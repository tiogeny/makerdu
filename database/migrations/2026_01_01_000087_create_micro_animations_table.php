<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('micro_animations', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title_json'); // {"es": "Exportar STL en Tinkercad", "en": "Export STL in Tinkercad"}
            $table->string('category')->default('3d'); // 3d, laser, 2.5d, electronics, general
            $table->json('description_json')->nullable();
            $table->longText('html_css_code');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'age_ranges_json')) {
                $table->json('age_ranges_json')->nullable()->after('age_range');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('micro_animations');
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('age_ranges_json');
        });
    }
};
