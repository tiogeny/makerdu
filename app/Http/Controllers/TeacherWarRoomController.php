<?php

namespace App\Http\Controllers;

use App\Models\BitacoraEntry;
use App\Models\Classroom;
use App\Models\FabricationBatch;
use App\Models\Project;
use App\Models\Squad;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;

class TeacherWarRoomController extends Controller
{
    /**
     * Torre de Control Docente (Mapa de Calor de Aprendizaje y Lotes de Fabricación)
     */
    public function index(Request $request)
    {
        $classrooms = Classroom::with(['teacher', 'squads.members'])->get();
        $selectedClassroomId = $request->input('classroom_id', $classrooms->first()->id ?? null);
        $activeClassroom = Classroom::with(['teacher', 'squads.members'])->find($selectedClassroomId);

        $project = Project::with('levels')->first();

        // Mapa de calor: Estado de cada escuadra por cada nivel
        $heatmapData = [];
        if ($activeClassroom) {
            foreach ($activeClassroom->squads as $squad) {
                $levelsProgress = [];
                $bitacoras = BitacoraEntry::where('squad_id', $squad->id)->get();

                foreach ($project->levels as $level) {
                    $entry = $bitacoras->where('level_id', $level->id)->sortByDesc('id')->first();
                    $status = 'locked';

                    if ($entry) {
                        $status = $entry->status === 'approved' ? 'completed' : 'in_progress';
                    } elseif ($level->level_number === 1) {
                        $status = 'in_progress';
                    }

                    $levelsProgress[] = [
                        'level_id' => $level->id,
                        'level_number' => $level->level_number,
                        'status' => $status,
                    ];
                }

                $heatmapData[] = [
                    'squad_id' => $squad->id,
                    'squad_name' => $squad->name,
                    'fabcoins_balance' => $squad->fabcoins_balance,
                    'total_xp' => $squad->members->sum('xp_points'),
                    'members_count' => $squad->members->count(),
                    'levels_progress' => $levelsProgress,
                ];
            }
        }

        // Lotes de fabricación del aula seleccionada
        $batches = FabricationBatch::where('classroom_id', $selectedClassroomId)
            ->latest()
            ->get();

        // Traducción a competencias curriculares CNEB / MINEDU
        $competencies = [
            1 => [
                'name' => 'Ideación y Bocetado Digital',
                'cneb_competency' => 'Competencia 28 (Se desenvuelve en entornos virtuales generados por las TIC)',
                'indicator' => 'Modela y diseña objetos tridimensionales para resolver retos de su entorno.',
            ],
            2 => [
                'name' => 'Restricciones y Tolerancias Físicas',
                'cneb_competency' => 'Competencia 20 (Diseña y construye soluciones tecnológicas)',
                'indicator' => 'Verifica dimensiones y propiedades estructurales de los materiales.',
            ],
            3 => [
                'name' => 'Fabricación Digital y Pre-flight Check',
                'cneb_competency' => 'Competencia 27 (Gestiona proyectos de emprendimiento económico o social)',
                'indicator' => 'Optimiza insumos de producción y presupuesto en FabCoins.',
            ],
            4 => [
                'name' => 'Ensamblaje Figital y Bitácora',
                'cneb_competency' => 'Competencia 28 / 20 / 27 Integrada',
                'indicator' => 'Documenta el proceso colaborativo y evalúa el impacto del producto final.',
            ],
        ];

        return Inertia::render('Teacher/WarRoom', [
            'classrooms' => $classrooms,
            'activeClassroom' => $activeClassroom,
            'project' => $project,
            'heatmap' => $heatmapData,
            'competencies' => $competencies,
            'batches' => $batches,
        ]);
    }

    /**
     * Descarga de Tarjetas de PIN Imprimibles en PDF para los alumnos
     */
    public function downloadPinCards(Classroom $classroom)
    {
        $classroom->load(['teacher', 'squads.members']);

        $pdf = Pdf::loadView('pdf.pin_cards', [
            'classroom' => $classroom,
        ]);

        return $pdf->download("tarjetas_pin_aula_{$classroom->access_code}.pdf");
    }

