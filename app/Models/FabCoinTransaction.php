<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FabCoinTransaction extends Model
{
    protected $fillable = [
        'squad_id',
        'amount',
        'type',
        'description',
        'reference_type',
        'reference_id',
        'balance_after',
    ];

    protected $casts = [
        'amount'       => 'integer',
        'balance_after'=> 'integer',
    ];

    public function squad()
    {
        return $this->belongsTo(Squad::class);
    }

    /**
     * Badge de color según tipo de transacción.
     */
    public function typeBadge(): array
    {
        return match ($this->type) {
            'earn_level'        => ['label' => '+FC Nivel', 'class' => 'text-emerald-400'],
            'earn_bonus'        => ['label' => '+FC Bonus', 'class' => 'text-amber-400'],
            'spend_fabrication' => ['label' => '-FC Fab',   'class' => 'text-red-400'],
            'spend_reward'      => ['label' => '-FC Canje', 'class' => 'text-purple-400'],
            'penalty'           => ['label' => '-FC Penaliz','class' => 'text-red-500'],
            'adjustment'        => ['label' => '± Ajuste',  'class' => 'text-slate-400'],
            default             => ['label' => 'FC',        'class' => 'text-slate-300'],
        };
    }
}
