<script setup>
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { ref, computed, watch } from 'vue';
import {
    Sparkles, Coins, Trophy, Users, ShieldCheck, Wrench, CheckCircle2,
    Clock, BookOpen, ExternalLink, Send, FileText, ChevronRight, LogOut,
    Check, AlertCircle, ArrowUpRight, Flame, Layers, Laptop, UploadCloud,
    Cpu, XCircle, Printer, Hammer, Gauge, Globe, Box, Film, Camera, Image,
    Download
} from 'lucide-vue-next';
import StlViewer3D from '@/Components/StlViewer3D.vue';
import VideoTutorialPlayer from '@/Components/VideoTutorialPlayer.vue';
import { t, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    squad: Object,
    activeStudent: Object,
    project: Object,
    bitacoras: Array,
    flash: Object,
});

const page = usePage();

// Pestaña activa en la cabina de la escuadra: 'mission', 'inspection_3d', 'bitacora'
const activeTab = ref('mission');

// Nivel seleccionado actualmente
const selectedLevelId = ref(props.project.levels[0]?.id || null);

const selectedLevel = computed(() => {
    return props.project.levels.find((l) => l.id === selectedLevelId.value) || props.project.levels[0];
});

// Bitácoras filtradas para el nivel seleccionado
const currentLevelBitacoras = computed(() => {
    return props.bitacoras.filter((b) => b.level_id === selectedLevel.value?.id);
});

// Formulario para envío de bitácora multimedia
const bitacoraForm = useForm({
    content_text: '',
    file: null,
});

const photoPreviewUrl = ref(null);

const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    bitacoraForm.file = file;
    photoPreviewUrl.value = URL.createObjectURL(file);
};

const submitBitacora = () => {
    if (!selectedLevel.value) return;
    bitacoraForm.post(route('squad.bitacora.submit', {
        squad: props.squad.id,
        level: selectedLevel.value.id,
    }), {
        preserveScroll: true,
        onSuccess: () => {
            bitacoraForm.reset();
            photoPreviewUrl.value = null;
        },
    });
};

// Formulario de Pre-flight Check con IA
const preflightForm = useForm({
    level_id: null,
    file: null,
});

const preflightResult = ref(props.flash?.preflight_result || null);
const selectedRealFile = ref(null);
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
    selectedRealFile.value = file;
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

    selectedRealFile.value = testFile;
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

const getRoleColor = (role) => {
    switch (role) {
        case 'Architect': return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
        case 'Quality': return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
        case 'Finance': return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
        case 'Relator': return 'text-purple-400 bg-purple-950/60 border-purple-500/40';
        default: return 'text-slate-300 bg-slate-800 border-slate-700';
    }
};

const totalSquadXp = computed(() => {
    return props.squad.members.reduce((acc, m) => acc + (m.xp_points || 0), 0);
});
</script>