    /**
     * Pasaporte Maker Digital Verificable y Portafolio
     */
    public function passport(Squad $squad)
    {
        $squad->load(['classroom.teacher', 'members']);
        $classroom = $squad->classroom;
        $project = Project::with('levels')->first();

        $bitacoras = BitacoraEntry::with(['activeRoleUser', 'level'])
            ->where('squad_id', $squad->id)
            ->where('status', 'approved')
            ->latest()
            ->get();

        $competencies = [
            1 => [
                'name' => 'Ideación y Modelado Digital',
                'cneb_competency' => 'Competencia TIC 28',
                'indicator' => 'Modela objetos tridimensionales.',
            ],
            2 => [
                'name' => 'Tolerancias y Parámetros Mecánicos',
                'cneb_competency' => 'Competencia Tecnología 20',
                'indicator' => 'Verifica dimensiones de fabricación.',
            ],
            3 => [
                'name' => 'Gestión de Recursos y FabCoins',
                'cneb_competency' => 'Competencia Emprendimiento 27',
                'indicator' => 'Optimiza insumos de fabricación.',
            ],
        ];

        return Inertia::render('Student/MakerPassport', [
            'squad' => $squad,
            'classroom' => $classroom,
            'project' => $project,
            'bitacoras' => $bitacoras,
            'competencies' => $competencies,
            'qrUrl' => "https://makerdu.test/family/{$classroom->access_code}/squad/{$squad->id}",
        ]);
    }

    /**
     * Empaquetar Lote de Fabricación (.ZIP + Hoja de Rotulado PDF)
     */
    public function generateBatch(Request $request, Classroom $classroom)
    {
        $classroom->load(['squads.members']);
        $project = Project::with('levels')->first();

        $batch = FabricationBatch::create([
            'classroom_id' => $classroom->id,
            'status' => 'queue',
            'shipping_address' => 'FabLab Makerdu Central - Sede Principal',
        ]);

        $pdf = Pdf::loadView('pdf.fabrication_label', [
            'batch' => $batch,
            'classroom' => $classroom,
            'project' => $project,
            'squads' => $classroom->squads,
        ]);

        $pdfPath = "batches/rotulado_lote_{$batch->id}.pdf";
        Storage::disk('public')->put($pdfPath, $pdf->output());

        $zipPath = "batches/disenos_lote_{$batch->id}.zip";
        $fullZipPath = Storage::disk('public')->path($zipPath);

        if (!file_exists(dirname($fullZipPath))) {
            mkdir(dirname($fullZipPath), 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($fullZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($classroom->squads as $squad) {
                $bitacora = BitacoraEntry::where('squad_id', $squad->id)
                    ->whereNotNull('file_url')
                    ->where('status', 'approved')
                    ->latest()
                    ->first();

                if ($bitacora && $bitacora->file_url) {
                    $relativeFilePath = str_replace('/storage/', '', $bitacora->file_url);
                    if (Storage::disk('public')->exists($relativeFilePath)) {
                        $fileContents = Storage::disk('public')->get($relativeFilePath);
                        $extension = pathinfo($relativeFilePath, PATHINFO_EXTENSION);
                        $zip->addFromString("{$squad->name}/diseno_final.{$extension}", $fileContents);
                    }
                } else {
                    $zip->addFromString("{$squad->name}/README.txt", "Escuadra: {$squad->name}\nAula: {$classroom->name}\nArchivo pendiente de exportar.");
                }
            }
            $zip->close();
        }

        $batch->update([
            'pdf_label_url' => Storage::url($pdfPath),
            'zip_file_url' => Storage::url($zipPath),
            'status' => 'queue',
        ]);

        return back()->with('success', "¡Lote de Fabricación #{$batch->id} generado exitosamente! Se han empaquetado los archivos .ZIP y la Hoja de Rotulado PDF para el técnico del FabLab.");
    }

    /**
     * Actualizar estado del lote
     */
    public function updateBatchStatus(Request $request, FabricationBatch $batch)
    {
        $request->validate([
            'status' => ['required', 'in:queue,printing,dispatched,delivered'],
        ]);

        $batch->update(['status' => $request->status]);

        return back()->with('success', "Estado del lote #{$batch->id} actualizado a {$request->status}.");
    }

    /**
     * Portal Familiar Seguro
     */
    public function familyPortal($accessCode, Squad $squad)
    {
        $squad->load(['classroom', 'members']);
        $project = Project::with('levels')->first();

        $bitacoras = BitacoraEntry::with(['activeRoleUser', 'level'])
            ->where('squad_id', $squad->id)
            ->where('status', 'approved')
            ->latest()
            ->get();

        return Inertia::render('Family/Portal', [
            'squad' => $squad,
            'project' => $project,
            'bitacoras' => $bitacoras,
        ]);
    }
}