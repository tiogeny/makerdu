<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MicroAnimation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AnimationManagerController extends Controller
{
    public function index()
    {
        $animations = MicroAnimation::orderBy('created_at', 'desc')->get()->map(function ($anim) {
            return [
                'id' => $anim->id,
                'slug' => $anim->slug,
                'title_json' => $anim->title_json,
                'category' => $anim->category,
                'description_json' => $anim->description_json,
                'html_css_code' => $anim->html_css_code,
                'is_active' => (bool) $anim->is_active,
            ];
        });

        return Inertia::render('Admin/Animations/Index', [
            'animations' => $animations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_es' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'category' => 'required|string|in:3d,laser,2.5d,electronics,general',
            'description_es' => 'nullable|string',
            'html_css_code' => 'required|string',
        ]);

        $slug = Str::slug($validated['title_es']) . '-' . rand(100, 999);

        MicroAnimation::create([
            'slug' => $slug,
            'title_json' => [
                'es' => $validated['title_es'],
                'en' => $validated['title_en'] ?? $validated['title_es'],
            ],
            'category' => $validated['category'],
            'description_json' => [
                'es' => $validated['description_es'] ?? '',
                'en' => $validated['description_en'] ?? ($validated['description_es'] ?? ''),
            ],
            'html_css_code' => $validated['html_css_code'],
            'is_active' => true,
        ]);

        return redirect()->route('admin.animations.index')->with('success', '¡Micro-Animación registrada con éxito!');
    }

    public function toggle(MicroAnimation $animation)
    {
        $animation->is_active = !$animation->is_active;
        $animation->save();
        return back()->with('success', 'Estado de animación actualizado.');
    }

    public function destroy(MicroAnimation $animation)
    {
        $animation->delete();
        return redirect()->route('admin.animations.index')->with('success', 'Animación eliminada.');
    }
}
