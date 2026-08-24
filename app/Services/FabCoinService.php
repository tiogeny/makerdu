<?php

namespace App\Services;

use App\Models\FabCoinTransaction;
use App\Models\Squad;
use Illuminate\Support\Facades\DB;

/**
 * FabCoinService — Motor centralizado de la economía FabCoins.
 *
 * TODAS las operaciones de FabCoins deben pasar por este service
 * para garantizar consistencia del ledger y del balance del squad.
 */
class FabCoinService
{
    /**
     * Registra una transacción y actualiza el balance de la escuadra.
     * Siempre en transacción DB para garantizar atomicidad.
     */
    public function record(
        Squad $squad,
        int $amount,
        string $type,
        string $description,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): FabCoinTransaction {
        return DB::transaction(function () use ($squad, $amount, $type, $description, $referenceType, $referenceId) {
            // Actualizar balance
            $newBalance = $squad->fabcoins_balance + $amount;
            $squad->update(['fabcoins_balance' => max(0, $newBalance)]);
            $squad->refresh();

            // Crear registro en el ledger
            return FabCoinTransaction::create([
                'squad_id'       => $squad->id,
                'amount'         => $amount,
                'type'           => $type,
                'description'    => $description,
                'reference_type' => $referenceType,
                'reference_id'   => $referenceId,
                'balance_after'  => $squad->fabcoins_balance,
            ]);
        });
    }

    /**
     * Gana FabCoins por completar un nivel.
     */
    public function earnLevel(Squad $squad, int $levelNumber, int $amount, string $projectTitle = ''): FabCoinTransaction
    {
        return $this->record(
            $squad,
            +$amount,
            'earn_level',
            "✅ Nivel {$levelNumber} completado" . ($projectTitle ? " — {$projectTitle}" : ''),
        );
    }

    /**
     * Bonus manual del docente.
     */
    public function earnBonus(Squad $squad, int $amount, string $reason): FabCoinTransaction
    {
        return $this->record($squad, +$amount, 'earn_bonus', "🎁 Bonus: {$reason}");
    }

    /**
     * Gasto en solicitud de fabricación.
     */
    public function spendFabrication(Squad $squad, int $amount, int $batchId): FabCoinTransaction
    {
        return $this->record(
            $squad,
            -abs($amount),
            'spend_fabrication',
            "🏭 Solicitud de fabricación #{$batchId}",
            'fabrication_batch',
            $batchId
        );
    }

    /**
     * Canje de recompensa del catálogo.
     */
    public function spendReward(Squad $squad, int $amount, string $rewardName, int $redemptionId): FabCoinTransaction
    {
        return $this->record(
            $squad,
            -abs($amount),
            'spend_reward',
            "🛒 Canje: {$rewardName}",
            'reward',
            $redemptionId
        );
    }

    /**
     * Obtiene el historial de transacciones de una escuadra (últimas N).
     */
    public function history(Squad $squad, int $limit = 20): \Illuminate\Support\Collection
    {
        return FabCoinTransaction::where('squad_id', $squad->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Ranking de escuadras de un aula ordenadas por FabCoins.
     */
    public function classroomRanking(int $classroomId): \Illuminate\Support\Collection
    {
        return Squad::where('classroom_id', $classroomId)
            ->with(['members'])
            ->orderByDesc('fabcoins_balance')
            ->get()
            ->map(function ($squad, $idx) {
                return [
                    'rank'             => $idx + 1,
                    'id'               => $squad->id,
                    'name'             => $squad->name,
                    'fabcoins_balance' => $squad->fabcoins_balance,
                    'total_xp'         => $squad->members->sum('xp_points'),
                    'member_count'     => $squad->members->count(),
                ];
            });
    }
}
