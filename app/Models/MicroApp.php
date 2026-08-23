<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MicroApp extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
        'embed_path',
        'output_type',
        'icon',
        'default_config',
        'is_active',
    ];

    protected $casts = [
        'default_config' => 'array',
        'is_active' => 'boolean',
    ];
}