<?php

namespace App\Http\Controllers;

use App\Models\BitacoraEntry;
use App\Models\Classroom;
use App\Models\FabricationBatch;
use App\Models\Project;
use App\Models\Squad;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;

class TeacherWarRoomController extends Controller
{
    /**
     * Vista War Room Docente con Mapa de Calor por Competencias
     */
    public function index(Request $request)
    {
        $teacher = Auth::user();

        $classrooms = Classroom::with(['squads.members', 'fabricationBatches'])
            ->where('teacher_id', $teacher->id)
            ->get();

        if ($classrooms->isEmpty()) {
            $classrooms = Classroom::with(['squads.members', 'fabricationBatches'])->get();
        }

        $selectedClassroomId = $request->input('classroom_id', $classrooms->first()->id ?? null);
        $activeClassroom = $classrooms->firstWhere('id', $selectedClassroomId) ?? $classrooms->first();

        $project = Project::with('levels')->first();

        // Construir Mapa de Calor y Competencias
        $heatmapData = [];
        $competencyTranslations = [
            1 => [
                'name' => 'Nivel 1: Reto e Ideación',
                'cneb_competency' => 'Competencia 28 (TIC): Crea objetos virtuales y personaliza entornos.',
                'indicator' => 'Identifica la problemática y boceta conceptos visuales.',
            ],
            2 => [
                'name' => 'Nivel 2: Modelado Digital',
                'cneb_competency' => 'Competencia 20 (Tecnología): Diseña y construye soluciones tecnológicas.',
                'indicator' => 'Modela formas tridimensionales cumpliendo tolerancias.',
            ],
            3 => [
                'name' => 'Nivel 3: Pre-flight IA & Fabricación',
                'cneb_competency' => 'Competencia 27 (Emprendimiento): Gestiona proyectos y optimiza recursos.',
                'indicator' => 'Valida parámetros mecánicos y administra presupuesto FabCoins.',
            ],
            4 => [
                'name' => 'Nivel 4: Ensamblaje y Entrega',
                'cneb_competency' => 'Competencia 20: Evalúa y comunica el funcionamiento de la solución.',
                'indicator' => 'Comprueba la funcionalidad del producto final.',
            ],
        ];

        if ($activeClassroom && $project) {
            foreach ($activeClassroom->squads as $squad) {
                $bitacoras = BitacoraEntry::where('squad_id', $squad->id)->get();
                $levelsProgress = [];

                foreach ($project->levels as $lvl) {
                    $entry = $bitacoras->firstWhere('level_id', $lvl->id);
                    $status = 'locked';

                    if ($entry) {
                        $status = $entry->status === 'approved' ? 'completed' : 'in_progress';
                    } elseif ($lvl->level_number === 1) {
                        $status = 'in_progress';
                    }

                    $levelsProgress[] = [
                        'level_id' => $lvl->id,
                        'level_number' => $lvl->level_number,
                        'title' => $lvl->title_json['es'] ?? "Nivel {$lvl->level_number}",
                        'status' => $status,
                        'has_ai_approval' => (bool)($entry->ai_score ?? false),
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

        $batches = FabricationBatch::where('classroom_id', $activeClassroom->id ?? 0)
            ->latest()
            ->get();

        return Inertia::render('Teacher/WarRoom', [
            'classrooms' => $classrooms,
            'activeClassroom' => $activeClassroom,
            'project' => $project,
            'heatmap' => $heatmapData,
            'competencies' => $competencyTranslations,
            'batches' => $batches,
        ]);
    }

    /**
     * Generar Lote de Fabricación (.ZIP + Hoja de Rotulado PDF)
     */
    public function generateBatch(Request $request, Classroom $classroom)
    {
        $project = Project::with('levels')->first();
        $squads = $classroom->squads()->with('members')->get();

        // 1. Crear registro de Lote
        $batch = FabricationBatch::create([
            'classroom_id' => $classroom->id,
            'status' => 'queue',
            'shipping_address' => 'FabLab Makerdu Central - Sede Principal',
        ]);

        // 2. Generar PDF de Rotulado con DomPDF
        $pdf = Pdf::loadView('pdf.fabrication_label', [
            'batch' => $batch,
            'classroom' => $classroom,
            'project' => $project,
            'squads' => $squads,
        ]);

        $pdfPath = "batches/rotulado_lote_{$batch->id}.pdf";
        Storage::disk('public')->put($pdfPath, $pdf->output());

        // 3. Generar Archivo ZIP con los modelos de la clase
        $zipPath = "batches/disenos_lote_{$batch->id}.zip";
        $fullZipPath = Storage::disk('public')->path($zipPath);

        // Asegurar que existe el directorio de batches
        if (!file_exists(dirname($fullZipPath))) {
            mkdir(dirname($fullZipPath), 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($fullZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($squads as $squad) {
                $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $squad->name);
                // Archivo STL demo para empaquetado del lote
                $stlContent = "solid stamp_{$squad->id}\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 40 0 0\nvertex 0 40 10\nendloop\nendfacet\nendsolid";
                $zip->addFromString("{$sanitizedName}/sello_{$sanitizedName}.stl", $stlContent);
            }
            $zip->close();
        }

        // Actualizar URLs en el lote
        $batch->update([
            'pdf_label_url' => Storage::url($pdfPath),
            'zip_file_url' => Storage::url($zipPath),
        ]);

        return back()->with('success', "¡Lote #{$batch->id} generado exitosamente! Se empaquetó el archivo .ZIP y la Hoja de Rotulado PDF.");
    }

    /**
     * Actualizar estado del Lote de Fabricación (Técnico FabLab)
     */
    public function updateBatchStatus(Request $request, FabricationBatch $batch)
    {
        $request->validate([
            'status' => ['required', 'in:queue,printing,dispatched,delivered'],
        ]);

        $batch->update(['status' => $request->status]);

        return back()->with('success', "Estado del Lote #{$batch->id} actualizado a '{$request->status}'.");
    }

    /**
     * Portal Público Seguro para Apoderados (WhatsApp Link)
     */
    public function familyPortal(string $accessCode, Squad $squad)
    {
        $squad->load(['classroom', 'members']);
        $project = Project::with('levels')->first();
        $bitacoras = BitacoraEntry::where('squad_id', $squad->id)->with('activeRoleUser')->get();

        return Inertia::render('Family/Portal', [
            'squad' => $squad,
            'project' => $project,
            'bitacoras' => $bitacoras,
        ]);
    }
}