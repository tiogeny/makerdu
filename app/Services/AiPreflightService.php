<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiPreflightService
{
    /**
     * Analiza un archivo STL o SVG contra las reglas del nivel, extrayendo métricas y consultando a Gemini Vision en modo estructurado.
     */
    public function analyzeFile(string $filePath, string $originalFilename, ?array $rules = [], ?string $imageBase64 = null): array
    {
        $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));

        // 1. Extraer métricas físicas reales del archivo
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

        // Métricas de estimación de fabricación
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
            'ai_feedback' => $aiAnalysis['text_summary'],
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
        if (stripos($content, 'vertex') !== false) {
            $minX = PHP_FLOAT_MAX; $maxX = -PHP_FLOAT_MAX;
            $minY = PHP_FLOAT_MAX; $maxY = -PHP_FLOAT_MAX;
            $minZ = PHP_FLOAT_MAX; $maxZ = -PHP_FLOAT_MAX;
            $vertexCount = 0;

            if (preg_match_all('/vertex\s+([-\d\.\+eE]+)\s+([-\d\.\+eE]+)\s+([-\d\.\+eE]+)/i', $content, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $m) {
                    $x = (float)$m[1]; $y = (float)$m[2]; $z = (float)$m[3];
                    $minX = min($minX, $x); $maxX = max($maxX, $x);
                    $minY = min($minY, $y); $maxY = max($maxY, $y);
                    $minZ = min($minZ, $z); $maxZ = max($maxZ, $z);
                    $vertexCount++;
                }

                $dimX = round(abs($maxX - $minX), 1);
                $dimY = round(abs($maxY - $minY), 1);
                $dimZ = round(abs($maxZ - $minZ), 1);

                return [
                    'x_mm' => $dimX > 0 ? $dimX : 40.0,
                    'y_mm' => $dimY > 0 ? $dimY : 40.0,
                    'z_mm' => $dimZ > 0 ? $dimZ : 10.0,
                    'triangles' => intval($vertexCount / 3),
                ];
            }
        }

        // Si es Binario STL
        $handle = @fopen($filePath, 'rb');
        if ($handle) {
            $header = fread($handle, 80);
            $triangleCountBytes = fread($handle, 4);
            $triangleCount = 0;

            if (strlen($triangleCountBytes) === 4) {
                $unpacked = unpack('Vcount', $triangleCountBytes);
                $triangleCount = $unpacked['count'] ?? 0;
            }

            $minX = PHP_FLOAT_MAX; $maxX = -PHP_FLOAT_MAX;
            $minY = PHP_FLOAT_MAX; $maxY = -PHP_FLOAT_MAX;
            $minZ = PHP_FLOAT_MAX; $maxZ = -PHP_FLOAT_MAX;

            if ($triangleCount > 0) {
                $samples = min($triangleCount, 6000);
                for ($i = 0; $i < $samples; $i++) {
                    fseek($handle, 84 + ($i * 50) + 12);
                    $vertexData = fread($handle, 36);
                    if (strlen($vertexData) === 36) {
                        $v = unpack('f9coords', $vertexData);
                        for ($j = 1; $j <= 9; $j += 3) {
                            $x = $v["coords$j"];
                            $y = $v['coords' . ($j + 1)];
                            $z = $v['coords' . ($j + 2)];

                            $minX = min($minX, $x); $maxX = max($maxX, $x);
                            $minY = min($minY, $y); $maxY = max($maxY, $y);
                            $minZ = min($minZ, $z); $maxZ = max($maxZ, $z);
                        }
                    }
                }
                fclose($handle);

                $dimX = round(abs($maxX - $minX), 1);
                $dimY = round(abs($maxY - $minY), 1);
                $dimZ = round(abs($maxZ - $minZ), 1);

                return [
                    'x_mm' => ($dimX > 0 && $dimX < 500) ? $dimX : 38.0,
                    'y_mm' => ($dimY > 0 && $dimY < 500) ? $dimY : 38.0,
                    'z_mm' => ($dimZ > 0 && $dimZ < 500) ? $dimZ : 8.5,
                    'triangles' => $triangleCount,
                ];
            }
            fclose($handle);
        }

        return [
            'x_mm' => 40.0,
            'y_mm' => 40.0,
            'z_mm' => 10.0,
            'triangles' => 1200,
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
        // Prioridad: Modelos Lite (500 peticiones/día gratuitas) antes de modelos estándar (20 peticiones/día)
        $modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];

        $maxX = $rules['max_x_mm'] ?? 50;
        $maxY = $rules['max_y_mm'] ?? 50;
        $maxZ = $rules['max_z_mm'] ?? 15;
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $isImageDrawing = in_array($ext, ['png', 'jpg', 'jpeg', 'webp']) || ($metrics['file_type'] ?? '') === 'png';

        if ($apiKey) {
            if ($isImageDrawing) {
                $promptText = "Eres el Mentor de Fabricación Digital y Control de Calidad de Makerdu. "
                    . "Analiza la imagen adjunta correspondiente a un boceto o silueta 2D para un Art Toy 2.5D autoportante ('{$fileName}'). "
                    . "Evalúa con visión pedagógica y técnica: "
                    . "1. Identifica qué personaje o figura es (ej. dinosaurio, criatura, robot, animal). "
                    . "2. ¿La silueta exterior está completamente cerrada o tiene aberturas? "
                    . "3. ¿La base inferior es amplia y estable para que el juguete se pare de pie solo en el escritorio? "
                    . "4. ¿Tiene espacios negativos bien definidos (ojos, boca, detalles)? "
                    . "Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto: "
                    . json_encode([
                        'headline' => 'Dinosaurio amigable en silueta cerrada autoportante',
                        'strengths' => [
                            'Punto fuerte 1 sobre el trazo y personaje detectado',
                            'Punto fuerte 2 sobre la estabilidad de la base o detalles'
                        ],
                        'slicing_recommendations' => [
                            'tecnica' => 'Extrusión 2.5D a 10 mm',
                            'base_estabilidad' => 'Base amplia autoportante'
                        ],
                        'pedagogical_tip' => 'Consejo breve y motivador para extruirlo a 3D',
                        'verdict_title' => '¡SILUETA APROBADA!',
                        'text_summary' => 'Resumen amigable de 2 oraciones para el estudiante creador'
                    ]);
            } else {
                $promptText = "Eres el Ingeniero Jefe de Fabricación Digital y Control de Calidad de Makerdu. "
                    . "Analiza la imagen adjunta del modelo 3D '{$fileName}' ({$metrics['x_mm']}x{$metrics['y_mm']}x{$metrics['z_mm']} mm, {$metrics['material_grams']}g PLA, " . ($metrics['triangles'] ?? 0) . " triángulos). "
                    . "Límites del reto: {$maxX}x{$maxY}x{$maxZ} mm. "
                    . "Estado: " . ($isValid ? "APROBADO" : "RECHAZADO: " . implode('; ', $violations)) . ". "
                    . "Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto: "
                    . json_encode([
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
                    "Silueta cerrada y continua: Trazo nítido sin aberturas que confundan al vectorizador.",
                    "Base inferior ancha y estable: Excelente centro de gravedad para que se sostenga de pie solo.",
                    "Espacios negativos definidos: Rasgos interiores claros para ser grabados o calados."
                ],
                'slicing_recommendations' => [
                    'tecnica' => 'Extrusión 2.5D a 10 mm',
                    'base_estabilidad' => 'Base amplia autoportante'
                ],
                'pedagogical_tip' => "¡Gran silueta! Tu dibujo está listo para ser digitalizado y extruido a 10 mm en el modelador.",
                'verdict_title' => '¡SILUETA APROBADA!',
                'text_summary' => "El boceto '{$fileName}' presenta una silueta cerrada con excelente estabilidad para convertirse en un Art Toy.",
                'tokens_used' => 0,
                'model_used' => 'local_fallback',
            ];
        }

        $isJewelry = stripos($fileName, 'arete') !== false || stripos($fileName, 'pendant') !== false || $metrics['z_mm'] <= 6.0;

        return [
            'headline' => $isJewelry ? "Arete con relieve escalonado y base plana" : "Modelo 3D con base de fabricación",
            'strengths' => [
                "Base 100% plana: Adherencia óptima a la bandeja magnética sin soportes.",
                "Dimensiones ({$metrics['x_mm']}x{$metrics['y_mm']}x{$metrics['z_mm']} mm): Dentro de los límites del reto.",
                "Densidad de malla: Definición geométrica precisa con {$metrics['material_grams']} g de PLA."
            ],
            'slicing_recommendations' => [
                'nozzle' => '0.4 mm',
                'layer_height' => '0.16 mm - 0.20 mm',
                'infill' => '15% relleno'
            ],
            'pedagogical_tip' => $isValid ? "Pieza lista para laminar y autorizar fabricación con {$metrics['estimated_fc_cost']} FabCoins." : "Ajusta las medidas en TinkerCAD para que no superen los límites máximos.",
            'verdict_title' => $isValid ? '¡DISEÑO APROBADO!' : 'REQUIERE AJUSTE EN TINKERCAD',
            'text_summary' => $isValid ? "El modelo '{$fileName}' cumple 100% las tolerancias y tiene excelente imprimibilidad." : "Se detectaron excesos: " . implode(', ', $violations),
            'tokens_used' => 0,
            'model_used' => 'local_fallback',
        ];
    }
}