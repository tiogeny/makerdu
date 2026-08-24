<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Carrocería Pedagógica: campos de personalización por docente.
     * El "chasis técnico" (niveles, reglas IA, FabCoins) lo controla el SuperAdmin.
     * El docente solo personaliza el contexto visual y narrativo de SU aula.
     */
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            // Título personalizado que reemplaza al título del proyecto en el HUD del alumno
            $table->string('custom_title')->nullable()->after('tinkercad_link');

            // Descripción contextual del proyecto adaptada al colegio/aula
            $table->text('custom_description')->nullable()->after('custom_title');

            // URL del video de YouTube del docente (reemplaza al video por defecto del proyecto)
            $table->string('custom_video_url')->nullable()->after('custom_description');

            // URL de imagen de contexto / foto del reto real del aula
            $table->string('custom_context_image_url')->nullable()->after('custom_video_url');

            // Mensaje de bienvenida personalizado para los alumnos del aula
            $table->text('custom_welcome_message')->nullable()->after('custom_context_image_url');

            // Color temático del aula (hex) para diferenciarlo visualmente
            $table->string('custom_accent_color', 7)->nullable()->default('#06b6d4')->after('custom_welcome_message');
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropColumn([
                'custom_title',
                'custom_description',
                'custom_video_url',
                'custom_context_image_url',
                'custom_welcome_message',
                'custom_accent_color',
            ]);
        });
    }
};
