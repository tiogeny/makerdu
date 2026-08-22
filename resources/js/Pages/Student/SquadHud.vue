<script setup>
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { ref, computed, watch, nextTick } from 'vue';
import {
    Sparkles, Coins, Trophy, Users, ShieldCheck, Wrench, CheckCircle2,
    Clock, BookOpen, ExternalLink, Send, FileText, ChevronRight, LogOut,
    Check, AlertCircle, ArrowUpRight, Flame, Layers, Laptop, UploadCloud,
    Cpu, XCircle, Printer, Hammer, Gauge, Globe, Box, Film, Camera, Image,
    Download, ArrowLeft, Play, Lock, Award, Eye
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

// Vista principal: 'roadmap' (Mapa de la Aventura) o 'studio' (Estudio del Nivel Seleccionado)
const currentMode = ref('roadmap');

// Pestaña dentro del Estudio: 'mission', 'inspection_3d', 'bitacora'
const studioTab = ref('inspection_3d');

// Nivel seleccionado
const selectedLevelId = ref(props.project.levels[0]?.id || null);

const selectedLevel = computed(() => {
    return props.project.levels.find((l) => l.id === selectedLevelId.value) || props.project.levels[0];
});

const openLevelStudio = (levelId, defaultTab = 'mission') => {
    selectedLevelId.value = levelId;
    studioTab.value = defaultTab;
    currentMode.value = 'studio';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const backToRoadmap = () => {
    currentMode.value = 'roadmap';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Bitácoras filtradas para el nivel
const currentLevelBitacoras = computed(() => {
    return props.bitacoras.filter((b) => b.level_id === selectedLevel.value?.id);
});

// Referencia al Visor 3D para snapshot a Gemini Vision
const viewerRef = ref(null);

// Formulario de Pre-flight Check con IA Multimodal
const preflightForm = useForm({
    level_id: null,
    file: null,
    image_snapshot: null,
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

const runPreflightCheck = async () => {
    if (!selectedLevel.value || !preflightForm.file) return;
    isScanning.value = true;
    preflightForm.level_id = selectedLevel.value.id;

    // Obtener captura de alta resolución desde Three.js para Gemini Vision
    if (viewerRef.value && typeof viewerRef.value.getSnapshotDataUrl === 'function') {
        preflightForm.image_snapshot = viewerRef.value.getSnapshotDataUrl();
    }

    preflightForm.post(route('squad.preflight', { squad: props.squad.id }), {
        preserveScroll: true,
        onFinish: () => {
            isScanning.value = false;
        },
    });
};

// Creador de archivos demo STL/SVG para pruebas rápidas
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

    if (viewerRef.value && typeof viewerRef.value.getSnapshotDataUrl === 'function') {
        preflightForm.image_snapshot = viewerRef.value.getSnapshotDataUrl();
    }

    preflightForm.post(route('squad.preflight', { squad: props.squad.id }), {
        preserveScroll: true,
        onFinish: () => {
            isScanning.value = false;
        },
    });
};

// Confirmar Fabricación y Descontar FabCoins
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

// Formulario de Bitácora Multimedia
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

// Cambio de Rol Activo (Regla 1-PC)
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
                    <!-- Billetera FabCoins -->
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-inner">
                        <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Coins class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-[9px] font-bold uppercase tracking-wider text-amber-400/80 leading-none">{{ t('hud.fabcoins_budget') }}</p>
                            <p class="text-sm font-mono font-black text-amber-300">{{ squad.fabcoins_balance }} <span class="text-[10px] font-normal">FC</span></p>
                        </div>
                    </div>

                    <!-- XP Points -->
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 shadow-inner">
                        <div class="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Trophy class="w-4 h-4" />
                        </div>
                        <div>
                            <p class="text-[9px] font-bold uppercase tracking-wider text-purple-400/80 leading-none">{{ t('hud.xp_score') }}</p>
                            <p class="text-sm font-mono font-black text-purple-300">{{ totalSquadXp }} <span class="text-[10px] font-normal">XP</span></p>
                        </div>
                    </div>

                    <!-- Selector Idioma -->
                    <button
                        type="button"
                        @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                        class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-cyan-300 border border-slate-700 transition flex items-center gap-1"
                        title="Cambiar Idioma"
                    >
                        <Globe class="w-3.5 h-3.5" />
                        <span>{{ currentLang.toUpperCase() }}</span>
                    </button>

                    <!-- TinkerCAD Direct -->
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

        <!-- MAIN CONTAINER -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
            
            <!-- ALERTA GLOBAL FLASH -->
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <!-- SECCIÓN 1: REGLA DE 1-PC - ROTACIÓN DE ROLES EN PANTALLA COMPARTIDA -->
            <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
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

                <!-- Grid de Miembros -->
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

            <!-- ================================================================= -->
            <!-- MODO A: MAPA DE LA AVENTURA / WORLD ROADMAP PANORÁMICO -->
            <!-- ================================================================= -->
            <section v-if="currentMode === 'roadmap'" class="space-y-6 animate-fade-in">
                <div class="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <Layers class="w-5 h-5 text-amber-400" />
                            <h2 class="text-xl font-black text-white">{{ project.title }}</h2>
                        </div>
                        <p class="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{{ project.description }}</p>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                            {{ project.total_levels }} Niveles de Fabricación
                        </span>
                    </div>
                </div>

                <!-- WORLD MAP: NIVELES INTERACTIVOS EN RUTA -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        v-for="(lvl, idx) in project.levels"
                        :key="lvl.id"
                        @click="openLevelStudio(lvl.id, 'inspection_3d')"
                        class="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                    >
                        <!-- Top Level Badge -->
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800">
                                    NIVEL {{ lvl.level_number }}
                                </span>
                                <span v-if="lvl.is_completed" class="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-600/40">
                                    <CheckCircle2 class="w-3.5 h-3.5" /> Aprobado
                                </span>
                                <span v-else class="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-600/30">
                                    En Curso
                                </span>
                            </div>

                            <h3 class="font-black text-sm text-white group-hover:text-cyan-300 transition leading-snug">
                                {{ lvl.title }}
                            </h3>

                            <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {{ lvl.toolbox?.guide }}
                            </p>
                        </div>

                        <!-- Bottom Level Details -->
                        <div class="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                            <span class="text-[11px] font-mono text-slate-400">
                                {{ lvl.fabcoins_cost > 0 ? `Cost: ${lvl.fabcoins_cost} FC` : 'Sin costo FC' }}
                            </span>
                            <button
                                type="button"
                                class="px-3 py-1.5 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 text-xs font-black transition flex items-center gap-1"
                            >
                                <span>Entrar</span>
                                <ArrowRight class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ================================================================= -->
            <!-- MODO B: ESTUDIO DE TRABAJO A PANTALLA COMPLETA DEL NIVEL -->
            <!-- ================================================================= -->
            <section v-else-if="currentMode === 'studio'" class="space-y-4 animate-fade-in">
                <!-- BARRA DE NAVEGACIÓN DEL ESTUDIO -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            @click="backToRoadmap"
                            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                        >
                            <ArrowLeft class="w-4 h-4" />
                            <span>Volver a la Ruta</span>
                        </button>

                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Estudio de Fabricación • Nivel {{ selectedLevel.level_number }}</span>
                            <h2 class="text-base font-black text-white">{{ selectedLevel.title }}</h2>
                        </div>
                    </div>

                    <!-- SELECTOR DE PESTAÑAS EN EL ESTUDIO -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            type="button"
                            @click="studioTab = 'mission'"
                            :class="[
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                                studioTab === 'mission'
                                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                            ]"
                        >
                            <BookOpen class="w-3.5 h-3.5" />
                            <span>1. Misión y Tutorial</span>
                        </button>

                        <button
                            type="button"
                            @click="studioTab = 'inspection_3d'"
                            :class="[
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                                studioTab === 'inspection_3d'
                                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                            ]"
                        >
                            <Box class="w-3.5 h-3.5" />
                            <span>2. Inspección 3D IA</span>
                        </button>

                        <button
                            type="button"
                            @click="studioTab = 'bitacora'"
                            :class="[
                                'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap',
                                studioTab === 'bitacora'
                                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                            ]"
                        >
                            <Camera class="w-3.5 h-3.5" />
                            <span>3. Bitácora y Fotos</span>
                        </button>
                    </div>
                </div>

                <!-- PESTAÑA 1: MISIÓN & TUTORIALES BUNNY STREAM -->
                <div v-if="studioTab === 'mission'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-6 space-y-4">
                        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <BookOpen class="w-4 h-4 text-cyan-400" />
                                <span>Guía del Reto de Fabricación</span>
                            </h3>
                            <p class="text-xs text-slate-300 leading-relaxed">{{ selectedLevel?.toolbox?.guide }}</p>
                        </div>

                        <div v-if="selectedLevel?.toolbox?.resources?.length" class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                            <h4 class="text-xs font-bold text-slate-400">Recursos de Apoyo:</h4>
                            <div class="flex flex-wrap gap-2">
                                <a
                                    v-for="(res, idx) in selectedLevel.toolbox.resources"
                                    :key="idx"
                                    :href="res.url"
                                    target="_blank"
                                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 transition font-medium"
                                >
                                    <FileText class="w-3.5 h-3.5" />
                                    <span>{{ res.title }}</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-6">
                        <VideoTutorialPlayer
                            :title="`Video Tutorial: ${selectedLevel?.title}`"
                            type="bunny_stream"
                            source="https://iframe.mediadelivery.net/embed/demo"
                        />
                    </div>
                </div>

                <!-- PESTAÑA 2: INSPECCIÓN 3D Y CALIDAD CON GEMINI VISION -->
                <div v-else-if="studioTab === 'inspection_3d'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    <!-- LADO IZQUIERDO: VISOR 3D REAL (7 Cols) -->
                    <div class="lg:col-span-7 space-y-3">
                        <StlViewer3D
                            ref="viewerRef"
                            :file="selectedRealFile"
                            :fileUrl="preflightResult?.file_url || ''"
                            :dimensions="preflightResult?.metrics || { x_mm: 40, y_mm: 40, z_mm: 10 }"
                            :limits="selectedLevel.validation_rules || { max_x_mm: 50, max_y_mm: 50, max_z_mm: 15 }"
                            :isValid="preflightResult ? preflightResult.is_valid : true"
                            :fileName="selectedFileName || 'modelo.stl'"
                        />
                    </div>

                    <!-- LADO DERECHO: PANEL DE CONTROL Y DIAGNÓSTICO IA (5 Cols) -->
                    <div class="lg:col-span-5 space-y-4">
                        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                            <div>
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <Cpu class="w-4 h-4 text-cyan-400 animate-pulse" />
                                    <span>Control de Calidad IA (Gemini Vision)</span>
                                </h3>
                                <p class="text-xs text-slate-400 mt-0.5">Sube tu archivo .STL para que la IA inspeccione la pieza en 3D.</p>
                            </div>

                            <!-- Zona de Carga de Archivo -->
                            <div class="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-cyan-400 text-center space-y-2 transition">
                                <UploadCloud class="w-7 h-7 text-cyan-400 mx-auto" />
                                <div>
                                    <label class="cursor-pointer text-xs font-bold text-cyan-300 hover:underline">
                                        <span>Seleccionar archivo .STL o .SVG</span>
                                        <input type="file" @change="handleFileSelect" accept=".stl,.svg,.obj" class="hidden" />
                                    </label>
                                    <p v-if="selectedFileName" class="text-xs font-mono text-amber-300 mt-1 font-bold">
                                        📄 {{ selectedFileName }}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    @click="runPreflightCheck"
                                    :disabled="isScanning || !preflightForm.file"
                                    class="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                                >
                                    <Sparkles class="w-3.5 h-3.5" />
                                    <span>{{ isScanning ? 'Analizando con Gemini Vision...' : 'INSPECCIONAR PIEZA CON IA' }}</span>
                                </button>
                            </div>

                            <!-- Pruebas Rápidas Demo -->
                            <div>
                                <p class="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Simulaciones de prueba:</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        @click="createAndTestDemoFile('stl', true)"
                                        :disabled="isScanning"
                                        class="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 text-[10px] font-bold text-left transition"
                                    >
                                        ✓ STL Válido (40mm)
                                    </button>
                                    <button
                                        type="button"
                                        @click="createAndTestDemoFile('stl', false)"
                                        :disabled="isScanning"
                                        class="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-600/40 text-rose-300 text-[10px] font-bold text-left transition"
                                    >
                                        ✕ STL Excedido (75mm)
                                    </button>
                                </div>
                            </div>

                            <!-- RESULTADO DEL DIAGNÓSTICO IA -->
                            <div v-if="preflightResult" :class="[
                                'p-4 rounded-2xl border space-y-3 transition-all',
                                preflightResult.is_valid ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-rose-950/30 border-rose-500/50'
                            ]">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-1.5 font-black text-xs">
                                        <CheckCircle2 v-if="preflightResult.is_valid" class="w-4 h-4 text-emerald-400" />
                                        <XCircle v-else class="w-4 h-4 text-rose-400" />
                                        <span :class="preflightResult.is_valid ? 'text-emerald-300' : 'text-rose-300'">
                                            {{ preflightResult.is_valid ? 'DISEÑO APROBADO' : 'CORRECCIÓN REQUERIDA' }}
                                        </span>
                                    </div>
                                    <span class="text-[11px] font-mono font-bold text-slate-300">
                                        {{ preflightResult.metrics?.x_mm }}x{{ preflightResult.metrics?.y_mm }}x{{ preflightResult.metrics?.z_mm }} mm
                                    </span>
                                </div>

                                <!-- Ficha de Insumos -->
                                <div class="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono">
                                    <div class="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                                        <p class="text-[9px] text-slate-500">Material</p>
                                        <p class="font-bold text-cyan-300">{{ preflightResult.metrics?.material_grams }}g</p>
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                                        <p class="text-[9px] text-slate-500">Tiempo</p>
                                        <p class="font-bold text-purple-300">{{ preflightResult.metrics?.print_time_minutes }}m</p>
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                                        <p class="text-[9px] text-slate-500">Costo</p>
                                        <p class="font-bold text-amber-400">{{ preflightResult.metrics?.estimated_fc_cost }} FC</p>
                                    </div>
                                </div>

                                <!-- Feedback IA -->
                                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                                    <p class="text-[11px] font-bold text-cyan-300">🤖 Diagnóstico del Copiloto IA:</p>
                                    <p class="text-slate-300 leading-relaxed text-[11px]">{{ preflightResult.ai_feedback }}</p>
                                </div>

                                <!-- Botón Autorizar Fabricación -->
                                <div v-if="preflightResult.is_valid && selectedLevel.fabcoins_cost > 0">
                                    <button
                                        type="button"
                                        @click="confirmFabrication"
                                        :disabled="isFabricating || squad.fabcoins_balance < selectedLevel.fabcoins_cost"
                                        class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-40 transition"
                                    >
                                        <Printer class="w-4 h-4" />
                                        <span>AUTORIZAR IMPRESIÓN ({{ selectedLevel.fabcoins_cost }} FC)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PESTAÑA 3: BITÁCORA MULTIMEDIA Y FOTOS -->
                <div v-else-if="studioTab === 'bitacora'" class="space-y-6">
                    <form @submit.prevent="submitBitacora" class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1.5">
                                Registrar evidencia como:
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

                        <!-- Subir Foto Real -->
                        <div class="flex items-center gap-3">
                            <label class="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition">
                                <Camera class="w-4 h-4 text-cyan-400" />
                                <span>Subir Foto del Proceso / Pieza Real</span>
                                <input type="file" @change="handlePhotoSelect" accept="image/*" class="hidden" />
                            </label>
                            <span v-if="bitacoraForm.file" class="text-xs text-emerald-400 font-mono font-bold">
                                📷 {{ bitacoraForm.file.name }}
                            </span>
                        </div>

                        <div v-if="photoPreviewUrl" class="w-36 h-36 rounded-2xl overflow-hidden border border-slate-700">
                            <img :src="photoPreviewUrl" class="w-full h-full object-cover" />
                        </div>

                        <button
                            type="submit"
                            :disabled="bitacoraForm.processing || !bitacoraForm.content_text"
                            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                        >
                            <Send class="w-4 h-4" />
                            <span>GUARDAR EVIDENCIA EN LA BITÁCORA (+25 XP)</span>
                        </button>
                    </form>

                    <!-- Historial -->
                    <div class="space-y-3">
                        <h4 class="text-xs font-bold text-slate-400">Línea de Tiempo de Evidencias Guardadas:</h4>
                        <div v-if="currentLevelBitacoras.length" class="space-y-3">
                            <div
                                v-for="b in currentLevelBitacoras"
                                :key="b.id"
                                class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2"
                            >
                                <div class="flex items-center justify-between text-[11px]">
                                    <span class="font-bold text-cyan-300">{{ b.active_role_user?.name || 'Miembro' }}</span>
                                    <span :class="[
                                        'flex items-center gap-1 font-semibold text-[10px]',
                                        b.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                                    ]">
                                        <CheckCircle2 v-if="b.status === 'approved'" class="w-3.5 h-3.5" />
                                        <XCircle v-else class="w-3.5 h-3.5" />
                                        {{ b.status === 'approved' ? 'Aprobado' : 'Observado' }}
                                    </span>
                                </div>
                                <p class="text-slate-300">{{ b.content_text }}</p>

                                <div v-if="b.file_url" class="pt-1">
                                    <img :src="b.file_url" class="max-h-48 rounded-xl border border-slate-800 object-cover" />
                                </div>

                                <div v-if="b.ai_feedback" class="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-900/60 text-[11px] text-cyan-300">
                                    🤖 <strong>Diagnóstico IA:</strong> {{ b.ai_feedback }}
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-xs text-slate-500 text-center py-6 bg-slate-900/40 rounded-2xl border border-slate-850">
                            Aún no hay evidencias registradas en este nivel.
                        </div>
                    </div>
                </div>
            </section>

        </main>
    </div>
</template>
