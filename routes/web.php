<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AiTutorChatController;
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
})->name('welcome');

// Autenticación de Alumnos (Código de Aula + PIN de 4 dígitos)
Route::get('/student-login', [StudentAuthController::class, 'showLogin'])->name('student.login');
Route::post('/student-login', [StudentAuthController::class, 'login'])->name('student.login.post');
Route::post('/student-logout', [StudentAuthController::class, 'logout'])->name('student.logout');

// Rutas Autenticadas con Redirección Inteligente por Rol
Route::middleware(['auth'])->group(function () {
    
    // Dashboard Centralizador Inteligente por Rol
    Route::get('/dashboard', function () {
        $user = auth()->user();
        if ($user->role_type === 'admin') {
            return redirect()->route('admin.dashboard');
        } elseif ($user->role_type === 'teacher') {
            return redirect()->route('teacher.war-room');
        }
        return redirect()->route('student.hud');
    })->name('dashboard');

    // Super Administrador (Catálogo Maestro y Centro de Mando)
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::resource('/admin/projects', ProjectBuilderController::class)->names('admin.projects');
    Route::get('/admin/classrooms', [ClassroomManagerController::class, 'index'])->name('admin.classrooms.index');
    Route::post('/admin/classrooms', [ClassroomManagerController::class, 'store'])->name('admin.classrooms.store');
    Route::post('/admin/classrooms/{classroom}/enroll', [ClassroomManagerController::class, 'enrollStudents'])->name('admin.classrooms.enroll');

    // Docente / Instructor (Torre de Control de su Aula & Lotes FabLab)
    Route::get('/teacher/war-room', [TeacherWarRoomController::class, 'index'])->name('teacher.war-room');
    Route::get('/teacher/classroom/{classroom}/pin-cards', [TeacherWarRoomController::class, 'downloadPinCards'])->name('teacher.pin-cards');
    Route::post('/teacher/classroom/{classroom}/generate-batch', [TeacherWarRoomController::class, 'generateBatch'])->name('teacher.generate-batch');
    Route::post('/teacher/batch/{batch}/status', [TeacherWarRoomController::class, 'updateBatchStatus'])->name('teacher.batch-status');

    // HUD de la Escuadra y Operaciones Maker
    Route::get('/hud', [SquadController::class, 'hud'])->name('student.hud');
    Route::post('/squad/{squad}/switch-role', [SquadController::class, 'switchRole'])->name('squad.switch-role');
    Route::post('/squad/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('squad.preflight');
    Route::post('/squad/{squad}/level/{level}/fabricate', [SquadController::class, 'confirmFabrication'])->name('squad.fabricate');
    Route::post('/squad/{squad}/level/{level}/bitacora', [SquadController::class, 'submitBitacora'])->name('squad.bitacora.submit');
    Route::post('/squad/{squad}/ai-chat', [AiTutorChatController::class, 'chat'])->name('squad.ai-chat');
    Route::get('/squad/{squad}/passport', [TeacherWarRoomController::class, 'passport'])->name('squad.passport');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Portal Familiar Seguro (WhatsApp)
Route::get('/family/{accessCode}/squad/{squad}', [TeacherWarRoomController::class, 'familyPortal'])->name('family.portal');

// API REST Pre-flight
Route::post('/api/squads/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('api.squad.preflight');

require __DIR__.'/auth.php';