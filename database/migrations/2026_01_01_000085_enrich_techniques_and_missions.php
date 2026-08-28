<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('projects', 'competencies_json')) {
                $table->json('competencies_json')->nullable()->after('type');
            }
            if (!Schema::hasColumn('projects', 'animation_preset')) {
                $table->string('animation_preset')->nullable()->default('art-toy-loop')->after('competencies_json');
            }
            if (!Schema::hasColumn('projects', 'recommended_age')) {
                $table->string('recommended_age')->nullable()->default('8-16 años')->after('animation_preset');
            }
            if (!Schema::hasColumn('projects', 'gemini_prompt_context')) {
                $table->text('gemini_prompt_context')->nullable()->after('recommended_age');
            }
            if (!Schema::hasColumn('projects', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('total_levels');
            }
        });

        Schema::table('project_levels', function (Blueprint $table) {
            if (!Schema::hasColumn('project_levels', 'inputs_json')) {
                $table->json('inputs_json')->nullable()->after('toolbox_json');
            }
            if (!Schema::hasColumn('project_levels', 'process_json')) {
                $table->json('process_json')->nullable()->after('inputs_json');
            }
            if (!Schema::hasColumn('project_levels', 'outputs_json')) {
                $table->json('outputs_json')->nullable()->after('process_json');
            }
            if (!Schema::hasColumn('project_levels', 'xp_reward')) {
                $table->integer('xp_reward')->default(50)->after('fabcoins_cost');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['slug', 'competencies_json', 'animation_preset', 'recommended_age', 'gemini_prompt_context', 'is_active']);
        });

        Schema::table('project_levels', function (Blueprint $table) {
            $table->dropColumn(['inputs_json', 'process_json', 'outputs_json', 'xp_reward']);
        });
    }
};
