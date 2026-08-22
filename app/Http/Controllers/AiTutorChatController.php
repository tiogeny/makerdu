<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\Squad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiTutorChatController extends Controller
{
    /**
     * Chatbot Tutor de Fabricación Digital con Gemini 2.0 Flash
     */
    public function chat(Request $request, Squad $squad)
    {
        $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'level_id' => ['nullable', 'exists:project_levels,id'],
            'history' => ['nullable', 'array'],
        ]);

        $level = null;
        if ($request->filled('level_id')) {
            $level = ProjectLevel::find($request->level_id);
        }

        $activeStudentId = session('active_student_id', auth()->id());
        $activeStudent = $squad->members->firstWhere('id', $activeStudentId) ?? auth()->user();
        $studentRole = $activeStudent->pivot->current_role ?? 'Maker';

        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');

        $systemInstruction = "Eres el Tutor Inteligente y Copiloto de Fabricación Digital de Makerdu (un FabLab para escuelas y talleres figitales). "
            . "Estás guiando a la escuadra '{$squad->name}'. "
            . "El alumno que te habla se llama {$activeStudent->name} y tiene el rol activo de '{$studentRole}'. "
            . ($level ? "Están trabajando en el Nivel {$level->level_number}: '{$level->title_json['es']}'. Guía del nivel: {$level->toolbox_json['guide']}. " : "")
            . "Tu objetivo es ayudarlos a resolver problemas de modelado 3D (TinkerCAD, Blender), parámetros de impresión (PLA, temperaturas, adhesión a la cama, soportes, boquillas), corte láser, tolerancias y optimización de FabCoins. "
            . "Sé pedagógico, motivador, técnico pero fácil de entender para estudiantes y responde siempre en español conciso (2 a 4 párrafos cortos).";

        if ($apiKey) {
            try {
                $contents = [];

                if ($request->filled('history') && is_array($request->history)) {
                    foreach ($request->history as $h) {
                        $role = ($h['sender'] === 'user') ? 'user' : 'model';
                        $contents[] = [
                            'role' => $role,
                            'parts' => [['text' => $h['text']]],
                        ];
                    }
                }

                $contents[] = [
                    'role' => 'user',
                    'parts' => [['text' => $request->message]],
                ];

                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(12)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
                        'system_instruction' => [
                            'parts' => [['text' => $systemInstruction]]
                        ],
                        'contents' => $contents,
                        'generationConfig' => [
                            'temperature' => 0.7,
                            'maxOutputTokens' => 600,
                        ],
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $reply = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($reply) {
                        return response()->json([
                            'success' => true,
                            'reply' => trim($reply),
                            'is_live_ai' => true,
                        ]);
                    }
                } else {
                    Log::warning("Gemini API Chat error: " . $response->body());
                }
            } catch (\Exception $e) {
                Log::warning("Excepción al consultar Gemini Chat: " . $e->getMessage());
            }
        }

        // Fallback pedagógico inteligente
        $msgLower = strtolower($request->message);
        $fallbackReply = "¡Hola {$activeStudent->name}! Como {$studentRole} de la escuadra '{$squad->name}', ";

        if (str_contains($msgLower, 'pega') || str_contains($msgLower, 'cama') || str_contains($msgLower, 'warping')) {
            $fallbackReply .= "si tu pieza se despega de la cama de impresión, verifica: 1) Calibrar la altura de la boquilla (nivelación Z=0), 2) Usar temperatura de cama de 55-60°C para PLA, y 3) Limpiar la superficie magnética con alcohol isopropílico antes de imprimir.";
        } elseif (str_contains($msgLower, 'agujero') || str_contains($msgLower, 'hueco') || str_contains($msgLower, 'tinkercad')) {
            $fallbackReply .= "para hacer un orificio en TinkerCAD: crea la forma cilíndrica del tamaño deseado, cámbiala a tipo 'Hueco' (Hole), alíneala con tu pieza sólida y presiona el botón 'Agrupar' (Ctrl + G).";
        } elseif (str_contains($msgLower, 'fabcoin') || str_contains($msgLower, 'ahorrar') || str_contains($msgLower, 'costo')) {
            $fallbackReply .= "para optimizar FabCoins: reduce el grosor de paredes innecesarias, mantén la altura Z en lo mínimo indispensable y usa un porcentaje de relleno (infill) del 15% al 20%.";
        } else {
            $fallbackReply .= "recuerda que el diseño figital requiere verificar siempre las medidas máximas en el visor 3D antes de mandar a fabricar. ¡Cuéntame qué herramienta o reto de este nivel estás modelando!";
        }

        return response()->json([
            'success' => true,
            'reply' => $fallbackReply,
            'is_live_ai' => false,
        ]);
    }
}