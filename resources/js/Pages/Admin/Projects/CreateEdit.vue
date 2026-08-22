<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, Layers, Plus, Trash2, ArrowLeft,
    Save, Film, Box, Coins, HelpCircle, Palette, Scissors, Wrench, CheckSquare
} from 'lucide-vue-next';

const props = defineProps({
    project: Object,
    isEdit: Boolean,
});

const form = useForm({
    title_es: props.project?.title_es || '',
    title_en: props.project?.title_en || '',
    description_es: props.project?.description_es || '',
    description_en: props.project?.description_en || '',
    type: props.project?.type || '3D',
    levels: props.project?.levels?.length ? props.project.levels : [
        {
            level_number: 1,
            title_es: 'Nivel 1: Ideación y Boceto Inicial',
            title_en: 'Level 1: Ideation & Sketching',
            deliverable_type: 'photo_sketch',
            guide_es: 'Dibuja el concepto de tu pieza en tu libreta o papel cuadriculado y sube la foto.',
            bunny_video_url: 'https://iframe.mediadelivery.net/embed/demo',
            max_x_mm: 50,
            max_y_mm: 50,
            max_z_mm: 15,
            fabcoins_cost: 0,
        },
        {
            level_number: 2,
            title_es: 'Nivel 2: Modelado CAD e Inspección 3D IA',
            title_en: 'Level 2: 3D CAD Modeling & AI Inspection',
            deliverable_type: 'stl_3d',
            guide_es: 'Diseña el modelo en TinkerCAD y súbelo al visor para que Gemini Vision valide las medidas.',
            bunny_video_url: 'https://iframe.mediadelivery.net/embed/demo',
            max_x_mm: 50,
            max_y_mm: 50,
            max_z_mm: 15,
            fabcoins_cost: 20,
        },
        {
            level_number: 3,
            title_es: 'Nivel 3: Relieves y Optimización de Infill',
            title_en: 'Level 3: Reliefs & Infill Optimization',
            deliverable_type: 'stl_3d',
            guide_es: 'Agrega relieves escalonados y verifica el ahorro de FabCoins con la IA.',
            bunny_video_url: 'https://iframe.mediadelivery.net/embed/demo',
            max_x_mm: 50,
            max_y_mm: 50,
            max_z_mm: 15,
            fabcoins_cost: 25,
        },
        {
            level_number: 4,
            title_es: 'Nivel 4: Ensamblaje y Pruebas Físicas',
            title_en: 'Level 4: Physical Assembly & Testing',
            deliverable_type: 'checklist_assembly',
            guide_es: 'Retira la pieza de la cama, lija los bordes, realiza el ensamble y completa el checklist de calidad.',
            bunny_video_url: 'https://iframe.mediadelivery.net/embed/demo',
            max_x_mm: 50,
            max_y_mm: 50,
            max_z_mm: 15,
            fabcoins_cost: 0,
        }
    ],
});

const addLevel = () => {
    const nextNum = form.levels.length + 1;
    form.levels.push({
        level_number: nextNum,
        title_es: `Nivel ${nextNum}: Reto de Fabricación ${nextNum}`,
        title_en: `Level ${nextNum}: Fabrication Challenge ${nextNum}`,
        deliverable_type: 'stl_3d',
        guide_es: 'Describe la guía paso a paso para los estudiantes...',
        bunny_video_url: '',
        max_x_mm: 50,
        max_y_mm: 50,
        max_z_mm: 15,
        fabcoins_cost: 20,
    });
};

const removeLevel = (index) => {
    if (form.levels.length > 1) {
        form.levels.splice(index, 1);
        form.levels.forEach((lvl, idx) => {
            lvl.level_number = idx + 1;
        });
    }
};

const submitForm = () => {
    if (props.isEdit) {
        form.put(route('admin.projects.update', { project: props.project.id }));
    } else {
        form.post(route('admin.projects.store'));
    }
};
</script>

