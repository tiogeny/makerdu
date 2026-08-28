<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'age_range')) {
                $table->string('age_range')->nullable()->default('juniors_9_12')->after('recommended_age');
            }
            if (!Schema::hasColumn('projects', 'difficulty_level')) {
                $table->string('difficulty_level')->nullable()->default('foundational')->after('age_range');
            }
            if (!Schema::hasColumn('projects', 'technologies_json')) {
                $table->json('technologies_json')->nullable()->after('type');
            }
            if (!Schema::hasColumn('projects', 'curriculum_framework')) {
                $table->string('curriculum_framework')->nullable()->default('cneb_peru')->after('competencies_json');
            }
            if (!Schema::hasColumn('projects', 'competencies_custom_json')) {
                $table->json('competencies_custom_json')->nullable()->after('curriculum_framework');
            }
            if (!Schema::hasColumn('projects', 'skills_json')) {
                $table->json('skills_json')->nullable()->after('competencies_custom_json');
            }
            if (!Schema::hasColumn('projects', 'custom_animation_html')) {
                $table->longText('custom_animation_html')->nullable()->after('animation_preset');
            }
            if (!Schema::hasColumn('projects', 'status')) {
                $table->string('status')->default('published')->after('is_active');
            }
        });

        Schema::table('project_levels', function (Blueprint $table) {
            if (!Schema::hasColumn('project_levels', 'skills_reward_json')) {
                $table->json('skills_reward_json')->nullable()->after('xp_reward');
            }
            if (!Schema::hasColumn('project_levels', 'allows_iteration')) {
                $table->boolean('allows_iteration')->default(true)->after('skills_reward_json');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'age_range',
                'difficulty_level',
                'technologies_json',
                'curriculum_framework',
                'competencies_custom_json',
                'skills_json',
                'custom_animation_html',
                'status',
            ]);
        });

        Schema::table('project_levels', function (Blueprint $table) {
            $table->dropColumn(['skills_reward_json', 'allows_iteration']);
        });
    }
};
