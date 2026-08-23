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
     * Listado de Aulas y Talleres
     */
    public function index()
    {
        $classrooms = Classroom::with(['teacher', 'project', 'squads.members'])->latest()->get();
        $projects = Project::all(['id', 'title_json', 'type', 'total_levels']);

        return Inertia::render('Admin/Classrooms/Index', [
            'projects' => $projects->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title_json['es'] ?? 'Curso Maker',
                    'type' => $p->type,
                    'total_levels' => $p->total_levels,
                ];
            }),
            'classrooms' => $classrooms->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'access_code' => $c->access_code,
                    'mode' => $c->mode,
                    'project_id' => $c->project_id,
                    'project_title' => $c->project->title_json['es'] ?? 'Sellos y Relieves 2.5D',
                    'tinkercad_link' => $c->tinkercad_link,
                    'teacher_name' => $c->teacher->name ?? 'Docente',
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
     * Crear Nueva Aula
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'access_code' => ['required', 'string', 'max:20', 'unique:classrooms,access_code'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'mode' => ['required', 'in:school_squads,private_workshop'],
            'tinkercad_link' => ['nullable', 'url'],
        ]);

        $classroom = Classroom::create([
            'teacher_id' => auth()->id() ?? 2,
            'project_id' => $request->project_id ?: Project::first()?->id,
            'name' => $request->name,
            'access_code' => strtoupper(trim($request->access_code)),
            'mode' => $request->mode,
            'tinkercad_link' => $request->tinkercad_link,
        ]);

        return back()->with('success', "¡Aula '{$classroom->name}' creada con código {$classroom->access_code}!");
    }

    /**
     * Cargar Alumnos en Lote y Generar Escuadras Automáticas con PINs
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
        $prefix = $request->squad_prefix ?: 'Escuadra Titanes';

        $chunks = array_chunk($names, 4);
        $squadCount = $classroom->squads()->count();

        foreach ($chunks as $chunkIdx => $studentNames) {
            $squadNum = $squadCount + $chunkIdx + 1;
            $squad = Squad::create([
                'classroom_id' => $classroom->id,
                'name' => "{$prefix} {$squadNum}",
                'fabcoins_balance' => 100,
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

        return back()->with('success', "¡" . count($names) . " alumnos matriculados y agrupados en " . count($chunks) . " nuevas escuadras con PINs únicos!");
    }
}
