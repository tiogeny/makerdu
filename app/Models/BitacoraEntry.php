<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BitacoraEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'squad_id',
        'level_id',
        'active_role_user_id',
        'content_text',
        'file_url',
        'ai_score',
        'ai_feedback',
        'status',
    ];

    protected $casts = [
        'ai_score' => 'boolean',
    ];

    public function squad()
    {
        return $this->belongsTo(Squad::class);
    }

    public function level()
    {
        return $this->belongsTo(ProjectLevel::class, 'level_id');
    }

    public function activeRoleUser()
    {
        return $this->belongsTo(User::class, 'active_role_user_id');
    }
}
