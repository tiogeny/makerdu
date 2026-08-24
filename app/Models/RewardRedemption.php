<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardRedemption extends Model
{
    protected $fillable = [
        'squad_id',
        'reward_id',
        'redeemed_by',
        'fabcoins_spent',
        'status',
        'teacher_notes',
    ];

    protected $casts = [
        'fabcoins_spent' => 'integer',
    ];

    public function squad()
    {
        return $this->belongsTo(Squad::class);
    }

    public function reward()
    {
        return $this->belongsTo(RewardCatalog::class, 'reward_id');
    }

    public function redeemedBy()
    {
        return $this->belongsTo(User::class, 'redeemed_by');
    }

    public function statusBadge(): array
    {
        return match ($this->status) {
            'pending'   => ['label' => 'Pendiente',  'class' => 'bg-amber-500/20 text-amber-300 border-amber-500/30'],
            'approved'  => ['label' => 'Aprobado',   'class' => 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'],
            'delivered' => ['label' => 'Entregado',  'class' => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'],
            'rejected'  => ['label' => 'Rechazado',  'class' => 'bg-red-500/20 text-red-400 border-red-500/30'],
            default     => ['label' => $this->status,'class' => 'bg-slate-800 text-slate-400'],
        };
    }
}
