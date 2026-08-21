<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->json('title_json'); // {"es": "Sellos 2.5D", "en": "2.5D Stamps"}
            $table->json('description_json');
            $table->enum('type', ['2.5D', '3D', 'Laser'])->default('3D');
            $table->integer('total_levels')->default(5);
            $table->timestamps();
        });

        Schema::create('project_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->integer('level_number'); // 1, 2, 3...
            $table->json('title_json'); // {"es": "Nivel 1: Reto e Idea"}
            $table->json('toolbox_json'); // Links, GIFs, PDFs de apoyo
            $table->json('validation_rules_json')->nullable(); // Reglas IA (X, Y, Z, grosor)
            $table->integer('fabcoins_cost')->default(0); // Costo insumos
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_levels');
        Schema::dropIfExists('projects');
    }
};
