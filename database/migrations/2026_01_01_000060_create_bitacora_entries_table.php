<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('squad_id')->constrained('squads')->onDelete('cascade');
            $table->foreignId('level_id')->constrained('project_levels')->onDelete('cascade');
            $table->foreignId('active_role_user_id')->constrained('users')->onDelete('cascade');
            $table->text('content_text')->nullable();
            $table->string('file_url')->nullable();
            $table->boolean('ai_score')->default(false);
            $table->text('ai_feedback')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_entries');
    }
};
