<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone_whatsapp',
        'dni_id',
        'notifications_enabled',
    ];

    protected $casts = [
        'notifications_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
