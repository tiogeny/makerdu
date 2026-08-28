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
        'competencies_json',
        'animation_preset',
        'recommended_age',
        'gemini_prompt_context',
        'total_levels',
        'is_active',
    ];

    protected $casts = [
        'title_json' => 'array',
        'description_json' => 'array',
        'competencies_json' => 'array',
        'total_levels' => 'integer',
        'is_active' => 'boolean',
    ];

    public function levels()
    {
        return $this->hasMany(ProjectLevel::class)->orderBy('level_number');
    }

    // Alias semántico para Misiones
    public function missions()
    {
        return $this->hasMany(ProjectLevel::class)->orderBy('level_number');
    }
}