<template>
    <Head :title="`${squad.name} - ${t('app.name')}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOP NAVIGATION BAR -->
        <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <!-- Brand & Squad Info -->
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
                <div class="flex items-center gap-3 sm:gap-4">
                    <!-- Billetera FabCoins (Insumos Reales) -->
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-inner">
                        <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Coins class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-[9px] font-bold uppercase tracking-wider text-amber-400/80 leading-none">{{ t('hud.fabcoins_budget') }}</p>
                            <p class="text-sm font-mono font-black text-amber-300">{{ squad.fabcoins_balance }} <span class="text-[10px] font-normal">FC</span></p>
                        </div>
                    </div>

                    <!-- XP Puntos Pedagógicos -->
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 shadow-inner">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Trophy class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-[9px] font-bold uppercase tracking-wider text-purple-400/80 leading-none">{{ t('hud.xp_score') }}</p>
                            <p class="text-sm font-mono font-black text-purple-300">{{ totalSquadXp }} <span class="text-[10px] font-normal">XP</span></p>
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
            <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <Laptop class="w-4 h-4" />
                        </div>
                        <div>
                            <h2 class="text-sm font-black text-white flex items-center gap-2">
                                {{ t('roles.title') }}
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal border border-slate-700">{{ t('roles.rule_1pc') }}</span>
                            </h2>
                            <p class="text-[11px] text-slate-400">{{ t('roles.switch_hint') }}</p>
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
                            'p-3.5 rounded-2xl border transition cursor-pointer relative',
                            member.is_active_device_user
                                ? 'bg-gradient-to-b from-cyan-950/70 to-slate-900 border-cyan-400/60 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-400/40'
                                : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 opacity-85 hover:opacity-100'
                        ]"
                    >
                        <div v-if="member.is_active_device_user" class="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950">
                            <Check class="w-3 h-3 stroke-[3]" /> {{ t('roles.active_badge') }}
                        </div>

                        <div class="flex items-center gap-2.5 mb-2">
                            <div class="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-200">
                                {{ member.name.charAt(0) }}
                            </div>
                            <div>
                                <h3 class="font-bold text-xs text-white leading-snug">{{ member.name }}</h3>
                                <p class="text-[11px] font-mono text-purple-400 font-semibold">{{ member.xp_points }} XP</p>
                            </div>
                        </div>

                        <div class="mt-2">
                            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-lg border inline-block w-full text-center', getRoleColor(member.role)]">
                                {{ t(`roles.${member.role}.name`) }}
                            </span>
                            <p class="text-[9px] text-slate-400 mt-1 text-center leading-tight">
                                {{ t(`roles.${member.role}.desc`) }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- SECCIÓN 2: MATRIZ DE NIVELES DINÁMICOS & WORKSPACE -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <!-- COLUMNA IZQUIERDA: ROADMAP DE NIVELES (4 Cols) -->
                <div class="lg:col-span-4 space-y-4">
                    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <Layers class="w-4 h-4 text-amber-400" />
                                <h2 class="text-sm font-black text-white">{{ t('roadmap.title') }}</h2>
                            </div>
                            <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {{ project.total_levels }} {{ t('roadmap.levels_count') }}
                            </span>
                        </div>
                        
                        <p class="text-xs text-slate-300 mb-4">{{ project.description }}</p>

                        <!-- Lista de Niveles -->
                        <div class="space-y-2">
                            <button
                                v-for="lvl in project.levels"
                                :key="lvl.id"
                                type="button"
                                @click="selectedLevelId = lvl.id"
                                :class="[
                                    'w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3',
                                    selectedLevelId === lvl.id
                                        ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border-cyan-400/50 shadow-md shadow-cyan-950/40'
                                        : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800 text-slate-300'
                                ]"
                            >
                                <div class="flex items-center gap-2.5">
                                    <div :class="[
                                        'w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs',
                                        lvl.is_completed
                                            ? 'bg-emerald-500 text-slate-950'
                                            : selectedLevelId === lvl.id
                                                ? 'bg-cyan-500 text-slate-950'
                                                : 'bg-slate-800 text-slate-400'
                                    ]">
                                        <CheckCircle2 v-if="lvl.is_completed" class="w-3.5 h-3.5" />
                                        <span v-else>{{ lvl.level_number }}</span>
                                    </div>
                                    <div>
                                        <p class="font-bold text-xs leading-snug text-white">{{ lvl.title }}</p>
                                        <p class="text-[10px] text-slate-400">
                                            {{ lvl.fabcoins_cost > 0 ? `${t('roadmap.cost_required')} ${lvl.fabcoins_cost} FC` : t('roadmap.cost_free') }}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight class="w-3.5 h-3.5 text-slate-500" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA: WORKSPACE EN 3 PESTAÑAS (8 Cols) -->
                <div class="lg:col-span-8 space-y-4">
                    
                    <!-- ENCABEZADO DEL NIVEL & SELECTOR DE PESTAÑAS -->
                    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div>
                                <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Nivel {{ selectedLevel?.level_number }}</span>
                                <h3 class="text-lg font-black text-white">{{ selectedLevel?.title }}</h3>
                            </div>

                            <div v-if="selectedLevel?.fabcoins_cost > 0" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold self-start">
                                <Coins class="w-3.5 h-3.5" />
                                <span>{{ t('roadmap.cost_required') }} {{ selectedLevel.fabcoins_cost }} FC</span>
                            </div>
                        </div>

                        <!-- BARRA DE PESTAÑAS DE TRABAJO -->
                        <div class="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
                            <button
                                type="button"
                                @click="activeTab = 'mission'"
                                :class="[
                                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap',
                                    activeTab === 'mission'
                                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                                ]"
                            >
                                <BookOpen class="w-3.5 h-3.5" />
                                <span>{{ t('hud.tabs.mission') }}</span>
                            </button>

                            <button
                                v-if="selectedLevel?.validation_rules"
                                type="button"
                                @click="activeTab = 'inspection_3d'"
                                :class="[
                                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap',
                                    activeTab === 'inspection_3d'
                                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                                ]"
                            >
                                <Box class="w-3.5 h-3.5" />
                                <span>{{ t('hud.tabs.inspection_3d') }}</span>
                            </button>

                            <button
                                type="button"
                                @click="activeTab = 'bitacora'"
                                :class="[
                                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap',
                                    activeTab === 'bitacora'
                                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                                ]"
                            >
                                <Camera class="w-3.5 h-3.5" />
                                <span>{{ t('hud.tabs.bitacora') }}</span>
                            </button>
                        </div>

                        <!-- ============================================== -->
                        <!-- PESTAÑA 1: MISIÓN & TUTORIALES (BUNNY.NET PLAYER) -->
                        <!-- ============================================== -->
                        <div v-if="activeTab === 'mission'" class="space-y-4 pt-1">
                            <div class="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2">
                                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <BookOpen class="w-4 h-4 text-cyan-400" />
                                    {{ t('tutorials.title') }}
                                </h4>
                                <p class="text-xs text-slate-300 leading-relaxed">{{ selectedLevel?.toolbox?.guide }}</p>
                            </div>

                            <!-- Video Tutorial (Soporte Bunny Stream / Local MP4) -->
                            <VideoTutorialPlayer
                                :title="`Tutorial: ${selectedLevel?.title}`"
                                type="bunny_stream"
                                source="https://iframe.mediadelivery.net/embed/demo"
                            />

                            <!-- Recursos Descargables & TinkerCAD -->
                            <div v-if="selectedLevel?.toolbox?.resources?.length" class="space-y-2 pt-2">
                                <h4 class="text-xs font-bold text-slate-400">{{ t('tutorials.resources') }}</h4>
                                <div class="flex flex-wrap gap-2">
                                    <a
                                        v-for="(res, idx) in selectedLevel.toolbox.resources"
                                        :key="idx"
                                        :href="res.url"
                                        target="_blank"
                                        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 transition"
                                    >
                                        <FileText class="w-3.5 h-3.5" />
                                        <span>{{ res.title }}</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- ============================================== -->
                        <!-- PESTAÑA 2: INSPECCIÓN 3D Y CONTROL DE CALIDAD IA -->
                        <!-- ============================================== -->
                        <div v-else-if="activeTab === 'inspection_3d'" class="space-y-4 pt-1">
                            <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/30 border border-cyan-500/30 space-y-4">
                                <div>
                                    <h4 class="text-sm font-bold text-cyan-300 flex items-center gap-2">
                                        <Cpu class="w-4 h-4 text-cyan-400" />
                                        <span>{{ t('inspection_3d.title') }}</span>
                                    </h4>
                                    <p class="text-xs text-slate-400 mt-1">{{ t('inspection_3d.subtitle') }}</p>
                                </div>

                                <!-- Zona de Carga de Archivo Real (.STL / .SVG) -->
                                <div class="p-4 rounded-xl bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-cyan-400 text-center space-y-2 transition">
                                    <UploadCloud class="w-8 h-8 text-cyan-400 mx-auto" />
                                    <div>
                                        <label class="cursor-pointer text-xs font-bold text-cyan-300 hover:underline">
                                            <span>{{ t('inspection_3d.upload_zone_title') }}</span>
                                            <input type="file" @change="handleFileSelect" accept=".stl,.svg,.obj" class="hidden" />
                                        </label>
                                        <p v-if="selectedFileName" class="text-xs font-mono text-amber-300 mt-1 font-bold">
                                            📄 {{ t('inspection_3d.current_file') }} {{ selectedFileName }}
                                        </p>
                                        <p v-else class="text-[11px] text-slate-500 mt-0.5">{{ t('inspection_3d.upload_zone_hint') }}</p>
                                    </div>

                                    <div class="pt-1">
                                        <button
                                            type="button"
                                            @click="runPreflightCheck"
                                            :disabled="isScanning || !preflightForm.file"
                                            class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs disabled:opacity-40 transition flex items-center gap-1.5 mx-auto shadow-md shadow-cyan-500/20"
                                        >
                                            <Sparkles class="w-3.5 h-3.5" />
                                            <span>{{ isScanning ? t('inspection_3d.btn_analyzing') : t('inspection_3d.btn_analyze') }}</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Botones de Prueba Rápida -->
                                <div>
                                    <p class="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">{{ t('inspection_3d.quick_tests') }}</p>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            @click="createAndTestDemoFile('stl', true)"
                                            :disabled="isScanning"
                                            class="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold text-left transition"
                                        >
                                            {{ t('inspection_3d.btn_test_valid') }}
                                        </button>
                                        <button
                                            type="button"
                                            @click="createAndTestDemoFile('stl', false)"
                                            :disabled="isScanning"
                                            class="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-600/40 text-rose-300 text-[11px] font-bold text-left transition"
                                        >
                                            {{ t('inspection_3d.btn_test_invalid') }}
                                        </button>
                                    </div>
                                </div>

                                <!-- VISOR 3D REAL CON STLLOADER Y ORBITCONTROLS -->
                                <div class="pt-2">
                                    <StlViewer3D
                                        :file="selectedRealFile"
                                        :fileUrl="preflightResult?.file_url || ''"
                                        :dimensions="preflightResult?.metrics || { x_mm: 40, y_mm: 40, z_mm: 10 }"
                                        :limits="selectedLevel.validation_rules || { max_x_mm: 50, max_y_mm: 50, max_z_mm: 15 }"
                                        :isValid="preflightResult ? preflightResult.is_valid : true"
                                        :fileName="selectedFileName || 'modelo.stl'"
                                    />
                                </div>

                                <!-- PANEL DE RESULTADOS DE INSPECCIÓN -->
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
                                                {{ preflightResult.is_valid ? t('inspection_3d.status_approved') : t('inspection_3d.status_rejected') }}
                                            </span>
                                        </div>
                                        <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300">
                                            {{ preflightResult.metrics?.x_mm }} x {{ preflightResult.metrics?.y_mm }} x {{ preflightResult.metrics?.z_mm }} mm
                                        </span>
                                    </div>

                                    <!-- Ficha Técnica de Fabricación -->
                                    <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                                        <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                            <p class="text-[10px] text-slate-500">{{ t('inspection_3d.specs.material') }}</p>
                                            <p class="font-bold text-cyan-300">{{ preflightResult.metrics?.material_grams }} g</p>
                                        </div>
                                        <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                            <p class="text-[10px] text-slate-500">{{ t('inspection_3d.specs.time') }}</p>
                                            <p class="font-bold text-purple-300">{{ preflightResult.metrics?.print_time_minutes }} min</p>
                                        </div>
                                        <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                            <p class="text-[10px] text-slate-500">{{ t('inspection_3d.specs.fabcoins') }}</p>
                                            <p class="font-bold text-amber-400">{{ preflightResult.metrics?.estimated_fc_cost }} FC</p>
                                        </div>
                                    </div>

                                    <!-- Feedback Pedagógico IA -->
                                    <div class="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                                        <p class="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                                            🤖 {{ t('inspection_3d.ai_feedback_title') }}
                                        </p>
                                        <p class="text-slate-300 leading-relaxed">{{ preflightResult.ai_feedback }}</p>
                                    </div>

                                    <!-- Botón Mandar a Fabricación -->
                                    <div v-if="preflightResult.is_valid && selectedLevel.fabcoins_cost > 0" class="pt-2">
                                        <button
                                            type="button"
                                            @click="confirmFabrication"
                                            :disabled="isFabricating || squad.fabcoins_balance < selectedLevel.fabcoins_cost"
                                            class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40 transition"
                                        >
                                            <Printer class="w-4 h-4" />
                                            <span>{{ t('inspection_3d.btn_send_fabrication') }} (CONSUMIR {{ selectedLevel.fabcoins_cost }} FC)</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ============================================== -->
                        <!-- PESTAÑA 3: BITÁCORA DIGITAL MULTIMEDIA -->
                        <!-- ============================================== -->
                        <div v-else-if="activeTab === 'bitacora'" class="space-y-4 pt-1">
                            <form @submit.prevent="submitBitacora" class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                                <div>
                                    <label class="block text-xs font-bold text-slate-300 mb-1.5">
                                        {{ t('bitacora.form_label') }}
                                        <span class="text-cyan-400 font-black">{{ activeStudent.name }} ({{ t(`roles.${activeStudent.current_role}.name`) }})</span>
                                    </label>
                                    <textarea
                                        v-model="bitacoraForm.content_text"
                                        rows="3"
                                        :placeholder="t('bitacora.form_placeholder')"
                                        class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                        required
                                    ></textarea>
                                </div>

                                <!-- Subir Foto Real del Taller -->
                                <div class="flex items-center gap-3">
                                    <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition">
                                        <Camera class="w-4 h-4 text-cyan-400" />
                                        <span>{{ t('bitacora.photo_label') }}</span>
                                        <input type="file" @change="handlePhotoSelect" accept="image/*" class="hidden" />
                                    </label>
                                    <span v-if="bitacoraForm.file" class="text-xs text-emerald-400 font-mono font-bold">
                                        📷 {{ bitacoraForm.file.name }}
                                    </span>
                                </div>

                                <!-- Preview de Foto si seleccionó -->
                                <div v-if="photoPreviewUrl" class="w-32 h-32 rounded-xl overflow-hidden border border-slate-700">
                                    <img :src="photoPreviewUrl" class="w-full h-full object-cover" />
                                </div>

                                <button
                                    type="submit"
                                    :disabled="bitacoraForm.processing || !bitacoraForm.content_text"
                                    class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition"
                                >
                                    <Send class="w-4 h-4" />
                                    <span>{{ t('bitacora.btn_submit') }}</span>
                                </button>
                            </form>

                            <!-- Línea de Tiempo de Evidencias Guardadas -->
                            <div class="space-y-3 pt-2">
                                <h4 class="text-xs font-bold text-slate-400">{{ t('bitacora.history_title') }}</h4>
                                <div v-if="currentLevelBitacoras.length" class="space-y-2.5">
                                    <div
                                        v-for="b in currentLevelBitacoras"
                                        :key="b.id"
                                        class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2"
                                    >
                                        <div class="flex items-center justify-between text-[11px]">
                                            <span class="font-bold text-cyan-300">{{ b.active_role_user?.name || 'Miembro' }}</span>
                                            <span :class="[
                                                'flex items-center gap-1 font-semibold text-[10px]',
                                                b.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                                            ]">
                                                <CheckCircle2 v-if="b.status === 'approved'" class="w-3.5 h-3.5" />
                                                <XCircle v-else class="w-3.5 h-3.5" />
                                                {{ b.status === 'approved' ? t('bitacora.status_approved') : t('bitacora.status_rejected') }}
                                            </span>
                                        </div>
                                        <p class="text-slate-300">{{ b.content_text }}</p>

                                        <!-- Foto adjunta si existe -->
                                        <div v-if="b.file_url" class="pt-1">
                                            <img :src="b.file_url" class="max-h-48 rounded-xl border border-slate-800 object-cover" />
                                        </div>

                                        <div v-if="b.ai_feedback" class="p-2 rounded-xl bg-cyan-950/40 border border-cyan-900/60 text-[10px] text-cyan-300">
                                            🤖 <strong>{{ t('bitacora.ai_feedback') }}</strong> {{ b.ai_feedback }}
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-900">
                                    {{ t('bitacora.empty_history') }}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </main>
    </div>
</template>
