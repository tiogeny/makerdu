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
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Limpieza segura e idempotente (Base Limpia Makerdu v4.0)
        Schema::disableForeignKeyConstraints();
        User::truncate();
        Project::truncate();
        ProjectLevel::truncate();
        Classroom::truncate();
        Squad::truncate();
        BitacoraEntry::truncate();
        RewardCatalog::truncate();
        FabCoinTransaction::truncate();
        Schema::enableForeignKeyConstraints();

        // =====================================================================
        // 1. SUITE MAESTRA DE 19 MICRO-APPS DE FABRICACIÓN DIGITAL (AUTÓNOMAS)
        // =====================================================================
        $microApps = [
            [
                'slug' => 'vectorizer',
                'name' => 'Vectorizador Cámara B/N & Editor Bézier 2D/3D',
                'category' => '2.5D',
                'description' => 'Convierte bocetos en papel a vectores limpios SVG mediante cámara web o pluma Bézier y genera extrusión 3D instantánea.',
                'embed_path' => '/apps/vectorizer',
                'output_type' => 'svg',
                'icon' => '🎨',
            ],
            [
                'slug' => 'viewer-3d',
                'name' => 'Visor 3D WebGL Autónomo',
                'category' => '3D',
                'description' => 'Inspección 360° de mallas STL, cotas físicas X/Y/Z, cálculo volumétrico y validación de grosor.',
                'embed_path' => '/apps/viewer-3d',
                'output_type' => 'stl',
                'icon' => '🧊',
            ],
            [
                'slug' => 'box-generator',
                'name' => 'Generador de Cajas Láser con Encastre',
                'category' => 'Laser',
                'description' => 'Diseño paramétrico de cajas finger-joint para corte láser con compensación automática de kerf.',
                'embed_path' => '/apps/box-generator',
                'output_type' => 'svg',
                'icon' => '📦',
            ],
            [
                'slug' => 'digitoy-studio',
                'name' => 'Digitoy Studio 3D — Figuras Articuladas',
                'category' => '3D',
                'description' => 'Estudio de personalización de personajes articulados tipo Print-in-Place con simulación cinemática.',
                'embed_path' => '/apps/digitoy-studio',
                'output_type' => 'stl',
                'icon' => '🦖',
            ],
            [
                'slug' => 'gear-generator',
                'name' => 'Generador de Engranajes & Autómatas',
                'category' => 'Laser',
                'description' => 'Diseñador paramétrico de trenes de engranajes evolventes con simulación cinemática en tiempo real.',
                'embed_path' => '/apps/gear-generator',
                'output_type' => 'svg',
                'icon' => '⚙️',
            ],
            [
                'slug' => 'pixel-art-studio',
                'name' => 'Pixel & Voxel Art Studio 2D/3D',
                'category' => '3D',
                'description' => 'Diseñador de personajes en cuadrícula con simetría vertical, exportación láser y extrusión vóxel 3D.',
                'embed_path' => '/apps/pixel-art-studio',
                'output_type' => 'stl',
                'icon' => '👾',
            ],
            [
                'slug' => 'lamp-designer',
                'name' => 'Diseñador de Lámparas Waffle Grid',
                'category' => 'Laser',
                'description' => 'Calculadora de lámparas de costillas entrelazadas con selector de soquete y simulación de luz.',
                'embed_path' => '/apps/lamp-designer',
                'output_type' => 'svg',
                'icon' => '💡',
            ],
            [
                'slug' => 'stamp-maker',
                'name' => 'Creador de Sellos Ergonómicos & Troqueles',
                'category' => '3D',
                'description' => 'Generador de sellos con relieve espejado, mangos ergonómicos y base de corte láser.',
                'embed_path' => '/apps/stamp-maker',
                'output_type' => 'stl',
                'icon' => '🔤',
            ],
            [
                'slug' => 'jewelry-pattern',
                'name' => 'Generador de Bio-Joyería & Dijes Andinos',
                'category' => '2.5D',
                'description' => 'Diseñador de aretes y dijes con geometría sagrada, simetría radial y ojal para cadena.',
                'embed_path' => '/apps/jewelry-pattern',
                'output_type' => 'svg',
                'icon' => '💎',
            ],
            [
                'slug' => 'packaging-box',
                'name' => 'Diseñador de Packaging Plegable & Cajas',
                'category' => 'Laser',
                'description' => 'Calculadora de cajas de cartulina con pestañas, líneas de corte y hendido, y simulador de plegado 3D.',
                'embed_path' => '/apps/packaging-box',
                'output_type' => 'svg',
                'icon' => '📐',
            ],
            [
                'slug' => 'living-hinge',
                'name' => 'Generador de Bisagras Vivas & Madera Flexible',
                'category' => 'Laser',
                'description' => 'Generador de patrones de corte para doblar MDF y acrílico con simulación de flexión 3D.',
                'embed_path' => '/apps/living-hinge',
                'output_type' => 'svg',
                'icon' => '🪵',
            ],
            [
                'slug' => 'lithophane-maker',
                'name' => 'Generador de Litofanías 3D & Cajas de Luz',
                'category' => '3D',
                'description' => 'Convierte fotos en relieves 3D translúcidos con simulación de contraluz en tiempo real.',
                'embed_path' => '/apps/lithophane-maker',
                'output_type' => 'stl',
                'icon' => '🖼️',
            ],
            [
                'slug' => 'vase-pot-generator',
                'name' => 'Diseñador de Macetas & Jarrones 3D',
                'category' => '3D',
                'description' => 'Diseñador paramétrico de macetas y floreros geométricos optimizados para Modo Vaso (Vase Mode).',
                'embed_path' => '/apps/vase-pot-generator',
                'output_type' => 'stl',
                'icon' => '🪴',
            ],
            [
                'slug' => 'robot-chassis',
                'name' => 'Diseñador de Chasis para Robótica Educativa',
                'category' => 'Laser',
                'description' => 'Generador de chasis para carritos 2WD/4WD con orificios de montaje para Arduino, Micro:bit, sensores y motores TT.',
                'embed_path' => '/apps/robot-chassis',
                'output_type' => 'svg',
                'icon' => '🤖',
            ],
            [
                'slug' => 'layered-topography',
                'name' => 'Creador de Topografía & Maquetas 2.5D',
                'category' => '2.5D',
                'description' => 'Generador de mapas en capas apilables de cartón o madera con curvas de nivel y pines de registro.',
                'embed_path' => '/apps/layered-topography',
                'output_type' => 'svg',
                'icon' => '🗺️',
            ],
            [
                'slug' => 'mold-maker',
                'name' => 'Generador de Moldes & Matrices 3D',
                'category' => '3D',
                'description' => 'Diseñador de moldes para chocolatería, jabones y resina con ángulos de salida para desmolde perfecto.',
                'embed_path' => '/apps/mold-maker',
                'output_type' => 'stl',
                'icon' => '🍫',
            ],
            [
                'slug' => 'block-cad',
                'name' => 'Block CAD 3D (Tinker-Lite)',
                'category' => '3D',
                'description' => 'Modelador 3D por bloques primitivos, sólidos y huecos con plano de trabajo interactivo y exportador STL.',
                'embed_path' => '/apps/block-cad',
                'output_type' => 'stl',
                'icon' => '🧱',
            ],
            [
                'slug' => 'clay-sculptor',
                'name' => 'Clay Sculptor 3D (SculptGL-Lite)',
                'category' => '3D',
                'description' => 'Estudio de escultura digital en arcilla 3D con pinceles de inflar, pellizcar, suavizar y simetría en tiempo real.',
                'embed_path' => '/apps/clay-sculptor',
                'output_type' => 'stl',
                'icon' => '🗿',
            ],
            [
                'slug' => 'cookie-cutter',
                'name' => 'Diseñador de Cortadores de Galletas',
                'category' => '3D',
                'description' => 'Generador de cortadores para repostería y plastilina con filo afilado y pestaña ergonómica de presión.',
                'embed_path' => '/apps/cookie-cutter',
                'output_type' => 'stl',
                'icon' => '🍪',
            ],
        ];

        foreach ($microApps as $app) {
            MicroApp::firstOrCreate(['slug' => $app['slug']], array_merge($app, ['is_active' => true]));
        }

        // =====================================================================
        // 2. USUARIO SUPER ADMINISTRADOR PRINCIPAL
        // =====================================================================
        User::firstOrCreate(
            ['email' => 'contacto@fablablima.org'],
            [
                'name' => 'Admin FabLab Lima',
                'password' => Hash::make('password'),
                'role_type' => 'admin',
                'language' => 'es',
            ]
        );
    }
}
