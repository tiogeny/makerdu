<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->string('name');
            $table->string('access_code', 20)->unique();
            $table->enum('mode', ['school_squads', 'private_workshop'])->default('school_squads');
            $table->string('tinkercad_link')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classrooms');
    }
};
