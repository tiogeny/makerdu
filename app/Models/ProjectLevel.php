<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'level_number',
        'title_json',
        'toolbox_json',
        'validation_rules_json',
        'fabcoins_cost',
    ];

    protected $casts = [
        'title_json' => 'array',
        'toolbox_json' => 'array',
        'validation_rules_json' => 'array',
        'level_number' => 'integer',
        'fabcoins_cost' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function bitacoras()
    {
        return $this->hasMany(BitacoraEntry::class, 'level_id');
    }
}
