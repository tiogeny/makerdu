<?php

namespace App\Http\Controllers;

use App\Models\BitacoraEntry;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\Squad;
use App\Models\User;
use App\Services\AiPreflightService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SquadController extends Controller
{
    public function hud(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('student.login');
        }

        $squadId = session('active_squad_id');
        $squad = null;

        if ($squadId) {
            $squad = Squad::with(['classroom.teacher', 'members'])->find($squadId);
        }

        if (!$squad) {
            $squad = $user->squads()->with(['classroom.teacher', 'members'])->first();
            if ($squad) {
                session(['active_squad_id' => $squad->id]);
            }
        }

        if (!$squad) {
            return redirect()->route('student.login')->withErrors(['general' => 'No tienes escuadra asignada.']);
        }

        // Obtener proyecto activo
        $project = $squad->classroom->project ?? Project::with('levels')->first();

        // Obtener bitácoras de la escuadra
        $bitacoras = BitacoraEntry::with(['activeRoleUser', 'level'])
            ->where('squad_id', $squad->id)
            ->latest()
            ->get();

        // Alumno activo actual en la 1-PC session
        $activeStudentId = session('active_student_id', $user->id);
        $activeStudent = $squad->members->firstWhere('id', $activeStudentId) ?? $user;

        // Progreso por niveles
        $completedLevelIds = $bitacoras->where('status', 'approved')->pluck('level_id')->unique()->toArray();

        return Inertia::render('Student/SquadHud', [
            'squad' => [
                'id' => $squad->id,
                'name' => $squad->name,
                'fabcoins_balance' => $squad->fabcoins_balance,
                'classroom' => [
                    'id' => $squad->classroom->id,
                    'name' => $squad->classroom->name,
                    'access_code' => $squad->classroom->access_code,
                    'tinkercad_link' => $squad->classroom->tinkercad_link,
                    'teacher_name' => $squad->classroom->teacher->name ?? 'Profesor',
                ],
                'members' => $squad->members->map(function ($m) use ($activeStudentId) {
                    return [
                        'id' => $m->id,
                        'name' => $m->name,
                        'xp_points' => $m->xp_points,
                        'role' => $m->pivot->current_role,
                        'active_minutes' => $m->pivot->active_minutes,
                        'is_active_device_user' => $m->id === $activeStudentId,
                    ];
                }),
            ],
            'activeStudent' => [
                'id' => $activeStudent->id,
                'name' => $activeStudent->name,
                'xp_points' => $activeStudent->xp_points,
                'current_role' => $squad->members->firstWhere('id', $activeStudent->id)->pivot->current_role ?? 'Architect',
            ],
            'project' => [
                'id' => $project->id,
                'title' => $project->title_json['es'] ?? 'Proyecto Maker',
                'description' => $project->description_json['es'] ?? '',
                'type' => $project->type,
                'total_levels' => $project->total_levels,
                'levels' => $project->levels->map(function ($lvl) use ($completedLevelIds) {
                    return [
                        'id' => $lvl->id,
                        'level_number' => $lvl->level_number,
                        'title' => $lvl->title_json['es'] ?? ('Nivel ' . $lvl->level_number),
                        'toolbox' => $lvl->toolbox_json,
                        'validation_rules' => $lvl->validation_rules_json,
                        'fabcoins_cost' => $lvl->fabcoins_cost,
                        'is_completed' => in_array($lvl->id, $completedLevelIds),
                    ];
                }),
            ],
            'bitacoras' => $bitacoras,
            'flash' => [
                'preflight_result' => session('preflight_result'),
            ],
        ]);
    }

    /**
     * Regla de 1-PC: Cambiar el alumno/rol activo en la misma computadora.
     */
    public function switchRole(Request $request, Squad $squad)
    {
        $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'new_role' => ['nullable', 'in:Architect,Quality,Finance,Relator'],
        ]);

        $targetUser = $squad->members()->where('users.id', $request->student_id)->first();
        if (!$targetUser) {
            return back()->withErrors(['general' => 'El alumno no pertenece a esta escuadra.']);
        }

        if ($request->filled('new_role')) {
            $squad->members()->updateExistingPivot($request->student_id, [
                'current_role' => $request->new_role,
            ]);
        }

        session(['active_student_id' => $targetUser->id]);

        return back()->with('success', "Rol activo cambiado a {$targetUser->name} ({$targetUser->pivot->current_role})");
    }

    /**
     * Engine de Pre-flight Check con IA Multimodal (POST /squad/{id}/pre-flight)
     */
    public function preflight(Request $request, Squad $squad, AiPreflightService $preflightService)
    {
        $request->validate([
            'level_id' => ['required', 'exists:project_levels,id'],
            'file' => ['required', 'file', 'max:25600'], // Max 25MB (.stl, .svg, .obj)
            'image_snapshot' => ['nullable', 'string'], // Base64 snapshot del Three.js canvas
        ]);

        $level = ProjectLevel::findOrFail($request->level_id);
        $file = $request->file('file');

        // Guardar archivo temporal de validación
        $storedPath = $file->store('preflights', 'public');
        $fullPath = Storage::disk('public')->path($storedPath);

        // Ejecutar análisis y consulta a Gemini Vision
        $result = $preflightService->analyzeFile(
            $fullPath,
            $file->getClientOriginalName(),
            $level->validation_rules_json,
            $request->image_snapshot
        );
        $result['file_url'] = Storage::url($storedPath);
        $result['level_id'] = $level->id;

        // Registrar entrada en Bitácora con el resultado del diagnóstico
        $activeStudentId = session('active_student_id', Auth::id());
        $bitacora = BitacoraEntry::create([
            'squad_id' => $squad->id,
            'level_id' => $level->id,
            'active_role_user_id' => $activeStudentId,
            'content_text' => "Control de Calidad 3D para '{$file->getClientOriginalName()}': " . ($result['is_valid'] ? "Aprobado (Listo para Fabricación)" : "Requiere corrección de tolerancias."),
            'file_url' => Storage::url($storedPath),
            'ai_score' => $result['ai_score'],
            'ai_feedback' => $result['ai_feedback'],
            'status' => $result['is_valid'] ? 'approved' : 'rejected',
        ]);

        // Si es una petición API REST pura
        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        }

        return back()->with('preflight_result', $result);
    }

    /**
     * Confirmar Fabricación y Descontar FabCoins (Paso 4)
     */
    public function confirmFabrication(Request $request, Squad $squad, ProjectLevel $level)
    {
        $cost = $level->fabcoins_cost;

        if ($squad->fabcoins_balance < $cost) {
            return back()->withErrors(['general' => "Balance insuficiente de FabCoins. Requiere {$cost} FC y dispones de {$squad->fabcoins_balance} FC."]);
        }

        $squad->decrement('fabcoins_balance', $cost);

        $activeStudentId = session('active_student_id', Auth::id());
        $user = User::find($activeStudentId);
        if ($user) {
            $user->increment('xp_points', 50);
        }

        return back()->with('success', "¡Pieza autorizada para fabricación! Se consumieron {$cost} FabCoins y tu equipo ganó +50 XP.");
    }

    /**
     * Enviar evidencia general a la bitácora
     */
    public function submitBitacora(Request $request, Squad $squad, ProjectLevel $level)
    {
        $request->validate([
            'content_text' => ['required', 'string', 'min:5'],
            'file' => ['nullable', 'file', 'max:10240'],
        ]);

        $activeStudentId = session('active_student_id', Auth::id());

        $fileUrl = null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('bitacoras', 'public');
            $fileUrl = Storage::url($path);
        }

        BitacoraEntry::create([
            'squad_id' => $squad->id,
            'level_id' => $level->id,
            'active_role_user_id' => $activeStudentId,
            'content_text' => $request->content_text,
            'file_url' => $fileUrl,
            'ai_score' => true,
            'ai_feedback' => 'Evidencia registrada exitosamente por la escuadra.',
            'status' => 'approved',
        ]);

        $user = User::find($activeStudentId);
        if ($user) {
            $user->increment('xp_points', 25);
        }

        return back()->with('success', '¡Evidencia enviada! Has ganado +25 XP para tu escuadra.');
    }
}