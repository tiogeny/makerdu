<script setup>
import { Head, router, useForm, usePage, Link } from '@inertiajs/vue3';
import { ref, computed, watch, nextTick } from 'vue';
import {
    Sparkles, Coins, Trophy, Users, ShieldCheck, Wrench, CheckCircle2,
    Clock, BookOpen, ExternalLink, Send, FileText, ChevronRight, LogOut,
    Check, AlertCircle, ArrowUpRight, Flame, Layers, Laptop, UploadCloud,
    Cpu, XCircle, Printer, Hammer, Gauge, Globe, Box, Film, Camera, Image,
    Download, ArrowLeft, ArrowRight, Play, Lock, Award, Eye, Star, Heart, Lightbulb, Zap,
    PartyPopper, Compass, Palette, Scissors, CheckSquare, ListChecks, Sun, Moon,
    ChevronDown, UserCheck, RefreshCw, Undo2
} from 'lucide-vue-next';
import StlViewer3D from '@/Components/StlViewer3D.vue';
import VideoTutorialPlayer from '@/Components/VideoTutorialPlayer.vue';
import AiTutorChatModal from '@/Components/AiTutorChatModal.vue';
import MicroAppOverlay from '@/Components/MicroAppOverlay.vue';
import { t, trans, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    squad: {
        type: Object,
        required: true,
    },
    activeStudent: {
        type: Object,
        required: true,
    },
    project: {
        type: Object,
        required: true,
    },
    animations: {
        type: Array,
        default: () => [],
    },
    microApps: {
        type: Array,
        default: () => [],
    },
    bitacoras: {
        type: Array,
        default: () => [],
    },
    flash: {
        type: Object,
        default: () => ({}),
    },
});

const page = usePage();

// TEMA: Claro por defecto (Estilo Google Learn About / Papel limpio)
const isDarkTheme = ref(false);

const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
};

// Menú desplegable de Avatar de Escuadra
const showUserMenu = ref(false);

// Micro-Apps Overlay
const activeTestingApp = ref(null);
const showMicroAppModal = ref(false);

const openMicroAppModal = (app) => {
    activeTestingApp.value = app;
    showMicroAppModal.value = true;
};

const handleMicroAppAsset = (asset) => {
    if (asset && asset.content) {
        bitacoraForm.content_text = `Entregable generado con Micro-App '${asset.appName || 'Makerdu'}': ${asset.fileName || 'archivo'} (${asset.depth_mm || 10} mm espesor).`;
        showMicroAppModal.value = false;
    }
};

// Misión activa seleccionada (Navegación no restrictiva)
const selectedMissionIndex = ref(0);
const highestCompletedIndex = ref(0);

// Nivel / Misión seleccionada
const selectedMission = computed(() => {
    return props.project.levels[selectedMissionIndex.value] || props.project.levels[0];
});

// Comprobar si el alumno está regresando de una misión más avanzada
const isReturningToPreviousMission = computed(() => {
    return selectedMissionIndex.value < highestCompletedIndex.value;
});

// Formulario de Bitácora y Entrega
const bitacoraForm = useForm({
    content_text: '',
    file: null,
    reflection_text: '',
    allow_iteration: true,
});

const preflightLoading = ref(false);
const preflightResult = ref(props.flash?.preflight_result || null);

// Manejo de archivo
const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    bitacoraForm.file = file;
};

// Ejecutar Preflight con Gemini Vision
const runPreflightCheck = () => {
    if (!bitacoraForm.file) {
        alert('Por favor selecciona o arrastra una foto o archivo STL antes de auditar.');
        return;
    }

    preflightLoading.value = true;
    preflightResult.value = null;

    const formData = new FormData();
    formData.append('file', bitacoraForm.file);
    formData.append('level_id', selectedMission.value.id);

    router.post(route('squad.preflight', { squad: props.squad.id }), formData, {
        preserveScroll: true,
        onSuccess: (pageResp) => {
            preflightLoading.value = false;
            preflightResult.value = pageResp.props.flash?.preflight_result;
        },
        onError: () => {
            preflightLoading.value = false;
            alert('Error al conectar con el Copiloto IA. Inténtalo de nuevo.');
        },
    });
};

