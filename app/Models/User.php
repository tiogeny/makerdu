<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'pin',
        'role_type',
        'parent_id',
        'xp_points',
        'language',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'xp_points' => 'integer',
        ];
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    public function parentProfile()
    {
        return $this->hasOne(ParentProfile::class);
    }

    public function classroomsTaught()
    {
        return $this->hasMany(Classroom::class, 'teacher_id');
    }

    public function squads()
    {
        return $this->belongsToMany(Squad::class, 'squad_user')
            ->withPivot('current_role', 'active_minutes')
            ->withTimestamps();
    }

    public function bitacoras()
    {
        return $this->hasMany(BitacoraEntry::class, 'active_role_user_id');
    }
}
