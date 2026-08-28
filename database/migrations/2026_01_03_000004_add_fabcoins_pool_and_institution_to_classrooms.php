<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->string('institution_name')->nullable()->after('name');
            $table->unsignedInteger('total_fabcoins_pool')->default(500)->after('mode');
            $table->unsignedInteger('fabcoins_reserve_pool')->default(100)->after('total_fabcoins_pool');
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropColumn(['institution_name', 'total_fabcoins_pool', 'fabcoins_reserve_pool']);
        });
    }
};
