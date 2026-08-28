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
        'inputs_json',
        'process_json',
        'outputs_json',
        'validation_rules_json',
        'fabcoins_cost',
        'xp_reward',
    ];

    protected $casts = [
        'title_json' => 'array',
        'toolbox_json' => 'array',
        'inputs_json' => 'array',
        'process_json' => 'array',
        'outputs_json' => 'array',
        'validation_rules_json' => 'array',
        'fabcoins_cost' => 'integer',
        'xp_reward' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
