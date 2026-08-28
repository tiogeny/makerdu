<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\MicroApp;
use App\Models\MicroAnimation;
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
                'technologies_json' => $tech->technologies_json ?? [$tech->type],
                'age_range' => $tech->age_range ?? 'juniors_9_12',
                'age_ranges_json' => $tech->age_ranges_json ?? [$tech->age_range ?? 'juniors_9_12'],
                'difficulty_level' => $tech->difficulty_level ?? 'foundational',
                'curriculum_framework' => $tech->curriculum_framework ?? 'cneb_peru',
                'competencies_json' => $tech->competencies_json ?? [],
                'competencies_custom_json' => $tech->competencies_custom_json ?? [],
                'skills_json' => $tech->skills_json ?? [],
                'animation_preset' => $tech->animation_preset ?? 'art-toy-loop',
                'custom_animation_html' => $tech->custom_animation_html,
                'recommended_age' => $tech->recommended_age ?? '8-16 años',
                'status' => $tech->status ?? 'published',
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
                        'skills_reward_json' => $lvl->skills_reward_json ?? [],
                        'allows_iteration' => (bool) ($lvl->allows_iteration ?? true),
                        'xp_reward' => $lvl->xp_reward ?? 50,
                        'fabcoins_cost' => $lvl->fabcoins_cost ?? 0,
                    ];
                }),
            ];
        });

        $microApps = MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']);
        $animations = MicroAnimation::where('is_active', true)->get(['id', 'slug', 'title_json', 'category', 'html_css_code']);

        return Inertia::render('Admin/Techniques/Index', [
            'techniques' => $techniques,
            'microApps' => $microApps,
            'animations' => $animations,
        ]);
    }

    public function create()
    {
        $microApps = MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']);
        $animations = MicroAnimation::where('is_active', true)->get(['id', 'slug', 'title_json', 'category', 'description_json', 'html_css_code']);

        return Inertia::render('Admin/Techniques/CreateEdit', [
            'technique' => null,
            'microApps' => $microApps,
            'animations' => $animations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_es' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description_es' => 'required|string',
            'description_en' => 'nullable|string',
            'type' => 'required|string',
            'technologies' => 'nullable|array',
            'age_ranges' => 'nullable|array',
            'age_range' => 'nullable|string',
            'difficulty_level' => 'nullable|string',
            'curriculum_framework' => 'nullable|string',
            'competencies' => 'nullable|array',
            'competencies_custom' => 'nullable|array',
            'skills' => 'nullable|array',
            'animation_preset' => 'nullable|string',
            'custom_animation_html' => 'nullable|string',
            'recommended_age' => 'nullable|string',
            'gemini_prompt_context' => 'nullable|string',
            'status' => 'nullable|in:draft,published',
            'missions' => 'required|array|min:1',
        ]);

        $slug = Str::slug($validated['title_es']) . '-' . rand(100, 999);

        $selectedAgeRanges = $request->input('age_ranges', [$request->input('age_range', 'juniors_9_12')]);
        $primaryAgeRange = is_array($selectedAgeRanges) && count($selectedAgeRanges) > 0 ? $selectedAgeRanges[0] : 'juniors_9_12';

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
            'type' => in_array($validated['type'], ['2.5D', '3D', 'Laser']) ? $validated['type'] : '2.5D',
            'technologies_json' => $validated['technologies'] ?? [$validated['type']],
            'age_range' => $primaryAgeRange,
            'age_ranges_json' => $selectedAgeRanges,
            'difficulty_level' => $validated['difficulty_level'] ?? 'foundational',
            'curriculum_framework' => $validated['curriculum_framework'] ?? 'cneb_peru',
            'competencies_json' => $validated['competencies'] ?? [],
            'competencies_custom_json' => $validated['competencies_custom'] ?? [],
            'skills_json' => $validated['skills'] ?? [],
            'animation_preset' => $validated['animation_preset'] ?? 'art-toy-loop',
            'custom_animation_html' => $validated['custom_animation_html'] ?? null,
            'recommended_age' => $validated['recommended_age'] ?? '8-16 años',
            'gemini_prompt_context' => $validated['gemini_prompt_context'] ?? '',
            'total_levels' => count($validated['missions']),
            'is_active' => true,
            'status' => $validated['status'] ?? 'published',
        ]);

        foreach ($validated['missions'] as $index => $mission) {
            ProjectLevel::create([
                'project_id' => $project->id,
                'level_number' => $index + 1,
                'title_json' => [
                    'es' => !empty($mission['title_es']) ? $mission['title_es'] : ("Misión " . ($index + 1)),
                    'en' => !empty($mission['title_en']) ? $mission['title_en'] : ("Mission " . ($index + 1)),
                ],
                'toolbox_json' => [
                    'guide' => $mission['guide_es'] ?? '',
                    'bunny_video_url' => $mission['video_url'] ?? '',
                ],
                'inputs_json' => [
                    'guide_text' => $mission['guide_es'] ?? '',
                    'video_url' => $mission['video_url'] ?? '',
                    'resources_list' => $mission['resources_list'] ?? [],
                ],
                'process_json' => [
                    'mode' => $mission['process_mode'] ?? 'micro_app',
                    'micro_app_slug' => is_array($mission['micro_app_slugs'] ?? null) && count($mission['micro_app_slugs']) > 0 ? $mission['micro_app_slugs'][0] : ($mission['micro_app_slug'] ?? null),
                    'micro_app_slugs' => $mission['micro_app_slugs'] ?? ($mission['micro_app_slug'] ? [$mission['micro_app_slug']] : []),
                    'external_tool_name' => $mission['external_tool_name'] ?? null,
                    'external_url' => $mission['external_url'] ?? null,
                    'instructions' => $mission['process_instructions'] ?? '',
                ],
                'outputs_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $mission['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $mission['min_thickness_mm'] ?? 2.0,
                    'allows_iteration' => (bool) ($mission['allows_iteration'] ?? true),
                ],
                'validation_rules_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $mission['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $mission['min_thickness_mm'] ?? 2.0,
                ],
                'skills_reward_json' => $mission['skills_reward'] ?? [],
                'allows_iteration' => (bool) ($mission['allows_iteration'] ?? true),
                'fabcoins_cost' => $mission['fabcoins_cost'] ?? 0,
                'xp_reward' => $mission['xp_reward'] ?? 50,
            ]);
        }

        $msg = ($validated['status'] ?? 'published') === 'draft' ? '¡Borrador guardado con éxito!' : '¡Técnica STEAM publicada con éxito!';
        return redirect()->route('admin.techniques.index')->with('success', $msg);
    }

    public function edit(Project $technique)
    {
        $technique->load('levels');
        $microApps = MicroApp::where('is_active', true)->get(['id', 'slug', 'name', 'category', 'icon', 'output_type']);
        $animations = MicroAnimation::where('is_active', true)->get(['id', 'slug', 'title_json', 'category', 'description_json', 'html_css_code']);

        $formatted = [
            'id' => $technique->id,
            'slug' => $technique->slug,
            'title_es' => $technique->title_json['es'] ?? '',
            'title_en' => $technique->title_json['en'] ?? '',
            'description_es' => $technique->description_json['es'] ?? '',
            'description_en' => $technique->description_json['en'] ?? '',
            'type' => $technique->type,
            'technologies' => $technique->technologies_json ?? [$technique->type],
            'age_ranges' => $technique->age_ranges_json ?? [$technique->age_range ?? 'juniors_9_12'],
            'age_range' => $technique->age_range ?? 'juniors_9_12',
            'difficulty_level' => $technique->difficulty_level ?? 'foundational',
            'curriculum_framework' => $technique->curriculum_framework ?? 'cneb_peru',
            'competencies' => $technique->competencies_json ?? [],
            'competencies_custom' => $technique->competencies_custom_json ?? [],
            'skills' => $technique->skills_json ?? [],
            'animation_preset' => $technique->animation_preset ?? 'art-toy-loop',
            'custom_animation_html' => $technique->custom_animation_html ?? '',
            'recommended_age' => $technique->recommended_age ?? '8-16 años',
            'gemini_prompt_context' => $technique->gemini_prompt_context ?? '',
            'status' => $technique->status ?? 'published',
            'missions' => $technique->levels->map(function ($lvl) {
                return [
                    'id' => $lvl->id,
                    'title_es' => $lvl->title_json['es'] ?? '',
                    'title_en' => $lvl->title_json['en'] ?? '',
                    'guide_es' => $lvl->inputs_json['guide_text'] ?? $lvl->toolbox_json['guide'] ?? '',
                    'video_url' => $lvl->inputs_json['video_url'] ?? $lvl->toolbox_json['bunny_video_url'] ?? '',
                    'resources_list' => $lvl->inputs_json['resources_list'] ?? [],
                    'process_mode' => $lvl->process_json['mode'] ?? 'micro_app',
                    'micro_app_slug' => $lvl->process_json['micro_app_slug'] ?? null,
                    'micro_app_slugs' => $lvl->process_json['micro_app_slugs'] ?? ($lvl->process_json['micro_app_slug'] ? [$lvl->process_json['micro_app_slug']] : []),
                    'external_tool_name' => $lvl->process_json['external_tool_name'] ?? null,
                    'external_url' => $lvl->process_json['external_url'] ?? null,
                    'process_instructions' => $lvl->process_json['instructions'] ?? '',
                    'deliverable_type' => $lvl->outputs_json['deliverable_type'] ?? $lvl->validation_rules_json['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $lvl->outputs_json['max_dim_mm'] ?? $lvl->validation_rules_json['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $lvl->outputs_json['min_thickness_mm'] ?? $lvl->validation_rules_json['min_thickness_mm'] ?? 2.0,
                    'allows_iteration' => (bool) ($lvl->allows_iteration ?? true),
                    'skills_reward' => $lvl->skills_reward_json ?? [],
                    'fabcoins_cost' => $lvl->fabcoins_cost ?? 0,
                    'xp_reward' => $lvl->xp_reward ?? 50,
                ];
            }),
        ];

        return Inertia::render('Admin/Techniques/CreateEdit', [
            'technique' => $formatted,
            'microApps' => $microApps,
            'animations' => $animations,
        ]);
    }

    public function update(Request $request, Project $technique)
    {
        $validated = $request->validate([
            'title_es' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description_es' => 'required|string',
            'description_en' => 'nullable|string',
            'type' => 'required|string',
            'technologies' => 'nullable|array',
            'age_ranges' => 'nullable|array',
            'age_range' => 'nullable|string',
            'difficulty_level' => 'nullable|string',
            'curriculum_framework' => 'nullable|string',
            'competencies' => 'nullable|array',
            'competencies_custom' => 'nullable|array',
            'skills' => 'nullable|array',
            'animation_preset' => 'nullable|string',
            'custom_animation_html' => 'nullable|string',
            'recommended_age' => 'nullable|string',
            'gemini_prompt_context' => 'nullable|string',
            'status' => 'nullable|in:draft,published',
            'missions' => 'required|array|min:1',
        ]);

        $selectedAgeRanges = $request->input('age_ranges', [$request->input('age_range', 'juniors_9_12')]);
        $primaryAgeRange = is_array($selectedAgeRanges) && count($selectedAgeRanges) > 0 ? $selectedAgeRanges[0] : 'juniors_9_12';

        $technique->update([
            'title_json' => [
                'es' => $validated['title_es'],
                'en' => $validated['title_en'] ?? $validated['title_es'],
            ],
            'description_json' => [
                'es' => $validated['description_es'],
                'en' => $validated['description_en'] ?? $validated['description_es'],
            ],
            'type' => in_array($validated['type'], ['2.5D', '3D', 'Laser']) ? $validated['type'] : '2.5D',
            'technologies_json' => $validated['technologies'] ?? [$validated['type']],
            'age_range' => $primaryAgeRange,
            'age_ranges_json' => $selectedAgeRanges,
            'difficulty_level' => $validated['difficulty_level'] ?? 'foundational',
            'curriculum_framework' => $validated['curriculum_framework'] ?? 'cneb_peru',
            'competencies_json' => $validated['competencies'] ?? [],
            'competencies_custom_json' => $validated['competencies_custom'] ?? [],
            'skills_json' => $validated['skills'] ?? [],
            'animation_preset' => $validated['animation_preset'] ?? 'art-toy-loop',
            'custom_animation_html' => $validated['custom_animation_html'] ?? null,
            'recommended_age' => $validated['recommended_age'] ?? '8-16 años',
            'gemini_prompt_context' => $validated['gemini_prompt_context'] ?? '',
            'total_levels' => count($validated['missions']),
            'status' => $validated['status'] ?? 'published',
        ]);

        // Recrear misiones
        $technique->levels()->delete();

        foreach ($validated['missions'] as $index => $mission) {
            ProjectLevel::create([
                'project_id' => $technique->id,
                'level_number' => $index + 1,
                'title_json' => [
                    'es' => !empty($mission['title_es']) ? $mission['title_es'] : ("Misión " . ($index + 1)),
                    'en' => !empty($mission['title_en']) ? $mission['title_en'] : ("Mission " . ($index + 1)),
                ],
                'toolbox_json' => [
                    'guide' => $mission['guide_es'] ?? '',
                    'bunny_video_url' => $mission['video_url'] ?? '',
                ],
                'inputs_json' => [
                    'guide_text' => $mission['guide_es'] ?? '',
                    'video_url' => $mission['video_url'] ?? '',
                    'resources_list' => $mission['resources_list'] ?? [],
                ],
                'process_json' => [
                    'mode' => $mission['process_mode'] ?? 'micro_app',
                    'micro_app_slug' => is_array($mission['micro_app_slugs'] ?? null) && count($mission['micro_app_slugs']) > 0 ? $mission['micro_app_slugs'][0] : ($mission['micro_app_slug'] ?? null),
                    'micro_app_slugs' => $mission['micro_app_slugs'] ?? ($mission['micro_app_slug'] ? [$mission['micro_app_slug']] : []),
                    'external_tool_name' => $mission['external_tool_name'] ?? null,
                    'external_url' => $mission['external_url'] ?? null,
                    'instructions' => $mission['process_instructions'] ?? '',
                ],
                'outputs_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $mission['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $mission['min_thickness_mm'] ?? 2.0,
                    'allows_iteration' => (bool) ($mission['allows_iteration'] ?? true),
                ],
                'validation_rules_json' => [
                    'deliverable_type' => $mission['deliverable_type'] ?? 'stl_3d',
                    'max_dim_mm' => $mission['max_dim_mm'] ?? 60,
                    'min_thickness_mm' => $mission['min_thickness_mm'] ?? 2.0,
                ],
                'skills_reward_json' => $mission['skills_reward'] ?? [],
                'allows_iteration' => (bool) ($mission['allows_iteration'] ?? true),
                'fabcoins_cost' => $mission['fabcoins_cost'] ?? 0,
                'xp_reward' => $mission['xp_reward'] ?? 50,
            ]);
        }

        $msg = ($validated['status'] ?? 'published') === 'draft' ? '¡Borrador actualizado con éxito!' : '¡Técnica STEAM actualizada con éxito!';
        return redirect()->route('admin.techniques.index')->with('success', $msg);
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
