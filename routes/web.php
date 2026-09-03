<?php

use App\Http\Controllers\Admin\TechniqueController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AiSandboxController;
use App\Http\Controllers\AiTutorChatController;
use App\Http\Controllers\ClassroomManagerController;
use App\Http\Controllers\FabCoinController;
use App\Http\Controllers\MicroAppManagerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectBuilderController;
use App\Http\Controllers\StudentAuthController;
use App\Http\Controllers\StudioController;
use App\Http\Controllers\SquadController; // Alias retrocompatible
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
        return redirect()->route('student.studio');
    })->name('dashboard');

    // Super Administrador Makerdu v4.0 (Técnicas STEAM, Micro-Apps, Gemini AI Sandbox)
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::resource('/admin/techniques', TechniqueController::class)->names('admin.techniques');
    Route::post('/admin/techniques/{technique}/toggle', [TechniqueController::class, 'toggle'])->name('admin.techniques.toggle');
    Route::resource('/admin/projects', ProjectBuilderController::class)->names('admin.projects');
    Route::get('/admin/classrooms', [ClassroomManagerController::class, 'index'])->name('admin.classrooms.index');
    Route::post('/admin/classrooms', [ClassroomManagerController::class, 'store'])->name('admin.classrooms.store');
    Route::post('/admin/teachers', [ClassroomManagerController::class, 'createTeacher'])->name('admin.teachers.store');
    Route::post('/admin/classrooms/{classroom}/enroll', [ClassroomManagerController::class, 'enrollStudents'])->name('admin.classrooms.enroll');
    
    // Catálogo y Gestión de Micro-Apps
    Route::get('/admin/apps', [MicroAppManagerController::class, 'index'])->name('admin.apps.index');
    Route::post('/admin/apps', [MicroAppManagerController::class, 'store'])->name('admin.apps.store');
    Route::post('/admin/apps/{app}/toggle', [MicroAppManagerController::class, 'toggle'])->name('admin.apps.toggle');

    // Galería Maestra de Micro-Animaciones Didácticas (HTML/CSS)
    Route::get('/admin/animations', [\App\Http\Controllers\Admin\AnimationManagerController::class, 'index'])->name('admin.animations.index');
    Route::post('/admin/animations', [\App\Http\Controllers\Admin\AnimationManagerController::class, 'store'])->name('admin.animations.store');
    Route::put('/admin/animations/{animation}', [\App\Http\Controllers\Admin\AnimationManagerController::class, 'update'])->name('admin.animations.update');
    Route::post('/admin/animations/{animation}/toggle', [\App\Http\Controllers\Admin\AnimationManagerController::class, 'toggle'])->name('admin.animations.toggle');
    Route::delete('/admin/animations/{animation}', [\App\Http\Controllers\Admin\AnimationManagerController::class, 'destroy'])->name('admin.animations.destroy');

    // Sandbox de Calibración de IA (Gemini Vision)
    Route::get('/admin/ai-sandbox', [AiSandboxController::class, 'index'])->name('admin.ai-sandbox.index');
    Route::post('/admin/ai-sandbox/test', [AiSandboxController::class, 'test'])->name('admin.ai-sandbox.test');

    // Docente / Instructor (Torre de Control, Catálogo de Proyectos & Lotes FabLab)
    Route::get('/teacher/war-room', [TeacherWarRoomController::class, 'index'])->name('teacher.war-room');
    Route::post('/teacher/classroom/{classroom}/assign-project', [TeacherWarRoomController::class, 'assignProject'])->name('teacher.assign-project');
    Route::get('/teacher/classroom/{classroom}/pin-cards', [TeacherWarRoomController::class, 'downloadPinCards'])->name('teacher.pin-cards');
    Route::post('/teacher/classroom/{classroom}/generate-batch', [TeacherWarRoomController::class, 'generateBatch'])->name('teacher.generate-batch');
    Route::post('/teacher/batch/{batch}/status', [TeacherWarRoomController::class, 'updateBatchStatus'])->name('teacher.batch-status');
    // Carrocería Pedagógica (Paso 4)
    Route::post('/teacher/classroom/{classroom}/customize', [TeacherWarRoomController::class, 'customize'])->name('teacher.customize');
    Route::post('/teacher/classroom/{classroom}/reset-customization', [TeacherWarRoomController::class, 'resetCustomization'])->name('teacher.reset-customization');

    // Estudio Maker y Operaciones del Taller
    Route::get('/studio', [StudioController::class, 'hud'])->name('student.studio');
    Route::get('/hud', function () { return redirect()->route('student.studio'); })->name('student.hud');
    Route::post('/squad/join-team', [StudioController::class, 'joinTeam'])->name('squad.join-team');
    Route::post('/squad/set-individual', [StudioController::class, 'setIndividualMode'])->name('squad.set-individual');
    Route::post('/squad/{squad}/switch-role', [StudioController::class, 'switchRole'])->name('squad.switch-role');
    Route::post('/squad/{squad}/quality-control', [StudioController::class, 'qualityControl'])->name('squad.quality-control');
    Route::post('/squad/{squad}/pre-flight', [StudioController::class, 'qualityControl'])->name('squad.preflight');
    Route::post('/squad/{squad}/level/{level}/fabricate', [StudioController::class, 'confirmFabrication'])->name('squad.fabricate');
    Route::post('/squad/{squad}/level/{level}/bitacora', [StudioController::class, 'submitBitacora'])->name('squad.bitacora.submit');
    Route::post('/squad/{squad}/ai-chat', [AiTutorChatController::class, 'chat'])->name('squad.ai-chat');
    Route::get('/squad/{squad}/passport', [TeacherWarRoomController::class, 'passport'])->name('squad.passport');

    // Economía FabCoins & Panel de Recompensas (Paso 6)
    Route::get('/fabcoins', [FabCoinController::class, 'panel'])->name('student.fabcoins');
    Route::post('/squad/{squad}/redeem', [FabCoinController::class, 'redeem'])->name('squad.redeem');
    Route::post('/teacher/redemption/{redemption}/action', [FabCoinController::class, 'approveRedemption'])->name('teacher.redemption.action');
    Route::post('/teacher/squad/{squad}/grant-bonus', [FabCoinController::class, 'grantBonus'])->name('teacher.squad.bonus');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Portal Familiar Seguro (WhatsApp)
Route::get('/family/{accessCode}/squad/{squad}', [TeacherWarRoomController::class, 'familyPortal'])->name('family.portal');

// API REST Pre-flight
Route::post('/api/squads/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('api.squad.preflight');

require __DIR__.'/auth.php';