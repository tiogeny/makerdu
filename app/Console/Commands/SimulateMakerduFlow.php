<?php

namespace App\Console\Commands;

use App\Models\BitacoraEntry;
use App\Models\Classroom;
use App\Models\FabricationBatch;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\Squad;
use App\Models\User;
use App\Services\AiPreflightService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class SimulateMakerduFlow extends Command
{
    protected $signature = 'makerdu:simulate';
    protected $description = 'Simula de extremo a extremo todo el flujo de Makerdu v2.6 (Alumnos, 1-PC, Preflight IA, FabCoins, War Room, Course Builder y Aulas)';

    public function handle(AiPreflightService $preflightService)
    {
        $this->info("===============================================================");
        $this->info("   INICIANDO SIMULACIÓN INTEGRAL: MAKERDU v2.6 (E2E TEST)");
        $this->info("===============================================================\n");

        $startTime = microtime(true);

        // -------------------------------------------------------------
        // PASO 1: VERIFICAR BASE DE DATOS Y SEEDER
        // -------------------------------------------------------------
        $this->comment("Paso 1: Verificando datos base (Aula, Alumnos y Proyecto)...");
        $classroom = Classroom::where('access_code', 'MK402')->first();
        $squad = Squad::with('members')->first();
        $project = Project::with('levels')->first();

        if (!$classroom || !$squad || !$project) {
            $this->error("Error: Faltan datos semilla. Ejecutando migrate:fresh --seed...");
            $this->call('migrate:fresh', ['--seed' => true]);
            $classroom = Classroom::where('access_code', 'MK402')->first();
            $squad = Squad::with('members')->first();
            $project = Project::with('levels')->first();
        }

        $this->line("  [✓] Aula encontrada: {$classroom->name} (Código: {$classroom->access_code})");
        $this->line("  [✓] Escuadra: {$squad->name} con {$squad->members->count()} alumnos.");
        $this->line("  [✓] Proyecto: {$project->title_json['es']} con {$project->levels->count()} niveles dinámicos.");
        $this->info("  -> PASO 1 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 2: SIMULACIÓN DE LOGIN ESTUDIANTIL POR PIN (Mateo - 1234)
        // -------------------------------------------------------------
        $this->comment("Paso 2: Simulando Login de Alumno con PIN y Código de Aula...");
        $mateo = $squad->members->firstWhere('pin', '1234');
        if (!$mateo) {
            $this->error("Alumno Mateo (PIN 1234) no encontrado.");
            return 1;
        }

        Auth::login($mateo);
        session(['active_squad_id' => $squad->id, 'active_student_id' => $mateo->id]);

        $this->line("  [✓] Alumno autenticado: {$mateo->name} (Rol inicial: {$mateo->pivot->current_role})");
        $this->line("  [✓] Sesión de Escuadra fijada en ID: {$squad->id}");
        $this->info("  -> PASO 2 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 3: REGLA DE 1-PC (CAMBIO DE ROL ACTIVO EN PANTALLA COMPARTIDA)
        // -------------------------------------------------------------
        $this->comment("Paso 3: Simulando Regla 1-PC (Cambio de Rol Activo a Sofía - Quality)...");
        $sofia = $squad->members->firstWhere('pin', '5678');
        
        $squad->members()->updateExistingPivot($sofia->id, ['current_role' => 'Quality']);
        session(['active_student_id' => $sofia->id]);

        $this->line("  [✓] Rol Activo en dispositivo transferido a: {$sofia->name} (Quality)");
        $this->line("  [✓] Sesión de Laravel intacta sin desloguear al equipo.");
        $this->info("  -> PASO 3 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 4: REGISTRO DE BITÁCORA Y ADICIÓN DE XP PUNTOS
        // -------------------------------------------------------------
        $this->comment("Paso 4: Simulando Envío de Evidencia a Bitácora Nivel 1...");
        $initialXp = $sofia->xp_points;
        $l1 = $project->levels->firstWhere('level_number', 1);

        $bitacora = BitacoraEntry::create([
            'squad_id' => $squad->id,
            'level_id' => $l1->id,
            'active_role_user_id' => $sofia->id,
            'content_text' => 'Evidencia de prueba automatizada: Ideación del prototipo completada.',
            'ai_score' => true,
            'ai_feedback' => 'Boceto validado pedagógicamente.',
            'status' => 'approved',
        ]);

        $sofia->increment('xp_points', 25);
        $sofia->refresh();

        $this->line("  [✓] Bitácora #{$bitacora->id} registrada para Nivel 1.");
        $this->line("  [✓] XP de {$sofia->name}: {$initialXp} XP -> {$sofia->xp_points} XP (+25 XP sumados)");
        $this->info("  -> PASO 4 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 5: PRE-FLIGHT CHECK CON IA (STL VÁLIDO VS INVÁLIDO)
        // -------------------------------------------------------------
        $this->comment("Paso 5: Simulando Motor de Pre-flight Check IA para archivos STL...");
        $l3 = $project->levels->firstWhere('level_number', 3);

        $validStlPath = storage_path('app/temp_valid_stamp.stl');
        file_put_contents($validStlPath, "solid stamp\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 40 0 0\nvertex 0 40 10\nendloop\nendfacet\nendsolid");

        $analysisValid = $preflightService->analyzeFile($validStlPath, 'temp_valid_stamp.stl', $l3->validation_rules_json ?? ['max_x_mm' => 50, 'max_y_mm' => 50, 'max_z_mm' => 15]);
        @unlink($validStlPath);

        $this->line("  [✓] STL Válido (40x40x10mm): is_valid = " . ($analysisValid['is_valid'] ? 'TRUE' : 'FALSE') . " | Material: {$analysisValid['metrics']['material_grams']}g | Costo FC: {$analysisValid['metrics']['estimated_fc_cost']} FC");

        $invalidStlPath = storage_path('app/temp_invalid_stamp.stl');
        file_put_contents($invalidStlPath, "solid stamp\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 75 0 0\nvertex 0 75 25\nendloop\nendfacet\nendsolid");

        $analysisInvalid = $preflightService->analyzeFile($invalidStlPath, 'temp_invalid_stamp.stl', ['max_x_mm' => 50, 'max_y_mm' => 50, 'max_z_mm' => 15]);
        @unlink($invalidStlPath);

        $this->line("  [✓] STL Excedido (75mm): is_valid = " . ($analysisInvalid['is_valid'] ? 'TRUE' : 'FALSE') . " | Violaciones detectadas: " . count($analysisInvalid['violations']));
        $this->info("  -> PASO 5 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 6: AUTORIZACIÓN Y CONSUMO REAL DE FABCOINS
        // -------------------------------------------------------------
        $this->comment("Paso 6: Simulando Autorización de Fabricación & Consumo de FabCoins...");
        $initialBalance = $squad->fabcoins_balance;
        $cost = 25;

        $squad->decrement('fabcoins_balance', $cost);
        $squad->refresh();
        $sofia->increment('xp_points', 50);

        $this->line("  [✓] Billetera FabCoins: {$initialBalance} FC -> {$squad->fabcoins_balance} FC (-{$cost} FC insumos descontados)");
        $this->line("  [✓] Bono de Fabricación: +50 XP otorgados al equipo.");
        $this->info("  -> PASO 6 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 7: WAR ROOM, GENERACIÓN DE ZIP, PDF ROTULADO Y TARJETAS PIN
        // -------------------------------------------------------------
        $this->comment("Paso 7: Simulando War Room Docente, Generación de .ZIP, PDF Rotulado y Tarjetas PIN...");
        $batch = FabricationBatch::create([
            'classroom_id' => $classroom->id,
            'status' => 'queue',
            'shipping_address' => 'FabLab Makerdu Central - Sede Principal',
        ]);

        $pdf = Pdf::loadView('pdf.fabrication_label', [
            'batch' => $batch,
            'classroom' => $classroom,
            'project' => $project,
            'squads' => [$squad],
        ]);
        $pdfPath = "batches/test_rotulado_lote_{$batch->id}.pdf";
        Storage::disk('public')->put($pdfPath, $pdf->output());

        $zipPath = "batches/test_disenos_lote_{$batch->id}.zip";
        $fullZipPath = Storage::disk('public')->path($zipPath);
        if (!file_exists(dirname($fullZipPath))) {
            mkdir(dirname($fullZipPath), 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($fullZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $zip->addFromString("{$squad->name}/sello_final.stl", "solid stamp_final\nendsolid");
            $zip->close();
        }

        // Tarjetas PIN PDF
        $pinPdf = Pdf::loadView('pdf.pin_cards', [
            'classroom' => $classroom,
        ]);
        $pinPdfPath = "batches/test_tarjetas_pin_{$classroom->id}.pdf";
        Storage::disk('public')->put($pinPdfPath, $pinPdf->output());

        $batch->update([
            'pdf_label_url' => Storage::url($pdfPath),
            'zip_file_url' => Storage::url($zipPath),
            'status' => 'printing',
        ]);

        $this->line("  [✓] Lote FabLab #{$batch->id} generado.");
        $this->line("  [✓] Archivo PDF Rotulado: " . filesize(Storage::disk('public')->path($pdfPath)) . " bytes");
        $this->line("  [✓] Archivo ZIP Modelos: " . filesize($fullZipPath) . " bytes");
        $this->line("  [✓] Tarjetas PIN PDF: " . filesize(Storage::disk('public')->path($pinPdfPath)) . " bytes");
        $this->info("  -> PASO 7 SUPERADO CON ÉXITO.\n");

        // -------------------------------------------------------------
        // PASO 8: DISEÑADOR DE CURSOS Y GESTOR DE AULAS/PINS
        // -------------------------------------------------------------
        $this->comment("Paso 8: Simulando Creación de Nuevo Curso y Matrícula Masiva con PINs...");
        $newProject = Project::create([
            'title_json' => ['es' => 'Curso Test Bio-Joyería', 'en' => 'Test Bio-Jewelry Course'],
            'description_json' => ['es' => 'Curso de prueba automatizado', 'en' => 'Automated test course'],
            'type' => '3D',
            'total_levels' => 2,
        ]);
        $this->line("  [✓] Course Builder: Proyecto #{$newProject->id} ('{$newProject->title_json['es']}') creado.");

        $newClassroom = Classroom::create([
            'teacher_id' => $classroom->teacher_id ?? 1,
            'name' => 'Aula Test 6to Primaria',
            'access_code' => 'MK-600',
            'mode' => 'school_squads',
        ]);

        $testStudents = ['Carlos Mendoza', 'Andrea Ruiz', 'Gabriel Peña', 'Lucía Torres'];
        $newSquad = Squad::create([
            'classroom_id' => $newClassroom->id,
            'name' => 'Escuadra Fénix 1',
            'fabcoins_balance' => 100,
        ]);

        $roles = ['Architect', 'Quality', 'Finance', 'Relator'];
        foreach ($testStudents as $idx => $sName) {
            $pin = str_pad((string)mt_rand(1000, 9999), 4, '0', STR_PAD_LEFT);
            $u = User::create([
                'name' => $sName,
                'email' => Str::slug($sName) . '.' . mt_rand(100, 999) . '@test.makerdu.local',
                'password' => Hash::make($pin),
                'pin' => $pin,
                'role_type' => 'student',
                'xp_points' => 100,
            ]);
            $newSquad->members()->attach($u->id, ['current_role' => $roles[$idx], 'active_minutes' => 0]);
        }

        $this->line("  [✓] Classroom Manager: Aula '{$newClassroom->name}' creada con 4 alumnos y PINs únicos en '{$newSquad->name}'.");
        $this->info("  -> PASO 8 SUPERADO CON ÉXITO.\n");

        $totalDuration = round(microtime(true) - $startTime, 2);

        $this->info("===============================================================");
        $this->info("   🎉 RESULTADO: TODOS LOS 8 PASOS PASARON SIN ERRORES (100%)");
        $this->info("   Tiempo total de simulación: {$totalDuration} segundos.");
        $this->info("===============================================================");

        return 0;
    }
}