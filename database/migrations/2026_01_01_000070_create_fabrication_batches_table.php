<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fabrication_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
            $table->string('zip_file_url')->nullable();
            $table->string('pdf_label_url')->nullable();
            $table->text('shipping_address')->nullable();
            $table->enum('status', ['queue', 'printing', 'dispatched', 'delivered'])->default('queue');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fabrication_batches');
    }
};
