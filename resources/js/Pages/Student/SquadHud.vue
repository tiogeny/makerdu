<script setup>
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { ref, computed, watch } from 'vue';
import {
    Sparkles, Coins, Trophy, Users, ShieldCheck, Wrench, CheckCircle2,
    Clock, BookOpen, ExternalLink, Send, FileText, ChevronRight, LogOut,
    Check, AlertCircle, ArrowUpRight, Flame, Layers, Laptop, UploadCloud,
    Cpu, XCircle, Printer, Hammer, Gauge, Globe, Box
} from 'lucide-vue-next';
import StlViewer3D from '@/Components/StlViewer3D.vue';
import { t, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    squad: Object,
    activeStudent: Object,
    project: Object,
    bitacoras: Array,
    flash: Object,
});

const page = usePage();

// Nivel seleccionado actualmente
const selectedLevelId = ref(props.project.levels[0]?.id || null);

const selectedLevel = computed(() => {
    return props.project.levels.find((l) => l.id === selectedLevelId.value) || props.project.levels[0];
});

// Bitácoras filtradas para el nivel seleccionado
const currentLevelBitacoras = computed(() => {
    return props.bitacoras.filter((b) => b.level_id === selectedLevel.value?.id);
});

// Formulario para envío de bitácora tradicional
const bitacoraForm = useForm({
    content_text: '',
    file: null,
});

const submitBitacora = () => {
    if (!selectedLevel.value) return;
    bitacoraForm.post(route('squad.bitacora.submit', {
        squad: props.squad.id,
        level: selectedLevel.value.id,
    }), {
        preserveScroll: true,
        onSuccess: () => {
            bitacoraForm.reset();
        },
    });
};

// Formulario de Pre-flight Check con IA
const preflightForm = useForm({
    level_id: null,
    file: null,
});

const preflightResult = ref(props.flash?.preflight_result || null);
const selectedFileName = ref('');
const isScanning = ref(false);

watch(() => props.flash?.preflight_result, (newVal) => {
    if (newVal) {
        preflightResult.value = newVal;
    }
});

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    selectedFileName.value = file.name;
    preflightForm.file = file;
};

const runPreflightCheck = () => {
    if (!selectedLevel.value || !preflightForm.file) return;
    isScanning.value = true;
    preflightForm.level_id = selectedLevel.value.id;

    preflightForm.post(route('squad.preflight', { squad: props.squad.id }), {
        preserveScroll: true,
        onFinish: () => {
            isScanning.value = false;
        },
    });
};

// Creador de archivos demo STL/SVG para probar directamente en el navegador
const createAndTestDemoFile = (type, isValid = true) => {
    isScanning.value = true;
    let fileName = '';
    let content = '';

    if (type === 'stl') {
        fileName = isValid ? 'sello_valido_40mm.stl' : 'sello_gigante_75mm.stl';
        content = isValid 
            ? 'solid stamp\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 40 0 0\nvertex 0 40 10\nendloop\nendfacet\nendsolid' 
            : 'solid stamp\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 75 0 0\nvertex 0 75 25\nendloop\nendfacet\nendsolid';
    } else {
        fileName = isValid ? 'vector_laser_35mm.svg' : 'vector_laser_sobredimensionado.svg';
        content = isValid 
            ? '<svg viewBox="0 0 140 140"><rect width="140" height="140"/></svg>' 
            : '<svg viewBox="0 0 350 350"><rect width="350" height="350"/></svg>';
    }

    const blob = new Blob([content], { type: 'application/octet-stream' });
    const testFile = new File([blob], fileName, { type: 'application/octet-stream' });

    selectedFileName.value = fileName;
    preflightForm.file = testFile;
    preflightForm.level_id = selectedLevel.value.id;

    preflightForm.post(route('squad.preflight', { squad: props.squad.id }), {
        preserveScroll: true,
        onFinish: () => {
            isScanning.value = false;
        },
    });
};

// Confirmar y Descontar FabCoins para Fabricación Real
const isFabricating = ref(false);
const confirmFabrication = () => {
    if (!selectedLevel.value) return;
    isFabricating.value = true;
    router.post(route('squad.fabricate', {
        squad: props.squad.id,
        level: selectedLevel.value.id,
    }), {}, {
        preserveScroll: true,
        onFinish: () => {
            isFabricating.value = false;
        },
    });
};

