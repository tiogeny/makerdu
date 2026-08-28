<script setup>
import { ref } from 'vue';
import { Head, Link, useForm } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { 
    Layers, 
    Plus, 
    Trash2, 
    ArrowLeft, 
    Sparkles, 
    Cpu, 
    Box, 
    Video, 
    FileText, 
    CheckCircle2, 
    Save, 
    Eye, 
    ArrowRight,
    HelpCircle
} from 'lucide-vue-next';

const props = defineProps({
    technique: {
        type: Object,
        default: null,
    },
    microApps: {
        type: Array,
        default: () => [],
    },
});

const isEditing = !!props.technique;
const activeTab = ref('general'); // 'general', 'missions', 'gemini', 'preview'

const availableCompetencies = [
    'Arte y Creatividad Digital',
    'Pensamiento Geométrico y Escala',
    'Educación para el Trabajo / Prototipado',
    'Pensamiento Computacional & Lógica',
    'Emprendimiento & Diseño de Producto',
    'Ciencia y Materiales STEAM',
];

const form = useForm({
    title_es: props.technique?.title_es || 'Fabricación 2.5D: Del Dibujo al Art Toy & Relieves',
    title_en: props.technique?.title_en || '2.5D Digital Fabrication: From Sketch to Art Toy',
    description_es: props.technique?.description_es || 'Transforma bocetos en papel a personajes 3D coleccionables mediante vectorización Bézier y extrusión física milimétrica.',
    description_en: props.technique?.description_en || 'Transform sketches into 3D art toys with Bézier vectorization and millimeter physical extrusion.',
    type: props.technique?.type || '2.5D',
    competencies: props.technique?.competencies || ['Arte y Creatividad Digital', 'Pensamiento Geométrico y Escala', 'Educación para el Trabajo / Prototipado'],
    animation_preset: props.technique?.animation_preset || 'art-toy-loop',
    recommended_age: props.technique?.recommended_age || '8-16 años',
    gemini_prompt_context: props.technique?.gemini_prompt_context || 'Eres el Mentor de Fabricación 2.5D de Makerdu. Tu objetivo es verificar que los bocetos tengan líneas cerradas y que los modelos 3D cumplan con al menos 2.0 mm de grosor de pared.',
    missions: props.technique?.missions || [
        {
            title_es: 'Misión 1: Del Papel a la Idea — Bocetado del Art Toy',
            title_en: 'Mission 1: From Sketch to Idea — Art Toy Concept',
            guide_es: 'Dibuja en papel bond la silueta de tu personaje con plumón negro grueso respetando 60x60mm.',
            video_url: 'https://iframe.mediadelivery.net/embed/demo',
            micro_app_slug: null,
            process_instructions: 'Trabajo manual de dibujo y captura de fotografía nítida.',
            deliverable_type: 'photo_sketch',
            max_dim_mm: 60,
            min_thickness_mm: 2.0,
            xp_reward: 30,
            fabcoins_cost: 0,
        },
        {
            title_es: 'Misión 2: Digitalización Vectorial — Nodos y Curvas Limpias',
            title_en: 'Mission 2: Vector Digitization — Nodes & Clean Curves',
            guide_es: 'Convierte tu boceto a vectores limpios SVG cerrando todos los nodos.',
            video_url: '',
            micro_app_slug: 'vectorizer',
            process_instructions: 'Usa la micro-app Vectorizer para escanear y generar curvas Bézier.',
            deliverable_type: 'svg_laser',
            max_dim_mm: 60,
            min_thickness_mm: 2.0,
            xp_reward: 50,
            fabcoins_cost: 0,
        },
        {
            title_es: 'Misión 3: Volumen 3D — Extrusión y Accesorios (Llavero / Base)',
            title_en: 'Mission 3: 3D Volume — Extrusion & Accessories',
            guide_es: 'Extruye tu personaje a 4mm de grosor y añade un ojal de llavero o base.',
            video_url: '',
            micro_app_slug: 'block-cad',
            process_instructions: 'Usa Block CAD para unir el relieve con el ojal de llavero.',
            deliverable_type: 'stl_3d',
            max_dim_mm: 60,
            min_thickness_mm: 2.5,
            xp_reward: 60,
            fabcoins_cost: 15,
        },
        {
            title_es: 'Misión 4: Ensamble, Acabado Físico y Bitácora Final',
            title_en: 'Mission 4: Assembly, Physical Finish & Final Report',
            guide_es: 'Retira soportes, ensambla la anilla de llavero y toma la foto final del producto fabricado.',
            video_url: '',
            micro_app_slug: null,
            process_instructions: 'Fabricación física en impresora 3D o láser y control de calidad.',
            deliverable_type: 'photo_assembly',
            max_dim_mm: 60,
            min_thickness_mm: 2.0,
            xp_reward: 100,
            fabcoins_cost: 0,
        },
    ],
});

