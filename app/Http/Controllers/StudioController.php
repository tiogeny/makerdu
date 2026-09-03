<?php

namespace App\Http\Controllers;

use App\Models\BitacoraEntry;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\Squad;
use App\Models\User;
use App\Services\AiQualityControlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StudioController extends Controller
{
    public function hud(Request $request)
    {
        $data = $this->getStudioData();
        if ($data instanceof \Illuminate\Http\RedirectResponse) {
            return $data;
        }

        return Inertia::render('Student/Studio', $data);
    }

    public function missionStation(Request $request, $level_number = 1)
    {
        $data = $this->getStudioData();
        if ($data instanceof \Illuminate\Http\RedirectResponse) {
            return $data;
        }

        $data['selected_level_number'] = (int) $level_number;

        return Inertia::render('Student/MissionStation', $data);
    }

    private function getStudioData()
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

        return [
            'squad' => [
                'id' => $squad->id,
                'name' => $squad->name,
                'fabcoins_balance' => $squad->fabcoins_balance,
                'classroom' => [
                    'id'                       => $squad->classroom->id,
                    'name'                     => $squad->classroom->name,
                    'access_code'              => $squad->classroom->access_code,
                    'tinkercad_link'           => $squad->classroom->tinkercad_link,
                    'teacher_name'             => $squad->classroom->teacher->name ?? 'Profesor',
                    // Carrocería Pedagógica (Paso 4)
                    'custom_title'             => $squad->classroom->custom_title,
                    'custom_description'       => $squad->classroom->custom_description,
                    'custom_video_url'         => $squad->classroom->custom_video_url,
                    'custom_context_image_url' => $squad->classroom->custom_context_image_url,
                    'custom_welcome_message'   => $squad->classroom->custom_welcome_message,
                    'custom_accent_color'      => $squad->classroom->custom_accent_color ?? '#06b6d4',
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
                'briefing_json' => $project->briefing_json,
                'levels' => $project->levels->map(function ($lvl) use ($completedLevelIds) {
                    return [
                        'id' => $lvl->id,
                        'level_number' => $lvl->level_number,
                        'title' => $lvl->title_json['es'] ?? ('Misión ' . $lvl->level_number),
                        'title_en' => $lvl->title_json['en'] ?? '',
                        'inputs' => $lvl->inputs_json ?? [],
                        'process' => $lvl->process_json ?? [],
                        'outputs' => $lvl->outputs_json ?? [],
                        'toolbox' => $lvl->toolbox_json ?? [],
                        'validation_rules' => $lvl->validation_rules_json ?? [],
                        'fabcoins_cost' => $lvl->fabcoins_cost ?? 0,
                        'xp_reward' => $lvl->xp_reward ?? 50,
                        'skills_reward' => $lvl->skills_reward_json ?? [],
                        'allows_iteration' => (bool)($lvl->allows_iteration ?? true),
                        'is_completed' => in_array($lvl->id, $completedLevelIds),
                    ];
                }),
            ],
            // Compañeros en la misma aula para agruparse en equipo
            'peers' => User::whereHas('squads', function ($q) use ($squad) {
                $q->where('classroom_id', $squad->classroom_id);
            })
            ->where('users.id', '!=', $activeStudentId)
            ->select('users.id', 'users.name', 'users.xp_points')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'short_name' => explode(' ', $u->name)[0],
                    'xp_points' => $u->xp_points,
                ];
            }),
            'animations' => \App\Models\MicroAnimation::where('is_active', true)->get(['id', 'slug', 'title_json', 'category', 'html_css_code']),
            'microApps' => \App\Models\MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']),
            'bitacoras' => $bitacoras,
            'flash' => [
                'quality_control_result' => session('quality_control_result') ?? session('preflight_result'),
                'preflight_result' => session('preflight_result') ?? session('quality_control_result'),
            ],
        ];
    }

    /**
     * Unirse a la mesa o equipo de otro compañero en el taller
     */
    public function joinTeam(Request $request)
    {
        $request->validate([
            'partner_user_id' => ['required', 'exists:users,id'],
        ]);

        $activeStudentId = session('active_student_id', Auth::id());
        $me = User::findOrFail($activeStudentId);
        $partner = User::findOrFail($request->partner_user_id);

        $partnerSquad = $partner->squads()->first();
        if ($partnerSquad) {
            $partnerSquad->members()->syncWithoutDetaching([
                $me->id => ['current_role' => 'Quality', 'active_minutes' => 0]
            ]);

            session(['active_squad_id' => $partnerSquad->id]);

            return back()->with('success', "¡Te has unido a la mesa con {$partner->name}!");
        }

        return back()->withErrors(['general' => 'No se encontró la mesa del compañero.']);
    }

    /**
     * Volver a modo Creador Individual (su propia mesa personal)
     */
    public function setIndividualMode(Request $request)
    {
        $activeStudentId = session('active_student_id', Auth::id());
        $me = User::findOrFail($activeStudentId);
        
        $classroomId = $me->squads()->first()?->classroom_id ?? 1;
        $firstName = explode(' ', $me->name)[0];

        $mySquad = Squad::firstOrCreate(
            ['classroom_id' => $classroomId, 'name' => "Mesa · {$firstName}"],
            ['fabcoins_balance' => 400]
        );

        $mySquad->members()->syncWithoutDetaching([
            $me->id => ['current_role' => 'Architect', 'active_minutes' => 0]
        ]);

        session(['active_squad_id' => $mySquad->id]);

        return back()->with('success', "Has vuelto a tu Mesa de Trabajo individual.");
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
     * Motor de Control de Calidad y Auditoría con IA Multimodal (POST /squad/{id}/quality-control)
     */
    public function qualityControl(Request $request, Squad $squad, AiQualityControlService $qcService)
    {
        $request->validate([
            'level_id' => ['required', 'exists:project_levels,id'],
            'file' => ['required', 'file', 'max:25600'], // Max 25MB (.stl, .svg, .obj, .png, .jpg)
            'image_snapshot' => ['nullable', 'string'], // Base64 snapshot del Three.js canvas
        ]);

        $level = ProjectLevel::findOrFail($request->level_id);
        $file = $request->file('file');

        // Guardar archivo en disco público
        $storedPath = $file->store('calidad_ia', 'public');
        $fullPath = Storage::disk('public')->path($storedPath);

        $imageBase64 = $request->image_snapshot;
        $extension = strtolower($file->getClientOriginalExtension());
        if (!$imageBase64 && in_array($extension, ['png', 'jpg', 'jpeg', 'webp'])) {
            $imageBase64 = base64_encode(file_get_contents($fullPath));
        }

        // Ejecutar análisis y consulta a Gemini Vision
        $result = $qcService->analyzeFile(
            $fullPath,
            $file->getClientOriginalName(),
            $level->validation_rules_json,
            $imageBase64
        );
        $result['file_url'] = Storage::url($storedPath);
        $result['level_id'] = $level->id;

        // Registrar entrada en Bitácora con el resultado del diagnóstico
        $activeStudentId = session('active_student_id', Auth::id());
        $bitacora = BitacoraEntry::create([
            'squad_id' => $squad->id,
            'level_id' => $level->id,
            'active_role_user_id' => $activeStudentId,
            'content_text' => "Control de Calidad para '{$file->getClientOriginalName()}': " . ($result['is_valid'] ? "Aprobado" : "Requiere corrección"),
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

        return back()->with([
            'quality_control_result' => $result,
            'preflight_result' => $result,
        ]);
    }

    /**
     * Alias retrocompatible
     */
    public function preflight(Request $request, Squad $squad, AiQualityControlService $qcService)
    {
        return $this->qualityControl($request, $squad, $qcService);
    }

    /**
     * Confirmar Fabricación y Descontar FabCoins (Paso 4)
     */
    public function confirmFabrication(Request $request, Squad $squad, ProjectLevel $level, \App\Services\FabCoinService $fabCoinService)
    {
        $cost = $level->fabcoins_cost;

        if ($squad->fabcoins_balance < $cost) {
            return back()->withErrors(['general' => "Balance insuficiente de FabCoins. Requiere {$cost} FC y dispones de {$squad->fabcoins_balance} FC."]);
        }

        // Registrar transacción de gasto en el ledger
        if ($cost > 0) {
            $fabCoinService->record(
                $squad,
                -$cost,
                'spend_fabrication',
                "🏭 Fabricación autorizada para {$level->title_json['es']}",
                'project_level',
                $level->id
            );
        }

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
        $contentText = $request->input('reflection_text') ?: $request->input('content_text') ?: 'Evidencia entregada y validada por la escuadra.';
        $request->merge(['content_text' => $contentText]);

        $request->validate([
            'content_text' => ['required', 'string', 'min:3'],
            'file' => ['nullable', 'file', 'max:10240'],
        ]);

        $activeStudentId = session('active_student_id', Auth::id());

        $fileUrl = null;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('bitacoras', 'public');
            $fileUrl = Storage::url($path);
        }

        $snapshotUrl = null;
        if ($request->filled('image_snapshot') && str_starts_with($request->input('image_snapshot'), 'data:image')) {
            try {
                $base64Data = explode(',', $request->input('image_snapshot'))[1] ?? '';
                if ($base64Data) {
                    $snapContent = base64_decode($base64Data);
                    $snapFilename = 'bitacoras/snapshot_' . $squad->id . '_' . $level->id . '_' . time() . '.png';
                    Storage::disk('public')->put($snapFilename, $snapContent);
                    $snapshotUrl = Storage::url($snapFilename);
                }
            } catch (\Exception $e) {
                \Log::warning('Error guardando snapshot 3D: ' . $e->getMessage());
            }
        }

        BitacoraEntry::create([
            'squad_id' => $squad->id,
            'level_id' => $level->id,
            'active_role_user_id' => $activeStudentId,
            'content_text' => $request->content_text,
            'file_url' => $fileUrl,
            'snapshot_url' => $snapshotUrl,
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