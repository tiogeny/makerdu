<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_json',
        'description_json',
        'type',
        'total_levels',
    ];

    protected $casts = [
        'title_json' => 'array',
        'description_json' => 'array',
        'total_levels' => 'integer',
    ];

    public function levels()
    {
        return $this->hasMany(ProjectLevel::class)->orderBy('level_number');
    }
}
