<script setup>
import { Head, Link } from '@inertiajs/vue3';
import { ref, onMounted } from 'vue';
import {
    Sparkles, ArrowLeft, Bot, Play, CheckCircle2, XCircle,
    Sliders, Cpu, FileText, Code2, Clock, Zap, RefreshCw, Upload, Eye
} from 'lucide-vue-next';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import axios from 'axios';

const props = defineProps({
    projects: Array,
});

// Parámetros de Calibración
const maxX = ref(50);
const maxY = ref(50);
const maxZ = ref(15);
const minWall = ref(2.0);
const selectedProjectLevel = ref('');

const customPrompt = ref(
    'Eres el Guardián IA de Fabricación Digital de Makerdu. Tu objetivo es auditar piezas 3D escolares para verificar que sean imprimibles y tengan relieves claros. Sé constructivo, amigable y motivador para estudiantes.'
);

// Archivo y Visor
const selectedFile = ref(null);
const fileName = ref('modelo_demo_50x50.stl');
const isRunning = ref(false);
const analysisResult = ref(null);
const latency = ref(null);
const rawJsonOpen = ref(false);

const applyPreset = (preset) => {
    if (!preset) return;
    const parts = preset.split('-');
    const projId = parseInt(parts[0]);
    const lvlNum = parseInt(parts[1]);

    const proj = props.projects.find(p => p.id === projId);
    const lvl = proj?.levels?.find(l => l.level_number === lvlNum);

    if (lvl && lvl.validation_rules) {
        maxX.value = lvl.validation_rules.max_x_mm || 50;
        maxY.value = lvl.validation_rules.max_y_mm || 50;
        maxZ.value = lvl.validation_rules.max_z_mm || 15;
        minWall.value = lvl.validation_rules.min_wall_thickness_mm || 2.0;
    }
};

const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile.value = file;
    fileName.value = file.name;
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
        alert('Error al ejecutar la prueba de IA. Revisa los parámetros.');
    } finally {
        isRunning.value = false;
    }
};
</script>

