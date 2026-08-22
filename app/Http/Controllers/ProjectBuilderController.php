<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectBuilderController extends Controller
{
    /**
     * Listado de Proyectos / Cursos
     */
    public function index()
    {
        $projects = Project::with('levels')->latest()->get();

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title_json['es'] ?? 'Proyecto Maker',
                    'title_en' => $p->title_json['en'] ?? '',
                    'description' => $p->description_json['es'] ?? '',
                    'type' => $p->type,
                    'total_levels' => $p->total_levels,
                    'levels_count' => $p->levels->count(),
                    'created_at' => $p->created_at->format('d/m/Y'),
                ];
            }),
        ]);
    }

    /**
     * Formulario de Creación
     */
    public function create()
    {
        return Inertia::render('Admin/Projects/CreateEdit', [
            'project' => null,
            'isEdit' => false,
        ]);
    }

    /**
     * Guardar nuevo Proyecto con N Niveles dinámicos
     */
    public function store(Request $request)
    {
        $request->validate([
            'title_es' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'description_es' => ['required', 'string'],
            'description_en' => ['nullable', 'string'],
            'type' => ['required', 'string'],
            'levels' => ['required', 'array', 'min:1'],
            'levels.*.level_number' => ['required', 'integer'],
            'levels.*.title_es' => ['required', 'string'],
            'levels.*.guide_es' => ['required', 'string'],
            'levels.*.deliverable_type' => ['nullable', 'string', 'in:stl_3d,photo_sketch,svg_laser,checklist_assembly'],
            'levels.*.bunny_video_url' => ['nullable', 'string'],
            'levels.*.max_x_mm' => ['nullable', 'numeric'],
            'levels.*.max_y_mm' => ['nullable', 'numeric'],
            'levels.*.max_z_mm' => ['nullable', 'numeric'],
            'levels.*.fabcoins_cost' => ['nullable', 'integer', 'min:0'],
        ]);

        $project = Project::create([
            'title_json' => [
                'es' => $request->title_es,
                'en' => $request->title_en ?: $request->title_es,
            ],
            'description_json' => [
                'es' => $request->description_es,
                'en' => $request->description_en ?: $request->description_es,
            ],
            'type' => $request->type,
            'total_levels' => count($request->levels),
        ]);

        foreach ($request->levels as $idx => $lvl) {
            $delivType = $lvl['deliverable_type'] ?? ($idx === 0 ? 'photo_sketch' : ($idx === 3 ? 'checklist_assembly' : 'stl_3d'));

            ProjectLevel::create([
                'project_id' => $project->id,
                'level_number' => $idx + 1,
                'title_json' => [
                    'es' => $lvl['title_es'],
                    'en' => $lvl['title_en'] ?? $lvl['title_es'],
                ],
                'toolbox_json' => [
                    'guide' => $lvl['guide_es'],
                    'deliverable_type' => $delivType,
                    'bunny_video_url' => $lvl['bunny_video_url'] ?? '',
                    'resources' => [],
                ],
                'validation_rules_json' => [
                    'deliverable_type' => $delivType,
                    'max_x_mm' => (float)($lvl['max_x_mm'] ?? 50),
                    'max_y_mm' => (float)($lvl['max_y_mm'] ?? 50),
                    'max_z_mm' => (float)($lvl['max_z_mm'] ?? 15),
                    'min_wall_thickness_mm' => 2.0,
                ],
                'fabcoins_cost' => (int)($lvl['fabcoins_cost'] ?? 0),
            ]);
        }

        return redirect()->route('admin.projects.index')->with('success', "¡Proyecto '{$request->title_es}' creado con " . count($request->levels) . " niveles exitosamente!");
    }

    /**
     * Editar Proyecto Existente
     */
    public function edit(Project $project)
    {
        $project->load('levels');

        return Inertia::render('Admin/Projects/CreateEdit', [
            'project' => [
                'id' => $project->id,
                'title_es' => $project->title_json['es'] ?? '',
                'title_en' => $project->title_json['en'] ?? '',
                'description_es' => $project->description_json['es'] ?? '',
                'description_en' => $project->description_json['en'] ?? '',
                'type' => $project->type,
                'levels' => $project->levels->map(function ($lvl, $idx) {
                    $delivType = $lvl->toolbox_json['deliverable_type'] ?? $lvl->validation_rules_json['deliverable_type'] ?? ($idx === 0 ? 'photo_sketch' : ($idx === 3 ? 'checklist_assembly' : 'stl_3d'));
                    return [
                        'id' => $lvl->id,
                        'level_number' => $lvl->level_number,
                        'title_es' => $lvl->title_json['es'] ?? '',
                        'title_en' => $lvl->title_json['en'] ?? '',
                        'deliverable_type' => $delivType,
                        'guide_es' => $lvl->toolbox_json['guide'] ?? '',
                        'bunny_video_url' => $lvl->toolbox_json['bunny_video_url'] ?? '',
                        'max_x_mm' => $lvl->validation_rules_json['max_x_mm'] ?? 50,
                        'max_y_mm' => $lvl->validation_rules_json['max_y_mm'] ?? 50,
                        'max_z_mm' => $lvl->validation_rules_json['max_z_mm'] ?? 15,
                        'fabcoins_cost' => $lvl->fabcoins_cost,
                    ];
                }),
            ],
            'isEdit' => true,
        ]);
    }

    /**
     * Actualizar Proyecto y Niveles
     */
    public function update(Request $request, Project $project)
    {
        $request->validate([
            'title_es' => ['required', 'string', 'max:255'],
            'description_es' => ['required', 'string'],
            'type' => ['required', 'string'],
            'levels' => ['required', 'array', 'min:1'],
        ]);

        $project->update([
            'title_json' => [
                'es' => $request->title_es,
                'en' => $request->title_en ?: $request->title_es,
            ],
            'description_json' => [
                'es' => $request->description_es,
                'en' => $request->description_en ?: $request->description_es,
            ],
            'type' => $request->type,
            'total_levels' => count($request->levels),
        ]);

        $project->levels()->delete();

        foreach ($request->levels as $idx => $lvl) {
            $delivType = $lvl['deliverable_type'] ?? ($idx === 0 ? 'photo_sketch' : ($idx === 3 ? 'checklist_assembly' : 'stl_3d'));

            ProjectLevel::create([
                'project_id' => $project->id,
                'level_number' => $idx + 1,
                'title_json' => [
                    'es' => $lvl['title_es'],
                    'en' => $lvl['title_en'] ?? $lvl['title_es'],
                ],
                'toolbox_json' => [
                    'guide' => $lvl['guide_es'],
                    'deliverable_type' => $delivType,
                    'bunny_video_url' => $lvl['bunny_video_url'] ?? '',
                    'resources' => [],
                ],
                'validation_rules_json' => [
                    'deliverable_type' => $delivType,
                    'max_x_mm' => (float)($lvl['max_x_mm'] ?? 50),
                    'max_y_mm' => (float)($lvl['max_y_mm'] ?? 50),
                    'max_z_mm' => (float)($lvl['max_z_mm'] ?? 15),
                    'min_wall_thickness_mm' => 2.0,
                ],
                'fabcoins_cost' => (int)($lvl['fabcoins_cost'] ?? 0),
            ]);
        }

        return redirect()->route('admin.projects.index')->with('success', "¡Proyecto '{$request->title_es}' actualizado con éxito!");
    }

    /**
     * Eliminar Proyecto
     */
    public function destroy(Project $project)
    {
        $name = $project->title_json['es'] ?? 'Proyecto';
        $project->levels()->delete();
        $project->delete();

        return redirect()->route('admin.projects.index')->with('success', "Proyecto '{$name}' eliminado.");
    }
}