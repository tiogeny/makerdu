<script setup>
import { Head, router, useForm, usePage, Link } from '@inertiajs/vue3';
import { ref, computed, watch, nextTick } from 'vue';
import {
    Sparkles, Coins, Trophy, Users, ShieldCheck, Wrench, CheckCircle2,
    Clock, BookOpen, ExternalLink, Send, FileText, ChevronRight, LogOut,
    Check, AlertCircle, ArrowUpRight, Flame, Layers, Laptop, UploadCloud,
    Cpu, XCircle, Printer, Hammer, Gauge, Globe, Box, Film, Camera, Image,
    Download, ArrowLeft, ArrowRight, Play, Lock, Award, Eye, Star, Heart, Lightbulb, Zap,
    PartyPopper, Compass, Palette, Scissors, CheckSquare, ListChecks
} from 'lucide-vue-next';
import StlViewer3D from '@/Components/StlViewer3D.vue';
import VideoTutorialPlayer from '@/Components/VideoTutorialPlayer.vue';
import AiTutorChatModal from '@/Components/AiTutorChatModal.vue';
import { t, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    squad: Object,
    activeStudent: Object,
    project: Object,
    bitacoras: Array,
    flash: Object,
});

const page = usePage();

// Vista principal: 'roadmap' o 'studio'
const currentMode = ref('roadmap');

// Paso activo del Stepper Guiado dentro del Estudio: 1, 2, 3 o 4
const currentStep = ref(2);

// Estado para Micro-Apps Autónomas Overlay
const activeMicroApp = ref(null);

const openMicroApp = (name, url, icon = '⚡') => {
    activeMicroApp.value = { name, url, icon };
};

const handleMicroAppAsset = (asset) => {
    if (asset && asset.content) {
        bitacoraForm.content_text = `Entregable generado con Micro-App '${asset.appName}': ${asset.fileName} (${asset.depth_mm || 5}mm de altura).`;
    }
};

// Modal de Celebración de Nivel Superado
const showVictoryModal = ref(false);

// Nivel seleccionado
const selectedLevelId = ref(props.project.levels[0]?.id || null);

const selectedLevel = computed(() => {
    return props.project.levels.find((l) => l.id === selectedLevelId.value) || props.project.levels[0];
});

// Tipo de entregable activo del nivel: 'stl_3d', 'photo_sketch', 'svg_laser', 'checklist_assembly'
const levelDeliverableType = computed(() => {
    const lvl = selectedLevel.value;
    return lvl?.toolbox?.deliverable_type || lvl?.validation_rules?.deliverable_type || (lvl?.level_number === 1 ? 'photo_sketch' : (lvl?.level_number === 4 ? 'checklist_assembly' : 'stl_3d'));
});

