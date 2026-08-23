<?php

namespace App\Http\Controllers;

use App\Models\MicroApp;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MicroAppManagerController extends Controller
{
    /**
     * Catálogo / App Store de Micro-Apps para el SuperAdmin
     */
    public function index()
    {
        $apps = MicroApp::latest()->get();

        return Inertia::render('Admin/Apps/Index', [
            'apps' => $apps,
        ]);
    }

    /**
     * Registrar Nueva Micro-App
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:100', 'unique:micro_apps,slug'],
            'category' => ['required', 'in:2.5D,3D,Laser,Electronics,Sustainability'],
            'description' => ['nullable', 'string'],
            'embed_path' => ['required', 'string', 'max:255'],
            'output_type' => ['required', 'in:svg,stl,json,image'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);

        $app = MicroApp::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'category' => $request->category,
            'description' => $request->description,
            'embed_path' => $request->embed_path,
            'output_type' => $request->output_type,
            'icon' => $request->icon ?: '⚡',
            'is_active' => true,
        ]);

        return back()->with('success', "¡Micro-App '{$app->name}' registrada con éxito!");
    }

    /**
     * Alternar estado Activo / Inactivo
     */
    public function toggle(MicroApp $app)
    {
        $app->update(['is_active' => !$app->is_active]);
        $status = $app->is_active ? 'activada' : 'desactivada';
        return back()->with('success', "Micro-App '{$app->name}' {$status}.");
    }
}