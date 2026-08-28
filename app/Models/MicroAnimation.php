<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MicroAnimation extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title_json',
        'category',
        'description_json',
        'html_css_code',
        'is_active',
    ];

    protected $casts = [
        'title_json' => 'array',
        'description_json' => 'array',
        'is_active' => 'boolean',
    ];
}
