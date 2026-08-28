<script setup>
import { Head, Link } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import {
    Sparkles, ArrowLeft, Bot, Play, CheckCircle2, XCircle,
    Sliders, Cpu, FileText, Code2, Clock, Zap, RefreshCw, Upload, Eye,
    AlertCircle, Layers, Check
} from 'lucide-vue-next';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import axios from 'axios';

const props = defineProps({
    projects: {
        type: Array,
        default: () => [],
    },
});

// Parámetros de Calibración
const selectedProject = ref(props.projects?.[0]?.id || '');
const selectedLevel = ref('');
const maxX = ref(60);
const maxY = ref(60);
const maxZ = ref(10);
const minWall = ref(2.0);

const customPrompt = ref(
    props.projects?.[0]?.gemini_prompt_context ||
    'Eres el Mentor Copiloto IA de Makerdu especializado en Fabricación Digital 2.5D. Audita la geometría, el cierre de contornos, el espesor de pared y la imprimibilidad física con tono constructivo y amigable para el estudiante.'
);

// Archivo y Test
const selectedFile = ref(null);
const filePreview = ref(null);
const fileName = ref('');
const isRunning = ref(false);
const analysisResult = ref(null);
const latency = ref(null);
const rawJsonOpen = ref(false);

const activeProject = computed(() => {
    return props.projects.find(p => p.id === selectedProject.value);
});

const onProjectChange = () => {
    const proj = activeProject.value;
    if (proj) {
        if (proj.gemini_prompt_context) {
            customPrompt.value = proj.gemini_prompt_context;
        }
        if (proj.levels && proj.levels.length > 0) {
            selectedLevel.value = proj.levels[0].id;
            onLevelChange();
        }
    }
};

const onLevelChange = () => {
    const proj = activeProject.value;
    const lvl = proj?.levels?.find(l => l.id === selectedLevel.value);
    if (lvl && lvl.validation_rules) {
        maxX.value = lvl.validation_rules.max_dim_mm || lvl.validation_rules.max_x_mm || 60;
        maxY.value = lvl.validation_rules.max_dim_mm || lvl.validation_rules.max_y_mm || 60;
        maxZ.value = lvl.validation_rules.max_z_mm || 10;
        minWall.value = lvl.validation_rules.min_thickness_mm || lvl.validation_rules.min_wall_thickness_mm || 2.0;
    }
};

const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile.value = file;
    fileName.value = file.name;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
            filePreview.value = re.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        filePreview.value = null;
    }
};

