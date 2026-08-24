<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('squad_id')->constrained()->onDelete('cascade');
            $table->foreignId('reward_id')->constrained('reward_catalog')->onDelete('cascade');

            // Quién canjeó (alumno activo en el dispositivo)
            $table->foreignId('redeemed_by')->constrained('users')->onDelete('cascade');

            $table->unsignedInteger('fabcoins_spent');

            // Estado del canje
            $table->enum('status', ['pending', 'approved', 'delivered', 'rejected'])->default('pending');

            // Notas del docente al aprobar/rechazar
            $table->text('teacher_notes')->nullable();

            $table->timestamps();

            $table->index(['squad_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_redemptions');
    }
};