const openLevelStudio = (levelId, stepNumber = 1) => {
    selectedLevelId.value = levelId;
    currentStep.value = stepNumber;
    currentMode.value = 'studio';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const backToRoadmap = () => {
    currentMode.value = 'roadmap';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goToStep = (stepNumber) => {
    currentStep.value = stepNumber;
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

// Checklist interactivo para niveles de ensamble físico
const assemblyChecks = ref({
    bed_removal: true,
    deburred_edges: true,
    tight_fit: true,
    durability_test: false,
});

const allAssemblyChecksPassed = computed(() => {
    return Object.values(assemblyChecks.value).every(Boolean);
});

// Preview para fotos de boceto
const sketchPreviewUrl = ref(null);

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

    if (levelDeliverableType.value === 'photo_sketch') {
        sketchPreviewUrl.value = URL.createObjectURL(file);
    }
};

const runPreflightCheck = async () => {
    if (!selectedLevel.value || !preflightForm.file) return;
    isScanning.value = true;
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

// Confirmar Fabricación o Completar Reto Gratuito
const isFabricating = ref(false);
const confirmFabrication = () => {
    if (!selectedLevel.value) return;
    isFabricating.value = true;
    router.post(route('squad.fabricate', {
        squad: props.squad.id,
        level: selectedLevel.value.id,
    }), {}, {
        preserveScroll: true,
        onSuccess: () => {
            showVictoryModal.value = true;
        },
        onFinish: () => {
            isFabricating.value = false;
        },
    });
};

// Formulario de Autoevaluación & Reflexión Metacognitiva (+50 XP)
const reflectionForm = useForm({
    design_challenge_solved: '',
    fabcoins_strategy: '',
    self_rating: 5,
});

const submitReflection = () => {
    if (!selectedLevel.value) return;
    const combinedContent = `[AUTORREFLEXIÓN METACOGNITIVA MAKER ⭐${reflectionForm.self_rating}/5]\n\n• Reto resuelto: ${reflectionForm.design_challenge_solved}\n• Estrategia y Acabado: ${reflectionForm.fabcoins_strategy}`;

    bitacoraForm.content_text = combinedContent;
    submitBitacora();
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
            reflectionForm.reset();
            goToStep(4);
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

const activeModelInfo = computed(() => {
    if (preflightResult.value?.metrics) {
        return {
            file_name: selectedFileName.value || preflightResult.value.file_name || 'AreteAmazon.stl',
            x_mm: preflightResult.value.metrics.x_mm || 40,
            y_mm: preflightResult.value.metrics.y_mm || 47.5,
            z_mm: preflightResult.value.metrics.z_mm || 4,
            material_grams: preflightResult.value.metrics.material_grams || 4.3,
        };
    }
    if (selectedFileName.value) {
        return {
            file_name: selectedFileName.value,
            x_mm: 40,
            y_mm: 47.5,
            z_mm: 4,
            material_grams: 4.3,
        };
    }
    return null;
});

const nextLevel = computed(() => {
    const currentIdx = props.project.levels.findIndex(l => l.id === selectedLevel.value?.id);
    if (currentIdx !== -1 && currentIdx + 1 < props.project.levels.length) {
        return props.project.levels[currentIdx + 1];
    }
    return null;
});

const getDeliverableBadge = (type) => {
    switch(type) {
        case 'photo_sketch': return { label: 'Boceto / Ideación', icon: Palette, color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
        case 'svg_laser': return { label: 'Corte Láser 2D', icon: Scissors, color: 'text-purple-400 bg-purple-950/60 border-purple-500/40' };
        case 'checklist_assembly': return { label: 'Ensamble Físico', icon: Wrench, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
        default: return { label: 'Impresión 3D STL', icon: Box, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' };
    }
};
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
                        <Link
                            :href="route('squad.passport', { squad: squad.id })"
                            class="px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <Award class="w-4 h-4" />
                            <span>Pasaporte Maker</span>
                        </Link>

                        <span class="text-xs font-bold px-3 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                            {{ project.total_levels }} Niveles
                        </span>
                    </div>
                </div>

                <!-- WORLD MAP: NIVELES INTERACTIVOS EN RUTA -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        v-for="(lvl, idx) in project.levels"
                        :key="lvl.id"
                        @click="openLevelStudio(lvl.id, 1)"
                        class="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                    >
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800">
                                    NIVEL {{ lvl.level_number }}
                                </span>
                                
                                <span :class="['flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg border', getDeliverableBadge(lvl.toolbox?.deliverable_type || (lvl.level_number === 1 ? 'photo_sketch' : (lvl.level_number === 4 ? 'checklist_assembly' : 'stl_3d'))).color]">
                                    {{ getDeliverableBadge(lvl.toolbox?.deliverable_type || (lvl.level_number === 1 ? 'photo_sketch' : (lvl.level_number === 4 ? 'checklist_assembly' : 'stl_3d'))).label }}
                                </span>
                            </div>

                            <h3 class="font-black text-sm text-white group-hover:text-cyan-300 transition leading-snug">
                                {{ lvl.title }}
                            </h3>

                            <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {{ lvl.toolbox?.guide }}
                            </p>
                        </div>

                        <div class="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                            <span class="text-[11px] font-mono text-slate-400">
                                {{ lvl.fabcoins_cost > 0 ? `Cost: ${lvl.fabcoins_cost} FC` : 'Sin costo FC' }}
                            </span>
                            <button
                                type="button"
                                class="px-3 py-1.5 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 text-xs font-black transition flex items-center gap-1"
                            >
                                <span>Iniciar</span>
                                <ArrowRight class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ================================================================= -->
            <!-- MODO B: ESTUDIO DE TRABAJO CON STEPPER GUIADO ADAPTABLE -->
            <!-- ================================================================= -->
            <section v-else-if="currentMode === 'studio'" class="space-y-6 animate-fade-in">
                
                <!-- HEADER DEL ESTUDIO CON NAVEGACIÓN Y STEPPER GUIADO -->
                <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Nivel {{ selectedLevel.level_number }}</span>
                                    <span :class="['text-[9px] font-bold px-2 py-0.5 rounded-md border', getDeliverableBadge(levelDeliverableType).color]">
                                        {{ getDeliverableBadge(levelDeliverableType).label }}
                                    </span>
                                </div>
                                <h2 class="text-base font-black text-white">{{ selectedLevel.title }}</h2>
                            </div>
                        </div>

                        <!-- Badge de Costo del Nivel -->
                        <div class="flex items-center gap-2">
                            <span v-if="selectedLevel.fabcoins_cost > 0" class="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-600/40">
                                🪙 Costo: {{ selectedLevel.fabcoins_cost }} FC
                            </span>
                            <span v-else class="text-xs font-bold text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-600/40">
                                🎁 Reto Sin Costo FC (+XP)
                            </span>
                        </div>
                    </div>

                    <!-- STEPPER GUIADO VISUAL (4 PASOS ADAPTABLES) -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                        <!-- Paso 1 -->
                        <button
                            type="button"
                            @click="goToStep(1)"
                            :class="[
                                'p-3 rounded-2xl border text-left transition flex items-center gap-2.5',
                                currentStep === 1
                                    ? 'bg-gradient-to-r from-cyan-950 to-slate-900 border-cyan-400 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                                    : (currentStep > 1 ? 'bg-slate-950/70 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/40 border-slate-800 text-slate-400')
                            ]"
                        >
                            <div :class="[
                                'w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0',
                                currentStep === 1 ? 'bg-cyan-400 text-slate-950' : (currentStep > 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400')
                            ]">
                                <Check v-if="currentStep > 1" class="w-4 h-4 stroke-[3]" />
                                <span v-else>1</span>
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Paso 1</p>
                                <p :class="['text-xs font-black truncate', currentStep === 1 ? 'text-white' : 'text-slate-300']">Misión y Video</p>
                            </div>
                        </button>

                        <!-- Paso 2 (Nombre Adaptable según deliverable_type) -->
                        <button
                            type="button"
                            @click="goToStep(2)"
                            :class="[
                                'p-3 rounded-2xl border text-left transition flex items-center gap-2.5',
                                currentStep === 2
                                    ? 'bg-gradient-to-r from-cyan-950 to-slate-900 border-cyan-400 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/50'
                                    : (currentStep > 2 ? 'bg-slate-950/70 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/40 border-slate-800 text-slate-400')
                            ]"
                        >
                            <div :class="[
                                'w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0',
                                currentStep === 2 ? 'bg-cyan-400 text-slate-950' : (currentStep > 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400')
                            ]">
                                <Check v-if="currentStep > 2" class="w-4 h-4 stroke-[3]" />
                                <span v-else>2</span>
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Paso 2</p>
                                <p :class="['text-xs font-black truncate', currentStep === 2 ? 'text-white' : 'text-slate-300']">
                                    {{ levelDeliverableType === 'photo_sketch' ? 'Boceto Inicial' : (levelDeliverableType === 'checklist_assembly' ? 'Ensamble y Pruebas' : (levelDeliverableType === 'svg_laser' ? 'Inspección Láser 2D' : 'Inspección 3D IA')) }}
                                </p>
                            </div>
                        </button>

                        <!-- Paso 3 -->
                        <button
                            type="button"
                            @click="goToStep(3)"
                            :class="[
                                'p-3 rounded-2xl border text-left transition flex items-center gap-2.5',
                                currentStep === 3
                                    ? 'bg-gradient-to-r from-amber-950/50 to-slate-900 border-amber-400 shadow-md shadow-amber-950/50 ring-1 ring-amber-400/50'
                                    : (currentStep > 3 ? 'bg-slate-950/70 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/40 border-slate-800 text-slate-400')
                            ]"
                        >
                            <div :class="[
                                'w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0',
                                currentStep === 3 ? 'bg-amber-400 text-slate-950' : (currentStep > 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400')
                            ]">
                                <Check v-if="currentStep > 3" class="w-4 h-4 stroke-[3]" />
                                <span v-else>3</span>
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Paso 3</p>
                                <p :class="['text-xs font-black truncate', currentStep === 3 ? 'text-white' : 'text-slate-300']">Autoreflexión (+50 XP)</p>
                            </div>
                        </button>

                        <!-- Paso 4 -->
                        <button
                            type="button"
                            @click="goToStep(4)"
                            :class="[
                                'p-3 rounded-2xl border text-left transition flex items-center gap-2.5',
                                currentStep === 4
                                    ? 'bg-gradient-to-r from-emerald-950 to-slate-900 border-emerald-400 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/50'
                                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                            ]"
                        >
                            <div :class="[
                                'w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0',
                                currentStep === 4 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                            ]">
                                <span>4</span>
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Paso 4</p>
                                <p :class="['text-xs font-black truncate', currentStep === 4 ? 'text-white' : 'text-slate-300']">
                                    {{ selectedLevel.fabcoins_cost > 0 ? 'Fabricar & FC' : 'Completar Nivel' }}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- PASO 1: COMPRENDER (MISIÓN & TUTORIAL BUNNY STREAM) -->
                <!-- ========================================================= -->
                <div v-if="currentStep === 1" class="space-y-6 animate-fade-in">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div class="lg:col-span-6 space-y-4">
                            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                                <div class="flex items-center gap-2 text-cyan-400 font-black text-sm">
                                    <Compass class="w-5 h-5" />
                                    <span>Objetivo de la Misión</span>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed">{{ selectedLevel?.toolbox?.guide }}</p>
                            </div>

                            <div v-if="selectedLevel?.toolbox?.resources?.length" class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                                <h4 class="text-xs font-bold text-slate-400">Recursos y Archivos de Apoyo:</h4>
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

                        <div class="lg:col-span-6 space-y-4">
                            <VideoTutorialPlayer
                                :title="`Video Tutorial: ${selectedLevel?.title}`"
                                type="bunny_stream"
                                source="https://iframe.mediadelivery.net/embed/demo"
                            />
                        </div>
                    </div>

                    <!-- FOOTER NAVEGACIÓN PASO 1 -->
                    <div class="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span class="text-xs text-slate-400">¿Listos para comenzar con el entregable?</span>
                        <button
                            type="button"
                            @click="goToStep(2)"
                            class="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
                        >
                            <span>Ir al Paso 2: Creación</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- PASO 2: CREACIÓN ADAPTABLE SEGÚN DELIVERABLE_TYPE -->
                <!-- ========================================================= -->
                <div v-else-if="currentStep === 2" class="space-y-6 animate-fade-in">
                    
                    <!-- CASO A: BOCETO / IDEACIÓN (PHOTO_SKETCH) -->
                    <div v-if="levelDeliverableType === 'photo_sketch'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div class="lg:col-span-6 space-y-4">
                            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                                <div class="flex items-center gap-2 text-amber-400 font-black text-sm">
                                    <Palette class="w-5 h-5" />
                                    <span>Lienzo de Ideación y Bocetado</span>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    Dibuja tu concepto en papel o en una pizarra con tu escuadra. Define las dimensiones estimadas (máximo {{ selectedLevel.validation_rules?.max_x_mm || 50 }}x{{ selectedLevel.validation_rules?.max_y_mm || 50 }} mm) antes de pasar al modelado 3D.
                                </p>

                                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                                    <p class="font-bold text-amber-300">📋 Rúbrica de Diseño del Nivel 1:</p>
                                    <ul class="space-y-1.5 text-slate-400 text-[11px]">
                                        <li class="flex items-center gap-2">✓ Proporciones equilibradas y silueta clara.</li>
                                        <li class="flex items-center gap-2">✓ Identificación de zonas planas para apoyo magnético.</li>
                                        <li class="flex items-center gap-2">✓ Indicación de orificios o relieves previstos.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-6 space-y-4">
                            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <Camera class="w-4 h-4 text-cyan-400" />
                                    <span>Subir Foto del Boceto en Papel</span>
                                </h3>

                                <div class="p-5 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-cyan-400 text-center space-y-3 transition">
                                    <UploadCloud class="w-8 h-8 text-cyan-400 mx-auto" />
                                    <label class="cursor-pointer text-xs font-bold text-cyan-300 hover:underline block">
                                        <span>Tomar foto o subir imagen del boceto</span>
                                        <input type="file" @change="handleFileSelect" accept="image/*" class="hidden" />
                                    </label>
                                    <span v-if="selectedFileName" class="text-xs text-emerald-400 font-mono font-bold block">
                                        📷 {{ selectedFileName }}
                                    </span>
                                </div>

                                <div v-if="sketchPreviewUrl" class="w-full h-48 rounded-2xl overflow-hidden border border-slate-700">
                                    <img :src="sketchPreviewUrl" class="w-full h-full object-contain bg-slate-950" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CASO B: ENSAMBLAJE Y PRUEBAS FÍSICAS (CHECKLIST_ASSEMBLY) -->
                    <div v-else-if="levelDeliverableType === 'checklist_assembly'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div class="lg:col-span-6 space-y-4">
                            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                                <div class="flex items-center gap-2 text-emerald-400 font-black text-sm">
                                    <Wrench class="w-5 h-5" />
                                    <span>Guía de Ensamble y Post-Procesado</span>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    Llegó el momento de retirar la pieza de la impresora 3D, remover rebabas con lija suave, colocar los aros de bisutería o accesorios y realizar las pruebas de calidad física.
                                </p>

                                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                                    <p class="font-bold text-cyan-300">💡 Trucos de Taller:</p>
                                    <p class="text-slate-400 text-[11px]">
                                        Usa una lija al agua de grano 400 para pulir los relieves antes de colocar la argolla superior. Si vas a pintar a mano, aplica una capa ligera de laca para fijar el color.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-6 space-y-4">
                            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <CheckSquare class="w-4 h-4 text-emerald-400" />
                                    <span>Checklist de Calidad Física</span>
                                </h3>

                                <div class="space-y-2.5">
                                    <label class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs cursor-pointer hover:border-emerald-500/50 transition">
                                        <input type="checkbox" v-model="assemblyChecks.bed_removal" class="w-4 h-4 rounded text-emerald-500 focus:ring-0" />
                                        <span class="text-slate-200">Pieza despegada de la cama sin fracturas ni warping.</span>
                                    </label>

                                    <label class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs cursor-pointer hover:border-emerald-500/50 transition">
                                        <input type="checkbox" v-model="assemblyChecks.deburred_edges" class="w-4 h-4 rounded text-emerald-500 focus:ring-0" />
                                        <span class="text-slate-200">Bordes lijados y orificio de enganche limpio.</span>
                                    </label>

                                    <label class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs cursor-pointer hover:border-emerald-500/50 transition">
                                        <input type="checkbox" v-model="assemblyChecks.tight_fit" class="w-4 h-4 rounded text-emerald-500 focus:ring-0" />
                                        <span class="text-slate-200">Argolla o accesorio de ensamble colocado con firmeza.</span>
                                    </label>

                                    <label class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs cursor-pointer hover:border-emerald-500/50 transition">
                                        <input type="checkbox" v-model="assemblyChecks.durability_test" class="w-4 h-4 rounded text-emerald-500 focus:ring-0" />
                                        <span class="text-slate-200">Prueba de resistencia superada (soporta el peso sin ceder).</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CASO C: IMPRESIÓN 3D STL (STL_3D) -->
                    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <!-- Visor 3D (7 Cols) -->
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

                        <!-- Mini-Dashboard IA (5 Cols) -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                                <div>
                                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                        <Cpu class="w-4 h-4 text-cyan-400 animate-pulse" />
                                        <span>Control de Calidad IA (Gemini Vision)</span>
                                    </h3>
                                    <p class="text-xs text-slate-400 mt-0.5">Sube tu archivo .STL para que la IA inspeccione la geometría en 3D.</p>
                                </div>

                                <!-- Carga de Archivo -->
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

                                <!-- Pruebas Demo -->
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

                                <!-- Mini-Dashboard IA -->
                                <div v-if="preflightResult" class="space-y-3 pt-2">
                                    <div :class="[
                                        'p-4 rounded-2xl border space-y-2 transition-all',
                                        preflightResult.is_valid ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-rose-950/30 border-rose-500/50'
                                    ]">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2 font-black text-xs">
                                                <CheckCircle2 v-if="preflightResult.is_valid" class="w-4 h-4 text-emerald-400" />
                                                <XCircle v-else class="w-4 h-4 text-rose-400" />
                                                <span :class="preflightResult.is_valid ? 'text-emerald-300' : 'text-rose-300'">
                                                    {{ preflightResult.dashboard?.verdict_title || (preflightResult.is_valid ? '¡DISEÑO APROBADO!' : 'REQUIERE AJUSTE EN TINKERCAD') }}
                                                </span>
                                            </div>

                                            <span v-if="preflightResult.dashboard?.tokens_used" class="text-[9px] font-mono text-cyan-400/80 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                                                <Zap class="w-3 h-3 text-amber-400" />
                                                <span>~{{ preflightResult.dashboard.tokens_used }} tk</span>
                                            </span>
                                        </div>

                                        <p class="text-xs text-slate-200 font-semibold leading-snug">
                                            {{ preflightResult.dashboard?.headline || preflightResult.ai_feedback }}
                                        </p>
                                    </div>

                                    <!-- Aspectos Destacados -->
                                    <div v-if="preflightResult.dashboard?.strengths?.length" class="space-y-1.5">
                                        <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">🌟 Aspectos destacados por la IA:</p>
                                        <div class="space-y-1.5">
                                            <div
                                                v-for="(st, idx) in preflightResult.dashboard.strengths"
                                                :key="idx"
                                                class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-200 flex items-start gap-2"
                                            >
                                                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                <span class="leading-snug">{{ st }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Parámetros de Laminado -->
                                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                                        <p class="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">⚙️ Recomendaciones de Fabricación:</p>
                                        <div class="grid grid-cols-3 gap-2 text-center text-[10px]">
                                            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
                                                <p class="text-slate-500 font-mono">Boquilla</p>
                                                <p class="font-bold text-cyan-300 mt-0.5">{{ preflightResult.dashboard?.slicing_recommendations?.nozzle || '0.4 mm' }}</p>
                                            </div>
                                            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
                                                <p class="text-slate-500 font-mono">Capa</p>
                                                <p class="font-bold text-purple-300 mt-0.5">{{ preflightResult.dashboard?.slicing_recommendations?.layer_height || '0.16-0.2mm' }}</p>
                                            </div>
                                            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
                                                <p class="text-slate-500 font-mono">Relleno</p>
                                                <p class="font-bold text-amber-300 mt-0.5">{{ preflightResult.dashboard?.slicing_recommendations?.infill || '15%' }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- FOOTER NAVEGACIÓN PASO 2 -->
                    <div class="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <button
                            type="button"
                            @click="goToStep(1)"
                            class="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
                        >
                            <ArrowLeft class="w-4 h-4" />
                            <span>Paso 1: Misión</span>
                        </button>

                        <button
                            type="button"
                            @click="goToStep(3)"
                            class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                        >
                            <span>Paso 3: Autoreflexión (+50 XP)</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- PASO 3: REFLEXIONAR (METACOGNICIÓN MAKER +50 XP) -->
                <!-- ========================================================= -->
                <div v-else-if="currentStep === 3" class="max-w-3xl mx-auto space-y-6 animate-fade-in">
                    <div class="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/40 space-y-2 shadow-2xl">
                        <div class="flex items-center gap-2">
                            <Lightbulb class="w-6 h-6 text-amber-400" />
                            <h3 class="text-base font-black text-white">Autoevaluación y Pensamiento Crítico Maker</h3>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">
                            La IA es tu copiloto, pero el criterio es de tu equipo. Reflexionen sobre las decisiones técnicas tomadas en este reto para desbloquear el **Bono Metacognitivo de +50 XP**.
                        </p>
                    </div>

                    <form @submit.prevent="submitReflection" class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl">
                        <div>
                            <label class="block text-xs font-bold text-cyan-300 mb-1.5">
                                1. ¿Cuál fue el mayor desafío geométrico o técnico que resolvió el equipo en este modelo? *
                            </label>
                            <textarea
                                v-model="reflectionForm.design_challenge_solved"
                                rows="3"
                                placeholder="Ej: Mantener los relieves simétricos de 4mm y asegurar que el orificio del aro no debilite la estructura exterior..."
                                class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-amber-300 mb-1.5">
                                2. ¿Qué decisiones tomaron para ahorrar FabCoins o darle resistencia a la pieza? *
                            </label>
                            <textarea
                                v-model="reflectionForm.fabcoins_strategy"
                                rows="3"
                                placeholder="Ej: Redujimos la altura innecesaria a 4mm y planeamos usar 15% de relleno para no exceder los 4.3 gramos de material..."
                                class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                                required
                            ></textarea>
                        </div>

                        <!-- Autovaloración Estrellas -->
                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-2">
                                3. ¿Qué tan satisfechos están con el resultado final del prototipo? (1 a 5 estrellas)
                            </label>
                            <div class="flex items-center gap-2">
                                <button
                                    v-for="star in 5"
                                    :key="star"
                                    type="button"
                                    @click="reflectionForm.self_rating = star"
                                    class="p-2 rounded-xl bg-slate-950 border border-slate-800 transition transform hover:scale-110"
                                >
                                    <Star :class="['w-6 h-6', star <= reflectionForm.self_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600']" />
                                </button>
                                <span class="text-xs font-bold text-amber-300 ml-2">{{ reflectionForm.self_rating }}/5 Estrellas</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            :disabled="reflectionForm.processing || !reflectionForm.design_challenge_solved || !reflectionForm.fabcoins_strategy"
                            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
                        >
                            <Award class="w-4 h-4" />
                            <span>GUARDAR REFLEXIÓN Y AVANZAR AL PASO 4 (+50 XP)</span>
                        </button>
                    </form>

                    <!-- FOOTER NAVEGACIÓN PASO 3 -->
                    <div class="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <button
                            type="button"
                            @click="goToStep(2)"
                            class="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
                        >
                            <ArrowLeft class="w-4 h-4" />
                            <span>Paso 2: Creación</span>
                        </button>

                        <button
                            type="button"
                            @click="goToStep(4)"
                            class="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
                        >
                            <span>Paso 4: Finalizar</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- PASO 4: FABRICAR / COMPLETAR RETO (ADAPTABLE FC) -->
                <!-- ========================================================= -->
                <div v-else-if="currentStep === 4" class="space-y-6 animate-fade-in">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        <!-- Columna Izquierda: Panel de Autorización o Completar Reto (5 Cols) -->
                        <div class="lg:col-span-5 space-y-4">
                            
                            <!-- CASO 1: REQUIERE FABCOINS (3D PRINT / LASER) -->
                            <div v-if="selectedLevel.fabcoins_cost > 0" class="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-2xl">
                                <div class="flex items-center gap-2.5 text-amber-400 font-black text-sm">
                                    <Printer class="w-5 h-5" />
                                    <span>Autorización de Fabricación Física</span>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    Al autorizar la impresión, se consumirán los FabCoins requeridos para el filamento y el archivo pasará al lote de producción del docente.
                                </p>

                                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-400">Balance Actual:</span>
                                        <span class="font-mono font-bold text-amber-300">{{ squad.fabcoins_balance }} FC</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-slate-400">Costo de Insumos:</span>
                                        <span class="font-mono font-bold text-rose-400">-{{ selectedLevel.fabcoins_cost }} FC</span>
                                    </div>
                                    <div class="pt-2 border-t border-slate-800 flex justify-between text-xs font-black">
                                        <span class="text-white">Balance Final:</span>
                                        <span class="font-mono text-cyan-300">{{ squad.fabcoins_balance - selectedLevel.fabcoins_cost }} FC</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    @click="confirmFabrication"
                                    :disabled="isFabricating || squad.fabcoins_balance < selectedLevel.fabcoins_cost"
                                    class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 disabled:opacity-40 transition transform active:scale-95"
                                >
                                    <Printer class="w-4 h-4" />
                                    <span>{{ isFabricating ? 'Autorizando Fabricación...' : `AUTORIZAR IMPRESIÓN (${selectedLevel.fabcoins_cost} FC)` }}</span>
                                </button>
                            </div>

                            <!-- CASO 2: RETO SIN COSTO FC (BOCETO / ENSAMBLE FINAL) -->
                            <div v-else class="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/40 space-y-4 shadow-2xl">
                                <div class="flex items-center gap-2.5 text-emerald-400 font-black text-sm">
                                    <Award class="w-5 h-5" />
                                    <span>Completar Misión Pedagógica</span>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed">
                                    ¡Gran trabajo escuadra! Este reto no requiere gasto de FabCoins de insumos. Al confirmar, registrarán su avance y recibirán sus **+100 XP**.
                                </p>

                                <button
                                    type="button"
                                    @click="confirmFabrication"
                                    :disabled="isFabricating"
                                    class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition transform active:scale-95"
                                >
                                    <CheckCircle2 class="w-4 h-4" />
                                    <span>{{ isFabricating ? 'Guardando Progreso...' : 'CONFIRMAR Y FINALIZAR NIVEL (+100 XP)' }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Columna Derecha: Registro de Fotos Reales en Bitácora (7 Cols) -->
                        <div class="lg:col-span-7 space-y-4">
                            <form @submit.prevent="submitBitacora" class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
                                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                    <Camera class="w-4 h-4 text-cyan-400" />
                                    <span>Subir Foto de la Pieza Fabricada a la Bitácora</span>
                                </h3>

                                <textarea
                                    v-model="bitacoraForm.content_text"
                                    rows="2"
                                    placeholder="Nota final del equipo sobre el resultado físico impreso o ensamble..."
                                    class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                ></textarea>

                                <div class="flex items-center gap-3">
                                    <label class="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition">
                                        <Camera class="w-4 h-4 text-cyan-400" />
                                        <span>Adjuntar Foto Real</span>
                                        <input type="file" @change="handlePhotoSelect" accept="image/*" class="hidden" />
                                    </label>
                                    <span v-if="bitacoraForm.file" class="text-xs text-emerald-400 font-mono font-bold">
                                        📷 {{ bitacoraForm.file.name }}
                                    </span>
                                </div>

                                <div v-if="photoPreviewUrl" class="w-32 h-32 rounded-2xl overflow-hidden border border-slate-700">
                                    <img :src="photoPreviewUrl" class="w-full h-full object-cover" />
                                </div>

                                <button
                                    type="submit"
                                    :disabled="bitacoraForm.processing || !bitacoraForm.content_text"
                                    class="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                                >
                                    <Send class="w-4 h-4" />
                                    <span>GUARDAR EN PORTAFOLIO (+25 XP)</span>
                                </button>
                            </form>

                            <!-- Línea de Tiempo de Evidencias -->
                            <div class="space-y-3">
                                <h4 class="text-xs font-bold text-slate-400">Evidencias Guardadas de este Reto:</h4>
                                <div v-if="currentLevelBitacoras.length" class="space-y-2">
                                    <div
                                        v-for="b in currentLevelBitacoras"
                                        :key="b.id"
                                        class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2"
                                    >
                                        <div class="flex items-center justify-between text-[11px]">
                                            <span class="font-bold text-cyan-300">{{ b.active_role_user?.name || 'Miembro' }}</span>
                                            <span class="flex items-center gap-1 font-semibold text-[10px] text-emerald-400">
                                                <CheckCircle2 class="w-3.5 h-3.5" /> Aprobado
                                            </span>
                                        </div>
                                        <p class="text-slate-300 whitespace-pre-line">{{ b.content_text }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>

        <!-- ================================================================= -->
        <!-- MODAL DE VICTORIA & CELEBRACIÓN DE NIVEL COMPLETADO -->
        <!-- ================================================================= -->
        <div
            v-if="showVictoryModal"
            class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
            <div class="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
                <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 mx-auto shadow-2xl shadow-amber-500/40 animate-bounce">
                    <PartyPopper class="w-10 h-10" />
                </div>

                <div class="space-y-2">
                    <span class="text-[11px] uppercase font-mono font-bold tracking-widest text-amber-400">¡Misión Cumplida!</span>
                    <h2 class="text-2xl font-black text-white">¡NIVEL {{ selectedLevel.level_number }} SUPERADO CON ÉXITO!</h2>
                    <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        {{ selectedLevel.fabcoins_cost > 0 ? `Tu pieza '${activeModelInfo?.file_name || 'Modelo 3D'}' ha sido validada por la IA y enviada a la cola de fabricación física.` : 'Has completado este reto pedagógico con éxito.' }}
                    </p>
                </div>

                <!-- Resumen de Recompensas -->
                <div class="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <div class="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-center">
                        <p class="text-[10px] text-purple-300 uppercase font-bold">XP Ganados</p>
                        <p class="text-base font-black text-purple-200">+100 XP</p>
                    </div>
                    <div class="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-center">
                        <p class="text-[10px] text-amber-300 uppercase font-bold">FabCoins Invertidos</p>
                        <p class="text-base font-black text-amber-200">{{ selectedLevel.fabcoins_cost > 0 ? `-${selectedLevel.fabcoins_cost} FC` : '0 FC (Gratis)' }}</p>
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div class="space-y-2 pt-2">
                    <button
                        v-if="nextLevel"
                        type="button"
                        @click="showVictoryModal = false; openLevelStudio(nextLevel.id, 1)"
                        class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition"
                    >
                        <span>AVANZAR AL NIVEL {{ nextLevel.level_number }} 🚀</span>
                        <ArrowRight class="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        @click="showVictoryModal = false; backToRoadmap()"
                        class="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                    >
                        Volver al Mapa de Retos
                    </button>
                </div>
            </div>
        </div>

        <!-- WIDGET FLOTANTE CHATBOT TUTOR IA (GEMINI FLASH) -->
        <AiTutorChatModal
            :squad="squad"
            :activeStudent="activeStudent"
            :selectedLevelId="selectedLevelId"
            :activeModelInfo="activeModelInfo"
        />
    </div>
</template>
