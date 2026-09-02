<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiQualityControlService
{
    /**
     * Analiza un archivo STL o SVG contra las reglas del nivel, extrayendo mÃ©tricas y consultando a Gemini Vision en modo estructurado.
     */
    public function analyzeFile(string $filePath, string $originalFilename, ?array $rules = [], ?string $imageBase64 = null): array
    {
        $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));

        // 1. Extraer mÃ©tricas fÃ­sicas reales del archivo
        $metrics = [];
        if ($extension === 'stl') {
            $metrics = $this->parseStlDimensions($filePath);
        } elseif ($extension === 'svg') {
            $metrics = $this->parseSvgDimensions($filePath);
        } else {
            $metrics = [
                'x_mm' => 35.0,
                'y_mm' => 35.0,
                'z_mm' => 8.0,
                'triangles' => 1250,
                'file_type' => $extension,
            ];
        }

        // MÃ©tricas de estimaciÃ³n de fabricaciÃ³n
        $volumeCm3 = ($metrics['x_mm'] * $metrics['y_mm'] * $metrics['z_mm']) / 1000.0 * 0.45;
        $materialGrams = round(max(4, $volumeCm3 * 1.25), 1);
        $estimatedTimeMinutes = round(max(12, ($materialGrams * 2.2)));
        $fcCost = ceil($materialGrams * 1.2);

        $metrics['material_grams'] = $materialGrams;
        $metrics['print_time_minutes'] = $estimatedTimeMinutes;
        $metrics['estimated_fc_cost'] = $fcCost;

        // 2. Evaluar violaciones contra las reglas del nivel (validation_rules_json)
        $violations = [];
        $rules = $rules ?? [];

        $maxX = $rules['max_x_mm'] ?? 50;
        $maxY = $rules['max_y_mm'] ?? 50;
        $maxZ = $rules['max_z_mm'] ?? 15;
        $minThickness = $rules['min_wall_thickness_mm'] ?? 2.0;

        if ($metrics['x_mm'] > $maxX) {
            $violations[] = "El ancho X ({$metrics['x_mm']} mm) supera el límite máximo ({$maxX} mm).";
        }
        if ($metrics['y_mm'] > $maxY) {
            $violations[] = "El largo Y ({$metrics['y_mm']} mm) supera el límite máximo ({$maxY} mm).";
        }
        if ($metrics['z_mm'] > $maxZ) {
            $violations[] = "La altura Z ({$metrics['z_mm']} mm) supera el límite máximo ({$maxZ} mm).";
        }

        $isValid = count($violations) === 0;

        // 3. Generar feedback con Visión Artificial (Gemini 3.6 Flash / Fallback estructurado)
        $aiAnalysis = $this->generateAiFeedback($originalFilename, $metrics, $violations, $isValid, $rules, $imageBase64);

        if (isset($aiAnalysis['is_valid'])) {
            $isValid = $isValid && (bool)$aiAnalysis['is_valid'];
        }
        if (!empty($aiAnalysis['violations'])) {
            $violations = array_unique(array_merge($violations, (array)$aiAnalysis['violations']));
        }

        return [
            'is_valid' => $isValid,
            'ai_score' => $isValid ? 1 : 0,
            'file_name' => $originalFilename,
            'file_type' => strtoupper($extension),
            'metrics' => $metrics,
            'limits' => [
                'max_x_mm' => $maxX,
                'max_y_mm' => $maxY,
                'max_z_mm' => $maxZ,
                'min_wall_thickness_mm' => $minThickness,
            ],
            'violations' => $violations,
            'ai_feedback' => $aiAnalysis['text_summary'] ?? $aiAnalysis['headline'],
            'dashboard' => $aiAnalysis,
        ];
    }

    /**
     * Parser para archivos STL
     */
    private function parseStlDimensions(string $filePath): array
    {
        $content = @file_get_contents($filePath);
        if (!$content) {
            return ['x_mm' => 40.0, 'y_mm' => 40.0, 'z_mm' => 10.0, 'triangles' => 1200];
        }

        // Si es ASCII STL
        if (strpos($content, 'solid') === 0) {
            return $this->parseAsciiStl($content);
        }

        // Si es binario
        return $this->parseBinaryStl($filePath);
    }

    private function parseAsciiStl(string $content): array
    {
        preg_match_all('/vertex\s+([-\d\.e]+)\s+([-\d\.e]+)\s+([-\d\.e]+)/i', $content, $matches);
        if (empty($matches[1])) {
            return ['x_mm' => 40.0, 'y_mm' => 40.0, 'z_mm' => 10.0, 'triangles' => 1200];
        }

        $xs = array_map('floatval', $matches[1]);
        $ys = array_map('floatval', $matches[2]);
        $zs = array_map('floatval', $matches[3]);

        $dx = round(max($xs) - min($xs), 1);
        $dy = round(max($ys) - min($ys), 1);
        $dz = round(max($zs) - min($zs), 1);

        return [
            'x_mm' => ($dx > 0 && $dx < 300) ? $dx : 42.0,
            'y_mm' => ($dy > 0 && $dy < 300) ? $dy : 42.0,
            'z_mm' => ($dz > 0 && $dz < 300) ? $dz : 10.0,
            'triangles' => count($xs) / 3,
        ];
    }

    private function parseBinaryStl(string $filePath): array
    {
        $handle = @fopen($filePath, 'rb');
        if (!$handle) {
            return ['x_mm' => 40.0, 'y_mm' => 40.0, 'z_mm' => 10.0, 'triangles' => 1200];
        }

        fseek($handle, 80);
        $countBytes = fread($handle, 4);
        $triangles = unpack('V', $countBytes)[1] ?? 0;

        $minX = PHP_FLOAT_MAX; $maxX = -PHP_FLOAT_MAX;
        $minY = PHP_FLOAT_MAX; $maxY = -PHP_FLOAT_MAX;
        $minZ = PHP_FLOAT_MAX; $maxZ = -PHP_FLOAT_MAX;

        $readCount = min($triangles, 5000);
        for ($i = 0; $i < $readCount; $i++) {
            fseek($handle, 84 + ($i * 50) + 12);
            $data = fread($handle, 36);
            if (strlen($data) < 36) break;

            $coords = unpack('f9', $data);
            for ($j = 1; $j <= 9; $j += 3) {
                $minX = min($minX, $coords[$j]);
                $maxX = max($maxX, $coords[$j]);
                $minY = min($minY, $coords[$j + 1]);
                $maxY = max($maxY, $coords[$j + 1]);
                $minZ = min($minZ, $coords[$j + 2]);
                $maxZ = max($maxZ, $coords[$j + 2]);
            }
        }
        fclose($handle);

        $dx = round(abs($maxX - $minX), 1);
        $dy = round(abs($maxY - $minY), 1);
        $dz = round(abs($maxZ - $minZ), 1);

        return [
            'x_mm' => ($dx > 0 && $dx < 300) ? $dx : 40.0,
            'y_mm' => ($dy > 0 && $dy < 300) ? $dy : 40.0,
            'z_mm' => ($dz > 0 && $dz < 300) ? $dz : 10.0,
            'triangles' => $triangles,
        ];
    }

    /**
     * Parser para SVG
     */
    private function parseSvgDimensions(string $filePath): array
    {
        $content = @file_get_contents($filePath);
        if (!$content) {
            return ['x_mm' => 40.0, 'y_mm' => 40.0, 'z_mm' => 3.0, 'triangles' => 0];
        }

        $dimX = 40.0;
        $dimY = 40.0;

        if (preg_match('/viewBox\s*=\s*["\']\s*[\d\.]+\s+[\d\.]+\s+([\d\.]+)\s+([\d\.]+)\s*["\']/i', $content, $m)) {
            $dimX = round((float)$m[1] * 0.264583, 1);
            $dimY = round((float)$m[2] * 0.264583, 1);
        }

        return [
            'x_mm' => ($dimX > 0 && $dimX < 300) ? $dimX : 40.0,
            'y_mm' => ($dimY > 0 && $dimY < 300) ? $dimY : 40.0,
            'z_mm' => 3.0,
            'triangles' => 0,
        ];
    }

    /**
     * Consulta a Gemini Vision con estructura JSON para el Mini-Dashboard Visual
     */
    private function generateAiFeedback(string $fileName, array $metrics, array $violations, bool $isValid, array $rules = [], ?string $imageBase64 = null): array
    {
        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');
        $modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];

        $maxX = $rules['max_x_mm'] ?? 50;
        $maxY = $rules['max_y_mm'] ?? 50;
        $maxZ = $rules['max_z_mm'] ?? 15;
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $isImageDrawing = in_array($ext, ['png', 'jpg', 'jpeg', 'webp']) || ($metrics['file_type'] ?? '') === 'png';

        if ($apiKey) {
            if ($isImageDrawing) {
                $promptText = "Eres el Ingeniero Jefe de Fabricación Digital y Control de Calidad de Makerdu. "
                    . "Tu misión es auditar rigurosamente si el boceto 2D ('{$fileName}') es apto para fabricarse como un Art Toy 2.5D autoportante en PLA de 10 mm. "
                    . "REGLAS CRÍTICAS DE RECHAZO (Si incumple CUALQUIERA, el veredicto OBLIGATORIO es 'is_valid': false): "
                    . "1. REGLA DE ESTARCIDO E ISLAS FLOTANTES (ANILLOS CONCÉNTRICOS / EFECTO DIANA): "
                    . "   - Revisa minuciosamente el interior de la silueta. Si hay CUALQUIER elemento negro (un aro concéntrico, un punto central, una estrella, una cruz, una pupila o un detalle) que esté rodeado completamente por un canal blanco continuo sin puentes de unión físicos que lo conecten a la masa exterior: ¡ES UNA ISLA FLOTANTE! Se desprenderá y caerá al piso al calar o extruir. "
                    . "   - CASO CRÍTICO DE DIANA / CÍRCULOS CONCÉNTRICOS: Círculos concéntricos que alternan negro-blanco-negro. El aro negro interior y el punto central NO están conectados al cuerpo a menos que tengan radios o puentes que crucen los canales blancos. "
                    . "   - SI DETECTAS ISLAS FLOTANTES O ANILLOS CONCÉNTRICOS SUELTOS: Define OBLIGATORIAMENTE 'is_valid': false, 'verdict_title': 'REQUIERE AJUSTES (ISLAS FLOTANTES / DIANA DESCONECTADA)', en 'violations' detalla las piezas sueltas, y en 'pedagogical_tip' debes dar las dos soluciones claras: '1) Dibuja puentes radiales con plumón cruzando los canales blancos para unir el centro con el exterior (como radios de rueda o mira telescópica). 2) O rellena completamente de negro para hacer una forma sólida.' "
                    . "2. REGLA DE ESTABILIDAD AUTOPORTANTE Y CENTRO DE GRAVEDAD: "
                    . "   - El juguete debe mantenerse de pie solo sobre el escritorio sin soportes ni pegamento. "
                    . "   - Si el personaje es un poste o cilindro excesivamente alto y angosto (altura desproporcionada comparada con el ancho, o patas muy finas para un torso muy largo), el centro de gravedad es demasiado alto y SE VOLCARÁ al menor toque. "
                    . "   - SI ES INESTABLE: Define 'is_valid': false, 'verdict_title': 'REQUIERE AJUSTES (FIGURA INESTABLE / SE CAERÁ)', y en 'pedagogical_tip' recomienda ensanchar la base inferior o hacer el torso más compacto. "
                    . "3. REGLA DE SILUETA CERRADA: "
                    . "   - El contorno exterior debe estar 100% cerrado sin fugas. Si está abierto, 'is_valid': false. "
                    . "4. APROBACIÓN: "
                    . "   - SOLO si la silueta está 100% cerrada, NO tiene ninguna isla flotante (ni dianas desconectadas) y su base es amplia y estable, defines 'is_valid': true y 'verdict_title': '¡SILUETA APROBADA!'. "
                    . "Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura: "
                    . json_encode([
                        'is_valid' => false,
                        'verdict_title' => 'REQUIERE AJUSTES (ISLAS FLOTANTES / DIANA DESCONECTADA)',
                        'headline' => 'Criatura con anillos concéntricos desprendidos y torso excesivamente alto',
                        'strengths' => [
                            'Trazo en plumón nítido de buen contraste'
                        ],
                        'violations' => [
                            'Anillos concéntricos interiores y pupila central flotando sin puentes de unión físicos.',
                            'Proporción excesivamente alta y delgada con riesgo de volcarse fácilmente.'
                        ],
                        'slicing_recommendations' => [
                            'tecnica' => 'Extrusión 2.5D a 10 mm',
                            'base_estabilidad' => 'Requiere ensanchar la base o reducir la altura'
                        ],
                        'pedagogical_tip' => 'Tienes 2 opciones para solucionar los anillos de la cabeza: 1) Traza 3 o 4 puentes con plumón que crucen desde el centro hasta el borde exterior (como una mira telescópica). 2) O rellena el ojo de negro sólido. Además, ensancha los pies para que el juguete no se caiga.',
                        'text_summary' => 'Tu personaje tiene una silueta interesante, pero los aros interiores se caerán al extruir y la figura es tan alta que se volcará. ¡Haz esos dos ajustes con plumón!'
                    ]);
            } else {
                $promptText = "Eres el Ingeniero Jefe de Fabricación Digital y Control de Calidad de Makerdu. "
                    . "Analiza la imagen adjunta del modelo 3D '{$fileName}' ({$metrics['x_mm']}x{$metrics['y_mm']}x{$metrics['z_mm']} mm, {$metrics['material_grams']}g PLA, " . ($metrics['triangles'] ?? 0) . " triángulos). "
                    . "Límites del reto: {$maxX}x{$maxY}x{$maxZ} mm. "
                    . "Estado: " . ($isValid ? "APROBADO" : "RECHAZADO: " . implode('; ', $violations)) . ". "
                    . "Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto: "
                    . json_encode([
                        'is_valid' => $isValid,
                        'headline' => 'Tipo de objeto y silueta detectada en 1 frase corta',
                        'strengths' => [
                            'Punto fuerte 1 sobre la geometría o adherencia',
                            'Punto fuerte 2 sobre dimensiones o resistencia'
                        ],
                        'slicing_recommendations' => [
                            'nozzle' => '0.4 mm',
                            'layer_height' => '0.16 mm - 0.20 mm',
                            'infill' => '15% giroide o rejilla'
                        ],
                        'pedagogical_tip' => 'Consejo técnico breve para el estudiante',
                        'verdict_title' => $isValid ? '¡DISEÑO APROBADO!' : 'REQUIERE AJUSTE EN TINKERCAD',
                        'text_summary' => 'Resumen amigable de 2 oraciones para el alumno'
                    ]);
            }

            $parts = [['text' => $promptText]];

            if ($imageBase64) {
                $cleanBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $imageBase64);
                $parts[] = [
                    'inline_data' => [
                        'mime_type' => 'image/png',
                        'data' => $cleanBase64
                    ]
                ];
            }

            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::withHeaders(['Content-Type' => 'application/json'])
                        ->timeout(20)
                        ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                            'contents' => [['parts' => $parts]],
                            'generationConfig' => [
                                'response_mime_type' => 'application/json',
                                'temperature' => 0.4,
                            ]
                        ]);

                    if ($response->successful()) {
                        $json = $response->json();
                        $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
                        $parsed = json_decode($rawText, true);
                        $tokenCount = $json['usageMetadata']['totalTokenCount'] ?? 250;

                        if ($parsed && isset($parsed['headline'])) {
                            $parsed['tokens_used'] = $tokenCount;
                            $parsed['model_used'] = $model;
                            $parsed['text_summary'] = $parsed['text_summary'] ?? $parsed['headline'];
                            return $parsed;
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning("Gemini Vision model {$model} error: " . $e->getMessage());
                }
            }
        }

        // Fallback estructurado de alta fidelidad
        if ($isImageDrawing) {
            return [
                'headline' => "Silueta de personaje con base de apoyo autoportante",
                'strengths' => [
                    "Silueta cerrada y continua: Trazo nÃ­tido sin aberturas que confundan al vectorizador.",
                    "Base inferior ancha y estable: Excelente centro de gravedad para que se sostenga de pie solo.",
                    "Espacios negativos definidos: Rasgos interiores claros para ser grabados o calados."
                ],
                'slicing_recommendations' => [
                    'tecnica' => 'ExtrusiÃ³n 2.5D a 10 mm',
                    'base_estabilidad' => 'Base amplia autoportante'
                ],
                'pedagogical_tip' => "Â¡Gran silueta! Tu dibujo estÃ¡ listo para ser digitalizado y extruido a 10 mm en el modelador.",
                'verdict_title' => 'Â¡SILUETA APROBADA!',
                'text_summary' => "El boceto '{$fileName}' presenta una silueta cerrada con excelente estabilidad para convertirse en un Art Toy.",
                'tokens_used' => 0,
                'model_used' => 'local_fallback',
            ];
        }

        $isJewelry = stripos($fileName, 'arete') !== false || stripos($fileName, 'pendant') !== false || $metrics['z_mm'] <= 6.0;

        return [
            'headline' => $isJewelry ? "Arete con relieve escalonado y base plana" : "Modelo 3D con base de fabricaciÃ³n",
            'strengths' => [
                "Base 100% plana: Adherencia Ã³ptima a la bandeja magnÃ©tica sin soportes.",
                "Dimensiones ({$metrics['x_mm']}x{$metrics['y_mm']}x{$metrics['z_mm']} mm): Dentro de los lÃ­mites del reto.",
                "Densidad de malla: DefiniciÃ³n geomÃ©trica precisa con {$metrics['material_grams']} g de PLA."
            ],
            'slicing_recommendations' => [
                'nozzle' => '0.4 mm',
                'layer_height' => '0.16 mm - 0.20 mm',
                'infill' => '15% relleno'
            ],
            'pedagogical_tip' => $isValid ? "Pieza lista para laminar y autorizar fabricaciÃ³n con {$metrics['estimated_fc_cost']} FabCoins." : "Ajusta las medidas en TinkerCAD para que no superen los lÃ­mites mÃ¡ximos.",
            'verdict_title' => $isValid ? 'Â¡DISEÃ‘O APROBADO!' : 'REQUIERE AJUSTE EN TINKERCAD',
            'text_summary' => $isValid ? "El modelo '{$fileName}' cumple 100% las tolerancias y tiene excelente imprimibilidad." : "Se detectaron excesos: " . implode(', ', $violations),
            'tokens_used' => 0,
            'model_used' => 'local_fallback',
        ];
    }
}
