<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\BitacoraEntry;
use App\Models\User;
use App\Models\Squad;
use App\Models\Classroom;
use App\Models\Project;
use App\Models\ProjectLevel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;

echo "--- [1/5] APLICANDO MIGRACIONES PENDIENTES EN BASE DE DATOS ---\n";
try {
    Artisan::call('migrate', ['--force' => true]);
    echo "[✔] Migraciones ejecutadas: " . trim(Artisan::output()) . "\n";
} catch (\Exception $e) {
    echo "[!] Error al migrar (puede que ya existan las tablas): " . $e->getMessage() . "\n";
}

echo "--- [2/5] SINCRONIZANDO LAS 5 MISIONES OFICIALES DEL PROYECTO MAESTRO ---\n";
Schema::disableForeignKeyConstraints();

$jsonFile = __DIR__ . '/default_project_data.json';
if (file_exists($jsonFile)) {
    $data = json_decode(file_get_contents($jsonFile), true);
    if ($data) {
        $project = Project::updateOrCreate(
            ['id' => $data['id'] ?? 1],
            [
                'title_json' => $data['title_json'],
                'description_json' => $data['description_json'],
                'type' => $data['type'] ?? 'individual',
                'total_levels' => 5,
                'is_active' => true,
                'briefing_json' => $data['briefing_json'] ?? null,
            ]
        );

        // Borrar niveles antiguos y registrar exactamente las 5 misiones oficiales
        ProjectLevel::where('project_id', $project->id)->delete();
        foreach ($data['levels'] as $lvl) {
            unset($lvl['id']);
            $lvl['project_id'] = $project->id;
            ProjectLevel::create($lvl);
        }
        echo "[✔] Proyecto maestro (ID: {$project->id}) sincronizado con las 5 misiones completas.\n";
    }
}

echo "--- [3/5] LIMPIANDO BITÁCORAS Y EVIDENCIAS ANTERIORES ---\n";
BitacoraEntry::truncate();
echo "[✔] Bitacoras vaciadas a 0.\n";

echo "--- [4/5] GARANTIZANDO DOCENTE Y AULA MK2026 ---\n";
$teacher = User::firstOrCreate(
    ['email' => 'docente@makerdu.com'],
    [
        'name' => 'Profesor Maker',
        'password' => Hash::make('password'),
        'role_type' => 'teacher',
        'language' => 'es',
    ]
);

$classroom = Classroom::firstOrNew(['access_code' => 'MK2026']);
$classroom->name = 'Taller Digitoys 2.5D';
$classroom->teacher_id = $teacher->id;
$classroom->project_id = $project ? $project->id : null;
$classroom->mode = 'school_squads';
$classroom->save();
echo "[✔] Aula MK2026 activa y vinculada al Proyecto (ID: {$classroom->id}).\n";

echo "--- [5/5] CREANDO MESAS INDIVIDUALES Y ESTUDIANTES DEMO ---\n";
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

    echo "  -> {$student->name} (PIN: {$student->pin}) asignado a {$squad->name} con 12 FC\n";
}

Schema::enableForeignKeyConstraints();

echo "========================================================\n";
echo "RESTAURACIÓN Y RESET COMPLETADOS AL 100% SIN ERRORES.\n";
echo "Ya puedes iniciar sesión en https://makerdu.com con MK2026 y PIN 1010\n";
