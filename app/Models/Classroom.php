<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'project_id',
        'name',
        'access_code',
        'mode',
        'tinkercad_link',
        // Carrocería Pedagógica (Paso 4)
        'custom_title',
        'custom_description',
        'custom_video_url',
        'custom_context_image_url',
        'custom_welcome_message',
        'custom_accent_color',
    ];

    /**
     * Retorna el título efectivo: custom del aula o el del proyecto maestro.
     */
    public function effectiveTitle(): string
    {
        return $this->custom_title ?: ($this->project->title ?? 'Proyecto Makerdu');
    }

    /**
     * Retorna la descripción efectiva: custom del aula o la del proyecto maestro.
     */
    public function effectiveDescription(): string
    {
        return $this->custom_description ?: ($this->project->description ?? '');
    }

    /**
     * Retorna el color de acento efectivo (hex).
     */
    public function effectiveAccentColor(): string
    {
        return $this->custom_accent_color ?: '#06b6d4';
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function squads()
    {
        return $this->hasMany(Squad::class);
    }

    public function fabricationBatches()
    {
        return $this->hasMany(FabricationBatch::class);
    }
}
