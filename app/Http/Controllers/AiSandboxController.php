<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\AiPreflightService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AiSandboxController extends Controller
{
    /**
     * Consola de Calibración de IA para el SuperAdmin
     */
    public function index()
    {
        $projects = Project::with('levels')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'title' => $p->title_json['es'] ?? 'Curso Maker',
                'type' => $p->type,
                'levels' => $p->levels->map(function ($l) {
                    return [
                        'id' => $l->id,
                        'level_number' => $l->level_number,
                        'title' => $l->title_json['es'] ?? '',
                        'validation_rules' => $l->validation_rules_json,
                        'fabcoins_cost' => $l->fabcoins_cost,
                    ];
                }),
            ];
        });

        return Inertia::render('Admin/AiSandbox/Index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Ejecutar Test de Calibración en Vivo con Gemini Vision
     */
    public function test(Request $request, AiPreflightService $preflightService)
    {
        $request->validate([
            'file' => ['nullable', 'file'],
            'max_x_mm' => ['required', 'numeric', 'min:5', 'max:300'],
            'max_y_mm' => ['required', 'numeric', 'min:5', 'max:300'],
            'max_z_mm' => ['required', 'numeric', 'min:1', 'max:300'],
            'min_wall_thickness_mm' => ['required', 'numeric', 'min:0.5', 'max:10'],
            'custom_system_prompt' => ['nullable', 'string'],
            'dimensions_text' => ['nullable', 'string'],
        ]);

        $rules = [
            'max_x_mm' => (float)$request->max_x_mm,
            'max_y_mm' => (float)$request->max_y_mm,
            'max_z_mm' => (float)$request->max_z_mm,
            'min_wall_thickness_mm' => (float)$request->min_wall_thickness_mm,
            'custom_prompt' => $request->custom_system_prompt,
        ];

        $startTime = microtime(true);

        if ($request->hasFile('file')) {
            $result = $preflightService->validateStl($request->file('file'), $rules);
        } else {
            // Test sintético con dimensiones pasadas
            $simulatedFile = tempnam(sys_get_temp_dir(), 'stl_test_');
            file_put_contents($simulatedFile, "solid test\nendsolid test\n");
            $uploadedFile = new \Illuminate\Http\UploadedFile($simulatedFile, 'test_sandbox.stl', 'application/sla', null, true);
            $result = $preflightService->validateStl($uploadedFile, $rules);
            @unlink($simulatedFile);
        }

        $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

        return response()->json([
            'success' => true,
            'analysis' => $result,
            'latency_ms' => $latencyMs,
            'rules_applied' => $rules,
        ]);
    }
}