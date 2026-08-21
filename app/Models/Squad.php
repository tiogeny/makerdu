<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Squad extends Model
{
    use HasFactory;

    protected $fillable = [
        'classroom_id',
        'name',
        'fabcoins_balance',
    ];

    protected $casts = [
        'fabcoins_balance' => 'integer',
    ];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'squad_user')
            ->withPivot('current_role', 'active_minutes')
            ->withTimestamps();
    }

    public function bitacoras()
    {
        return $this->hasMany(BitacoraEntry::class);
    }
}
