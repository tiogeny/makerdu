<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\FabricationBatch;
use App\Models\Project;
use App\Models\Squad;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    /**
     * Tablero Maestro de Control para el Super Administrador
     */
    public function index()
    {
        $totalProjects = Project::count();
        $totalClassrooms = Classroom::count();
        $totalTeachers = User::where('role_type', 'teacher')->count();
        $totalSquads = Squad::count();
        $totalStudents = User::where('role_type', 'student')->count();
        $totalFabcoinsInCirculation = Squad::sum('fabcoins_balance');
        $totalBatches = FabricationBatch::count();

        $recentProjects = Project::with('levels')->latest()->take(5)->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'title' => $p->title_json['es'] ?? 'Curso Maker',
                'type' => $p->type,
                'total_levels' => $p->total_levels,
                'created_at' => $p->created_at->format('d/m/Y'),
            ];
        });

        $recentClassrooms = Classroom::with(['teacher', 'project', 'squads'])->latest()->take(5)->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'access_code' => $c->access_code,
                'teacher_name' => $c->teacher->name ?? 'No asignado',
                'project_title' => $c->project->title_json['es'] ?? 'Sin curso asignado',
                'squads_count' => $c->squads->count(),
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_projects' => $totalProjects,
                'total_classrooms' => $totalClassrooms,
                'total_teachers' => $totalTeachers,
                'total_squads' => $totalSquads,
                'total_students' => $totalStudents,
                'total_fabcoins' => $totalFabcoinsInCirculation,
                'total_batches' => $totalBatches,
            ],
            'recent_projects' => $recentProjects,
            'recent_classrooms' => $recentClassrooms,
        ]);
    }
}