<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Project;
use App\Models\Squad;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClassroomManagerController extends Controller
{
    /**
     * Listado de Aulas y Talleres (SuperAdmin HQ)
     */
    public function index()
    {
        $classrooms = Classroom::with(['teacher', 'project', 'squads.members'])->latest()->get();
        $projects = Project::where('is_active', true)->get(['id', 'title_json', 'type', 'total_levels', 'age_range', 'recommended_age']);
        $teachers = User::whereIn('role_type', ['teacher', 'admin'])->get(['id', 'name', 'email', 'role_type']);

        return Inertia::render('Admin/Classrooms/Index', [
            'projects' => $projects->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title_json['es'] ?? 'Técnica STEAM',
                    'type' => $p->type,
                    'total_levels' => $p->total_levels,
                    'recommended_age' => $p->recommended_age ?? '8-16 años',
                ];
            }),
            'teachers' => $teachers,
            'classrooms' => $classrooms->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'institution_name' => $c->institution_name ?? 'Makerdu Lab',
                    'access_code' => $c->access_code,
                    'mode' => $c->mode,
                    'project_id' => $c->project_id,
                    'project_title' => $c->project->title_json['es'] ?? 'Técnica STEAM Maestra',
                    'total_fabcoins_pool' => $c->total_fabcoins_pool ?? 500,
                    'fabcoins_reserve_pool' => $c->fabcoins_reserve_pool ?? 100,
                    'tinkercad_link' => $c->tinkercad_link,
                    'teacher_id' => $c->teacher_id,
                    'teacher_name' => $c->teacher->name ?? 'Docente / Instructor',
                    'teacher_email' => $c->teacher->email ?? '',
                    'squads_count' => $c->squads->count(),
                    'students_count' => $c->squads->flatMap->members->count(),
                    'squads' => $c->squads->map(function ($s) {
                        return [
                            'id' => $s->id,
                            'name' => $s->name,
                            'fabcoins_balance' => $s->fabcoins_balance,
                            'members' => $s->members->map(function ($m) {
                                return [
                                    'id' => $m->id,
                                    'name' => $m->name,
                                    'pin' => $m->pin,
                                    'role' => $m->pivot->current_role,
                                ];
                            }),
                        ];
                    }),
                ];
            }),
        ]);
    }

    /**
     * Registrar Nuevo Docente / Instructor
     */
    public function createTeacher(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_type' => 'teacher',
            'language' => 'es',
        ]);

        return back()->with('success', "¡Docente / Instructor '{$user->name}' registrado con éxito!");
    }

    /**
     * Crear Nueva Aula o Taller Extracurricular
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'institution_name' => ['nullable', 'string', 'max:255'],
            'teacher_id' => ['required', 'exists:users,id'],
            'access_code' => ['required', 'string', 'max:20', 'unique:classrooms,access_code'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'mode' => ['required', 'in:school_squads,private_workshop'],
            'total_fabcoins_pool' => ['required', 'numeric', 'min:100', 'max:5000'],
            'tinkercad_link' => ['nullable', 'url'],
        ]);

        $totalPool = (int) $request->total_fabcoins_pool;
        $reservePool = (int) round($totalPool * 0.20); // 20% reserva docente

        $classroom = Classroom::create([
            'teacher_id' => $request->teacher_id,
            'project_id' => $request->project_id ?: Project::first()?->id,
            'name' => $request->name,
            'institution_name' => $request->institution_name ?: ($request->mode === 'private_workshop' ? 'Taller Extracurricular Maker' : 'Colegio'),
            'access_code' => strtoupper(trim($request->access_code)),
            'mode' => $request->mode,
            'total_fabcoins_pool' => $totalPool,
            'fabcoins_reserve_pool' => $reservePool,
            'tinkercad_link' => $request->tinkercad_link,
        ]);

        $tipo = $request->mode === 'private_workshop' ? 'Taller Extracurricular' : 'Aula Escolar';
        return back()->with('success', "¡{$tipo} '{$classroom->name}' creado con código {$classroom->access_code} (Bolsa: {$totalPool} FC, Reserva 20%: {$reservePool} FC)!");
    }

    /**
     * Cargar Alumnos en Lote y Generar Escuadras Automáticas con PINs y Asignación de 80% FabCoins
     */
    public function enrollStudents(Request $request, Classroom $classroom)
    {
        $request->validate([
            'students_text' => ['required', 'string'],
            'squad_prefix' => ['nullable', 'string', 'max:50'],
        ]);

        $lines = explode("\n", $request->students_text);
        $names = array_values(array_filter(array_map('trim', $lines)));

        if (empty($names)) {
            return back()->withErrors(['general' => 'No se encontraron nombres válidos en el texto.']);
        }

        $roles = ['Architect', 'Quality', 'Finance', 'Relator'];
        $prefix = $request->squad_prefix ?: 'Escuadra Maker';

        // Dividir en escuadras de 4 (o parejas si es taller pequeño)
        $squadSize = $classroom->mode === 'private_workshop' ? 2 : 4;
        $chunks = array_chunk($names, $squadSize);
        $squadCount = $classroom->squads()->count();

        // Modelo 80/20: Repartir el 80% de la bolsa total equitativamente entre las escuadras
        $totalPool = $classroom->total_fabcoins_pool ?: 500;
        $baselinePool80 = round($totalPool * 0.80);
        $squadBalance = count($chunks) > 0 ? (int) floor($baselinePool80 / count($chunks)) : 100;
        $squadBalance = max(40, $squadBalance); // Mínimo 40 FC por escuadra

        foreach ($chunks as $chunkIdx => $studentNames) {
            $squadNum = $squadCount + $chunkIdx + 1;
            $squad = Squad::create([
                'classroom_id' => $classroom->id,
                'name' => "{$prefix} {$squadNum}",
                'fabcoins_balance' => $squadBalance,
            ]);

            foreach ($studentNames as $roleIdx => $name) {
                $pin = str_pad((string)mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                $uniqueEmail = Str::slug($name, '.') . '.' . mt_rand(100, 999) . '@estudiante.makerdu.local';

                $user = User::create([
                    'name' => $name,
                    'email' => $uniqueEmail,
                    'password' => Hash::make($pin),
                    'pin' => $pin,
                    'role_type' => 'student',
                    'xp_points' => 100,
                    'language' => 'es',
                ]);

                $role = $roles[$roleIdx % 4];
                $squad->members()->attach($user->id, [
                    'current_role' => $role,
                    'active_minutes' => 0,
                ]);
            }
        }

        return back()->with('success', "¡" . count($names) . " alumnos matriculados en " . count($chunks) . " escuadras con {$squadBalance} FC iniciales cada una (Regla 80/20)!");
    }
}
