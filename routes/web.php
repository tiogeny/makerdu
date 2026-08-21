<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentAuthController;
use App\Http\Controllers\SquadController;
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

// HUD de la Escuadra (Regla de 1-PC) y Operaciones Maker
Route::middleware(['auth'])->group(function () {
    Route::get('/hud', [SquadController::class, 'hud'])->name('student.hud');
    Route::post('/squad/{squad}/switch-role', [SquadController::class, 'switchRole'])->name('squad.switch-role');
    Route::post('/squad/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('squad.preflight');
    Route::post('/squad/{squad}/level/{level}/fabricate', [SquadController::class, 'confirmFabrication'])->name('squad.fabricate');
    Route::post('/squad/{squad}/level/{level}/bitacora', [SquadController::class, 'submitBitacora'])->name('squad.bitacora.submit');

    // Dashboard Docente / General
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->middleware(['verified'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Endpoint API REST según PRD v2.6 (Módulo C)
Route::post('/api/squads/{squad}/pre-flight', [SquadController::class, 'preflight'])->name('api.squad.preflight');

require __DIR__.'/auth.php';