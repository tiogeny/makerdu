<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('squad_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('squad_id')->constrained('squads')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('current_role', ['Architect', 'Quality', 'Finance', 'Relator'])->default('Architect');
            $table->integer('active_minutes')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('squad_user');
    }
};
