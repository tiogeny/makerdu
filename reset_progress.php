<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\BitacoraEntry;
use App\Models\User;
use App\Models\Squad;
use App\Models\Classroom;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

Schema::disableForeignKeyConstraints();

// 1. Limpiar bitácoras de evidencias
BitacoraEntry::truncate();

// 2. Resetear puntos de experiencia a 0
User::where('role_type', 'student')->update(['xp_points' => 0]);

// 3. Resetear agrupamientos en equipo y restaurar mesas individuales con 12 FC
DB::table('squad_user')->truncate();
Squad::truncate();

Schema::enableForeignKeyConstraints();

$classroom = Classroom::first();
$classroomId = $classroom ? $classroom->id : 1;

$students = User::where('role_type', 'student')->get();
foreach ($students as $student) {
    $firstName = explode(' ', $student->name)[0];
    $squad = Squad::create([
        'classroom_id' => $classroomId,
        'name' => "Mesa · {$firstName}",
        'fabcoins_balance' => 12,
        'is_active' => true,
    ]);

    $squad->members()->attach($student->id, [
        'current_role' => 'Architect',
        'active_minutes' => 0,
    ]);
}

echo "OK: Base de datos reseteada limpiamente con 12 FC para cada mesa individual.\n";
