<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('micro_apps', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('category', ['2.5D', '3D', 'Laser', 'Electronics', 'Sustainability'])->default('2.5D');
            $table->string('description')->nullable();
            $table->string('embed_path'); // ej: '/apps/vectorizer'
            $table->enum('output_type', ['svg', 'stl', 'json', 'image'])->default('svg');
            $table->string('icon')->default('sparkles');
            $table->json('default_config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('micro_apps');
    }
};