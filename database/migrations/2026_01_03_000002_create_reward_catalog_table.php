<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogo de Recompensas que los alumnos pueden canjear con FabCoins.
     * Gestionado por el SuperAdmin. Los docentes lo ven en su WarRoom.
     */
    public function up(): void
    {
        Schema::create('reward_catalog', function (Blueprint $table) {
            $table->id();

            // Nombre y descripción multilingüe
            $table->json('name_json');
            $table->json('description_json')->nullable();

            // Precio en FabCoins
            $table->unsignedInteger('cost');

            // Categoría visual
            $table->enum('category', [
                'material',     // Filamento extra, papel especial, etc.
                'time',         // Minutos de máquina (impresora/láser)
                'tool',         // Acceso a herramienta especial
                'privilege',    // Elegir rol, música en el taller, etc.
                'recognition',  // Sticker, certificado, mención especial
                'digital',      // Asset digital (plantilla premium, pack de figuras)
            ])->default('material');

            // Emoji / icono para la UI
            $table->string('icon', 10)->default('🎁');

            // Stock disponible (null = ilimitado)
            $table->unsignedInteger('stock')->nullable();

            // Total canjeado (para tracking de popularidad)
            $table->unsignedInteger('total_redeemed')->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_catalog');
    }
};