const executeAiTest = async () => {
    isRunning.value = true;
    analysisResult.value = null;

    try {
        const formData = new FormData();
        if (selectedFile.value) {
            formData.append('file', selectedFile.value);
        }
        formData.append('max_x_mm', maxX.value);
        formData.append('max_y_mm', maxY.value);
        formData.append('max_z_mm', maxZ.value);
        formData.append('min_wall_thickness_mm', minWall.value);
        formData.append('custom_system_prompt', customPrompt.value);

        const response = await axios.post(route('admin.ai-sandbox.test'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.success) {
            analysisResult.value = response.data.analysis;
            latency.value = response.data.latency_ms;
        }
    } catch (err) {
        console.error(err);
        alert('Error al ejecutar la prueba de IA con Gemini Vision.');
    } finally {
        isRunning.value = false;
    }
};
</script>

<template>
    <AdminLayout>
        <Head title="Sandbox Copiloto IA Gemini · Makerdu SuperAdmin" />

        <!-- HEADER SECTION -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold border border-purple-500/20">
                        AUDITORÍA VISUAL MULTIMODAL
                    </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Laboratorio de Calibración Gemini IA</span>
                    <span class="text-xs px-2 py-0.5 rounded-xl bg-slate-800 text-purple-400 font-mono font-normal">
                        Gemini 2.0 Flash Vision
                    </span>
                </h1>
                <p class="text-xs text-slate-400 mt-1">
                    Prueba y afina el comportamiento del mentor inteligente con fotos de bocetos, capturas o archivos STL reales.
                </p>
            </div>

            <div class="flex items-center gap-3">
                <Link
                    :href="route('admin.techniques.index')"
                    class="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-2"
                >
                    <Layers class="w-4 h-4 text-cyan-400" />
                    <span>Ver Técnicas STEAM</span>
                </Link>
            </div>
        </div>

        <!-- GRID DE 2 COLUMNAS: CONFIGURACIÓN vs. RESPUESTA DE LA IA -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- COLUMNA IZQUIERDA: CONTROLES DE CALIBRACIÓN (5 COLS) -->
            <div class="lg:col-span-5 space-y-6">
                
                <!-- SELECTOR DE TÉCNICA MAESTRA Y MISIÓN -->
                <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h2 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Sliders class="w-4 h-4 text-cyan-400" />
                        <span>1. Seleccionar Técnica & Misión a Probar</span>
                    </h2>

                    <div class="grid grid-cols-1 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Técnica STEAM:</label>
                            <select
                                v-model="selectedProject"
                                @change="onProjectChange"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:ring-2 focus:ring-cyan-500"
                            >
                                <option v-for="p in projects" :key="p.id" :value="p.id">
                                    {{ p.title }} ({{ p.type }})
                                </option>
                            </select>
                        </div>

                        <div v-if="activeProject?.levels?.length > 0">
                            <label class="block text-[11px] font-bold text-slate-400 mb-1">Misión del Reto:</label>
                            <select
                                v-model="selectedLevel"
                                @change="onLevelChange"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            >
                                <option v-for="lvl in activeProject.levels" :key="lvl.id" :value="lvl.id">
                                    Misión {{ lvl.level_number }}: {{ lvl.title }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- CARGA DE ARCHIVO DE PRUEBA (FOTO / STL / SVG) -->
                <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h2 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Upload class="w-4 h-4 text-purple-400" />
                        <span>2. Archivo o Foto de Prueba</span>
                    </h2>

                    <div class="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 text-center bg-slate-950 transition cursor-pointer relative">
                        <input
                            type="file"
                            @change="handleFileUpload"
                            accept=".stl,.svg,.jpg,.jpeg,.png,.webp"
                            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div v-if="!fileName" class="space-y-2">
                            <Upload class="w-6 h-6 text-purple-400 mx-auto" />
                            <p class="text-xs font-bold text-slate-300">Arrastra una foto de boceto o archivo STL/SVG</p>
                            <p class="text-[10px] text-slate-500 font-mono">Formatos: JPG, PNG, WEBP, STL, SVG</p>
                        </div>
                        <div v-else class="space-y-2">
                            <div v-if="filePreview" class="max-h-32 mx-auto rounded-xl overflow-hidden border border-slate-800 inline-block">
                                <img :src="filePreview" class="max-h-32 object-contain" />
                            </div>
                            <p class="text-xs font-mono font-bold text-cyan-300 truncate">{{ fileName }}</p>
                            <p class="text-[10px] text-slate-400">Haz clic para cambiar de archivo</p>
                        </div>
                    </div>
                </div>

                <!-- PROMPT DE CAPA 2 (ESPECÍFICO DE LA TÉCNICA) -->
                <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Cpu class="w-4 h-4 text-purple-400" />
                            <span>3. Prompt de Mentoría (Capa 2)</span>
                        </h2>
                        <span class="text-[10px] font-mono text-slate-500">Editable en vivo</span>
                    </div>

                    <textarea
                        v-model="customPrompt"
                        rows="4"
                        class="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-purple-200 font-mono leading-relaxed focus:ring-2 focus:ring-purple-500"
                    ></textarea>

                    <button
                        type="button"
                        @click="executeAiTest"
                        :disabled="isRunning"
                        class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw v-if="isRunning" class="w-4 h-4 animate-spin" />
                        <Sparkles v-else class="w-4 h-4" />
                        <span>{{ isRunning ? 'ANALIZANDO CON GEMINI VISION...' : 'EJECUTAR PRUEBA CON GEMINI' }}</span>
                    </button>
                </div>
            </div>

            <!-- COLUMNA DERECHA: RESPUESTA DE LA IA EN TIEMPO REAL (7 COLS) -->
            <div class="lg:col-span-7 space-y-6">
                
                <!-- ESTADO INICIAL -->
                <div 
                    v-if="!analysisResult && !isRunning" 
                    class="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3"
                >
                    <div class="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-3xl mx-auto border border-purple-500/20">
                        🤖
                    </div>
                    <h3 class="text-sm font-black text-white">Consola de Evaluación en Espera</h3>
                    <p class="text-xs text-slate-400 max-w-sm mx-auto">
                        Selecciona una técnica, adjunta una foto o archivo STL y haz clic en <strong>Ejecutar Prueba</strong> para ver la respuesta estructurada de Gemini.
                    </p>
                </div>

                <!-- CARGANDO ANÁLISIS -->
                <div 
                    v-else-if="isRunning" 
                    class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 animate-pulse"
                >
                    <Bot class="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
                    <h3 class="text-sm font-black text-white">Gemini 2.0 Flash Vision Analizando...</h3>
                    <p class="text-xs text-slate-400">Inspeccionando adherencia, geometría, proporciones y límites físicos...</p>
                </div>

                <!-- RESULTADO DE LA EVALUACIÓN (DASHBOARD ESTRUCTURADO) -->
                <div v-else-if="analysisResult" class="space-y-6 animate-fade-in">
                    
                    <!-- TARJETA PRINCIPAL DEL VEREDICTO -->
                    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
                        
                        <!-- Header con Estado y Latencia -->
                        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div class="flex items-center gap-2.5">
                                <span 
                                    class="px-3 py-1 rounded-full text-xs font-mono font-black border"
                                    :class="analysisResult.is_valid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'"
                                >
                                    {{ analysisResult.dashboard?.verdict_title || (analysisResult.is_valid ? '¡DISEÑO APROBADO!' : 'REQUIERE AJUSTES') }}
                                </span>
                            </div>

                            <div class="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                                <span class="flex items-center gap-1">
                                    <Clock class="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{{ latency }} ms</span>
                                </span>
                                <span class="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-purple-400">
                                    {{ analysisResult.dashboard?.model_used || 'gemini-2.0-flash' }}
                                </span>
                            </div>
                        </div>

                        <!-- Silueta / Headline Detectado -->
                        <div>
                            <span class="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Silueta & Geometría Detectada:
                            </span>
                            <h3 class="text-base font-black text-white">
                                {{ analysisResult.dashboard?.headline || 'Objeto 2.5D Analizado' }}
                            </h3>
                            <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                                {{ analysisResult.dashboard?.text_summary || analysisResult.ai_feedback }}
                            </p>
                        </div>

                        <!-- PUNTOS FUERTES DE LA GEOMETRÍA -->
                        <div v-if="analysisResult.dashboard?.strengths?.length > 0" class="space-y-2">
                            <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                                Puntos Fuertes Observados:
                            </span>
                            <div class="space-y-1.5">
                                <div 
                                    v-for="(st, sIdx) in analysisResult.dashboard.strengths" 
                                    :key="sIdx"
                                    class="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2"
                                >
                                    <Check class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>{{ st }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- RECOMENDACIÓN DE FABRICACIÓN / SLICING -->
                        <div v-if="analysisResult.dashboard?.slicing_recommendations" class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                            <span class="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                                Parámetros de Fabricación Recomendados:
                            </span>
                            <div class="grid grid-cols-3 gap-2 text-center text-xs">
                                <div class="bg-slate-900 p-2 rounded-xl border border-slate-800">
                                    <span class="text-[10px] text-slate-500 block">Boquilla / Nozzle:</span>
                                    <span class="font-bold text-white">{{ analysisResult.dashboard.slicing_recommendations.nozzle || '0.4 mm' }}</span>
                                </div>
                                <div class="bg-slate-900 p-2 rounded-xl border border-slate-800">
                                    <span class="text-[10px] text-slate-500 block">Altura de Capa:</span>
                                    <span class="font-bold text-white">{{ analysisResult.dashboard.slicing_recommendations.layer_height || '0.20 mm' }}</span>
                                </div>
                                <div class="bg-slate-900 p-2 rounded-xl border border-slate-800">
                                    <span class="text-[10px] text-slate-500 block">Relleno / Infill:</span>
                                    <span class="font-bold text-white">{{ analysisResult.dashboard.slicing_recommendations.infill || '15%' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- CONSEJO PEDAGÓGICO PARA EL ALUMNO -->
                        <div class="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
                            <Sparkles class="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                                <span class="font-bold block text-purple-300">Consejo Pedagógico del Mentor:</span>
                                <p class="text-[11px] text-purple-200/90 mt-0.5 leading-relaxed">
                                    {{ analysisResult.dashboard?.pedagogical_tip }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- BOTÓN PARA VER JSON CRUDO (DEBUGGER) -->
                    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <button
                            type="button"
                            @click="rawJsonOpen = !rawJsonOpen"
                            class="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                        >
                            <span>{{ rawJsonOpen ? '▼ Ocultar JSON Crudo de Gemini' : '▶ Inspeccionar JSON Crudo de Respuesta' }}</span>
                            <Code2 class="w-4 h-4 text-slate-500" />
                        </button>
                        <div v-if="rawJsonOpen" class="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] font-mono text-cyan-300">
                            <pre>{{ JSON.stringify(analysisResult, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>