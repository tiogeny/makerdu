<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\MicroApp;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TechniqueController extends Controller
{
    public function index()
    {
        $techniques = Project::with(['levels'])->orderBy('created_at', 'desc')->get()->map(function ($tech) {
            return [
                'id' => $tech->id,
                'slug' => $tech->slug,
                'title_json' => $tech->title_json,
                'description_json' => $tech->description_json,
                'type' => $tech->type,
                'competencies_json' => $tech->competencies_json ?? [],
                'animation_preset' => $tech->animation_preset ?? 'art-toy-loop',
                'recommended_age' => $tech->recommended_age ?? '8-16 años',
                'total_levels' => $tech->levels->count(),
                'is_active' => (bool) $tech->is_active,
                'levels' => $tech->levels->map(function ($lvl) {
                    return [
                        'id' => $lvl->id,
                        'level_number' => $lvl->level_number,
                        'title_json' => $lvl->title_json,
                        'inputs_json' => $lvl->inputs_json ?? [],
                        'process_json' => $lvl->process_json ?? [],
                        'outputs_json' => $lvl->outputs_json ?? [],
                        'xp_reward' => $lvl->xp_reward ?? 50,
                        'fabcoins_cost' => $lvl->fabcoins_cost ?? 0,
                    ];
                }),
            ];
        });

        $microApps = MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']);

        return Inertia::render('Admin/Techniques/Index', [
            'techniques' => $techniques,
            'microApps' => $microApps,
        ]);
    }

    public function create()
    {
        $microApps = MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']);

        return Inertia::render('Admin/Techniques/CreateEdit', [
            'technique' => null,
            'microApps' => $microApps,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_es' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description_es' => 'required|string',
            'description_en' => 'nullable|string',
            'type' => 'required|in:2.5D,3D,Laser',
            'competencies' => 'nullable|array',
            'animation_preset' => 'nullable|string',
            'recommended_age' => 'nullable|string',
            'gemini_prompt_context' => 'nullable|string',
            'missions' => 'required|array|min:1',
        ]);

        $slug = Str::slug($validated['title_es']) . '-' . rand(100, 999);

        $project = Project::create([
            'slug' => $slug,
            'title_json' => [
                'es' => $validated['title_es'],
                'en' => $validated['title_en'] ?? $validated['title_es'],
            ],
            'description_json' => [
                'es' => $validated['description_es'],
                'en' => $validated['description_en'] ?? $validated['description_es'],
            ],
            'type' => $validated['type'],
            'competencies_json' => $validated['competencies'] ?? [],
            'animation_preset' => $validated['animation_preset'] ?? 'art-toy-loop',
            'recommended_age' => $validated['recommended_age'] ?? '8-16 años',
            'gemini_prompt_context' => $validated['gemini_prompt_context'] ?? '',
            'total_levels' => count($validated['missions']),
            'is_active' => true,
        ]);

        foreach ($validated['missions'] as $index => $mission) {
            ProjectLevel::create([
                'project_id' => $project->id,
                'level_number' => $index + 1,
                'title_json' => [
                    'es' => $mission['title_es'] ?? "Misión " . ($index + 1),
                    'en' => $mission['title_en'] ?? "Mission " . ($index + 1),
                ],
                'toolbox_json' => [
                    'guide' => $mission['guide_es'] ?? '',
                    'bunny_video_url' => $mission['video_url'] ?? '',
                ],
                'inputs_json' => [
                    'video_url' => $mission['video_url'] ?? '',
                    'guide_text' => $mission['guide_es'] ?? '',
                    'resources' => $mission['resources'] ?? [],
                ],
                'process_json' => [
                    'micro_app_slug' => $mission['micro_app_slug'] ?? null,
                    'instructions' => $mission['process_instructions'] ?? '',
                ],
                'outputs_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'validation_rules' => $mission['validation_rules'] ?? [],
                ],
                'validation_rules_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $mission['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $mission['min_thickness_mm'] ?? 2.0,
                ],
                'fabcoins_cost' => $mission['fabcoins_cost'] ?? 0,
                'xp_reward' => $mission['xp_reward'] ?? 50,
            ]);
        }

        return redirect()->route('admin.techniques.index')->with('success', '¡Técnica STEAM creada con éxito!');
    }

    public function edit(Project $technique)
    {
        $technique->load('levels');
        $microApps = MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']);

        $formatted = [
            'id' => $technique->id,
            'slug' => $technique->slug,
            'title_es' => $technique->title_json['es'] ?? '',
            'title_en' => $technique->title_json['en'] ?? '',
            'description_es' => $technique->description_json['es'] ?? '',
            'description_en' => $technique->description_json['en'] ?? '',
            'type' => $technique->type,
            'competencies' => $technique->competencies_json ?? [],
            'animation_preset' => $technique->animation_preset ?? 'art-toy-loop',
            'recommended_age' => $technique->recommended_age ?? '8-16 años',
            'gemini_prompt_context' => $technique->gemini_prompt_context ?? '',
            'missions' => $technique->levels->map(function ($lvl) {
                return [
                    'id' => $lvl->id,
                    'title_es' => $lvl->title_json['es'] ?? '',
                    'title_en' => $lvl->title_json['en'] ?? '',
                    'guide_es' => $lvl->inputs_json['guide_text'] ?? $lvl->toolbox_json['guide'] ?? '',
                    'video_url' => $lvl->inputs_json['video_url'] ?? $lvl->toolbox_json['bunny_video_url'] ?? '',
                    'micro_app_slug' => $lvl->process_json['micro_app_slug'] ?? null,
                    'process_instructions' => $lvl->process_json['instructions'] ?? '',
                    'deliverable_type' => $lvl->outputs_json['deliverable_type'] ?? $lvl->validation_rules_json['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $lvl->validation_rules_json['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $lvl->validation_rules_json['min_thickness_mm'] ?? 2.0,
                    'fabcoins_cost' => $lvl->fabcoins_cost ?? 0,
                    'xp_reward' => $lvl->xp_reward ?? 50,
                ];
            }),
        ];

        return Inertia::render('Admin/Techniques/CreateEdit', [
            'technique' => $formatted,
            'microApps' => $microApps,
        ]);
    }

    public function update(Request $request, Project $technique)
    {
        $validated = $request->validate([
            'title_es' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description_es' => 'required|string',
            'description_en' => 'nullable|string',
            'type' => 'required|in:2.5D,3D,Laser',
            'competencies' => 'nullable|array',
            'animation_preset' => 'nullable|string',
            'recommended_age' => 'nullable|string',
            'gemini_prompt_context' => 'nullable|string',
            'missions' => 'required|array|min:1',
        ]);

        $technique->update([
            'title_json' => [
                'es' => $validated['title_es'],
                'en' => $validated['title_en'] ?? $validated['title_es'],
            ],
            'description_json' => [
                'es' => $validated['description_es'],
                'en' => $validated['description_en'] ?? $validated['description_es'],
            ],
            'type' => $validated['type'],
            'competencies_json' => $validated['competencies'] ?? [],
            'animation_preset' => $validated['animation_preset'] ?? 'art-toy-loop',
            'recommended_age' => $validated['recommended_age'] ?? '8-16 años',
            'gemini_prompt_context' => $validated['gemini_prompt_context'] ?? '',
            'total_levels' => count($validated['missions']),
        ]);

        // Recrear misiones
        $technique->levels()->delete();

        foreach ($validated['missions'] as $index => $mission) {
            ProjectLevel::create([
                'project_id' => $technique->id,
                'level_number' => $index + 1,
                'title_json' => [
                    'es' => $mission['title_es'] ?? "Misión " . ($index + 1),
                    'en' => $mission['title_en'] ?? "Mission " . ($index + 1),
                ],
                'toolbox_json' => [
                    'guide' => $mission['guide_es'] ?? '',
                    'bunny_video_url' => $mission['video_url'] ?? '',
                ],
                'inputs_json' => [
                    'video_url' => $mission['video_url'] ?? '',
                    'guide_text' => $mission['guide_es'] ?? '',
                    'resources' => $mission['resources'] ?? [],
                ],
                'process_json' => [
                    'micro_app_slug' => $mission['micro_app_slug'] ?? null,
                    'instructions' => $mission['process_instructions'] ?? '',
                ],
                'outputs_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'validation_rules' => $mission['validation_rules'] ?? [],
                ],
                'validation_rules_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $mission['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $mission['min_thickness_mm'] ?? 2.0,
                ],
                'fabcoins_cost' => $mission['fabcoins_cost'] ?? 0,
                'xp_reward' => $mission['xp_reward'] ?? 50,
            ]);
        }

        return redirect()->route('admin.techniques.index')->with('success', '¡Técnica STEAM actualizada!');
    }

    public function toggle(Project $technique)
    {
        $technique->is_active = !$technique->is_active;
        $technique->save();
        return back()->with('success', 'Estado de la técnica actualizado.');
    }

    public function destroy(Project $technique)
    {
        $technique->delete();
        return redirect()->route('admin.techniques.index')->with('success', 'Técnica eliminada.');
    }
}