const toggleCompetency = (comp) => {
    if (form.competencies.includes(comp)) {
        form.competencies = form.competencies.filter(c => c !== comp);
    } else {
        form.competencies.push(comp);
    }
};

const addMission = () => {
    form.missions.push({
        title_es: `Misión ${form.missions.length + 1}: Nueva Misión`,
        title_en: `Mission ${form.missions.length + 1}: New Mission`,
        guide_es: '',
        video_url: '',
        micro_app_slug: null,
        process_instructions: '',
        deliverable_type: 'stl_3d',
        max_dim_mm: 60,
        min_thickness_mm: 2.0,
        xp_reward: 50,
        fabcoins_cost: 0,
    });
};

const removeMission = (index) => {
    if (form.missions.length > 1) {
        form.missions.splice(index, 1);
    }
};

const submit = () => {
    if (isEditing) {
        form.put(route('admin.techniques.update', props.technique.id));
    } else {
        form.post(route('admin.techniques.store'));
    }
};
</script>

<template>
    <AdminLayout>
        <Head :title="isEditing ? 'Editar Técnica STEAM' : 'Crear Técnica STEAM Maestra'" />

        <!-- TOP ACTIONS BAR -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
                <Link
                    :href="route('admin.techniques.index')"
                    class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft class="w-4 h-4" />
                </Link>
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {{ isEditing ? 'Editar Técnica Maestra' : 'Diseñador de Técnica STEAM Maestra' }}
                    </h1>
                    <p class="text-xs text-slate-400">
                        Matriz modular de fabricación con misiones IPO y contexto de mentoría para Gemini.
                    </p>
                </div>
            </div>

            <button
                type="button"
                @click="submit"
                :disabled="form.processing"
                class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
                <Save class="w-4 h-4" />
                <span>{{ form.processing ? 'GUARDANDO...' : 'GUARDAR TÉCNICA MAESTRA' }}</span>
            </button>
        </div>

        <!-- TABS DE NAVEGACIÓN -->
        <div class="flex items-center gap-2 border-b border-slate-800 mb-6 overflow-x-auto pb-2">
            <button
                type="button"
                @click="activeTab = 'general'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2',
                    activeTab === 'general' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Layers class="w-4 h-4" />
                <span>1. Ficha & Competencias</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'missions'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2',
                    activeTab === 'missions' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Box class="w-4 h-4" />
                <span>2. Misiones IPO ({{ form.missions.length }})</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'gemini'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2',
                    activeTab === 'gemini' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Cpu class="w-4 h-4" />
                <span>3. Copiloto Gemini (3 Capas)</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'preview'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2',
                    activeTab === 'preview' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Eye class="w-4 h-4" />
                <span>4. Previsualización</span>
            </button>
        </div>

        <!-- FORMULARIO POR PESTAÑAS -->
        <form @submit.prevent="submit" class="space-y-6">

            <!-- PESTAÑA 1: FICHA & COMPETENCIAS -->
            <div v-show="activeTab === 'general'" class="space-y-6 animate-fade-in">
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🏷️ Datos Principales de la Técnica</span>
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Nombre de la Técnica (Español):</label>
                            <input
                                v-model="form.title_es"
                                type="text"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Nombre en Inglés (Opcional):</label>
                            <input
                                v-model="form.title_en"
                                type="text"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Descripción (Español):</label>
                            <textarea
                                v-model="form.description_es"
                                rows="3"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                                required
                            ></textarea>
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Descripción (Inglés):</label>
                            <textarea
                                v-model="form.description_en"
                                rows="3"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            ></textarea>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Tipo de Tecnología:</label>
                            <select
                                v-model="form.type"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="2.5D">Fabricación 2.5D (Relieves / Extrusión)</option>
                                <option value="3D">Impresión 3D Volumétrica</option>
                                <option value="Laser">Corte Láser & Encastres</option>
                            </select>
                        </div>

                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Edad Sugerida:</label>
                            <input
                                v-model="form.recommended_age"
                                type="text"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Animación Demostrativa:</label>
                            <select
                                v-model="form.animation_preset"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="art-toy-loop">🧸 Art Toy Extrusión Loop</option>
                                <option value="stamp-press-loop">🔤 Sello & Estampado Loop</option>
                                <option value="box-joint-loop">📦 Caja Finger-Joint Loop</option>
                                <option value="gear-mesh-loop">⚙️ Engranajes Cinemáticos</option>
                                <option value="lamp-waffle-loop">💡 Lámpara Waffle Grid</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SELECTOR DE COMPETENCIAS CURRICULARES -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                    <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🎯 Competencias Curriculares Asociadas</span>
                    </h2>
                    <p class="text-xs text-slate-400">
                        Selecciona las competencias que el docente podrá evaluar automáticamente al usar esta técnica.
                    </p>

                    <div class="flex flex-wrap gap-2 pt-2">
                        <button
                            v-for="comp in availableCompetencies"
                            :key="comp"
                            type="button"
                            @click="toggleCompetency(comp)"
                            :class="[
                                'px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border',
                                form.competencies.includes(comp)
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            ]"
                        >
                            <CheckCircle2 v-if="form.competencies.includes(comp)" class="w-3.5 h-3.5 text-cyan-400" />
                            <span>{{ comp }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 2: MISIONES MODULARES IPO -->
            <div v-show="activeTab === 'missions'" class="space-y-4 animate-fade-in">
                <div class="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <div>
                        <h2 class="text-sm font-black text-white">Ruta de Misiones (Input ➔ Process ➔ Output)</h2>
                        <p class="text-xs text-slate-400">Define los pasos secuenciales que recorrerán los estudiantes.</p>
                    </div>
                    <button
                        type="button"
                        @click="addMission"
                        class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5"
                    >
                        <Plus class="w-4 h-4" />
                        <span>AÑADIR MISIÓN</span>
                    </button>
                </div>

                <!-- LISTA DE MISIONES IPO -->
                <div 
                    v-for="(mission, index) in form.missions" 
                    :key="index"
                    class="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative"
                >
                    <!-- Header Misión -->
                    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-black text-xs flex items-center justify-center">
                                {{ index + 1 }}
                            </span>
                            <input
                                v-model="mission.title_es"
                                type="text"
                                placeholder="Título de la Misión"
                                class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold min-w-[280px]"
                                required
                            />
                        </div>

                        <div class="flex items-center gap-3">
                            <div class="flex items-center gap-1 text-[11px] text-amber-400 font-bold font-mono">
                                <span>⚡ Sparks:</span>
                                <input
                                    v-model.number="mission.xp_reward"
                                    type="number"
                                    class="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1 text-center text-xs text-amber-300"
                                />
                            </div>

                            <button
                                type="button"
                                @click="removeMission(index)"
                                class="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                title="Eliminar Misión"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- ESTRUCTURA IPO: 3 COLUMNAS -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                        
                        <!-- 1. INPUT (RECURSOS) -->
                        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                            <span class="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                                <span>📥 1. INPUT (Recursos)</span>
                            </span>
                            
                            <div class="space-y-1">
                                <label class="text-[10px] text-slate-400 font-bold">Guía / Instrucción Inicial:</label>
                                <textarea
                                    v-model="mission.guide_es"
                                    rows="2"
                                    placeholder="Qué debe leer o hacer el alumno antes..."
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
                                ></textarea>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] text-slate-400 font-bold">Video Bunny/YouTube URL:</label>
                                <input
                                    v-model="mission.video_url"
                                    type="text"
                                    placeholder="https://..."
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                                />
                            </div>
                        </div>

                        <!-- 2. PROCESS (MICRO-APP ASIGNADA) -->
                        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                            <span class="text-xs font-black text-blue-400 flex items-center gap-1.5">
                                <span>⚙️ 2. PROCESS (Herramienta)</span>
                            </span>

                            <div class="space-y-1">
                                <label class="text-[10px] text-slate-400 font-bold">Micro-App Embebida:</label>
                                <select
                                    v-model="mission.micro_app_slug"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-cyan-300 font-bold"
                                >
                                    <option :value="null">-- Ninguna (Trabajo Manual / Taller) --</option>
                                    <option v-for="app in microApps" :key="app.slug" :value="app.slug">
                                        {{ app.icon }} {{ app.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] text-slate-400 font-bold">Instrucción Técnica:</label>
                                <textarea
                                    v-model="mission.process_instructions"
                                    rows="2"
                                    placeholder="Cómo usar la app o fabricar la pieza..."
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
                                ></textarea>
                            </div>
                        </div>

                        <!-- 3. OUTPUT (ENTREGABLE & VALIDACIÓN) -->
                        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                            <span class="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                <span>📤 3. OUTPUT (Entregable)</span>
                            </span>

                            <div class="space-y-1">
                                <label class="text-[10px] text-slate-400 font-bold">Tipo de Archivo / Evidencia:</label>
                                <select
                                    v-model="mission.deliverable_type"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-emerald-300 font-bold"
                                >
                                    <option value="photo_sketch">📸 Foto de Boceto en Papel</option>
                                    <option value="svg_laser">📐 Archivo Vectorial SVG Láser</option>
                                    <option value="stl_3d">🧊 Archivo STL 3D Binario</option>
                                    <option value="photo_assembly">🛠️ Foto de Ensamble y Pieza Final</option>
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label class="text-[10px] text-slate-400">Máx Dim (mm):</label>
                                    <input
                                        v-model.number="mission.max_dim_mm"
                                        type="number"
                                        class="w-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label class="text-[10px] text-slate-400">FabCoins (FC):</label>
                                    <input
                                        v-model.number="mission.fabcoins_cost"
                                        type="number"
                                        class="w-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs text-amber-400 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 3: CONTEXTO GEMINI COPILOT -->
            <div v-show="activeTab === 'gemini'" class="space-y-6 animate-fade-in">
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                            🤖
                        </span>
                        <div>
                            <h2 class="text-sm font-black text-white uppercase tracking-wider">
                                Contexto de Inteligencia Artificial (Gemini 2.0 Flash)
                            </h2>
                            <p class="text-xs text-slate-400">
                                Enseña a Gemini los criterios técnicos y tono pedagógico para evaluar esta técnica.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-bold text-slate-300">
                            🎯 Instrucciones y Prompt del Mentor para esta Técnica:
                        </label>
                        <textarea
                            v-model="form.gemini_prompt_context"
                            rows="6"
                            placeholder="Describe qué debe buscar Gemini al analizar los bocetos y modelos STL..."
                            class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-purple-200 font-mono leading-relaxed focus:ring-2 focus:ring-purple-500"
                        ></textarea>
                    </div>

                    <div class="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-start gap-2.5">
                        <Sparkles class="w-5 h-5 shrink-0 mt-0.5 text-purple-400" />
                        <div>
                            <span class="font-bold">Estructura en 3 Capas Activa:</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">
                                Este prompt se fusionará automáticamente con la identidad de Makerdu y el reto que el profesor configure en su aula.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 4: PREVISUALIZACIÓN DE LA TARJETA -->
            <div v-show="activeTab === 'preview'" class="space-y-6 animate-fade-in">
                <div class="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                            {{ form.type }}
                        </span>
                        <span class="text-[10px] font-mono text-slate-500 font-bold">
                            {{ form.recommended_age }}
                        </span>
                    </div>

                    <div class="h-32 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl animate-pulse">
                        <span v-if="form.type === '2.5D'">🧸</span>
                        <span v-else-if="form.type === 'Laser'">🪵</span>
                        <span v-else>🧊</span>
                    </div>

                    <div>
                        <h3 class="text-base font-black text-white">{{ form.title_es }}</h3>
                        <p class="text-xs text-slate-400 mt-1 line-clamp-3">{{ form.description_es }}</p>
                    </div>

                    <div class="flex flex-wrap gap-1.5 pt-2">
                        <span v-for="c in form.competencies" :key="c" class="text-[9px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                            {{ c }}
                        </span>
                    </div>

                    <div class="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-400">
                        <span>{{ form.missions.length }} Misiones IPO</span>
                        <button type="button" class="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950">
                            Elegir Técnica
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </AdminLayout>
</template>
