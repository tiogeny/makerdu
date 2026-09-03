<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\BitacoraEntry;
use App\Models\User;
use App\Models\Squad;
use App\Models\Classroom;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;

echo "--- INICIANDO RESTAURACIÓN DE AULA Y RESET DE PROGRESO ---\n";

Schema::disableForeignKeyConstraints();

// 1. Limpiar bitácoras de evidencias
BitacoraEntry::truncate();
echo "[✔] Bitacoras vaciadas a 0.\n";

// 2. Garantizar Docente y Proyecto Activo
$teacher = User::firstOrCreate(
    ['email' => 'docente@makerdu.com'],
    [
        'name' => 'Profesor Maker',
        'password' => Hash::make('password'),
        'role_type' => 'teacher',
        'language' => 'es',
    ]
);

$project = Project::first();

// 3. Garantizar que el Aula exista con el código exacto 'MK2026'
$classroom = Classroom::firstOrNew(['access_code' => 'MK2026']);
$classroom->name = 'Taller Digitoys 2.5D';
$classroom->teacher_id = $teacher->id;
$classroom->project_id = $project ? $project->id : null;
$classroom->mode = 'school_squads';
$classroom->save();
echo "[✔] Aula MK2026 verificada/creada (ID: {$classroom->id}, Código: {$classroom->access_code}).\n";

// 4. Lista oficial de estudiantes demo con sus PINs garantizados
$studentsData = [
    ['name' => 'Henry Sánchez', 'short_name' => 'Henry', 'pin' => '1010', 'email' => 'henry@makerdu.com'],
    ['name' => 'Benito Juarez', 'short_name' => 'Benito', 'pin' => '1001', 'email' => 'benito@makerdu.com'],
    ['name' => 'María Angela Mejía', 'short_name' => 'María', 'pin' => '1002', 'email' => 'maria@makerdu.com'],
    ['name' => 'Delia Barriga', 'short_name' => 'Delia', 'pin' => '1003', 'email' => 'delia@makerdu.com'],
    ['name' => 'Grace Schwan', 'short_name' => 'Grace', 'pin' => '1004', 'email' => 'grace@makerdu.com'],
    ['name' => 'Silvana Espinoza', 'short_name' => 'Silvana', 'pin' => '1005', 'email' => 'silvana@makerdu.com'],
    ['name' => 'Hayashi Mateo', 'short_name' => 'Hayashi', 'pin' => '1006', 'email' => 'hayashi@makerdu.com'],
    ['name' => 'Esteban Valladares', 'short_name' => 'Esteban', 'pin' => '1007', 'email' => 'esteban@makerdu.com'],
    ['name' => 'Evelyn Cuadrado', 'short_name' => 'Evelyn', 'pin' => '1008', 'email' => 'evelyn@makerdu.com'],
    ['name' => 'Victor Freundt', 'short_name' => 'Victor', 'pin' => '1009', 'email' => 'victor@makerdu.com'],
];

// Resetear escuadras
DB::table('squad_user')->truncate();
Squad::truncate();

foreach ($studentsData as $sData) {
    $student = User::firstOrNew(['email' => $sData['email']]);
    $student->name = $sData['name'];
    $student->pin = $sData['pin'];
    $student->role_type = 'student';
    $student->xp_points = 0;
    $student->password = Hash::make('password');
    $student->save();

    // Crear mesa individual con 12 FC
    $squad = Squad::create([
        'classroom_id' => $classroom->id,
        'name' => "Mesa · {$sData['short_name']}",
        'fabcoins_balance' => 12,
        'is_active' => true,
    ]);

    $squad->members()->attach($student->id, [
        'current_role' => 'Architect',
        'active_minutes' => 0,
    ]);

    echo "  -> Estudiante {$student->name} listo con PIN {$student->pin} en {$squad->name} (12 FC)\n";
}

Schema::enableForeignKeyConstraints();

echo "--------------------------------------------------------\n";
echo "EXITO: El código de clase 'MK2026' y todos los estudiantes con sus PINs están 100% activos y listos para iniciar sesión.\n";