// Enviar Bitácora y Avanzar
const submitMissionEvidence = () => {
    bitacoraForm.post(route('squad.bitacora.submit', { squad: props.squad.id, level: selectedMission.value.id }), {
        preserveScroll: true,
        onSuccess: () => {
            if (selectedMissionIndex.value >= highestCompletedIndex.value) {
                highestCompletedIndex.value = selectedMissionIndex.value + 1;
            }
            if (selectedMissionIndex.value < props.project.levels.length - 1) {
                selectedMissionIndex.value++;
            }
            bitacoraForm.reset();
            preflightResult.value = null;
        },
    });
};

// Seleccionar misión desde la ruta lateral
const selectMission = (idx) => {
    selectedMissionIndex.value = idx;
    preflightResult.value = null;
};

// Helper para encontrar animación
const getMissionAnimation = (mission) => {
    const resList = mission.inputs?.resources_list || [];
    const animRes = resList.find(r => r.type === 'animation');
    if (animRes && animRes.animation_slug) {
        const found = props.animations.find(a => a.slug === animRes.animation_slug);
        if (found) return found.html_css_code;
    }
    return null;
};

// Helper para encontrar micro-apps disponibles en la misión
const getMissionMicroApps = (mission) => {
    const slugs = mission.process?.micro_app_slugs || (mission.process?.micro_app_slug ? [mission.process.micro_app_slug] : []);
    if (slugs.length === 0) return props.microApps.slice(0, 2);
    return props.microApps.filter(app => slugs.includes(app.slug));
};

// Cambiar Rol
const changeRole = (newRole) => {
    router.post(route('squad.switch-role', { squad: props.squad.id }), {
        student_id: props.activeStudent.id,
        new_role: newRole,
    }, { preserveScroll: true });
    showUserMenu.value = false;
};
</script>

