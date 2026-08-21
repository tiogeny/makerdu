<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'name',
        'access_code',
        'mode',
        'tinkercad_link',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
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