<template>
    <Head :title="isEdit ? 'Editar Curso Maker' : 'Nuevo Curso Maker'" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR -->
        <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
            <div class="max-w-5xl mx-auto flex items-center justify-between">
                <Link
                    :href="route('admin.projects.index')"
                    class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                    <ArrowLeft class="w-4 h-4" />
                    <span>Volver a Cursos</span>
                </Link>

                <h1 class="text-sm font-black text-white">
                    {{ isEdit ? `EDITAR CURSO: ${form.title_es}` : 'CREAR NUEVO CURSO / PROYECTO' }}
                </h1>

                <button
                    type="button"
                    @click="submitForm"
                    :disabled="form.processing"
                    class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                    <Save class="w-4 h-4" />
                    <span>{{ form.processing ? 'Guardando...' : 'GUARDAR PROYECTO' }}</span>
                </button>
            </div>
        </header>

        <!-- MAIN FORM -->
        <main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
            <form @submit.prevent="submitForm" class="space-y-8">
                
                <!-- SECCIÓN 1: DATOS GENERALES DEL PROYECTO -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h2 class="text-base font-black text-white flex items-center gap-2">
                        <Sparkles class="w-5 h-5 text-amber-400" />
                        <span>Información General del Curso</span>
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1.5">Título del Proyecto (Español) *</label>
                            <input
                                v-model="form.title_es"
                                type="text"
                                placeholder="Ej: Bio-joyería Amazónica en 3D"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1.5">Título en Inglés (Opcional)</label>
                            <input
                                v-model="form.title_en"
                                type="text"
                                placeholder="Ej: Amazonian Bio-jewelry 3D"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-300 mb-1.5">Descripción del Reto Pedagógico *</label>
                        <textarea
                            v-model="form.description_es"
                            rows="3"
                            placeholder="Explica a los estudiantes qué fabricarán a lo largo de este proyecto..."
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            required
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1.5">Tipo de Fabricación *</label>
                            <select
                                v-model="form.type"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-cyan-300 font-bold focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            >
                                <option value="3D">Impresión 3D (FDM / Resina)</option>
                                <option value="Laser">Corte y Grabado Láser (MDF / Acrílico)</option>
                                <option value="2.5D">Relieves 2.5D y Sellos</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 2: MALLA DE NIVELES DINÁMICOS -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-base font-black text-white flex items-center gap-2">
                                <Layers class="w-5 h-5 text-cyan-400" />
                                <span>Malla de Niveles Dinámicos ({{ form.levels.length }})</span>
                            </h2>
                            <p class="text-xs text-slate-400">Configura la secuencia de retos, el tipo de entregable, videos y costos.</p>
                        </div>

                        <button
                            type="button"
                            @click="addLevel"
                            class="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-black transition flex items-center gap-1.5"
                        >
                            <Plus class="w-3.5 h-3.5" />
                            <span>AGREGAR NIVEL</span>
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div
                            v-for="(lvl, index) in form.levels"
                            :key="index"
                            class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 relative"
                        >
                            <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                                <div class="flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
                                        {{ index + 1 }}
                                    </span>
                                    <span class="font-bold text-xs text-white">Nivel {{ index + 1 }}</span>
                                </div>

                                <button
                                    v-if="form.levels.length > 1"
                                    type="button"
                                    @click="removeLevel(index)"
                                    class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition text-xs"
                                    title="Eliminar este nivel"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-400 mb-1">Título del Nivel *</label>
                                    <input
                                        v-model="lvl.title_es"
                                        type="text"
                                        class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label class="block text-[11px] font-bold text-amber-300 mb-1">Tipo de Reto / Entregable *</label>
                                    <select
                                        v-model="lvl.deliverable_type"
                                        class="w-full bg-slate-900 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-300 font-bold focus:outline-none"
                                    >
                                        <option value="stl_3d">🧊 Impresión 3D (Visor Three.js + Gemini Vision)</option>
                                        <option value="photo_sketch">🎨 Boceto / Ideación (Foto de Cuaderno / Canvas)</option>
                                        <option value="svg_laser">✂️ Corte Láser 2D (Inspección SVG Vectorial)</option>
                                        <option value="checklist_assembly">🔌 Ensamblaje y Pruebas Físicas (Checklist)</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-[11px] font-bold text-slate-400 mb-1">URL Video Tutorial (Bunny Stream)</label>
                                    <input
                                        v-model="lvl.bunny_video_url"
                                        type="text"
                                        placeholder="https://iframe.mediadelivery.net/embed/..."
                                        class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-mono focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="block text-[11px] font-bold text-slate-400 mb-1">Guía del Reto / Instrucciones *</label>
                                <textarea
                                    v-model="lvl.guide_es"
                                    rows="2"
                                    class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                                    required
                                ></textarea>
                            </div>

                            <!-- Tolerancias y Costo FabCoins -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-400 mb-1">Máx Ancho X (mm)</label>
                                    <input
                                        v-model.number="lvl.max_x_mm"
                                        type="number"
                                        class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-cyan-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-400 mb-1">Máx Largo Y (mm)</label>
                                    <input
                                        v-model.number="lvl.max_y_mm"
                                        type="number"
                                        class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-cyan-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-400 mb-1">Máx Altura Z (mm)</label>
                                    <input
                                        v-model.number="lvl.max_z_mm"
                                        type="number"
                                        class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-cyan-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-amber-400 mb-1">Costo FabCoins (FC)</label>
                                    <input
                                        v-model.number="lvl.fabcoins_cost"
                                        type="number"
                                        placeholder="0 para bocetos/ensamble"
                                        class="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-1.5 text-xs text-amber-300 font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </main>
    </div>
</template>
