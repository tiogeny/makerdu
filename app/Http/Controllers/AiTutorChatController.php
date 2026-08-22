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
     * Chatbot Tutor de Fabricación Digital con Gemini 3.5 Flash Lite (Ultra Rápido y Bajo Consumo de Tokens)
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

        // Buscar última evidencia o modelo activo de la escuadra
        $modelContext = "";
        if ($request->filled('model_info') && !empty($request->model_info['file_name'])) {
            $mi = $request->model_info;
            $modelContext = "Diseño activo en la cabina: '{$mi['file_name']}' (Medidas: {$mi['x_mm']}x{$mi['y_mm']}x{$mi['z_mm']} mm, Material: {$mi['material_grams']}g PLA). ";
        } else {
            $lastBitacora = BitacoraEntry::where('squad_id', $squad->id)->whereNotNull('file_url')->latest()->first();
            if ($lastBitacora) {
                $modelContext = "Último diseño registrado: {$lastBitacora->content_text}. ";
            }
        }

        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');
        $modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];

        $systemInstruction = "Eres el Tutor y Mentor de Fabricación Digital de Makerdu (un FabLab y LMS Figital de clase mundial). "
            . "Estás guiando a {$firstName}, con rol de {$studentRole} en la escuadra '{$squad->name}'. "
            . ($level ? "Nivel de reto: Nivel {$level->level_number}: '{$level->title_json['es']}'. " : "")
            . $modelContext
            . "Reglas de oro indispensables: "
            . "1. Sé súper conciso, directo al grano y pedagógico (máximo 80 a 100 palabras en total). "
            . "2. Responde en 2 o 3 viñetas con formato Markdown (**negritas** y emojis útiles). "
            . "3. Haz referencia específica al modelo que están trabajando ({$modelContext}). "
            . "4. No uses saludos largos ni repitas su rol a cada momento.";

        if ($apiKey) {
            $rawHistory = $request->input('history', []);
            $contents = [];

            // Gemini requiere que el historial comience siempre con el rol 'user' y alterne
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
                        ->timeout(12)
                        ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                            'system_instruction' => [
                                'parts' => [['text' => $systemInstruction]]
                            ],
                            'contents' => $contents,
                            'generationConfig' => [
                                'temperature' => 0.3,
                                'maxOutputTokens' => 400,
                            ],
                        ]);

                    if ($response->successful()) {
                        $json = $response->json();
                        $reply = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                        $tokensUsed = $json['usageMetadata']['totalTokenCount'] ?? 150;

                        if ($reply) {
                            return response()->json([
                                'success' => true,
                                'reply' => trim($reply),
                                'is_live_ai' => true,
                                'tokens_used' => $tokensUsed,
                                'model' => $model,
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Gemini Chat model {$model} error: " . $e->getMessage());
                }
            }
        }

        // Fallback pedagógico ultra-conciso
        $msgLower = strtolower($request->message);
        $fallbackReply = "• **Calibración de Cama:** Nivelación a 0.2mm con hoja de papel y cama a 60°C para PLA.\n"
            . "• **Adhesión:** Limpia la superficie magnética con alcohol y activa un *Brim* de 4mm en tu laminador.\n"
            . "• **Recomendación:** Para '{$firstName}', imprimir en 1 solo color destaca las sombras de tus relieves escalonados.";

        return response()->json([
            'success' => true,
            'reply' => $fallbackReply,
            'is_live_ai' => false,
            'tokens_used' => 0,
            'model' => 'fallback',
        ]);
    }
}