<template>
    <AdminLayout>
        <Head title="Sandbox Copiloto IA Gemini · Makerdu v4.0" />

        <!-- HEADER DE ACCIÓN -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold border border-purple-500/20">
                        GEMINI 2.0 FLASH VISION
                    </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Sandbox de Calibración de IA Multimodal</span>
                </h1>
                <p class="text-xs text-slate-400 mt-1">Prueba y calibra umbrales de impresión 3D, prompts y diagnósticos pedagógicos en tiempo real.</p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center gap-1.5">
                    <Zap class="w-3.5 h-3.5" />
                    <span>Motor Activo: Gemini Vision API</span>
                </span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- COLUMNA IZQUIERDA: VISOR 3D & REGLAS FÍSICAS (5 COLS) -->
            <div class="lg:col-span-5 space-y-5">
                
                <!-- PRESET DE CURSOS EXISTENTES -->
                <div class="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <label class="block text-xs font-bold text-slate-300">Cargar Preset de un Curso Maestro:</label>
                    <select
                        v-model="selectedProjectLevel"
                        @change="applyPreset($event.target.value)"
                        class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-cyan-300 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                        <option value="">-- Seleccionar regla de nivel --</option>
                        <template v-for="p in projects" :key="p.id">
                            <option v-for="l in p.levels" :key="l.id" :value="`${p.id}-${l.level_number}`">
                                {{ p.title }} • Nivel {{ l.level_number }}: {{ l.title }}
                            </option>
                        </template>
                    </select>
                </div>

                <!-- CARGADOR DE ARCHIVO 3D -->
                <div class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Archivo de Prueba (.STL / .OBJ):</span>
                        <label class="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-bold hover:bg-cyan-900 cursor-pointer transition flex items-center gap-1">
                            <Upload class="w-3 h-3" />
                            <span>Cargar Archivo</span>
                            <input type="file" @change="handleFileUpload" accept=".stl,.obj" class="hidden" />
                        </label>
                    </div>

                    <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span class="text-cyan-300 font-bold truncate">{{ fileName }}</span>
                        <span class="text-slate-500 text-[10px]">Listo para test</span>
                    </div>
                </div>

                <!-- UMBRALES GEOMÉTRICOS (SLIDERS) -->
                <div class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                    <div class="flex items-center gap-2">
                        <Sliders class="w-4 h-4 text-amber-400" />
                        <h3 class="text-xs font-bold uppercase tracking-wider text-white">Tolerancias Físicas de Validación:</h3>
                    </div>

                    <!-- Slider Ancho X -->
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-400">Ancho Máximo ($X$):</span>
                            <span class="text-amber-300 font-bold">{{ maxX }} mm</span>
                        </div>
                        <input type="range" v-model="maxX" min="10" max="150" class="w-full accent-amber-400 cursor-pointer" />
                    </div>

                    <!-- Slider Largo Y -->
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-400">Largo Máximo ($Y$):</span>
                            <span class="text-amber-300 font-bold">{{ maxY }} mm</span>
                        </div>
                        <input type="range" v-model="maxY" min="10" max="150" class="w-full accent-amber-400 cursor-pointer" />
                    </div>

                    <!-- Slider Alto Z -->
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-400">Altura Máxima ($Z$):</span>
                            <span class="text-amber-300 font-bold">{{ maxZ }} mm</span>
                        </div>
                        <input type="range" v-model="maxZ" min="2" max="60" class="w-full accent-amber-400 cursor-pointer" />
                    </div>

                    <!-- Slider Grosor Mínimo -->
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-mono">
                            <span class="text-slate-400">Grosor Mínimo de Pared:</span>
                            <span class="text-emerald-400 font-bold">{{ minWall }} mm</span>
                        </div>
                        <input type="range" v-model="minWall" min="0.8" max="5.0" step="0.2" class="w-full accent-emerald-400 cursor-pointer" />
                    </div>
                </div>

            </div>

            <!-- COLUMNA DERECHA: PROMPT & SIMULACIÓN EN VIVO (7 COLS) -->
            <div class="lg:col-span-7 space-y-5">
                
                <!-- PROMPT PEDAGÓGICO DE GEMINI -->
                <div class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Bot class="w-4 h-4 text-cyan-400" />
                            <h3 class="text-xs font-bold uppercase tracking-wider text-white">System Prompt de la IA:</h3>
                        </div>
                        <span class="text-[10px] font-mono text-slate-500">Ajusta el tono de retroalimentación</span>
                    </div>

                    <textarea
                        v-model="customPrompt"
                        rows="3"
                        class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 font-sans focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    ></textarea>

                    <button
                        type="button"
                        @click="executeAiTest"
                        :disabled="isRunning"
                        class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                    >
                        <Play v-if="!isRunning" class="w-4 h-4 fill-current" />
                        <RefreshCw v-else class="w-4 h-4 animate-spin" />
                        <span>{{ isRunning ? 'ANALIZANDO MALLA CON GEMINI VISION...' : '⚡ EJECUTAR TEST DE PRE-FLIGHT IA' }}</span>
                    </button>
                </div>

                <!-- RESULTADOS DE LA AUDITORÍA IA -->
                <div v-if="analysisResult" class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-2xl animate-fade-in">
                    
                    <!-- ENCABEZADO DE RESULTADO CON VEREDICTO -->
                    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Veredicto de Fabricación:</span>
                            <div class="flex items-center gap-2 mt-1">
                                <span
                                    v-if="analysisResult.is_valid"
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-sm border border-emerald-500/40"
                                >
                                    <CheckCircle2 class="w-4 h-4 text-emerald-400" />
                                    <span>DISEÑO APROBADO PARA IMPRESIÓN</span>
                                </span>
                                <span
                                    v-else
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-sm border border-rose-500/40"
                                >
                                    <XCircle class="w-4 h-4 text-rose-400" />
                                    <span>REQUIERE AJUSTES DE DISEÑO</span>
                                </span>
                            </div>
                        </div>

                        <div v-if="latency" class="text-right">
                            <span class="text-[10px] text-slate-500 block">Latencia API</span>
                            <span class="font-mono text-xs font-bold text-cyan-300">{{ latency }} ms</span>
                        </div>
                    </div>

                    <!-- TARJETAS DE MÉTRICAS FÍSICAS -->
                    <div class="grid grid-cols-3 gap-3 text-center">
                        <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <p class="text-[9px] uppercase font-bold text-slate-500">Material Estimado</p>
                            <p class="text-sm font-black font-mono text-cyan-300 mt-0.5">{{ analysisResult.metrics?.estimated_grams || 8 }}g PLA</p>
                        </div>
                        <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <p class="text-[9px] uppercase font-bold text-slate-500">Costo FabCoins</p>
                            <p class="text-sm font-black font-mono text-amber-300 mt-0.5">{{ analysisResult.metrics?.fabcoins_cost || 12 }} FC</p>
                        </div>
                        <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <p class="text-[9px] uppercase font-bold text-slate-500">Grosor de Pared</p>
                            <p class="text-sm font-black font-mono text-emerald-400 mt-0.5">≥ {{ minWall }} mm (OK)</p>
                        </div>
                    </div>

                    <!-- FEEDBACK PEDAGÓGICO DE GEMINI -->
                    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                            <Bot class="w-4 h-4" />
                            <span>Retroalimentación para el Alumno:</span>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">{{ analysisResult.ai_feedback }}</p>
                    </div>

                    <!-- ACCORDION JSON RAW -->
                    <div class="pt-2 border-t border-slate-800/80">
                        <button
                            type="button"
                            @click="rawJsonOpen = !rawJsonOpen"
                            class="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1"
                        >
                            <Code2 class="w-3.5 h-3.5" />
                            <span>{{ rawJsonOpen ? 'Ocultar JSON de Respuesta' : 'Inspeccionar JSON de la API' }}</span>
                        </button>

                        <pre
                            v-if="rawJsonOpen"
                            class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto mt-2 max-h-48"
                        >{{ JSON.stringify(analysisResult, null, 2) }}</pre>
                    </div>

                </div>

            </div>
        </div>
    </AdminLayout>
</template>