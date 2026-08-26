<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Classroom;
use App\Models\Squad;
use App\Models\Project;
use App\Models\ProjectLevel;
use App\Models\BitacoraEntry;
use App\Models\MicroApp;
use App\Models\RewardCatalog;
use App\Models\FabCoinTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // =====================================================================
        // 0. CATÁLOGO INICIAL DE MICRO-APPS AUTÓNOMAS
        // =====================================================================
        MicroApp::firstOrCreate(['slug' => 'vectorizer'], [
            'name' => 'Vectorizador Cámara B/N & Editor Bézier 2D/3D',
            'category' => '2.5D',
            'description' => 'Convierte bocetos en papel a vectores limpios SVG mediante cámara web o pluma Bézier y genera extrusión 3D instantánea.',
            'embed_path' => '/apps/vectorizer',
            'output_type' => 'svg',
            'icon' => '🎨',
            'is_active' => true,
        ]);

        MicroApp::firstOrCreate(['slug' => 'viewer-3d'], [
            'name' => 'Visor 3D WebGL Autónomo',
            'category' => '3D',
            'description' => 'Inspección 360° de mallas STL, cotas físicas X/Y/Z, cálculo volumétrico y validación de grosor.',
            'embed_path' => '/apps/viewer-3d',
            'output_type' => 'stl',
            'icon' => '🧊',
            'is_active' => true,
        ]);

        MicroApp::firstOrCreate(['slug' => 'box-generator'], [
            'name' => 'Generador de Cajas Láser con Encastre',
            'category' => 'Laser',
            'description' => 'Calculadora paramétrica de ranuras de ensamble finger-joint con compensación de kerf para corte láser en MDF/acrílico.',
            'embed_path' => '/apps/box-generator',
            'output_type' => 'svg',
            'icon' => '📦',
            'is_active' => true,
        ]);

        MicroApp::firstOrCreate(['slug' => 'digitoy-studio'], [
            'name' => 'Digitoy Studio 3D — Figuras Articuladas',
            'category' => '3D',
            'description' => 'Estudio 3D de personajes modulares articulados (Print-in-Place & Snap-Fit) con simulación cinemática y exportación STL.',
            'embed_path' => '/apps/digitoy-studio',
            'output_type' => 'stl',
            'icon' => '🦖',
            'is_active' => true,
        ]);

        MicroApp::firstOrCreate(['slug' => 'gear-generator'], [
            'name' => 'Generador de Engranajes & Autómatas',
            'category' => 'Laser',
            'description' => 'Diseñador paramétrico de engranajes involuta, reductores de velocidad y mecanismos cinéticos con simulación en tiempo real.',
            'embed_path' => '/apps/gear-generator',
            'output_type' => 'svg',
            'icon' => '⚙️',
            'is_active' => true,
        ]);

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
            'project_id'       => $p3->id,
            'level_number'     => 4,
            'title_json'       => ['es' => 'Nivel 4: Armado Tridimensional y Portafolio', 'en' => 'Level 4: 3D Assembly & Portfolio'],
            'toolbox_json'     => [
                'deliverable_type' => 'checklist_assembly',
                'guide'            => 'Ensambla las piezas por fricción sin pegamento y registra la maqueta terminada.',
                'bunny_video_url'  => 'https://iframe.mediadelivery.net/embed/demo',
                'resources'        => [],
            ],
            'validation_rules_json' => ['deliverable_type' => 'checklist_assembly', 'max_x_mm' => 60, 'max_y_mm' => 60, 'max_z_mm' => 12],
            'fabcoins_cost'    => 0,
        ]);

        // =====================================================================
        // PROYECTO MAESTRO 4 (FLAGSHIP v3.0): Digitoys 2.5D — Figuras Articuladas
        // Curso estrella de Makerdu — diseñado para ferias STEAM y exhibiciones
        // =====================================================================
        $p4 = Project::create([
            'title_json'       => [
                'es' => 'Digitoys 2.5D — Figuras Articuladas & Juguetes de Precisión',
                'en' => 'Digitoys 2.5D — Articulated Figures & Precision Toys',
            ],
            'description_json' => [
                'es' => 'Diseña y fabrica tu propia figura articulada impresa en 3D con piezas intercambiables, uniones de clip y listo para exhibición en ferias STEAM. Combina modelado digital, validación IA de tolerancias y fabricación phygital completa.',
                'en' => 'Design and fabricate your own articulated 3D-printed figure with interchangeable parts, clip joints, and ready for STEAM fair exhibition. Combines digital modeling, AI tolerance validation, and full phygital manufacturing.',
            ],
            'type'         => '2.5D',
            'total_levels' => 4,
        ]);

        // NIVEL 1 — Concepto y Boceto del Digitoy
        ProjectLevel::create([
            'project_id'   => $p4->id,
            'level_number' => 1,
            'title_json'   => [
                'es' => 'Nivel 1: Concepto & Boceto del Digitoy',
                'en' => 'Level 1: Digitoy Concept & Sketch',
            ],
            'toolbox_json' => [
                'deliverable_type' => 'photo_sketch',
                'guide'            => 'Define el concepto de tu figura articulada en papel: ¿qué animal, personaje o forma será? Dibuja sus partes separadas (cabeza, torso, extremidades) indicando qué piezas se mueven. Usa la Micro-App Vectorizador para digitalizar tu boceto y exportarlo como SVG al log.',
                'bunny_video_url'  => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'resources'        => [
                    ['title' => 'Plantilla de Boceto Digitoy (PDF)', 'url' => 'https://drive.google.com/file/d/demo', 'type' => 'pdf'],
                    ['title' => 'Galería de Digitoys de Referencia',  'url' => 'https://makerdu.com/gallery/digitoys', 'type' => 'link'],
                    ['title' => 'Tutorial: Diseño de juguetes articulados', 'url' => 'https://www.tinkercad.com/learn', 'type' => 'link'],
                ],
                'cneb_competency'  => 'Crea proyectos usando tecnologías digitales (CNEB - Competencia 28)',
                'xp_reward'        => 50,
                'tips' => [
                    '💡 Las extremidades articuladas necesitan al menos 5mm de separación entre piezas.',
                    '🎨 Usa el Vectorizador para trazar el contorno de cada pieza y enviarla al log.',
                    '📐 Escala estimada: figura de 80×80×120mm en total.',
                ],
            ],
            'validation_rules_json' => [
                'deliverable_type' => 'photo_sketch',
                'max_x_mm'         => 80,
                'max_y_mm'         => 80,
                'max_z_mm'         => 120,
            ],
            'fabcoins_cost' => 0,
        ]);

        // NIVEL 2 — Modelado Digital con Uniones de Clip
        ProjectLevel::create([
            'project_id'   => $p4->id,
            'level_number' => 2,
            'title_json'   => [
                'es' => 'Nivel 2: Modelado Digital con Uniones de Clip',
                'en' => 'Level 2: Digital Modeling with Clip Joints',
            ],
            'toolbox_json' => [
                'deliverable_type'   => 'stl_3d',
                'guide'              => 'Modela en TinkerCAD al menos 2 piezas articuladas. Cada unión clip debe tener: macho de 4mm de diámetro, hembra de 4.3mm (tolerancia 0.3mm). Grosor mínimo de paredes: 2.5mm. Exporta el archivo STL completo y valídalo con el Visor 3D Makerdu para revisar cotas antes de enviarlo.',
                'bunny_video_url'    => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'resources'          => [
                    ['title' => 'TinkerCAD — Crear uniones clip', 'url' => 'https://www.tinkercad.com/learn/project-gallery/clips', 'type' => 'link'],
                    ['title' => 'Guía de Tolerancias para Impresión 3D FDM (PDF)', 'url' => 'https://drive.google.com/file/d/demo2', 'type' => 'pdf'],
                ],
                'cneb_competency'    => 'Usa el pensamiento computacional y diseño CAD para resolver problemas reales (CNEB - Competencia 28)',
                'xp_reward'          => 75,
                'tips' => [
                    '🔩 Tolerancia clip: macho=4.0mm, hembra=4.3mm para ajuste perfecto en PLA.',
                    '📏 Grosor mínimo de pared: 2.5mm para piezas resistentes a la manipulación.',
                    '🧊 Usa el Visor 3D para verificar que no hay geometría invertida antes de subir.',
                ],
            ],
            'validation_rules_json' => [
                'deliverable_type'       => 'stl_3d',
                'max_x_mm'               => 80,
                'max_y_mm'               => 80,
                'max_z_mm'               => 120,
                'min_wall_thickness_mm'  => 2.5,
            ],
            'fabcoins_cost' => 25,
        ]);

        // NIVEL 3 — Pre-flight Check IA de Tolerancias
        ProjectLevel::create([
            'project_id'   => $p4->id,
            'level_number' => 3,
            'title_json'   => [
                'es' => 'Nivel 3: Pre-flight Check IA de Tolerancias',
                'en' => 'Level 3: AI Tolerance Pre-flight Check',
            ],
            'toolbox_json' => [
                'deliverable_type'   => 'stl_3d',
                'guide'              => 'Sube tu STL al motor de Pre-flight Check IA. Gemini Vision analizará: (1) dimensiones dentro del rango permitido, (2) grosor de paredes ≥ 2.5mm, (3) que los conectores clip estén bien orientados para impresión sin soportes. Si el score IA es ≥ 80%, puedes solicitar fabricación.',
                'bunny_video_url'    => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'resources'          => [
                    ['title' => 'Cómo leer el reporte IA de Makerdu', 'url' => 'https://makerdu.com/docs/ai-preflight', 'type' => 'link'],
                ],
                'cneb_competency'    => 'Evalúa el funcionamiento y la calidad de sus producciones digitales (CNEB - Competencia 28)',
                'xp_reward'          => 100,
                'tips' => [
                    '🤖 Score IA ≥ 80 = apto para fabricación. Entre 60-79 = correcciones menores.',
                    '📐 Orienta las piezas con la cara plana más grande hacia abajo para evitar soportes.',
                    '⚡ Puedes resubir el STL corregido cuantas veces necesites antes de fabricar.',
                ],
            ],
            'validation_rules_json' => [
                'deliverable_type'       => 'stl_3d',
                'max_x_mm'               => 80,
                'max_y_mm'               => 80,
                'max_z_mm'               => 120,
                'min_wall_thickness_mm'  => 2.5,
            ],
            'fabcoins_cost' => 30,
        ]);

        // NIVEL 4 — Ensamblaje, Feria STEAM y Portafolio
        ProjectLevel::create([
            'project_id'   => $p4->id,
            'level_number' => 4,
            'title_json'   => [
                'es' => 'Nivel 4: Ensamblaje, Feria STEAM & Portafolio',
                'en' => 'Level 4: Assembly, STEAM Fair & Portfolio',
            ],
            'toolbox_json' => [
                'deliverable_type'   => 'checklist_assembly',
                'guide'              => 'Ensambla todas las piezas de tu Digitoy. Verifica que las articulaciones clip funcionen con al menos 90° de rango de movimiento. Fotografía el Digitoy ensamblado desde 3 ángulos y súbelo al portafolio. Prepara una presentación de 2 minutos para explicar tu proceso de diseño y fabricación.',
                'bunny_video_url'    => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'resources'          => [
                    ['title' => 'Rúbrica de Evaluación Feria STEAM (PDF)', 'url' => 'https://drive.google.com/file/d/demo3', 'type' => 'pdf'],
                    ['title' => 'Guía de Presentación Oral 2 Minutos',      'url' => 'https://makerdu.com/docs/presentacion', 'type' => 'link'],
                ],
                'cneb_competency'    => 'Comunica y sustenta sus producciones digitales ante una audiencia real (CNEB - Competencia 28 + 29)',
                'xp_reward'          => 150,
                'tips' => [
                    '🏆 El Digitoy ensamblado suma +150 XP y 1 FabCoin de bonus por articulación funcional.',
                    '📸 Fotografía desde: frontal, lateral y 3/4 para el portafolio completo.',
                    '🎤 Estructura tu presentación: Problema → Diseño → Fabricación → Resultado.',
                ],
            ],
            'validation_rules_json' => [
                'deliverable_type' => 'checklist_assembly',
                'max_x_mm'         => 80,
                'max_y_mm'         => 80,
                'max_z_mm'         => 120,
            ],
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

        // =====================================================================
        // AULA 4: Prof. Henry Sánchez → Flagship Digitoys 2.5D
        // Demo de Carrocería Pedagógica con personalización completa
        // =====================================================================
        $c4 = Classroom::create([
            'teacher_id'               => $teacher1->id,
            'project_id'               => $p4->id,
            'name'                     => 'Taller Flagship Digitoys — 6to Grado STEAM',
            'access_code'              => 'MK601',
            'mode'                     => 'school_squads',
            'tinkercad_link'           => 'https://www.tinkercad.com/joinclass/MK601DIGITOY',
            // Carrocería Pedagógica ya aplicada como demo
            'custom_title'             => 'Digitoys de Selva Amazónica — 6to B Coliseo Maker',
            'custom_description'       => 'Este trimestre fabricaremos figuras articuladas inspiradas en la fauna amazónica del Perú: el otorongo, el guacamayo y el caimán. Cada figura debe articular al menos 2 extremidades.',
            'custom_video_url'         => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'custom_context_image_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Panthera_onca_at_the_Los_Angeles_Zoo.jpg/640px-Panthera_onca_at_the_Los_Angeles_Zoo.jpg',
            'custom_welcome_message'   => '¡Bienvenidos Hacedores del 6toB! Esta semana iniciamos el reto Digitoys. ¡A crear figuras articuladas de la selva peruana! 🦜🐆',
            'custom_accent_color'      => '#10b981',
        ]);

        $sq4 = Squad::create([
            'classroom_id'    => $c4->id,
            'name'            => 'Escuadra Otorongo STEAM',
            'fabcoins_balance' => 150,
        ]);

        $students4 = [
            ['name' => 'Adriana Quispe',  'pin' => '2468', 'role' => 'Architect', 'xp' => 180],
            ['name' => 'Bruno Castillo',  'pin' => '1357', 'role' => 'Quality',   'xp' => 165],
            ['name' => 'Daniela Huanca',  'pin' => '9753', 'role' => 'Finance',   'xp' => 140],
            ['name' => 'Emilio Soto',     'pin' => '8642', 'role' => 'Relator',   'xp' => 155],
        ];

        foreach ($students4 as $s) {
            $u = User::create([
                'name'      => $s['name'],
                'pin'       => $s['pin'],
                'role_type' => 'student',
                'xp_points' => $s['xp'],
                'language'  => 'es',
            ]);
            $sq4->members()->attach($u->id, ['current_role' => $s['role'], 'active_minutes' => rand(20, 55)]);
        }

        // Bitácora inicial del Aula 4 (flagship)
        BitacoraEntry::create([
            'squad_id'            => $sq4->id,
            'level_id'            => $p4->levels->first()->id,
            'active_role_user_id' => $sq4->members()->first()->id,
            'content_text'        => 'Completamos el boceto de nuestro Digitoy: un otorongo articulado con cabeza, torso y 4 patas móviles. Usamos el Vectorizador Makerdu para digitalizar el boceto.',
            'ai_score'            => true,
            'ai_feedback'         => '✅ Excelente boceto con partes claramente diferenciadas. Las articulaciones están bien documentadas. Proporción estimada 80×120mm dentro del rango permitido.',
            'status'              => 'approved',
        ]);

        // =====================================================================
        // 4. CATÁLOGO DE RECOMPENSAS FABCOINS (TIENDA MAKER)
        // =====================================================================
        $rewards = [
            [
                'name_json' => ['es' => 'Filamento Seda Bicolor (100g Extra)', 'en' => 'Silk Dual-Color Filament (100g Extra)'],
                'description_json' => ['es' => 'Bobina especial de PLA con efecto tornasol para acabados premium en ferias.', 'en' => 'Special PLA spool with iridescent effect for premium finishes.'],
                'cost' => 35,
                'category' => 'material',
                'icon' => '🧵',
                'stock' => 10,
            ],
            [
                'name_json' => ['es' => 'Corte Láser Express (Sin Cola)', 'en' => 'Express Laser Cutting (Priority Queue)'],
                'description_json' => ['es' => 'Pase directo al cabezal láser de CO2 para fabricar piezas sin esperar el turno general.', 'en' => 'Direct access to CO2 laser cutter without general queue wait.'],
                'cost' => 25,
                'category' => 'time',
                'icon' => '⚡',
                'stock' => 5,
            ],
            [
                'name_json' => ['es' => 'DJ del Taller Maker (1 Sesión)', 'en' => 'Maker Lab DJ (1 Session)'],
                'description_json' => ['es' => 'Tu escuadra elige la playlist de música ambiental durante toda la clase de fabricación.', 'en' => 'Your squad picks the ambient music playlist for the whole class.'],
                'cost' => 20,
                'category' => 'privilege',
                'icon' => '🎧',
                'stock' => null,
            ],
            [
                'name_json' => ['es' => 'Pack de Stickers Holográficos Makerdu', 'en' => 'Makerdu Holographic Sticker Pack'],
                'description_json' => ['es' => 'Set de 4 calcomanías holográficas resistentes al agua con insignias de rol Maker.', 'en' => 'Set of 4 waterproof holographic stickers with Maker role badges.'],
                'cost' => 15,
                'category' => 'recognition',
                'icon' => '✨',
                'stock' => 25,
            ],
            [
                'name_json' => ['es' => 'Acceso a Boquilla de Alta Precisión 0.2mm', 'en' => 'High-Precision 0.2mm Nozzle Access'],
                'description_json' => ['es' => 'Imprime detalles ultra-finos (hasta 50 micras) para micro-mecanismos y miniaturas.', 'en' => 'Print ultra-fine details (down to 50 microns) for micro-mechanisms.'],
                'cost' => 40,
                'category' => 'tool',
                'icon' => '🔬',
                'stock' => 3,
            ],
            [
                'name_json' => ['es' => 'Pack de Plantillas CAD Paramétricas', 'en' => 'Parametric CAD Template Pack'],
                'description_json' => ['es' => 'Descarga de 8 archivos STL/STEP de engranajes y articulaciones optimizadas.', 'en' => 'Download 8 optimized gear and joint STL/STEP files.'],
                'cost' => 30,
                'category' => 'digital',
                'icon' => '📦',
                'stock' => null,
            ],
        ];

        foreach ($rewards as $r) {
            RewardCatalog::create($r);
        }

        // =====================================================================
        // 5. REGISTROS INICIALES DEL LIBRO CONTABLE (LEDGER TRANSACTIONS)
        // =====================================================================
        $squadsList = [$sq1, $sq2, $sq3, $sq4];
        foreach ($squadsList as $sq) {
            FabCoinTransaction::create([
                'squad_id' => $sq->id,
                'amount' => $sq->fabcoins_balance,
                'type' => 'earn_bonus',
                'description' => 'Presupuesto inicial de apertura de escuadra',
                'balance_after' => $sq->fabcoins_balance,
                'created_at' => now()->subDays(3),
            ]);
        }
    }
}