<template>
    <div :class="isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'" class="min-h-screen transition-colors duration-300 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
        <Head :title="`${project.title} · Makerdu Studio`" />

        <!-- ================================================================= -->
        <!-- 1. BARRA SUPERIOR MINIMALISTA (Estilo Google / Gemini Studio)      -->
        <!-- ================================================================= -->
        <header 
            :class="isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'"
            class="sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-6 py-2.5 transition-colors duration-300"
        >
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
                
                <!-- Logo & Reto Activo -->
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-cyan-500/20">
                        ⚡
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-black text-sm sm:text-base tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            Makerdu Studio
                        </span>
                        <span class="text-slate-400 text-xs hidden sm:inline">/</span>
                        <span class="text-xs font-bold font-mono truncate max-w-[200px] sm:max-w-md" :class="isDarkTheme ? 'text-cyan-400' : 'text-cyan-700'">
                            {{ squad.classroom?.custom_title || project.title }}
                        </span>
                    </div>
                </div>

                <!-- Controles: Saldo FC, Puntos Maker, Tema & Avatar Minimalista -->
                <div class="flex items-center gap-2 sm:gap-3">
                    
                    <!-- Píldora FabCoins (FC) -->
                    <div 
                        :class="isDarkTheme ? 'bg-amber-950/30 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'"
                        class="px-2.5 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                        title="Saldo disponible de FabCoins para fabricación"
                    >
                        <span>🪙</span>
                        <span>{{ squad.fabcoins_balance }} FC</span>
                    </div>

                    <!-- Píldora Puntos Maker (PM) -->
                    <div 
                        :class="isDarkTheme ? 'bg-purple-950/30 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'"
                        class="px-2.5 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm hidden sm:flex"
                        title="Puntos Maker de experiencia acumulados"
                    >
                        <span>⚡</span>
                        <span>{{ activeStudent.xp_points }} PM</span>
                    </div>

                    <!-- Switch Tema Claro / Oscuro -->
                    <button
                        type="button"
                        @click="toggleTheme"
                        :class="isDarkTheme ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                        class="p-1.5 rounded-xl transition cursor-pointer"
                        :title="isDarkTheme ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'"
                    >
                        <Sun v-if="isDarkTheme" class="w-4 h-4" />
                        <Moon v-else class="w-4 h-4" />
                    </button>

                    <!-- CHIP MINIMALISTA DE USUARIO (Estilo Google Avatar) -->
                    <div class="relative">
                        <button
                            type="button"
                            @click="showUserMenu = !showUserMenu"
                            :class="isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'"
                            class="px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                        >
                            <div class="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                                {{ squad.name.charAt(0) }}
                            </div>
                            <span class="truncate max-w-[90px] sm:max-w-[120px]">{{ activeStudent.name }}</span>
                            <ChevronDown class="w-3 h-3 text-slate-400" />
                        </button>

                        <!-- Menú Desplegable Flotante -->
                        <div 
                            v-if="showUserMenu"
                            :class="isDarkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-xl'"
                            class="absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50 space-y-1 text-xs animate-fade-in"
                        >
                            <div class="p-2 border-b border-slate-200 dark:border-slate-800">
                                <span class="text-[10px] text-slate-400 font-mono block">Escuadra Asignada:</span>
                                <strong class="text-sm font-black">{{ squad.name }}</strong>
                                <span class="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block mt-0.5">Rol: {{ activeStudent.current_role }}</span>
                            </div>

                            <!-- Rotar Rol -->
                            <div class="p-2">
                                <span class="text-[10px] text-slate-400 font-bold block mb-1">Rotar Rol en la Mesa:</span>
                                <div class="grid grid-cols-2 gap-1">
                                    <button 
                                        v-for="r in ['Architect', 'Quality', 'Finance', 'Relator']"
                                        :key="r"
                                        @click="changeRole(r)"
                                        :class="activeStudent.current_role === r ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'"
                                        class="p-1 rounded-lg text-[10px] text-center transition cursor-pointer"
                                    >
                                        {{ r }}
                                    </button>
                                </div>
                            </div>

                            <Link
                                :href="route('squad.passport', squad.id)"
                                class="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                            >
                                <Award class="w-4 h-4 text-purple-500" />
                                <span>Ver Pasaporte Maker</span>
                            </Link>

                            <button
                                type="button"
                                @click="router.post(route('logout'))"
                                class="w-full flex items-center gap-2 p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold cursor-pointer"
                            >
                                <LogOut class="w-4 h-4" />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- ================================================================= -->
        <!-- 2. LIENZO PRINCIPAL: 2 COLUMNAS (Google Learn About Layout)        -->
        <!-- ================================================================= -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- ============================================================= -->
            <!-- COLUMNA IZQUIERDA: RUTA DEL RETO (Roadmap / Misiones Timeline)-->
            <!-- ============================================================= -->
            <aside class="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-5 space-y-4 transition-colors duration-300"
                >
                    <!-- Cabecera de la Ruta -->
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <div>
                            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                                RUTA DEL RETO ABR
                            </span>
                            <h2 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Misiones del Proyecto
                            </h2>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold" :class="isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'">
                            {{ selectedMissionIndex + 1 }} de {{ project.levels.length }}
                        </span>
                    </div>

                    <!-- LISTA VERTICAL DE MISIONES (Navegación No Restrictiva) -->
                    <nav class="space-y-2">
                        <button
                            v-for="(mission, idx) in project.levels"
                            :key="mission.id"
                            type="button"
                            @click="selectMission(idx)"
                            :class="[
                                'w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between cursor-pointer group',
                                selectedMissionIndex === idx
                                    ? (isDarkTheme 
                                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/30' 
                                        : 'bg-cyan-50/70 border-cyan-300 shadow-sm ring-2 ring-cyan-500/20')
                                    : (isDarkTheme 
                                        ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400' 
                                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-600')
                            ]"
                        >
                            <div class="flex items-center gap-3">
                                <!-- Badge de Número / Check -->
                                <span 
                                    :class="[
                                        'w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 transition',
                                        mission.is_completed
                                            ? 'bg-emerald-500 text-white'
                                            : (selectedMissionIndex === idx
                                                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                                                : (isDarkTheme ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'))
                                    ]"
                                >
                                    <Check v-if="mission.is_completed" class="w-4 h-4 stroke-[3]" />
                                    <span v-else>{{ idx + 1 }}</span>
                                </span>

                                <div>
                                    <h4 
                                        class="text-xs font-bold leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition"
                                        :class="selectedMissionIndex === idx ? (isDarkTheme ? 'text-white' : 'text-slate-900') : ''"
                                    >
                                        {{ mission.title }}
                                    </h4>
                                    <span class="text-[10px] font-mono text-slate-400 block mt-0.5">
                                        ⚡ +{{ mission.xp_reward }} PM
                                    </span>
                                </div>
                            </div>

                            <ChevronRight 
                                class="w-4 h-4 transition-transform group-hover:translate-x-0.5" 
                                :class="selectedMissionIndex === idx ? 'text-cyan-500' : 'text-slate-300 dark:text-slate-600'" 
                            />
                        </button>
                    </nav>

                    <!-- Mensaje de Libertad de Aprendizaje -->
                    <div 
                        :class="isDarkTheme ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'"
                        class="p-3 rounded-2xl border text-[11px] leading-relaxed flex items-start gap-2"
                    >
                        <Compass class="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                        <span>Puedes saltar entre misiones en cualquier momento para revisar ideas, ajustar bocetos o explorar herramientas.</span>
                    </div>
                </div>
            </aside>

            <!-- ============================================================= -->
            <!-- COLUMNA DERECHA: EL COPILOTO MAKER VIVO (Conversational Scaffolding) -->
            <!-- ============================================================= -->
            <section class="lg:col-span-8 space-y-6">
                
                <!-- 1. SALUDO CONTEXTUAL INTELIGENTE DEL COPILOTO -->
                <div 
                    :class="isDarkTheme ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-3 transition-colors duration-300 relative overflow-hidden"
                >
                    <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center text-lg shadow-md shrink-0">
                            🤖
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                Copiloto Makerdu · Mentor de Escuadra
                            </span>
                            
                            <!-- Mensaje si regresa a una misión previa -->
                            <div v-if="isReturningToPreviousMission" class="space-y-1">
                                <h3 class="text-base font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    ¡Qué bueno verlos de vuelta por la Misión {{ selectedMissionIndex + 1 }}! 🎨
                                </h3>
                                <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                                    ¿Quieren reforzar el trazo de su boceto, revisar las proporciones o explorar una variante antes de continuar con la fabricación? Todo lo que ajusten aquí enriquecerá su resultado final.
                                </p>
                            </div>

                            <!-- Mensaje estándar de bienvenida a la misión -->
                            <div v-else class="space-y-1">
                                <h3 class="text-base font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    {{ selectedMission.title }}
                                </h3>
                                <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                                    {{ selectedMission.inputs?.guide_text || 'En esta misión transformaremos la idea en un entregable concreto siguiendo los pasos de fabricación digital.' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- TARJETA 1: 📥 MATERIALES DE INSPIRACIÓN & TUTORIAL (Input) -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                            <span class="p-1 rounded-lg bg-cyan-500/10 text-cyan-500">📥</span>
                            <span>Paso 1: Materiales de Inspiración & Tutorial</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Consigna & Recursos</span>
                    </div>

                    <!-- RENDER DE MICRO-ANIMACIÓN EN VIVO (Si la misión tiene una asignada) -->
                    <div v-if="getMissionAnimation(selectedMission)" class="rounded-2xl overflow-hidden border p-1" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
                        <div v-html="getMissionAnimation(selectedMission)" class="w-full"></div>
                    </div>

                    <!-- LISTA DE RECURSOS DE APOYO (Videos, PDFs, Enlaces) -->
                    <div v-if="selectedMission.inputs?.resources_list?.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div 
                            v-for="(res, rIdx) in selectedMission.inputs.resources_list" 
                            :key="rIdx"
                            :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'"
                            class="p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-inner"
                        >
                            <div class="flex items-center gap-2.5 truncate">
                                <span class="text-base shrink-0">
                                    {{ res.type === 'video' ? '🎬' : (res.type === 'pdf' ? '📄' : (res.type === 'link' ? '🔗' : '✨')) }}
                                </span>
                                <span class="text-xs font-bold truncate" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">
                                    {{ res.title || 'Recurso didáctico' }}
                                </span>
                            </div>

                            <a 
                                v-if="res.url" 
                                :href="res.url" 
                                target="_blank" 
                                class="text-xs font-bold text-cyan-600 hover:underline shrink-0"
                            >
                                Abrir ➔
                            </a>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- TARJETA 2: ⚙️ ACCIÓN MAKER & HERRAMIENTAS (Process)       -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <span class="p-1 rounded-lg bg-purple-500/10 text-purple-500">⚙️</span>
                            <span>Paso 2: Acción Maker & Herramientas Digitales</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Estudio Creativo</span>
                    </div>

                    <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                        {{ selectedMission.process?.instructions || 'Utiliza las herramientas digitales de la escuadra para modelar tu diseño y prepararlo para la fabricación física.' }}
                    </p>

                    <!-- BOTONES DE MICRO-APPS EMBEBIDAS -->
                    <div v-if="selectedMission.process?.mode === 'micro_app'" class="space-y-3">
                        <span class="text-[11px] font-bold text-slate-400 block uppercase font-mono">
                            Herramientas Autónomas Disponibles:
                        </span>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                v-for="app in getMissionMicroApps(selectedMission)"
                                :key="app.slug"
                                type="button"
                                @click="openMicroAppModal(app)"
                                :class="isDarkTheme ? 'bg-purple-950/20 hover:bg-purple-950/40 border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 border-purple-200'"
                                class="p-4 rounded-2xl border text-left transition flex items-center justify-between group cursor-pointer shadow-sm"
                            >
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl group-hover:scale-110 transition">{{ app.icon }}</span>
                                    <div>
                                        <h4 class="text-xs font-black text-purple-600 dark:text-purple-300">{{ app.name }}</h4>
                                        <span class="text-[10px] text-slate-400 font-mono">Salida: {{ app.output_type?.toUpperCase() || 'STL' }}</span>
                                    </div>
                                </div>
                                <ArrowUpRight class="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                            </button>
                        </div>
                    </div>

                    <!-- MODO TALLER MANUAL FÍSICO -->
                    <div v-else-if="selectedMission.process?.mode === 'manual_workshop'" class="p-4 rounded-2xl border" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
                        <div class="flex items-center gap-2 mb-1">
                            <Hammer class="w-4 h-4 text-amber-500" />
                            <h4 class="text-xs font-bold text-amber-600 dark:text-amber-300">Trabajo Manual en la Mesa del Taller</h4>
                        </div>
                        <p class="text-xs text-slate-500">
                            Trabaja directamente sobre papel bond con plumón negro grueso. Cierra bien los bordes de la silueta antes de presentar tu evidencia a la cámara.
                        </p>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- TARJETA 3: 📤 EVIDENCIA & AUDITORÍA CON GEMINI (Output)   -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <span class="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">📤</span>
                            <span>Paso 3: Evidencia & Validación con Gemini IA</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Entregable Requerido</span>
                    </div>

                    <!-- CAJA DE CARGA / CAPTURA DE EVIDENCIA -->
                    <div class="border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative" :class="isDarkTheme ? 'border-slate-800 hover:border-emerald-500/50 bg-slate-950' : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'">
                        <input
                            type="file"
                            @change="handleFileUpload"
                            accept=".stl,.svg,.jpg,.jpeg,.png,.webp"
                            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div v-if="!bitacoraForm.file" class="space-y-2">
                            <UploadCloud class="w-8 h-8 text-emerald-500 mx-auto" />
                            <p class="text-xs font-bold" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                                Arrastra tu evidencia aquí o haz clic para subir
                            </p>
                            <p class="text-[10px] text-slate-400 font-mono">
                                Acepta fotos de bocetos (JPG/PNG) o modelos digitales (STL 3D / SVG)
                            </p>
                        </div>
                        <div v-else class="space-y-1">
                            <CheckCircle2 class="w-7 h-7 text-emerald-500 mx-auto" />
                            <p class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                {{ bitacoraForm.file.name }}
                            </p>
                            <p class="text-[10px] text-slate-400">Archivo listo para auditar con el Copiloto IA</p>
                        </div>
                    </div>

                    <!-- BOTÓN PARA AUDITAR CON GEMINI IA -->
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <span class="text-xs font-mono text-slate-400">
                            Gasto de fabricación: <strong class="text-amber-500 font-bold">🪙 {{ selectedMission.fabcoins_cost || 0 }} FC</strong>
                        </span>

                        <button
                            type="button"
                            @click="runPreflightCheck"
                            :disabled="preflightLoading || !bitacoraForm.file"
                            class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <RefreshCw v-if="preflightLoading" class="w-4 h-4 animate-spin" />
                            <Sparkles v-else class="w-4 h-4" />
                            <span>{{ preflightLoading ? 'AUDITANDO CON GEMINI...' : 'AUDITAR EVIDENCIA CON IA' }}</span>
                        </button>
                    </div>

                    <!-- RETROALIMENTACIÓN DE GEMINI EN VIVO -->
                    <div v-if="preflightResult" class="p-5 rounded-2xl border space-y-3 animate-fade-in" :class="isDarkTheme ? 'bg-slate-950 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                                ● {{ preflightResult.dashboard?.verdict_title || 'EVALUACIÓN DE LA IA' }}
                            </span>
                            <span class="text-[10px] font-mono text-slate-400">Gemini 2.0 Flash</span>
                        </div>

                        <p class="text-xs font-bold leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                            {{ preflightResult.dashboard?.headline || preflightResult.ai_feedback }}
                        </p>

                        <!-- Puntos Fuertes -->
                        <div v-if="preflightResult.dashboard?.strengths?.length > 0" class="space-y-1">
                            <span class="text-[10px] font-mono font-bold text-emerald-600 uppercase">Puntos Fuertes:</span>
                            <div v-for="(st, sIdx) in preflightResult.dashboard.strengths" :key="sIdx" class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span>✓</span>
                                <span>{{ st }}</span>
                            </div>
                        </div>

                        <!-- Consejo del Mentor -->
                        <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                            <Lightbulb class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                            <span>{{ preflightResult.dashboard?.pedagogical_tip || '¡Buen trabajo! Continúa iterando tu diseño.' }}</span>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- TARJETA 4: CIERRE REFLEXIVO & AVANZAR MISIÓN              -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <!-- Pregunta de Cierre del Excel ABR FabLab -->
                    <div>
                        <label class="block text-xs font-bold mb-1" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                            Reflexión de Escuadra: ¿Qué funcionó y qué aprendieron en esta misión?
                        </label>
                        <textarea
                            v-model="bitacoraForm.reflection_text"
                            rows="2"
                            placeholder="Escribe una breve conclusión o aprendizaje de la mesa..."
                            class="w-full rounded-2xl border p-3 text-xs leading-relaxed"
                            :class="isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'"
                        ></textarea>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            Recompensa: +{{ selectedMission.xp_reward }} Puntos Maker
                        </span>

                        <button
                            type="button"
                            @click="submitMissionEvidence"
                            :disabled="bitacoraForm.processing || !bitacoraForm.file"
                            class="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <span>GUARDAR Y COMPLETAR MISIÓN</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>
        </main>

        <!-- ================================================================= -->
        <!-- MODAL OVERLAY PARA PROBAR MICRO-APPS EN VIVO                      -->
        <!-- ================================================================= -->
        <MicroAppOverlay
            :is-open="showMicroAppModal"
            :app="activeTestingApp"
            @close="showMicroAppModal = false"
            @asset-generated="handleMicroAppAsset"
        />
    </div>
</template>
