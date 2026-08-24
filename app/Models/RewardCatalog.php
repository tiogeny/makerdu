<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardCatalog extends Model
{
    protected $table = 'reward_catalog';

    protected $fillable = [
        'name_json',
        'description_json',
        'cost',
        'category',
        'icon',
        'stock',
        'total_redeemed',
        'is_active',
    ];

    protected $casts = [
        'name_json'        => 'array',
        'description_json' => 'array',
        'cost'             => 'integer',
        'stock'            => 'integer',
        'total_redeemed'   => 'integer',
        'is_active'        => 'boolean',
    ];

    public function redemptions()
    {
        return $this->hasMany(RewardRedemption::class, 'reward_id');
    }

    /**
     * Nombre según idioma activo.
     */
    public function name(string $lang = 'es'): string
    {
        return $this->name_json[$lang] ?? $this->name_json['es'] ?? 'Recompensa';
    }

    /**
     * Descripción según idioma activo.
     */
    public function description(string $lang = 'es'): string
    {
        return $this->description_json[$lang] ?? $this->description_json['es'] ?? '';
    }

    /**
     * Verifica si hay stock disponible.
     */
    public function hasStock(): bool
    {
        return $this->stock === null || $this->stock > 0;
    }

    /**
     * Color de categoría para la UI.
     */
    public function categoryColor(): string
    {
        return match ($this->category) {
            'material'    => 'amber',
            'time'        => 'cyan',
            'tool'        => 'blue',
            'privilege'   => 'purple',
            'recognition' => 'emerald',
            'digital'     => 'pink',
            default       => 'slate',
        };
    }
}
