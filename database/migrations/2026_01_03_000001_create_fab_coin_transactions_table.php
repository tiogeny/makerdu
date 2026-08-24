<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de todas las transacciones de FabCoins por escuadra.
     * Permite auditoría completa de la economía del aula.
     */
    public function up(): void
    {
        Schema::create('fab_coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('squad_id')->constrained()->onDelete('cascade');

            // Monto: positivo = ingreso, negativo = gasto
            $table->integer('amount');

            // Tipo de movimiento
            $table->enum('type', [
                'earn_level',       // Completar nivel (automático)
                'earn_bonus',       // Bonus del docente o logro especial
                'spend_fabrication',// Solicitud de fabricación (batch)
                'spend_reward',     // Canje de recompensa del catálogo
                'penalty',          // Penalización por docente
                'adjustment',       // Ajuste manual del SuperAdmin
            ]);

            // Descripción legible por el alumno
            $table->string('description')->nullable();

            // Referencia opcional (nivel completado, batch, recompensa, etc.)
            $table->string('reference_type')->nullable(); // 'project_level', 'fabrication_batch', 'reward'
            $table->unsignedBigInteger('reference_id')->nullable();

            // Balance después de esta transacción (snapshot para historial)
            $table->integer('balance_after')->default(0);

            $table->timestamps();

            $table->index(['squad_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fab_coin_transactions');
    }
};
