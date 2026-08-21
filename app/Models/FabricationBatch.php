<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FabricationBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'classroom_id',
        'zip_file_url',
        'pdf_label_url',
        'shipping_address',
        'status',
    ];

    public function classroom()
    {
        return $this->belongsTo(Classroom::class);
    }
}
