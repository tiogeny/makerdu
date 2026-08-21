<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('squads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
            $table->string('name');
            $table->integer('fabcoins_balance')->default(100); // Billetera de insumos físicos reales
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('squads');
    }
};
