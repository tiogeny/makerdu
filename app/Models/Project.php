<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title_json',
        'description_json',
        'type',
        'technologies_json',
        'age_range',
        'age_ranges_json',
        'difficulty_level',
        'curriculum_framework',
        'competencies_json',
        'competencies_custom_json',
        'skills_json',
        'animation_preset',
        'custom_animation_html',
        'recommended_age',
        'gemini_prompt_context',
        'total_levels',
        'is_active',
        'status',
    ];

    protected $casts = [
        'title_json' => 'array',
        'description_json' => 'array',
        'technologies_json' => 'array',
        'age_ranges_json' => 'array',
        'competencies_json' => 'array',
        'competencies_custom_json' => 'array',
        'skills_json' => 'array',
        'total_levels' => 'integer',
        'is_active' => 'boolean',
    ];

    public function levels()
    {
        return $this->hasMany(ProjectLevel::class)->orderBy('level_number');
    }

    public function missions()
    {
        return $this->hasMany(ProjectLevel::class)->orderBy('level_number');
    }
}
