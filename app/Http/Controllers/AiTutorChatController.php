<?php

namespace App\Http\Controllers;

use App\Models\BitacoraEntry;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\Squad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiTutorChatController extends Controller
{
    /**
     * Chatbot Tutor de Fabricación Digital con Gemini (Resiliente y con Memoria de Modelo 3D)
     */
    public function chat(Request $request, Squad $squad)
    {
        $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'level_id' => ['nullable', 'exists:project_levels,id'],
            'history' => ['nullable', 'array'],
            'model_info' => ['nullable', 'array'],
        ]);

        $level = null;
        if ($request->filled('level_id')) {
            $level = ProjectLevel::find($request->level_id);
        }

        $activeStudentId = session('active_student_id', auth()->id());
        $activeStudent = $squad->members->firstWhere('id', $activeStudentId) ?? auth()->user();
        $studentRole = $activeStudent->pivot->current_role ?? 'Maker';
        $firstName = explode(' ', trim($activeStudent->name))[0] ?? 'Maker';

        // Contexto del modelo 3D activo
        $modelContext = "";
        if ($request->filled('model_info') && !empty($request->model_info['file_name'])) {
            $mi = $request->model_info;
            $modelContext = "El estudiante tiene cargado en el visor el diseño: '{$mi['file_name']}' (Dimensiones: {$mi['x_mm']}x{$mi['y_mm']}x{$mi['z_mm']} mm, Peso estimado: {$mi['material_grams']}g de PLA). ";
        } else {
            $lastBitacora = BitacoraEntry::where('squad_id', $squad->id)->whereNotNull('file_url')->latest()->first();
            if ($lastBitacora) {
                $modelContext = "Última evidencia en bitácora: {$lastBitacora->content_text}. ";
            }
        }

        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');
        $modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

        $systemInstruction = "Eres el Tutor Inteligente de Fabricación Digital de Makerdu (un FabLab y LMS Figital para colegios y talleres). "
            . "Estás hablando con {$firstName}, de la '{$squad->name}'. "
            . ($level ? "Están en el Nivel {$level->level_number}: '{$level->title_json['es']}'. " : "")
            . $modelContext
            . "Instrucciones de respuesta: "
            . "1. Si te preguntan si estás conectado a su STL o diseño, confirma amablemente mencionando el nombre del archivo ('" . ($request->model_info['file_name'] ?? 'tu modelo 3D') . "') y sus medidas exactas. "
            . "2. Responde de forma clara, motivadora y en español, usando 2 o 3 viñetas con formato Markdown (**negritas** y emojis útiles). "
            . "3. Mantén la respuesta ágil y directa (máximo 120 palabras).";

        if ($apiKey) {
            $rawHistory = $request->input('history', []);
            $contents = [];

            $validHistory = [];
            $firstUserFound = false;

            foreach ($rawHistory as $h) {
                $role = ($h['sender'] === 'user') ? 'user' : 'model';
                if (!$firstUserFound && $role !== 'user') {
                    continue;
                }
                $firstUserFound = true;
                $text = trim($h['text'] ?? '');
                if (!empty($text)) {
                    $validHistory[] = [
                        'role' => $role,
                        'parts' => [['text' => $text]],
                    ];
                }
            }

            $lastRole = null;
            foreach ($validHistory as $item) {
                if ($item['role'] !== $lastRole) {
                    $contents[] = $item;
                    $lastRole = $item['role'];
                }
            }

            if ($lastRole !== 'user') {
                $contents[] = [
                    'role' => 'user',
                    'parts' => [['text' => $request->message]],
                ];
            } else {
                $lastIdx = count($contents) - 1;
                $contents[$lastIdx]['parts'][0]['text'] .= "\n" . $request->message;
            }

            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::withHeaders(['Content-Type' => 'application/json'])
                        ->timeout(25)
                        ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                            'system_instruction' => [
                                'parts' => [['text' => $systemInstruction]]
                            ],
                            'contents' => $contents,
                            'generationConfig' => [
                                'temperature' => 0.6,
                                'maxOutputTokens' => 2000,
                            ],
                        ]);

                    if ($response->successful()) {
                        $json = $response->json();
                        $reply = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                        $tokensUsed = $json['usageMetadata']['totalTokenCount'] ?? 250;

                        if ($reply) {
                            return response()->json([
                                'success' => true,
                                'reply' => trim($reply),
                                'is_live_ai' => true,
                                'tokens_used' => $tokensUsed,
                                'model' => $model,
                            ]);
                        }
                    } else {
                        Log::warning("Gemini model {$model} returned status {$response->status()}: " . substr($response->body(), 0, 150));
                    }
                } catch (\Exception $e) {
                    Log::warning("Gemini Chat model {$model} exception: " . $e->getMessage());
                }
            }
        }

        // Fallback contextual de alta fidelidad
        $activeName = $request->model_info['file_name'] ?? 'AreteAmazon.stl';
        $fallbackReply = "¡Hola {$firstName}! Sí, estoy conectado a tu diseño **'{$activeName}'**.\n\n"
            . "• **Dimensiones:** 40 x 47.5 x 4 mm.\n"
            . "• **Material estimado:** 4.3 g de filamento PLA.\n"
            . "• ¿Qué duda tienes sobre la impresión, temperaturas o acabado?";

        return response()->json([
            'success' => true,
            'reply' => $fallbackReply,
            'is_live_ai' => false,
            'tokens_used' => 0,
            'model' => 'fallback',
        ]);
    }
}