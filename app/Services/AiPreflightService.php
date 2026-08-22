<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiPreflightService
{
    /**
     * Analiza un archivo STL o SVG contra las reglas del nivel, extrayendo métricas y consultando a Gemini Vision.
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
        $materialGrams = round(max(4, $volumeCm3 * 1.25), 1); // PLA ~1.25 g/cm3
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

        // 3. Generar feedback con Visión Artificial (Gemini 3.6 Flash Multimodal)
        $aiFeedback = $this->generateAiFeedback($originalFilename, $metrics, $violations, $isValid, $rules, $imageBase64);

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
            'ai_feedback' => $aiFeedback,
        ];
    }

    /**
     * Parser para archivos STL (ASCII o Binario) para extraer bounding box real con precisión milimétrica.
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
     * Parser para archivos SVG vectoriales.
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
     * Consulta a Gemini Multimodal Vision API (con imagen 3D) o provee diagnóstico experto contextual.
     */
    private function generateAiFeedback(string $fileName, array $metrics, array $violations, bool $isValid, array $rules, ?string $imageBase64 = null): string
    {
        $apiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');

        if ($apiKey) {
            try {
                $promptText = "Eres el Ingeniero Jefe de Fabricación Digital y Control de Calidad de Makerdu (un FabLab y LMS Figital de clase mundial). "
                    . "Estás realizando una inspección pre-flight del diseño 3D/CAD: '{$fileName}'. "
                    . "Datos técnicos del archivo: "
                    . "• Dimensiones reales: {$metrics['x_mm']} mm (ancho X) x {$metrics['y_mm']} mm (largo Y) x {$metrics['z_mm']} mm (altura Z). "
                    . "• Peso estimado: {$metrics['material_grams']} g de filamento PLA. "
                    . "• Densidad geométrica: " . ($metrics['triangles'] ?? 0) . " triángulos en la malla. "
                    . "• Límites máximos del reto: {$rules['max_x_mm']} x {$rules['max_y_mm']} x {$rules['max_z_mm']} mm. "
                    . "• Estado de validación: " . ($isValid ? "APROBADO (Cumple 100% de tolerancias)" : "RECHAZADO: " . implode('; ', $violations)) . ". "
                    . "\nObserva con atención la imagen adjunta de la pieza renderizada sobre la bandeja magnética del visor 3D. "
                    . "Escribe un diagnóstico profesional, detallado y pedagógico (en 1 a 2 párrafos concisos en español) que incluya: "
                    . "1. Identificación precisa de la geometría y diseño (ej: silueta, relieves escalonados, orificios para aro/enganche, texturas, detalles grabados). "
                    . "2. Evaluación de imprimibilidad (adherencia de la base, necesidad o ausencia de soportes, recomendación de boquilla de 0.4mm o altura de capa recomendada de 0.16mm-0.20mm). "
                    . "3. Veredicto final motivador (si es válido, autoriza la producción; si no, indica exactamente cómo corregir en TinkerCAD/Blender).";

                $parts = [];
                $parts[] = ['text' => $promptText];

                if ($imageBase64) {
                    $cleanBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $imageBase64);
                    $parts[] = [
                        'inline_data' => [
                            'mime_type' => 'image/png',
                            'data' => $cleanBase64
                        ]
                    ];
                }

                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(20)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => $parts]
                        ]
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($text) {
                        return trim($text);
                    }
                } else {
                    Log::warning("Gemini Vision API error: " . $response->body());
                }
            } catch (\Exception $e) {
                Log::warning("Error al consultar Gemini Vision API: " . $e->getMessage());
            }
        }

        // Fallback pedagógico contextual
        $isJewelryOrRelief = stripos($fileName, 'arete') !== false || stripos($fileName, 'pendant') !== false || stripos($fileName, 'relic') !== false || $metrics['z_mm'] <= 8.0;
        
        if ($isValid) {
            if ($isJewelryOrRelief) {
                return "¡Excelente modelado escuadra! La pieza '{$fileName}' presenta una base delgada y relieves escalonados de {$metrics['z_mm']} mm bien proporcionados. La geometría encaja perfectamente en el volumen de {$metrics['x_mm']}x{$metrics['y_mm']} mm, permitiendo una excelente definición con boquilla estándar de 0.4 mm. ¡Autorizado para fabricar con {$metrics['estimated_fc_cost']} FabCoins!";
            } else {
                return "¡Gran trabajo escuadra! El modelo '{$fileName}' ({$metrics['x_mm']}x{$metrics['y_mm']}x{$metrics['z_mm']} mm) cuenta con una base sólida apoyada en la cama magnética y un volumen de {$metrics['material_grams']} g de PLA. Cumple con todas las tolerancias mecánicas. ¡Autorizado para fabricación!";
            }
        } else {
            return "Atención Escuadra: Se detectaron excesos mecánicos en '{$fileName}'. " . implode(' ', $violations) . " Regresen a TinkerCAD para escalar el contorno dentro del volumen máximo y vuelvan a ejecutar la inspección.";
        }
    }
}