// Cambio rápido de Rol (Regla 1-PC)
const isSwitchingRole = ref(false);
const switchActiveRole = (studentId, role) => {
    isSwitchingRole.value = true;
    router.post(route('squad.switch-role', { squad: props.squad.id }), {
        student_id: studentId,
        new_role: role,
    }, {
        preserveScroll: true,
        onFinish: () => {
            isSwitchingRole.value = false;
        },
    });
};

const getRoleDetails = (role) => {
    switch (role) {
        case 'Architect':
            return { label: 'Arquitecto Maker', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30', desc: 'Lidera el modelado 3D y planos' };
        case 'Quality':
            return { label: 'Inspector Calidad', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30', desc: 'Verifica tolerancias y pre-flight' };
        case 'Finance':
            return { label: 'Gestor FabCoins', color: 'text-amber-400 bg-amber-950/60 border-amber-500/30', desc: 'Optimiza el costo de insumos' };
        case 'Relator':
            return { label: 'Relator Bitácora', color: 'text-purple-400 bg-purple-950/60 border-purple-500/30', desc: 'Documenta evidencias del equipo' };
        default:
            return { label: role, color: 'text-slate-300 bg-slate-800 border-slate-700', desc: 'Miembro de la escuadra' };
    }
};

const totalSquadXp = computed(() => {
    return props.squad.members.reduce((acc, m) => acc + (m.xp_points || 0), 0);
});
</script>

<template>
    <Head :title="`${squad.name} - HUD Makerdu`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOP NAVIGATION BAR -->
        <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <!-- Brand & Squad Name -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/20">
                        <Sparkles class="w-5 h-5" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-black text-lg tracking-tight text-white">{{ squad.name }}</h1>
                            <span class="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                                {{ squad.classroom.access_code }}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400 flex items-center gap-1">
                            {{ squad.classroom.name }} • Docente: {{ squad.classroom.teacher_name }}
                        </p>
                    </div>
                </div>

                <!-- Economic Badges & Actions -->
                <div class="flex items-center gap-3 sm:gap-6">
                    <!-- Billetera FabCoins (Insumos Reales) -->
                    <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-inner">
                        <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Coins class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 leading-none">{{ t('fabcoins_balance') }}</p>
                            <p class="text-sm font-mono font-black text-amber-300">{{ squad.fabcoins_balance }} <span class="text-[11px] font-normal">FC</span></p>
                        </div>
                    </div>

                    <!-- XP Puntos Pedagógicos -->
                    <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 shadow-inner">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Trophy class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 leading-none">{{ t('squad_xp') }}</p>
                            <p class="text-sm font-mono font-black text-purple-300">{{ totalSquadXp }} <span class="text-[11px] font-normal">XP</span></p>
                        </div>
                    </div>

                    <!-- Idioma Selector (i18n) -->
                    <button
                        type="button"
                        @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                        class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-cyan-300 border border-slate-700 transition flex items-center gap-1"
                        title="Cambiar Idioma"
                    >
                        <Globe class="w-3.5 h-3.5" />
                        <span>{{ currentLang.toUpperCase() }}</span>
                    </button>

                    <!-- TinkerCAD Direct Access -->
                    <a
                        v-if="squad.classroom.tinkercad_link"
                        :href="squad.classroom.tinkercad_link"
                        target="_blank"
                        class="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition"
                    >
                        <span>TinkerCAD</span>
                        <ExternalLink class="w-3.5 h-3.5" />
                    </a>

                    <!-- Salir -->
                    <button
                        type="button"
                        @click="router.post(route('student.logout'))"
                        class="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
                        title="Cerrar Sesión"
                    >
                        <LogOut class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>

        <!-- MAIN WORKSPACE -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
            
            <!-- ALERTA GLOBAL FLASH SI EXISTE -->
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <!-- SECCIÓN 1: REGLA DE 1-PC - ROTACIÓN DE ROLES EN PANTALLA COMPARTIDA -->
            <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 lg:p-6 shadow-xl relative overflow-hidden">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <Laptop class="w-5 h-5" />
                        </div>
                        <div>
                            <h2 class="text-base font-black text-white flex items-center gap-2">
                                {{ t('active_role_device') }}
                                <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">{{ t('rule_1pc') }}</span>
                            </h2>
                            <p class="text-xs text-slate-400">Haz clic en tu tarjeta para tomar el turno activo sin desloguear el equipo.</p>
                        </div>
                    </div>
                </div>

                <!-- Grid de Miembros y Roles -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div
                        v-for="member in squad.members"
                        :key="member.id"
                        @click="switchActiveRole(member.id, member.role)"
                        :class="[
                            'p-4 rounded-2xl border transition cursor-pointer relative',
                            member.is_active_device_user
                                ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400/60 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-400/40'
                                : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 opacity-80 hover:opacity-100'
                        ]"
                    >
                        <div v-if="member.is_active_device_user" class="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950">
                            <Check class="w-3 h-3 stroke-[3]" /> {{ t('role_active') }}
                        </div>

                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-base text-slate-200">
                                {{ member.name.charAt(0) }}
                            </div>
                            <div>
                                <h3 class="font-bold text-sm text-white leading-snug">{{ member.name }}</h3>
                                <p class="text-xs font-mono text-purple-400 font-semibold">{{ member.xp_points }} XP</p>
                            </div>
                        </div>

                        <div class="mt-3">
                            <span :class="['text-[11px] font-bold px-2.5 py-1 rounded-lg border inline-block w-full text-center', getRoleDetails(member.role).color]">
                                {{ getRoleDetails(member.role).label }}
                            </span>
                            <p class="text-[10px] text-slate-400 mt-1.5 text-center leading-tight">
                                {{ getRoleDetails(member.role).desc }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SECCIÓN 2: MATRIZ DE NIVELES DINÁMICOS & WORKSPACE -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <!-- COLUMNA IZQUIERDA: ROADMAP DE NIVELES DINÁMICOS (5 Cols) -->
                <div class="lg:col-span-5 space-y-4">
                    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <Layers class="w-5 h-5 text-amber-400" />
                                <h2 class="text-base font-black text-white">{{ t('project_roadmap') }}</h2>
                            </div>
                            <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {{ project.type }} • {{ project.total_levels }} {{ t('levels') }}
                            </span>
                        </div>
                        
                        <p class="text-xs text-slate-300 mb-4">{{ project.description }}</p>

                        <!-- Niveles List -->
                        <div class="space-y-2.5">
                            <button
                                v-for="lvl in project.levels"
                                :key="lvl.id"
                                type="button"
                                @click="selectedLevelId = lvl.id"
                                :class="[
                                    'w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3',
                                    selectedLevelId === lvl.id
                                        ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-400/50 shadow-md shadow-cyan-950/40'
                                        : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800 text-slate-300'
                                ]"
                            >
                                <div class="flex items-center gap-3">
                                    <div :class="[
                                        'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs',
                                        lvl.is_completed
                                            ? 'bg-emerald-500 text-slate-950'
                                            : selectedLevelId === lvl.id
                                                ? 'bg-cyan-500 text-slate-950'
                                                : 'bg-slate-800 text-slate-400'
                                    ]">
                                        <CheckCircle2 v-if="lvl.is_completed" class="w-4 h-4" />
                                        <span v-else>{{ lvl.level_number }}</span>
                                    </div>
                                    <div>
                                        <p class="font-bold text-xs leading-snug text-white">{{ lvl.title }}</p>
                                        <p class="text-[10px] text-slate-400">
                                            {{ lvl.fabcoins_cost > 0 ? `Costo: ${lvl.fabcoins_cost} FC` : 'Sin consumo de insumos' }}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight class="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA: WORKSPACE DEL NIVEL, PRE-FLIGHT IA & BITÁCORA (7 Cols) -->
                <div class="lg:col-span-7 space-y-6">
                    
                    <!-- DETALLE DEL NIVEL SELECCIONADO -->
                    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                            <div>
                                <span class="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Nivel {{ selectedLevel?.level_number }}</span>
                                <h3 class="text-xl font-black text-white">{{ selectedLevel?.title }}</h3>
                            </div>

                            <div v-if="selectedLevel?.fabcoins_cost > 0" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold self-start">
                                <Coins class="w-3.5 h-3.5" />
                                <span>Requiere {{ selectedLevel.fabcoins_cost }} FC</span>
                            </div>
                        </div>

                        <!-- Toolbox & Guía del Nivel -->
                        <div class="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-3">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <BookOpen class="w-4 h-4 text-cyan-400" />
                                {{ t('level_guide') }}
                            </h4>
                            <p class="text-xs text-slate-300 leading-relaxed">{{ selectedLevel?.toolbox?.guide }}</p>

                            <div v-if="selectedLevel?.toolbox?.resources?.length" class="flex flex-wrap gap-2 pt-2">
                                <a
                                    v-for="(res, idx) in selectedLevel.toolbox.resources"
                                    :key="idx"
                                    :href="res.url"
                                    target="_blank"
                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 transition"
                                >
                                    <FileText class="w-3.5 h-3.5" />
                                    <span>{{ res.title }}</span>
                                </a>
                            </div>
                        </div>

                        <!-- MOTOR DE PRE-FLIGHT CHECK CON IA Y VISOR 3D WEBGL (MÓDULO 1) -->
                        <div v-if="selectedLevel?.validation_rules" class="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/30 border border-cyan-500/30 space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                                    <Cpu class="w-5 h-5 text-cyan-400 animate-pulse" />
                                    <span>{{ t('preflight_lab') }}</span>
                                </div>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Three.js WebGL & Gemini</span>
                            </div>

                            <p class="text-xs text-slate-300">
                                Sube tu diseño 3D o vectorial para inspeccionarlo interactivamente en la cama de impresión y validar tolerancias mecánicas.
                            </p>

                            <!-- Zona de Carga de Archivo -->
                            <div class="p-4 rounded-xl bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-cyan-400 text-center space-y-3 transition">
                                <UploadCloud class="w-8 h-8 text-cyan-400 mx-auto" />
                                <div>
                                    <label class="cursor-pointer text-xs font-bold text-cyan-300 hover:underline">
                                        <span>{{ t('upload_design') }}</span>
                                        <input type="file" @change="handleFileSelect" accept=".stl,.svg,.obj" class="hidden" />
                                    </label>
                                    <p v-if="selectedFileName" class="text-xs font-mono text-amber-300 mt-1 font-bold">
                                        📄 Archivo: {{ selectedFileName }}
                                    </p>
                                    <p v-else class="text-[11px] text-slate-500 mt-1">Archivos 3D hasta 25MB (.STL, .SVG)</p>
                                </div>

                                <div class="flex flex-wrap justify-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        @click="runPreflightCheck"
                                        :disabled="isScanning || !preflightForm.file"
                                        class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs disabled:opacity-40 transition flex items-center gap-1.5"
                                    >
                                        <Sparkles class="w-3.5 h-3.5" />
                                        <span>{{ isScanning ? t('analyzing_file') : t('run_preflight') }}</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Botones Demo para Pruebas Rápidas -->
                            <div class="pt-2">
                                <p class="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">⚡ Pruebas rápidas de validación:</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        @click="createAndTestDemoFile('stl', true)"
                                        :disabled="isScanning"
                                        class="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold text-left transition"
                                    >
                                        ✓ Probar STL Válido (40x40mm)
                                    </button>
                                    <button
                                        type="button"
                                        @click="createAndTestDemoFile('stl', false)"
                                        :disabled="isScanning"
                                        class="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-600/40 text-rose-300 text-[11px] font-bold text-left transition"
                                    >
                                        ✕ Probar STL Excedido (75mm)
                                    </button>
                                </div>
                            </div>

                            <!-- VISOR 3D INTERACTIVO THREE.JS WEBGL -->
                            <div class="pt-2">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                        <Box class="w-4 h-4" />
                                        {{ t('view_3d') }}
                                    </span>
                                    <span class="text-[10px] text-slate-400">{{ t('rotate_hint') }}</span>
                                </div>
                                <StlViewer3D
                                    :dimensions="preflightResult?.metrics || { x_mm: 40, y_mm: 40, z_mm: 10 }"
                                    :limits="selectedLevel.validation_rules || { max_x_mm: 50, max_y_mm: 50, max_z_mm: 15 }"
                                    :isValid="preflightResult ? preflightResult.is_valid : true"
                                    :fileName="selectedFileName || 'modelo.stl'"
                                />
                            </div>

                            <!-- PANEL DE RESULTADOS PRE-FLIGHT -->
                            <div v-if="preflightResult" :class="[
                                'p-4 rounded-xl border space-y-3 transition-all',
                                preflightResult.is_valid
                                    ? 'bg-emerald-950/30 border-emerald-500/50'
                                    : 'bg-rose-950/30 border-rose-500/50'
                            ]">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <CheckCircle2 v-if="preflightResult.is_valid" class="w-5 h-5 text-emerald-400" />
                                        <XCircle v-else class="w-5 h-5 text-rose-400" />
                                        <span class="font-black text-sm text-white">
                                            {{ preflightResult.is_valid ? t('preflight_approved') : t('preflight_rejected') }}
                                        </span>
                                    </div>
                                    <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300">
                                        {{ preflightResult.metrics?.x_mm }} x {{ preflightResult.metrics?.y_mm }} x {{ preflightResult.metrics?.z_mm }} mm
                                    </span>
                                </div>

                                <!-- Métricas de Fabricación Estimadas -->
                                <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                                    <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                        <p class="text-[10px] text-slate-500">Material</p>
                                        <p class="font-bold text-cyan-300">{{ preflightResult.metrics?.material_grams }} g</p>
                                    </div>
                                    <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                        <p class="text-[10px] text-slate-500">Tiempo Impresión</p>
                                        <p class="font-bold text-purple-300">{{ preflightResult.metrics?.print_time_minutes }} min</p>
                                    </div>
                                    <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                        <p class="text-[10px] text-slate-500">Insumo Real</p>
                                        <p class="font-bold text-amber-400">{{ preflightResult.metrics?.estimated_fc_cost }} FC</p>
                                    </div>
                                </div>

                                <!-- Feedback IA -->
                                <div class="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                                    <p class="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                                        🤖 Feedback Pedagógico del Copiloto IA:
                                    </p>
                                    <p class="text-slate-300 leading-relaxed">{{ preflightResult.ai_feedback }}</p>
                                </div>

                                <!-- Botón Autorizar Fabricación si es válido -->
                                <div v-if="preflightResult.is_valid && selectedLevel.fabcoins_cost > 0" class="pt-2">
                                    <button
                                        type="button"
                                        @click="confirmFabrication"
                                        :disabled="isFabricating || squad.fabcoins_balance < selectedLevel.fabcoins_cost"
                                        class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40 transition"
                                    >
                                        <Printer class="w-4 h-4" />
                                        <span>{{ t('send_to_fabrication') }} (CONSUMIR {{ selectedLevel.fabcoins_cost }} FC)</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Formulario de Bitácora Tradicional -->
                        <form @submit.prevent="submitBitacora" class="space-y-4 pt-2">
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                    {{ t('register_bitacora') }} como:
                                    <span class="text-cyan-400 font-black">{{ activeStudent.name }} ({{ activeStudent.current_role }})</span>
                                </label>
                                <textarea
                                    v-model="bitacoraForm.content_text"
                                    rows="3"
                                    placeholder="Describe las decisiones tomadas por el equipo, ajustes técnicos o ideas clave de este nivel..."
                                    class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                :disabled="bitacoraForm.processing || !bitacoraForm.content_text"
                                class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                            >
                                <Send class="w-4 h-4" />
                                <span>{{ t('send_evidence') }}</span>
                            </button>
                        </form>

                        <!-- Historial de Bitácoras de este nivel -->
                        <div v-if="currentLevelBitacoras.length" class="space-y-3 pt-4 border-t border-slate-800">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Evidencias Guardadas de la Escuadra:</h4>
                            <div
                                v-for="b in currentLevelBitacoras"
                                :key="b.id"
                                class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                            >
                                <div class="flex items-center justify-between text-[11px]">
                                    <span class="font-bold text-cyan-300">{{ b.active_role_user?.name || 'Miembro' }}</span>
                                    <span :class="[
                                        'flex items-center gap-1 font-semibold',
                                        b.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                                    ]">
                                        <CheckCircle2 v-if="b.status === 'approved'" class="w-3.5 h-3.5" />
                                        <XCircle v-else class="w-3.5 h-3.5" />
                                        {{ b.status === 'approved' ? 'Aprobado' : 'Rechazado' }}
                                    </span>
                                </div>
                                <p class="text-slate-300">{{ b.content_text }}</p>
                                <div v-if="b.ai_feedback" class="p-2 rounded-xl bg-cyan-950/40 border border-cyan-900/60 text-[10px] text-cyan-300">
                                    🤖 <strong>Feedback Pedagógico IA:</strong> {{ b.ai_feedback }}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </main>
    </div>
</template>
