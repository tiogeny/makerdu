<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Classroom;
use App\Models\Squad;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\BitacoraEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Docente Maker
        $teacher = User::create([
            'name' => 'Prof. Henry Sánchez',
            'email' => 'profesor@makerdu.com',
            'password' => Hash::make('password'),
            'role_type' => 'teacher',
            'language' => 'es',
        ]);

        // 2. Aula / Taller FabLab
        $classroom = Classroom::create([
            'teacher_id' => $teacher->id,
            'name' => 'Laboratorio FabLab - 4to Grado A',
            'access_code' => 'MK402',
            'mode' => 'school_squads',
            'tinkercad_link' => 'https://www.tinkercad.com/joinclass/MK402DEMO',
        ]);

        // 3. Proyecto Dinámico (Sellos y Relieves 2.5D)
        $project = Project::create([
            'title_json' => [
                'es' => 'Sellos y Relieves de Fabricación 2.5D',
                'en' => '2.5D Stamps & Relief Digital Fabrication'
            ],
            'description_json' => [
                'es' => 'Diseño digital y fabricación aditiva de sellos ergonómicos personalizados con corte y grabado láser / 3D.',
                'en' => 'Digital design and additive manufacturing of custom stamps with laser cut and 3D printing.'
            ],
            'type' => '2.5D',
            'total_levels' => 4,
        ]);

        // Niveles del Proyecto
        $l1 = ProjectLevel::create([
            'project_id' => $project->id,
            'level_number' => 1,
            'title_json' => [
                'es' => 'Nivel 1: Reto Maker e Ideación',
                'en' => 'Level 1: Maker Challenge & Ideation'
            ],
            'toolbox_json' => [
                'guide' => 'Define el boceto a mano alzada del sello con tu escuadra.',
                'resources' => [
                    ['title' => 'Plantilla de Boceto PDF', 'url' => '#', 'type' => 'pdf'],
                    ['title' => 'Inspiración de Formas Geométricas', 'url' => '#', 'type' => 'link']
                ]
            ],
            'validation_rules_json' => null,
            'fabcoins_cost' => 0,
        ]);

        $l2 = ProjectLevel::create([
            'project_id' => $project->id,
            'level_number' => 2,
            'title_json' => [
                'es' => 'Nivel 2: Modelado Digital en TinkerCAD',
                'en' => 'Level 2: Digital Modeling in TinkerCAD'
            ],
            'toolbox_json' => [
                'guide' => 'Exporta tu diseño en formato .STL o .SVG respetando las dimensiones máximas de 50x50mm.',
                'resources' => [
                    ['title' => 'Acceso a TinkerCAD Makerdu', 'url' => 'https://www.tinkercad.com', 'type' => 'link'],
                    ['title' => 'Tutorial: Relieves Positivos y Negativos', 'url' => '#', 'type' => 'video']
                ]
            ],
            'validation_rules_json' => [
                'max_x_mm' => 50,
                'max_y_mm' => 50,
                'max_z_mm' => 15,
                'min_wall_thickness_mm' => 2.0,
            ],
            'fabcoins_cost' => 0,
        ]);

        $l3 = ProjectLevel::create([
            'project_id' => $project->id,
            'level_number' => 3,
            'title_json' => [
                'es' => 'Nivel 3: Pre-flight Check IA y Fabricación',
                'en' => 'Level 3: AI Pre-flight Check & Fabrication'
            ],
            'toolbox_json' => [
                'guide' => 'Sube tu archivo .STL para validación automática por Inteligencia Artificial antes del envío a impresión.',
                'resources' => [
                    ['title' => 'Guía de Errores Comunes de Malla STL', 'url' => '#', 'type' => 'pdf']
                ]
            ],
            'validation_rules_json' => [
                'require_ai_approval' => true,
                'max_print_time_hours' => 1.5,
            ],
            'fabcoins_cost' => 25,
        ]);

        $l4 = ProjectLevel::create([
            'project_id' => $project->id,
            'level_number' => 4,
            'title_json' => [
                'es' => 'Nivel 4: Ensamblaje, Prueba y Bitácora Final',
                'en' => 'Level 4: Assembly, Testing & Final Report'
            ],
            'toolbox_json' => [
                'guide' => 'Realiza la prueba de estampado sobre papel y registra el resultado en la bitácora fotográfica.',
                'resources' => [
                    ['title' => 'Rúbrica de Evaluación Figital CNEB', 'url' => '#', 'type' => 'pdf']
                ]
            ],
            'validation_rules_json' => null,
            'fabcoins_cost' => 0,
        ]);

        // 4. Escuadra Maker
        $squad = Squad::create([
            'classroom_id' => $classroom->id,
            'name' => 'Escuadra Titanes Maker',
            'fabcoins_balance' => 100, // 100 FabCoins iniciales
        ]);

        // 5. Alumnos de la Escuadra con PINs y Roles
        $students = [
            [
                'name' => 'Mateo Alarcón',
                'pin' => '1234',
                'role' => 'Architect',
                'xp' => 120,
            ],
            [
                'name' => 'Sofía Chang',
                'pin' => '5678',
                'role' => 'Quality',
                'xp' => 150,
            ],
            [
                'name' => 'Lucas Ramos',
                'pin' => '9012',
                'role' => 'Finance',
                'xp' => 95,
            ],
            [
                'name' => 'Camila Díaz',
                'pin' => '3456',
                'role' => 'Relator',
                'xp' => 110,
            ],
        ];

        foreach ($students as $s) {
            $studentUser = User::create([
                'name' => $s['name'],
                'pin' => $s['pin'],
                'role_type' => 'student',
                'xp_points' => $s['xp'],
                'language' => 'es',
            ]);

            $squad->members()->attach($studentUser->id, [
                'current_role' => $s['role'],
                'active_minutes' => rand(15, 60),
            ]);
        }

        // Bitácora inicial de ejemplo en Nivel 1
        BitacoraEntry::create([
            'squad_id' => $squad->id,
            'level_id' => $l1->id,
            'active_role_user_id' => $squad->members()->first()->id,
            'content_text' => 'Completamos el boceto de nuestro sello con forma de hexágono y escudo representativo.',
            'ai_score' => true,
            'ai_feedback' => 'Excelente definición del área de estampado y proporción geométrica.',
            'status' => 'approved',
        ]);
    }
}
