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
        // =====================================================================
        // 1. USUARIOS DEL SISTEMA (ADMINISTRADOR Y DOCENTES)
        // =====================================================================

        // A) Super Administrador Makerdu (Henry / FabLab Lima)
        $admin = User::create([
            'name' => 'Admin FabLab Lima',
            'email' => 'contacto@fablablima.org',
            'password' => Hash::make('password'),
            'role_type' => 'admin',
            'language' => 'es',
        ]);

        // B) Docente 1: Prof. Henry Sánchez (Tecnología y Fabricación Digital)
        $teacher1 = User::create([
            'name' => 'Prof. Henry Sánchez',
            'email' => 'profesor@makerdu.com',
            'password' => Hash::make('password'),
            'role_type' => 'teacher',
            'language' => 'es',
        ]);

        // C) Docente 2: Prof. María Torres (Arte e Historia)
        $teacher2 = User::create([
            'name' => 'Prof. María Torres',
            'email' => 'maria.torres@colegio.edu',
            'password' => Hash::make('password'),
            'role_type' => 'teacher',
            'language' => 'es',
        ]);

        // =====================================================================
        // 2. CATÁLOGO MAESTRO DE CURSOS STEAM (CREADOS POR SUPER ADMIN)
        // =====================================================================

        // PROYECTO MAESTRO 1: Sellos y Relieves 2.5D
        $p1 = Project::create([
            'title_json' => [
                'es' => 'Sellos y Relieves de Fabricación 2.5D',
                'en' => '2.5D Stamps & Relief Digital Fabrication'
            ],
            'description_json' => [
                'es' => 'Diseño digital y fabricación aditiva de sellos ergonómicos personalizados con corte láser y modelado 3D para estampado.',
                'en' => 'Digital design and additive manufacturing of custom ergonomic stamps with laser cut and 3D modeling.'
            ],
            'type' => '2.5D',
            'total_levels' => 4,
        ]);

        ProjectLevel::create([
            'project_id' => $p1->id,
            'level_number' => 1,
            'title_json' => ['es' => 'Nivel 1: Reto Maker e Ideación', 'en' => 'Level 1: Maker Challenge & Ideation'],
            'toolbox_json' => [
                'deliverable_type' => 'photo_sketch',
                'guide' => 'Define el boceto a mano alzada del sello con tu escuadra en papel o pizarra.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => [['title' => 'Plantilla de Boceto PDF', 'url' => '#', 'type' => 'pdf']]
            ],
            'validation_rules_json' => ['deliverable_type' => 'photo_sketch', 'max_x_mm' => 50, 'max_y_mm' => 50, 'max_z_mm' => 15],
            'fabcoins_cost' => 0,
        ]);

        ProjectLevel::create([
            'project_id' => $p1->id,
            'level_number' => 2,
            'title_json' => ['es' => 'Nivel 2: Modelado Digital en TinkerCAD', 'en' => 'Level 2: Digital Modeling in TinkerCAD'],
            'toolbox_json' => [
                'deliverable_type' => 'stl_3d',
                'guide' => 'Diseña el mango y la base en TinkerCAD respetando 50x50x15mm.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => [['title' => 'TinkerCAD Web', 'url' => 'https://www.tinkercad.com', 'type' => 'link']]
            ],
            'validation_rules_json' => ['deliverable_type' => 'stl_3d', 'max_x_mm' => 50, 'max_y_mm' => 50, 'max_z_mm' => 15, 'min_wall_thickness_mm' => 2.0],
            'fabcoins_cost' => 20,
        ]);

        ProjectLevel::create([
            'project_id' => $p1->id,
            'level_number' => 3,
            'title_json' => ['es' => 'Nivel 3: Pre-flight Check IA y Relieves', 'en' => 'Level 3: AI Pre-flight Check & Reliefs'],
            'toolbox_json' => [
                'deliverable_type' => 'stl_3d',
                'guide' => 'Valida los relieves positivos y negativos con Gemini Vision antes de fabricar.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'stl_3d', 'max_x_mm' => 50, 'max_y_mm' => 50, 'max_z_mm' => 15, 'min_wall_thickness_mm' => 2.0],
            'fabcoins_cost' => 25,
        ]);

        ProjectLevel::create([
            'project_id' => $p1->id,
            'level_number' => 4,
            'title_json' => ['es' => 'Nivel 4: Ensamblaje, Prueba y Bitácora Final', 'en' => 'Level 4: Assembly, Testing & Final Report'],
            'toolbox_json' => [
                'deliverable_type' => 'checklist_assembly',
                'guide' => 'Realiza la prueba de estampado sobre papel y registra el resultado en la bitácora fotográfica.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'checklist_assembly', 'max_x_mm' => 50, 'max_y_mm' => 50, 'max_z_mm' => 15],
            'fabcoins_cost' => 0,
        ]);

        // PROYECTO MAESTRO 2: Bio-joyería Amazónica en 3D
        $p2 = Project::create([
            'title_json' => [
                'es' => 'Bio-joyería Amazónica en Impresión 3D',
                'en' => 'Amazonian Bio-jewelry 3D Printing'
            ],
            'description_json' => [
                'es' => 'Inspiración en la flora y fauna de la Amazonía para modelar y fabricar aretes, dijes y colgantes sostenibles con orificios de enganche.',
                'en' => 'Inspired by Amazon flora and fauna to model and 3D print sustainable earrings, pendants and bio-jewelry.'
            ],
            'type' => '3D',
            'total_levels' => 4,
        ]);

        ProjectLevel::create([
            'project_id' => $p2->id,
            'level_number' => 1,
            'title_json' => ['es' => 'Nivel 1: Concepto y Silueta de Naturaleza', 'en' => 'Level 1: Nature Concept & Silhouette'],
            'toolbox_json' => [
                'deliverable_type' => 'photo_sketch',
                'guide' => 'Boceta el patrón geométrico o silueta orgánica inspirada en hojas o fauna amazónica.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'photo_sketch', 'max_x_mm' => 45, 'max_y_mm' => 45, 'max_z_mm' => 10],
            'fabcoins_cost' => 0,
        ]);

        ProjectLevel::create([
            'project_id' => $p2->id,
            'level_number' => 2,
            'title_json' => ['es' => 'Nivel 2: Modelado CAD y Ojal de Enganche', 'en' => 'Level 2: CAD Modeling & Hook Ring'],
            'toolbox_json' => [
                'deliverable_type' => 'stl_3d',
                'guide' => 'Modela la pieza en TinkerCAD asegurando que el orificio para el aro de bisutería tenga al menos 3mm de diámetro.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'stl_3d', 'max_x_mm' => 45, 'max_y_mm' => 45, 'max_z_mm' => 10, 'min_wall_thickness_mm' => 1.6],
            'fabcoins_cost' => 15,
        ]);

        ProjectLevel::create([
            'project_id' => $p2->id,
            'level_number' => 3,
            'title_json' => ['es' => 'Nivel 3: Relieves Escalonados y Control IA', 'en' => 'Level 3: Stepped Reliefs & AI Check'],
            'toolbox_json' => [
                'deliverable_type' => 'stl_3d',
                'guide' => 'Audita con Gemini Vision que la base sea plana para asegurar adherencia magnética a la bandeja.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'stl_3d', 'max_x_mm' => 45, 'max_y_mm' => 45, 'max_z_mm' => 10, 'min_wall_thickness_mm' => 1.6],
            'fabcoins_cost' => 20,
        ]);

        ProjectLevel::create([
            'project_id' => $p2->id,
            'level_number' => 4,
            'title_json' => ['es' => 'Nivel 4: Colocación de Herrajes y Exhibición', 'en' => 'Level 4: Hardware Assembly & Showcase'],
            'toolbox_json' => [
                'deliverable_type' => 'checklist_assembly',
                'guide' => 'Coloca la argolla metálica, verifica la firmeza mecánica y sube la foto final al portafolio.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'checklist_assembly', 'max_x_mm' => 45, 'max_y_mm' => 45, 'max_z_mm' => 10],
            'fabcoins_cost' => 0,
        ]);

        // PROYECTO MAESTRO 3: Patrimonio Chavín en Corte Láser
        $p3 = Project::create([
            'title_json' => [
                'es' => 'Patrimonio Chavín: Cabezas Clavas en Corte Láser',
                'en' => 'Chavin Heritage: Laser Cut Artifacts'
            ],
            'description_json' => [
                'es' => 'Diseño vectorial 2D por capas y ensambles por encastre en madera MDF de 3mm inspirados en la iconografía Chavín.',
                'en' => '2D vector design by layers and slot-fit mechanical assembly in 3mm MDF wood inspired by Chavin iconography.'
            ],
            'type' => 'Laser',
            'total_levels' => 4,
        ]);

        ProjectLevel::create([
            'project_id' => $p3->id,
            'level_number' => 1,
            'title_json' => ['es' => 'Nivel 1: Investigación Iconográfica y Boceto', 'en' => 'Level 1: Iconographic Research & Sketch'],
            'toolbox_json' => [
                'deliverable_type' => 'photo_sketch',
                'guide' => 'Investiga los rasgos míticos de las Cabezas Clavas y dibuja el plano por capas.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'photo_sketch', 'max_x_mm' => 60, 'max_y_mm' => 60, 'max_z_mm' => 12],
            'fabcoins_cost' => 0,
        ]);

        ProjectLevel::create([
            'project_id' => $p3->id,
            'level_number' => 2,
            'title_json' => ['es' => 'Nivel 2: Vectorización SVG (Corte vs Grabado)', 'en' => 'Level 2: SVG Vectorization (Cut vs Engrave)'],
            'toolbox_json' => [
                'deliverable_type' => 'svg_laser',
                'guide' => 'Define líneas rojas para corte continuo y zonas negras para grabado superficial.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'svg_laser', 'max_x_mm' => 60, 'max_y_mm' => 60, 'max_z_mm' => 12],
            'fabcoins_cost' => 15,
        ]);

        ProjectLevel::create([
            'project_id' => $p3->id,
            'level_number' => 3,
            'title_json' => ['es' => 'Nivel 3: Ranuras de Encastre y Tolerancias', 'en' => 'Level 3: Interlocking Slots & Tolerances'],
            'toolbox_json' => [
                'deliverable_type' => 'svg_laser',
                'guide' => 'Ajusta las ranuras de encastre con compensación de kerf de 0.15mm para MDF de 3mm.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'svg_laser', 'max_x_mm' => 60, 'max_y_mm' => 60, 'max_z_mm' => 12],
            'fabcoins_cost' => 20,
        ]);

        ProjectLevel::create([
            'project_id' => $p3->id,
            'level_number' => 4,
            'title_json' => ['es' => 'Nivel 4: Armado Tridimensional y Portafolio', 'en' => 'Level 4: 3D Assembly & Portfolio'],
            'toolbox_json' => [
                'deliverable_type' => 'checklist_assembly',
                'guide' => 'Ensambla las piezas por fricción sin pegamento y registra la maqueta terminada.',
                'bunny_video_url' => 'https://iframe.mediadelivery.net/embed/demo',
                'resources' => []
            ],
            'validation_rules_json' => ['deliverable_type' => 'checklist_assembly', 'max_x_mm' => 60, 'max_y_mm' => 60, 'max_z_mm' => 12],
            'fabcoins_cost' => 0,
        ]);

        // =====================================================================
        // 3. AULAS Y TALLERES ASIGNADOS CON SUS ESCUADRAS
        // =====================================================================

        // AULA 1: Prof. Henry Sánchez -> Curso Sellos 2.5D
        $c1 = Classroom::create([
            'teacher_id' => $teacher1->id,
            'project_id' => $p1->id,
            'name' => 'Laboratorio FabLab - 4to Grado A',
            'access_code' => 'MK402',
            'mode' => 'school_squads',
            'tinkercad_link' => 'https://www.tinkercad.com/joinclass/MK402DEMO',
        ]);

        $sq1 = Squad::create([
            'classroom_id' => $c1->id,
            'name' => 'Escuadra Titanes Maker',
            'fabcoins_balance' => 100,
        ]);

        $students1 = [
            ['name' => 'Mateo Alarcón', 'pin' => '1234', 'role' => 'Architect', 'xp' => 120],
            ['name' => 'Sofía Chang', 'pin' => '5678', 'role' => 'Quality', 'xp' => 150],
            ['name' => 'Lucas Ramos', 'pin' => '9012', 'role' => 'Finance', 'xp' => 95],
            ['name' => 'Camila Díaz', 'pin' => '3456', 'role' => 'Relator', 'xp' => 110],
        ];

        foreach ($students1 as $s) {
            $u = User::create([
                'name' => $s['name'],
                'pin' => $s['pin'],
                'role_type' => 'student',
                'xp_points' => $s['xp'],
                'language' => 'es',
            ]);
            $sq1->members()->attach($u->id, ['current_role' => $s['role'], 'active_minutes' => rand(15, 60)]);
        }

        // Bitácora inicial
        BitacoraEntry::create([
            'squad_id' => $sq1->id,
            'level_id' => $p1->levels->first()->id,
            'active_role_user_id' => $sq1->members()->first()->id,
            'content_text' => 'Completamos el boceto de nuestro sello con forma de hexágono y escudo representativo.',
            'ai_score' => true,
            'ai_feedback' => 'Excelente definición del área de estampado y proporción geométrica.',
            'status' => 'approved',
        ]);

        // AULA 2: Prof. Henry Sánchez -> Curso Bio-joyería 3D
        $c2 = Classroom::create([
            'teacher_id' => $teacher1->id,
            'project_id' => $p2->id,
            'name' => 'Taller STEAM - 5to Grado B',
            'access_code' => 'MK505',
            'mode' => 'school_squads',
            'tinkercad_link' => 'https://www.tinkercad.com/joinclass/MK505BIO',
        ]);

        $sq2 = Squad::create([
            'classroom_id' => $c2->id,
            'name' => 'Escuadra Fénix 3D',
            'fabcoins_balance' => 120,
        ]);

        $students2 = [
            ['name' => 'Valentina Castro', 'pin' => '2345', 'role' => 'Architect', 'xp' => 140],
            ['name' => 'Diego Mendoza', 'pin' => '6789', 'role' => 'Quality', 'xp' => 130],
            ['name' => 'Romina Silva', 'pin' => '8901', 'role' => 'Finance', 'xp' => 110],
            ['name' => 'Gabriel Flores', 'pin' => '4567', 'role' => 'Relator', 'xp' => 125],
        ];

        foreach ($students2 as $s) {
            $u = User::create([
                'name' => $s['name'],
                'pin' => $s['pin'],
                'role_type' => 'student',
                'xp_points' => $s['xp'],
                'language' => 'es',
            ]);
            $sq2->members()->attach($u->id, ['current_role' => $s['role'], 'active_minutes' => rand(10, 45)]);
        }

        // AULA 3: Prof. María Torres -> Curso Corte Láser Chavín
        $c3 = Classroom::create([
            'teacher_id' => $teacher2->id,
            'project_id' => $p3->id,
            'name' => 'Historia & Tecnología - 3er Grado',
            'access_code' => 'MK301',
            'mode' => 'school_squads',
            'tinkercad_link' => 'https://www.tinkercad.com/joinclass/MK301LASER',
        ]);

        $sq3 = Squad::create([
            'classroom_id' => $c3->id,
            'name' => 'Escuadra Cóndor Láser',
            'fabcoins_balance' => 90,
        ]);

        $students3 = [
            ['name' => 'Esteban Ruiz', 'pin' => '1122', 'role' => 'Architect', 'xp' => 100],
            ['name' => 'Lucía Paredes', 'pin' => '3344', 'role' => 'Quality', 'xp' => 115],
            ['name' => 'Carlos Vílchez', 'pin' => '5566', 'role' => 'Finance', 'xp' => 90],
            ['name' => 'Andrea Benítez', 'pin' => '7788', 'role' => 'Relator', 'xp' => 105],
        ];

        foreach ($students3 as $s) {
            $u = User::create([
                'name' => $s['name'],
                'pin' => $s['pin'],
                'role_type' => 'student',
                'xp_points' => $s['xp'],
                'language' => 'es',
            ]);
            $sq3->members()->attach($u->id, ['current_role' => $s['role'], 'active_minutes' => rand(15, 30)]);
        }
    }
}
