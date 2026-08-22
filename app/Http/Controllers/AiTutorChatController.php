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
     * Chatbot Tutor de Fabricación Digital con Gemini 3.6 Flash
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
        $firstName = explode(' ', trim($activeStudent->name))[0] ?? 'Maker';

        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');

        $systemInstruction = "Eres el Tutor Inteligente y Mentor Senior de Fabricación Digital de Makerdu (un FabLab y LMS Figital de clase mundial). "
            . "Estás guiando a {$firstName}, integrante de la '{$squad->name}' con rol de {$studentRole}. "
            . ($level ? "Actualmente están en el Nivel {$level->level_number}: '{$level->title_json['es']}'. " : "")
            . "Tu misión es resolver cualquier duda técnica de impresión 3D (PLA, PETG, temperaturas, adherencia, boquillas 0.4mm, alturas de capa 0.2mm vs 0.12mm, warping, soportes), modelado CAD en TinkerCAD/Blender, corte láser, acabado artesanal y economía de FabCoins. "
            . "Reglas de conversación: "
            . "1. Trata a {$firstName} por su nombre con naturalidad y calidez. NO repitas su rol ni el nombre de su escuadra a cada momento. "
            . "2. Responde como un mentor entusiasta de innovación y FabLab. "
            . "3. Usa formato Markdown con negritas, listas o viñetas y emojis para que las explicaciones sean muy visuales y claras. "
            . "4. Da siempre recomendaciones prácticas reales de taller (por ejemplo, cambios de color con pausa de filamento M600, truco de pintar a mano, laca/pegamento para la cama, etc.).";

        if ($apiKey) {
            try {
                $rawHistory = $request->input('history', []);
                $contents = [];

                // Gemini requiere que el historial comience siempre con el rol 'user' y alterne
                $validHistory = [];
                $firstUserFound = false;

                foreach ($rawHistory as $h) {
                    $role = ($h['sender'] === 'user') ? 'user' : 'model';
                    if (!$firstUserFound && $role !== 'user') {
                        continue; // Omitir mensajes de bienvenida del modelo iniciales
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

                // Asegurar alternancia limpia user -> model -> user
                $lastRole = null;
                foreach ($validHistory as $item) {
                    if ($item['role'] !== $lastRole) {
                        $contents[] = $item;
                        $lastRole = $item['role'];
                    }
                }

                // Agregar el mensaje actual del usuario si no fue el último
                if ($lastRole !== 'user') {
                    $contents[] = [
                        'role' => 'user',
                        'parts' => [['text' => $request->message]],
                    ];
                } else {
                    // Si el último era user, actualizamos el texto
                    $lastIdx = count($contents) - 1;
                    $contents[$lastIdx]['parts'][0]['text'] .= "\n" . $request->message;
                }

                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(20)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}", [
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

        // Fallback pedagógico contextual
        $msgLower = strtolower($request->message);
        $fallbackReply = "¡Hola {$firstName}! ";

        if (str_contains($msgLower, 'pega') || str_contains($msgLower, 'cama') || str_contains($msgLower, 'despega') || str_contains($msgLower, 'warping')) {
            $fallbackReply .= "Para que no se despegue tu pieza:\n\n"
                . "1. **Calibra la cama (Z=0):** Asegúrate de que la boquilla pase rozando una hoja de papel en las 4 esquinas.\n"
                . "2. **Temperatura de cama:** Usa entre **55°C y 60°C** para filamento PLA.\n"
                . "3. **Limpieza:** Limpia la superficie magnética con alcohol isopropílico para retirar grasa o polvo.\n"
                . "4. **Adhesión extra:** Activa la opción **Brim (Borde)** de 4-5 mm en tu laminador.";
        } elseif (str_contains($msgLower, 'color') || str_contains($msgLower, 'colores') || str_contains($msgLower, 'pintar')) {
            $fallbackReply .= "Si buscas ahorrar FabCoins, te recomiendo imprimir en **1 solo color** y pintarlo a mano después con acrílicos.\n\n"
                . "💡 **Truco Maker:** Si tu diseño tiene relieves en diferentes alturas, puedes configurar una **pausa de capa (M600)** para cambiar el rollo de filamento a mitad de impresión sin gastar material extra en purgas.";
        } elseif (str_contains($msgLower, 'agujero') || str_contains($msgLower, 'hueco') || str_contains($msgLower, 'tinkercad')) {
            $fallbackReply .= "Para hacer un orificio en TinkerCAD:\n\n"
                . "1. Coloca un **Cilindro** sobre tu diseño y ajústale el diámetro.\n"
                . "2. En el panel superior derecho, cambia su propiedad a **'Hueco' (Hole)**.\n"
                . "3. Selecciona ambas piezas y pulsa **Agrupar (Ctrl + G)**. ¡Verás el agujero perfecto de inmediato!";
        } elseif (str_contains($msgLower, 'fabcoin') || str_contains($msgLower, 'ahorrar') || str_contains($msgLower, 'costo')) {
            $fallbackReply .= "Para optimizar tus FabCoins al máximo:\n\n"
                . "• **Relleno (Infill):** Usa entre **10% y 15%** (suficiente para piezas decorativas y aretes).\n"
                . "• **Altura Z:** Mantén el grosor del arete o relieve entre **3 y 4 mm**.\n"
                . "• **Paredes:** 2 perímetros de pared (0.8 mm) son ideales para que sea resistente y muy liviano.";
        } else {
            $fallbackReply .= "El modelado de tu pieza va por excelente camino. Recuerda verificar las medidas máximas en la pestaña de inspección 3D antes de mandar a imprimir. ¿Qué técnica o detalle quieres perfeccionar?";
        }

        return response()->json([
            'success' => true,
            'reply' => $fallbackReply,
            'is_live_ai' => false,
        ]);
    }
}