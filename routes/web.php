<?php

use App\Http\Controllers\ClassroomManagerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectBuilderController;
use App\Http\Controllers\StudentAuthController;
use App\Http\Controllers\SquadController;
use App\Http\Controllers\TeacherWarRoomController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing / Welcome
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Autenticación de Alumnos (Código de Aula + PIN de 4 dígitos)
Route::get('/student-login', [StudentAuthController::class, 'showLogin'])->name('student.login');
Route::post('/student-login', [StudentAuthController::class, 'login'])->name('student.login.post');
Route::post('/student-logout', [StudentAuthController::class, 'logout'])->name('student.logout');

// HUD de la Escuadra y Operaciones Maker
Route::middleware(['auth'])->group(function () {
    Route::get('/hud', [SquadController::class, 'hud'])->name('student.hud');
    Route::post('/squad/{squad}/switch-role', [SquadController::class, 'switchRole'])->name('squad.switch-role');
    Route::post('/squad/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('squad.preflight');
    Route::post('/squad/{squad}/level/{level}/fabricate', [SquadController::class, 'confirmFabrication'])->name('squad.fabricate');
    Route::post('/squad/{squad}/level/{level}/bitacora', [SquadController::class, 'submitBitacora'])->name('squad.bitacora.submit');

    // Pasaporte Maker Digital Verificable
    Route::get('/squad/{squad}/passport', [TeacherWarRoomController::class, 'passport'])->name('squad.passport');

    // Torre de Control Docente
    Route::get('/teacher/war-room', [TeacherWarRoomController::class, 'index'])->name('teacher.war-room');
    Route::get('/teacher/classroom/{classroom}/pin-cards', [TeacherWarRoomController::class, 'downloadPinCards'])->name('teacher.pin-cards');
    Route::post('/teacher/classroom/{classroom}/generate-batch', [TeacherWarRoomController::class, 'generateBatch'])->name('teacher.generate-batch');
    Route::post('/teacher/batch/{batch}/status', [TeacherWarRoomController::class, 'updateBatchStatus'])->name('teacher.batch-status');

    // Diseñador de Cursos / Proyectos (Course Builder)
    Route::resource('/admin/projects', ProjectBuilderController::class)->names('admin.projects');

    // Gestor de Aulas y Matrícula Masiva con PINs
    Route::get('/admin/classrooms', [ClassroomManagerController::class, 'index'])->name('admin.classrooms.index');
    Route::post('/admin/classrooms', [ClassroomManagerController::class, 'store'])->name('admin.classrooms.store');
    Route::post('/admin/classrooms/{classroom}/enroll', [ClassroomManagerController::class, 'enrollStudents'])->name('admin.classrooms.enroll');

    // Dashboard general
    Route::get('/dashboard', function () {
        return redirect()->route('teacher.war-room');
    })->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Portal Familiar Seguro (WhatsApp)
Route::get('/family/{accessCode}/squad/{squad}', [TeacherWarRoomController::class, 'familyPortal'])->name('family.portal');

// API REST Pre-flight
Route::post('/api/squads/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('api.squad.preflight');

require __DIR__.'/auth.php';