<?php

namespace App\Http\Controllers;

use App\Models\RewardCatalog;
use App\Models\RewardRedemption;
use App\Models\Squad;
use App\Services\FabCoinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FabCoinController extends Controller
{
    public function __construct(private FabCoinService $fabCoinService) {}

    /**
     * Panel FabCoins del alumno: billetera + historial + tienda + ranking.
     */
    public function panel(Request $request)
    {
        $user  = Auth::user();
        $squad = $user->squads()->with(['classroom.project', 'members'])->first();

        if (!$squad) {
            return redirect()->route('student.hud');
        }

        // Historial de transacciones
        $history = $this->fabCoinService->history($squad, 30);

        // Catálogo de recompensas activas
        $catalog = RewardCatalog::where('is_active', true)
            ->orderBy('cost')
            ->get()
            ->map(fn($r) => [
                'id'          => $r->id,
                'name'        => $r->name_json,
                'description' => $r->description_json,
                'cost'        => $r->cost,
                'category'    => $r->category,
                'icon'        => $r->icon,
                'stock'       => $r->stock,
                'has_stock'   => $r->hasStock(),
                'color'       => $r->categoryColor(),
            ]);

        // Canjes pendientes de esta escuadra
        $pendingRedemptions = RewardRedemption::with('reward')
            ->where('squad_id', $squad->id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'reward_name'    => $r->reward?->name_json,
                'reward_icon'    => $r->reward?->icon,
                'fabcoins_spent' => $r->fabcoins_spent,
                'status'         => $r->status,
                'status_badge'   => $r->statusBadge(),
                'created_at'     => $r->created_at->diffForHumans(),
            ]);

        // Ranking del aula
        $ranking = $this->fabCoinService->classroomRanking($squad->classroom_id);

        return Inertia::render('Student/FabCoinPanel', [
            'squad'              => [
                'id'               => $squad->id,
                'name'             => $squad->name,
                'fabcoins_balance' => $squad->fabcoins_balance,
                'classroom_name'   => $squad->classroom->name,
                'accent_color'     => $squad->classroom->custom_accent_color ?? '#06b6d4',
            ],
            'history'            => $history->map(fn($t) => [
                'id'          => $t->id,
                'amount'      => $t->amount,
                'type'        => $t->type,
                'description' => $t->description,
                'balance_after'=> $t->balance_after,
                'created_at'  => $t->created_at->format('d/m H:i'),
                'badge'       => $t->typeBadge(),
            ]),
            'catalog'            => $catalog,
            'pendingRedemptions' => $pendingRedemptions,
            'ranking'            => $ranking,
        ]);
    }

    /**
     * Canjear una recompensa del catálogo.
     */
    public function redeem(Request $request, Squad $squad)
    {
        $request->validate([
            'reward_id' => ['required', 'exists:reward_catalog,id'],
        ]);

        $reward = RewardCatalog::findOrFail($request->reward_id);

        // Validaciones
        if (!$reward->is_active) {
            return back()->withErrors(['reward' => 'Esta recompensa ya no está disponible.']);
        }

        if (!$reward->hasStock()) {
            return back()->withErrors(['reward' => 'Sin stock disponible. ¡Intenta más tarde!']);
        }

        if ($squad->fabcoins_balance < $reward->cost) {
            return back()->withErrors([
                'reward' => "FabCoins insuficientes. Necesitas {$reward->cost} FC, tienes {$squad->fabcoins_balance} FC.",
            ]);
        }

        // Crear canje (estado pendiente hasta que el docente apruebe)
        $redemption = RewardRedemption::create([
            'squad_id'       => $squad->id,
            'reward_id'      => $reward->id,
            'redeemed_by'    => Auth::id(),
            'fabcoins_spent' => $reward->cost,
            'status'         => 'pending',
        ]);

        // Descontar FabCoins via service (registra transacción en ledger)
        $this->fabCoinService->spendReward(
            $squad,
            $reward->cost,
            $reward->name('es'),
            $redemption->id
        );

        // Actualizar stock si aplica
        if ($reward->stock !== null) {
            $reward->decrement('stock');
        }
        $reward->increment('total_redeemed');

        return back()->with('success', "🎁 ¡Canje de \"{$reward->name('es')}\" enviado! El docente lo aprobará pronto.");
    }

    /**
     * Docente: aprobar / rechazar un canje pendiente.
     */
    public function approveRedemption(Request $request, RewardRedemption $redemption)
    {
        $request->validate([
            'action'        => ['required', 'in:approve,reject,deliver'],
            'teacher_notes' => ['nullable', 'string', 'max:300'],
        ]);

        $statusMap = ['approve' => 'approved', 'reject' => 'rejected', 'deliver' => 'delivered'];
        $newStatus = $statusMap[$request->action];

        // Si rechaza → devolver FabCoins
        if ($request->action === 'reject' && $redemption->status === 'pending') {
            $squad = $redemption->squad;
            $this->fabCoinService->record(
                $squad,
                +$redemption->fabcoins_spent,
                'adjustment',
                "🔄 Devolución por canje rechazado: {$redemption->reward?->name('es')}"
            );
        }

        $redemption->update([
            'status'        => $newStatus,
            'teacher_notes' => $request->teacher_notes,
        ]);

        $label = match ($request->action) {
            'approve' => 'aprobado',
            'reject'  => 'rechazado (FabCoins devueltos)',
            'deliver' => 'marcado como entregado',
        };

        return back()->with('success', "✅ Canje {$label}.");
    }

    /**
     * SuperAdmin: bonus manual de FabCoins a una escuadra.
     */
    public function grantBonus(Request $request, Squad $squad)
    {
        $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:500'],
            'reason' => ['required', 'string', 'max:200'],
        ]);

        $this->fabCoinService->earnBonus($squad, $request->amount, $request->reason);

        return back()->with('success', "🎁 +{$request->amount} FC otorgados a {$squad->name}.");
    }
}
