<script setup>
import { Head, router, useForm, usePage, Link } from '@inertiajs/vue3';
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
    Sparkles, Coins, Trophy, Users, ShieldCheck, Wrench, CheckCircle2,
    Clock, BookOpen, ExternalLink, Send, FileText, ChevronRight, LogOut,
    Check, AlertCircle, ArrowUpRight, Flame, Layers, Laptop, UploadCloud,
    Cpu, XCircle, Printer, Hammer, Gauge, Globe, Box, Film, Camera, Image,
    Download, ArrowLeft, ArrowRight, Play, Lock, Award, Eye, Star, Heart, Lightbulb, Zap,
    PartyPopper, Compass, Palette, Scissors, CheckSquare, ListChecks, Sun, Moon,
    ChevronDown, UserCheck, RefreshCw, Undo2, Target, MessageSquare, Bot, HelpCircle,
    ChevronUp, Rocket, Briefcase, ArrowDown, X, User
} from 'lucide-vue-next';
import StlViewer3D from '@/Components/StlViewer3D.vue';
import VideoTutorialPlayer from '@/Components/VideoTutorialPlayer.vue';
import AiTutorChatModal from '@/Components/AiTutorChatModal.vue';
import MicroAppOverlay from '@/Components/MicroAppOverlay.vue';
import MissionBriefingModal from '@/Components/Student/MissionBriefingModal.vue';
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
    peers: {
        type: Array,
        default: () => [],
    },
    flash: {
        type: Object,
        default: () => ({}),
    },
    selected_level_number: {
        type: Number,
        default: 1,
    }
});

// TEMA CLARO / OSCURO
const isDarkTheme = ref(true);
onMounted(() => {
    const saved = localStorage.getItem('makerdu_theme');
    if (saved) {
        isDarkTheme.value = saved === 'dark';
    } else {
        isDarkTheme.value = true;
    }
    applyThemeClass();
});

const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
    localStorage.setItem('makerdu_theme', isDarkTheme.value ? 'dark' : 'light');
    applyThemeClass();
};

const applyThemeClass = () => {
    if (isDarkTheme.value) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

// MISIÓN ACTIVA Y NAVEGACIÓN
const currentLevelNumber = ref(props.selected_level_number || 1);

watch(() => props.selected_level_number, (newVal) => {
    if (newVal) {
        currentLevelNumber.value = newVal;
        activeStep.value = 1;
        qualityControlResult.value = null;
        bitacoraForm.reset();
        previewUrl.value = null;
    }
});

const selectedMissionIndex = computed(() => {
    const idx = props.project.levels.findIndex(l => l.level_number === currentLevelNumber.value);
    return idx >= 0 ? idx : 0;
});

const selectedMission = computed(() => {
    return props.project.levels[selectedMissionIndex.value] || props.project.levels[0];
});

// PASO ACTIVO (1: Reglas, 2: Taller, 3: Auditoría IA)
const activeStep = ref(1);

// EVIDENCIAS PREVIAS
const existingEvidence = computed(() => {
    return props.bitacoras.find(b => b.level_id === selectedMission.value.id);
});
const mission1Evidence = computed(() => {
    const m1 = props.project.levels[0];
    return m1 ? props.bitacoras.find(b => b.level_id === m1.id && b.status === 'approved') : null;
});
const mission2Evidence = computed(() => {
    const m2 = props.project.levels[1];
    return m2 ? props.bitacoras.find(b => b.level_id === m2.id && b.status === 'approved') : null;
});

// FORMULARIO DE ENTREGA
const bitacoraForm = useForm({
    file: null,
    image_snapshot: null,
    content_text: '',
    reflection_text: '',
    rating: 5,
});

const previewUrl = ref(null);
const evidenceFileInput = ref(null);

const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        bitacoraForm.file = file;
        qualityControlResult.value = null;
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (re) => {
                previewUrl.value = re.target.result;
                bitacoraForm.image_snapshot = re.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            previewUrl.value = null;
        }
    }
};

// CÁMARA WEB
const isCameraOpen = ref(false);
const videoStream = ref(null);
const videoElement = ref(null);

const startCamera = async () => {
    try {
        isCameraOpen.value = true;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoStream.value = stream;
        await nextTick();
        if (videoElement.value) {
            videoElement.value.srcObject = stream;
        }
    } catch (err) {
        alert('No se pudo acceder a la cámara. Asegúrate de otorgar permisos.');
        isCameraOpen.value = false;
    }
};

const capturePhoto = () => {
    if (!videoElement.value) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.value.videoWidth || 640;
    canvas.height = videoElement.value.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    stopCamera();

    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], 'captura_camara_boceto.png', { type: mime });
    bitacoraForm.file = file;
    bitacoraForm.image_snapshot = dataUrl;
    previewUrl.value = dataUrl;
    qualityControlResult.value = null;
};

const stopCamera = () => {
    if (videoStream.value) {
        videoStream.value.getTracks().forEach(track => track.stop());
        videoStream.value = null;
    }
    isCameraOpen.value = false;
};

// MICRO-APPS (Lienzo Maker 2D, Vectorizador, Slicer)
const showMicroAppModal = ref(false);
const activeTestingApp = ref(null);
const initialAppImageUrl = ref(null);

const openMicroAppModal = (app, imageUrl = null) => {
    activeTestingApp.value = app;
    initialAppImageUrl.value = imageUrl;
    showMicroAppModal.value = true;
};

const handleMicroAppAsset = (asset) => {
    showMicroAppModal.value = false;
    if (!asset) return;

    if (asset.assetType === 'image' || (asset.dataUrl && !asset.stlContent)) {
        const dataUrl = asset.dataUrl || asset.image_snapshot;
        bitacoraForm.image_snapshot = dataUrl;
        previewUrl.value = dataUrl;

        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], 'boceto_maker_2d.png', { type: mime });
        bitacoraForm.file = file;
        qualityControlResult.value = null;
        return;
    }

    const fileContent = asset.stlContent || asset.content;
    if (!fileContent) return;

    const fileName = asset.fileName || (asset.fileType === 'stl' ? 'art_toy_2.5d.stl' : 'art_toy_2.5d.svg');
    const mimeType = asset.fileType === 'stl' ? 'model/stl' : 'image/svg+xml';
    
    const blob = new Blob([fileContent], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    
    bitacoraForm.file = file;
    if (asset.image_snapshot) {
        bitacoraForm.image_snapshot = asset.image_snapshot;
    }
    qualityControlResult.value = null;
};

// AUDITORÍA DE CALIDAD IA (PRE-FLIGHT CHECK)
const preflightLoading = ref(false);
const qualityControlResult = ref(props.flash?.quality_control_result || null);
const preflightResult = computed(() => qualityControlResult.value || props.flash?.preflight_result || null);

const runPreflightCheck = () => {
    if (!bitacoraForm.file) return;

    preflightLoading.value = true;
    const formData = new FormData();
    formData.append('file', bitacoraForm.file);
    if (bitacoraForm.image_snapshot) {
        formData.append('image_snapshot', bitacoraForm.image_snapshot);
    }
    formData.append('level_id', selectedMission.value.id);

    router.post(route('squad.preflight', { squad: props.squad.id }), formData, {
        preserveScroll: true,
        onSuccess: (page) => {
            preflightLoading.value = false;
            qualityControlResult.value = page.props.flash?.quality_control_result || page.props.flash?.preflight_result;
        },
        onError: () => {
            preflightLoading.value = false;
        }
    });
};

// COMPLETAR MISIÓN Y AVANZAR AUTOMÁTICAMENTE A LA SIGUIENTE
const isSubmitting = ref(false);
const submitMissionEvidence = () => {
    if (!bitacoraForm.file) {
        alert('Debes adjuntar o generar tu archivo antes de completar la misión.');
        return;
    }

    isSubmitting.value = true;
    bitacoraForm.post(route('squad.bitacora.submit', { squad: props.squad.id, level: selectedMission.value.id }), {
        preserveScroll: true,
        onSuccess: () => {
            isSubmitting.value = false;
            const nextLvl = currentLevelNumber.value + 1;
            if (nextLvl <= props.project.levels.length) {
                // Avanzar a la siguiente misión directamente
                router.visit(route('student.studio.mission', { level_number: nextLvl }));
            } else {
                // Última misión completada: volver con honores al Estudio
                router.visit(route('student.studio'));
            }
        },
        onError: () => {
            isSubmitting.value = false;
        }
    });
};

const getFirstName = (name) => {
    return name ? name.split(' ')[0] : 'Maker';
};
</script>

<template>
    <Head :title="selectedMission.title + ' — Estación Makerdu'" />

    <!-- CONTENEDOR 100% PANTALLA: H-SCREEN SIN SCROLL GENERAL -->
    <div class="h-screen w-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-300" :class="isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'">
        
        <!-- ================================================================= -->
        <!-- SLIM TOP HUD (50px)                                               -->
        <!-- ================================================================= -->
        <header class="h-12 border-b px-4 flex items-center justify-between shrink-0 z-30" :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'">
            
            <!-- Izquierda: Salir al Mapa y Título de la Misión -->
            <div class="flex items-center gap-3">
                <Link
                    :href="route('student.studio')"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    :class="isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'"
                >
                    <ArrowLeft class="w-3.5 h-3.5 text-cyan-400" />
                    <span class="hidden sm:inline">Mapa del Reto</span>
                </Link>

                <div class="h-4 w-px bg-slate-700/50 hidden sm:block"></div>

                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-black uppercase tracking-wider border border-cyan-500/20">
                        Misión {{ selectedMissionIndex + 1 }} de 5
                    </span>
                    <h1 class="text-xs sm:text-sm font-black truncate max-w-[200px] md:max-w-md" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                        {{ selectedMission.title }}
                    </h1>
                </div>
            </div>

            <!-- Centro: Stepper 1-2-3 Compacto -->
            <div class="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-300/40 dark:border-slate-700/60 text-xs">
                <button
                    type="button"
                    @click="activeStep = 1"
                    class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5"
                    :class="activeStep === 1 
                        ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                        : (isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')"
                >
                    <span class="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center bg-black/20">1</span>
                    <span class="hidden md:inline text-[11px]">Reglas</span>
                </button>

                <button
                    type="button"
                    @click="activeStep = 2"
                    class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5"
                    :class="activeStep === 2 
                        ? 'bg-amber-500 text-slate-950 shadow-sm' 
                        : (isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')"
                >
                    <span class="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center bg-black/20">
                        <Check v-if="bitacoraForm.file || bitacoraForm.image_snapshot" class="w-2.5 h-2.5 stroke-[3]" />
                        <span v-else>2</span>
                    </span>
                    <span class="hidden md:inline text-[11px]">Mesa de Trabajo</span>
                </button>

                <button
                    type="button"
                    @click="activeStep = 3"
                    class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5"
                    :class="activeStep === 3 
                        ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                        : (isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')"
                >
                    <span class="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center bg-black/20">
                        <Check v-if="qualityControlResult?.status === 'approved'" class="w-2.5 h-2.5 stroke-[3]" />
                        <span v-else>3</span>
                    </span>
                    <span class="hidden md:inline text-[11px]">Auditoría IA</span>
                </button>
            </div>

            <!-- Derecha: Saldo FC & Tema -->
            <div class="flex items-center gap-2.5">
                <div class="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-[11px] font-black flex items-center gap-1">
                    <span>🪙</span>
                    <span>{{ props.squad.fabcoins_balance }} FC</span>
                </div>

                <button
                    type="button"
                    @click="toggleTheme"
                    class="w-7 h-7 rounded-lg border flex items-center justify-center transition cursor-pointer"
                    :class="isDarkTheme ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'"
                >
                    <Sun v-if="isDarkTheme" class="w-3.5 h-3.5" />
                    <Moon v-else class="w-3.5 h-3.5" />
                </button>
            </div>
        </header>

        <!-- ================================================================= -->
        <!-- CUERPO PRINCIPAL: SIDEBAR IZQUIERDO (MISIONES) + WORKSPACE DERECHO -->
        <!-- ================================================================= -->
        <div class="flex-1 flex overflow-hidden">
            
            <!-- SIDEBAR IZQUIERDO: SELECTOR VERTICAL DE LAS 5 MISIONES -->
            <aside class="w-56 md:w-64 border-r shrink-0 flex flex-col justify-between overflow-y-auto p-3 space-y-2 select-none" :class="isDarkTheme ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'">
                <div class="space-y-1.5">
                    <span class="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 block">
                        Ruta de Misiones
                    </span>

                    <Link
                        v-for="(m, mIdx) in project.levels"
                        :key="m.id"
                        :href="route('student.studio.mission', { level_number: m.level_number })"
                        class="w-full p-2.5 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer group"
                        :class="[
                            m.level_number === currentLevelNumber
                                ? (isDarkTheme ? 'bg-cyan-500/15 border border-cyan-500/40 text-white' : 'bg-cyan-50 border border-cyan-300 text-slate-900')
                                : (isDarkTheme ? 'hover:bg-slate-800/80 text-slate-400 border border-transparent' : 'hover:bg-slate-100 text-slate-600 border border-transparent')
                        ]"
                    >
                        <div 
                            class="w-7 h-7 rounded-xl flex items-center justify-center font-mono text-[10px] font-black shrink-0"
                            :class="m.is_completed ? 'bg-emerald-500 text-white' : (m.level_number === currentLevelNumber ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400')"
                        >
                            <Check v-if="m.is_completed" class="w-3.5 h-3.5 stroke-[3]" />
                            <span v-else>{{ m.level_number }}</span>
                        </div>

                        <div class="flex-1 min-w-0">
                            <span class="text-[9px] font-mono font-bold block" :class="m.level_number === currentLevelNumber ? 'text-cyan-400' : 'text-slate-500'">
                                Etapa {{ m.level_number }}
                            </span>
                            <strong class="text-xs block truncate" :class="m.level_number === currentLevelNumber ? 'text-white' : (isDarkTheme ? 'text-slate-300' : 'text-slate-800')">
                                {{ m.title }}
                            </strong>
                        </div>
                    </Link>
                </div>

                <!-- Footer del Sidebar -->
                <div class="p-2.5 rounded-2xl border text-[10px] space-y-1" :class="isDarkTheme ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'">
                    <span class="font-bold flex items-center gap-1.5 text-cyan-400">
                        <span>💡</span>
                        <span>Nivel Inicial</span>
                    </span>
                    <p class="leading-tight">
                        Avanza a tu ritmo. Tus avances se guardan en vivo.
                    </p>
                </div>
            </aside>

            <!-- WORKSPACE DERECHO: 100% PANTALLA AJUSTADA (SIN SCROLL EXCESIVO) -->
            <main class="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-between max-w-4xl mx-auto w-full">

                <!-- ========================================================= -->
                <!-- PASO 1: INSPÍRATE & REGLAS DE DISEÑO                      -->
                <!-- ========================================================= -->
                <div v-if="activeStep === 1" class="flex-1 flex flex-col justify-between space-y-4 animate-fade-in">
                    
                    <div class="space-y-3">
                        <!-- Cabecera de Paso 1 -->
                        <div class="flex items-center justify-between border-b pb-2.5" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                            <div>
                                <span class="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                                    PASO 1 DE 3 · BRIEFING DE LA ETAPA
                                </span>
                                <h2 class="text-base sm:text-lg font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    💡 Reglas de Oro & Criterios de Éxito
                                </h2>
                            </div>

                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                0 FabCoins
                            </span>
                        </div>

                        <!-- CONTENIDO ESPECÍFICO SEGÚN LA MISIÓN -->
                        
                        <!-- MISIÓN 1: CONCEBIR -->
                        <div v-if="selectedMissionIndex === 0" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">✍️</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Plumón Negro Grueso</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Trazo nítido y continuo sobre fondo blanco puro. Evita lápices.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">📐</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Base Plana Autoportante</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">La base debe medir al menos 40% del ancho del cuerpo para no caerse.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-amber-500/10 text-amber-400">🔒</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Silueta 100% Cerrada</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Cierra completamente el contorno exterior para poder extruir el sólido.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-purple-500/30' : 'bg-purple-50/70 border-purple-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-purple-500/10 text-purple-400">👁️</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Regla del Estarcido</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Conecta pupilas o detalles interiores con puentes para que no se caigan.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- PDF Digitoys -->
                            <div class="p-3 rounded-2xl border flex items-center justify-between gap-3" :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">📄</span>
                                    <div class="text-xs">
                                        <strong class="block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Guía de Siluetas y Expresiones Digitoys (PDF)</strong>
                                        <span class="text-[11px] text-slate-400">Catálogo didáctico de formas base para inspirarte.</span>
                                    </div>
                                </div>
                                <a href="/images/digitoys/DIGITOYS-construccion.pdf" target="_blank" class="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1">
                                    <span>Ver PDF</span>
                                    <ExternalLink class="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        <!-- MISIÓN 2: INGENIERÍA 3D -->
                        <div v-else-if="selectedMissionIndex === 1" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">🧊</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Extrusión Z a 10 mm</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Grosor ideal para que tu Art Toy se sostenga firme sobre la mesa.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">📐</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Curvas Suaves con Nodos</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Ajusta los tiradores Bézier para que la boquilla imprima contornos fluidos.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="p-3 rounded-2xl border text-xs" :class="isDarkTheme ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'">
                                💡 <strong>Insumo:</strong> Usarás tu boceto aprobado de la Misión 1. El Vectorizador lo convertirá automáticamente en malla sólida STL.
                            </div>
                        </div>

                        <!-- MISIÓN 3: SLICER & PRODUCCIÓN -->
                        <div v-else-if="selectedMissionIndex === 2" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-amber-500/10 text-amber-400">🍰</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Relleno al 15% (Infill)</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Suficiente rigidez estructural sin desperdiciar filamento de la clase.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">🪙</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Costo Económico: ~4 FC</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Calcula el peso en gramos y descuenta de la bolsa de 12 FabCoins.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MISIÓN 4: POST-PROCESADO -->
                        <div v-else-if="selectedMissionIndex === 3" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">🪚</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Lijado al Agua</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Elimina rebabas en la base para asegurar 100% de apoyo plano.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-purple-500/30' : 'bg-purple-50/70 border-purple-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-purple-500/10 text-purple-400">📦</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Packaging Maker</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Arma la caja de colección con tu marca y ficha técnica.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MISIÓN 5: LANZAMIENTO -->
                        <div v-else class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400">🎬</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Pitch Comercial de 30s</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Presenta tu personaje, el reto de fabricación y su valor de autor.</p>
                                    </div>
                                </div>
                                <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'">
                                    <span class="text-base p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">🏆</span>
                                    <div class="text-xs space-y-0.5">
                                        <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Graduación & Pasaporte</strong>
                                        <p class="text-[11px]" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Obtén tu certificación oficial de Creador Maker.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Botón de Avance a Paso 2 -->
                    <div class="pt-3 border-t flex justify-end shrink-0" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                        <button
                            type="button"
                            @click="activeStep = 2"
                            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                        >
                            <span>Continuar a la Mesa de Trabajo (Paso 2)</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- PASO 2: MESA DE TRABAJO (HERRAMIENTAS ESPECÍFICAS)         -->
                <!-- ========================================================= -->
                <div v-else-if="activeStep === 2" class="flex-1 flex flex-col justify-between space-y-4 animate-fade-in">
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between border-b pb-2.5" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                            <div>
                                <span class="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block">
                                    PASO 2 DE 3 · CREACIÓN Y EXPERIMENTACIÓN
                                </span>
                                <h2 class="text-base sm:text-lg font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    🛠️ Mesa de Trabajo & Herramientas
                                </h2>
                            </div>

                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                EN ACCIÓN
                            </span>
                        </div>

                        <!-- MISIÓN 1: SELECTOR DE LOS 2 CAMINOS -->
                        <div v-if="selectedMissionIndex === 0" class="space-y-3">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <!-- CAMINO A -->
                                <div class="p-3.5 rounded-2xl border flex flex-col justify-between gap-3" :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'">
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-lg">📷</span>
                                            <strong class="text-xs font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Camino A: Papel y Plumón</strong>
                                        </div>
                                        <p class="text-[11px] text-slate-400">Dibuja a mano y sube una foto o usa la cámara web.</p>
                                    </div>
                                    <div class="flex items-center gap-2 pt-1">
                                        <input ref="evidenceFileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                                        <button type="button" @click="evidenceFileInput?.click()" class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700">
                                            📁 Subir Foto
                                        </button>
                                        <button type="button" @click="isCameraOpen ? capturePhoto() : startCamera()" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700">
                                            📸 Cámara
                                        </button>
                                    </div>
                                    <div v-if="isCameraOpen" class="space-y-2 pt-1">
                                        <video ref="videoElement" autoplay playsinline class="w-full h-36 rounded-xl bg-black object-cover"></video>
                                        <div class="flex gap-2">
                                            <button type="button" @click="capturePhoto" class="flex-1 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">📸 Capturar</button>
                                            <button type="button" @click="stopCamera" class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancelar</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- CAMINO B -->
                                <div class="p-3.5 rounded-2xl border flex flex-col justify-between gap-3 relative overflow-hidden" :class="isDarkTheme ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/40' : 'bg-gradient-to-br from-cyan-50 via-white to-white border-cyan-300'">
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-lg">🖌️</span>
                                            <strong class="text-xs font-black text-cyan-400">Camino B: Lienzo Maker 2D</strong>
                                            <span class="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[8px] font-black uppercase">Digital</span>
                                        </div>
                                        <p class="text-[11px] text-slate-400">Dibuja en pantalla: Plumón Libre, Armador Digitoys o Pixel Art.</p>
                                    </div>
                                    <button type="button" @click="openMicroAppModal({ slug: 'sketch-pad', name: 'Lienzo Maker 2D', icon: '🖌️' })" class="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer">
                                        <span>🖌️ ABRIR LIENZO DIGITAL</span>
                                        <Sparkles class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <!-- PREVIEW BOCETO -->
                            <div v-if="bitacoraForm.image_snapshot || bitacoraForm.file" class="p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 flex items-center justify-between gap-3">
                                <div class="flex items-center gap-3">
                                    <img :src="bitacoraForm.image_snapshot || previewUrl" class="w-14 h-14 rounded-xl object-contain bg-white border border-emerald-400 p-0.5 shrink-0" alt="Boceto cargado" />
                                    <div class="space-y-0.5 text-xs">
                                        <span class="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">✔ BOCETO EN LA MESA</span>
                                        <strong class="block truncate max-w-xs">{{ bitacoraForm.file?.name || 'boceto_maker_2d.png' }}</strong>
                                        <p class="text-[11px] text-slate-400">Listo para pasar a la auditoría en el Paso 3.</p>
                                    </div>
                                </div>
                                <button type="button" @click="openMicroAppModal({ slug: 'sketch-pad', name: 'Lienzo Maker 2D', icon: '🖌️' })" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                                    Redibujar
                                </button>
                            </div>
                        </div>

                        <!-- MISIÓN 2: VECTORIZADOR 2.5D -->
                        <div v-else-if="selectedMissionIndex === 1" class="space-y-3">
                            <div class="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3" :class="isDarkTheme ? 'bg-slate-900 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">🧊</span>
                                    <div class="text-xs">
                                        <strong class="block font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Vectorizador & Extrusor 2.5D</strong>
                                        <p class="text-[11px] text-slate-400">Limpia curvas y extruye tu silueta a 10 mm de altura sin soportes.</p>
                                    </div>
                                </div>
                                <button type="button" @click="openMicroAppModal(props.microApps.find(a => a.slug === 'vectorizer') || { slug: 'vectorizer', name: 'Vectorizador & Extrusor 2.5D' }, mission1Evidence?.file_url)" class="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20">
                                    <span>Abrir Vectorizador 3D</span>
                                    <Sparkles class="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <!-- Preview STL generado -->
                            <div v-if="bitacoraForm.file" class="p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 flex items-center justify-between gap-3">
                                <div class="flex items-center gap-3 text-xs">
                                    <span class="text-xl">✔</span>
                                    <div>
                                        <strong class="block text-emerald-400">{{ bitacoraForm.file.name }}</strong>
                                        <span class="text-[11px] text-slate-400">Modelo 3D extruido a 10 mm listo para auditar.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MISIÓN 3: SLICER 3D & LAMINADO -->
                        <div v-else-if="selectedMissionIndex === 2" class="space-y-3">
                            <div class="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3" :class="isDarkTheme ? 'bg-slate-900 border-amber-500/30' : 'bg-amber-50 border-amber-200'">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">🍰</span>
                                    <div class="text-xs">
                                        <strong class="block font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Simulador de Laminado & Infill</strong>
                                        <p class="text-[11px] text-slate-400">Inspecciona el relleno interno al 15% y autoriza el costo de 4 FabCoins.</p>
                                    </div>
                                </div>
                                <button type="button" @click="openMicroAppModal(props.microApps.find(a => a.slug === 'slicer-3d') || { slug: 'slicer-3d', name: 'Simulador de Laminado' }, mission2Evidence?.file_url)" class="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20">
                                    <span>Abrir Simulador Slicer</span>
                                    <Sparkles class="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <!-- MISIÓN 4: TRABAJO FÍSICO -->
                        <div v-else-if="selectedMissionIndex === 3" class="space-y-3">
                            <div class="p-4 rounded-2xl border flex flex-col justify-between gap-3 text-xs" :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'">
                                <div>
                                    <strong class="block font-black text-sm" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">📷 Evidencia de Tu Juguete Terminado</strong>
                                    <p class="text-[11px] text-slate-400 pt-0.5">Sube una foto de tu personaje lijado puesto de pie sobre tu mesa y junto a su empaque.</p>
                                </div>
                                <input ref="evidenceFileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                                <div class="flex gap-2">
                                    <button type="button" @click="evidenceFileInput?.click()" class="py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs">
                                        📁 Subir Foto de tu Art Toy
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- MISIÓN 5: LANZAMIENTO -->
                        <div v-else class="space-y-3">
                            <div class="p-4 rounded-2xl border space-y-2 text-xs" :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'">
                                <strong class="block font-black text-sm" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">🚀 Ficha de Catálogo & Video Pitch</strong>
                                <input v-model="bitacoraForm.content_text" type="text" placeholder="Enlace a tu video pitch o breve descripción..." class="w-full rounded-xl border p-2 text-xs" :class="isDarkTheme ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200'" />
                            </div>
                        </div>

                    </div>

                    <!-- Botones de Navegación Paso 2 -->
                    <div class="pt-3 border-t flex items-center justify-between shrink-0" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                        <button type="button" @click="activeStep = 1" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                            <ArrowLeft class="w-3.5 h-3.5" />
                            <span>Volver al Paso 1</span>
                        </button>

                        <button type="button" @click="activeStep = 3" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md cursor-pointer">
                            <span>Continuar al Paso 3: Auditoría IA</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- PASO 3: AUDITORÍA DE CALIDAD & VISTO BUENO IA             -->
                <!-- ========================================================= -->
                <div v-else class="flex-1 flex flex-col justify-between space-y-4 animate-fade-in">
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between border-b pb-2.5" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                            <div>
                                <span class="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider block">
                                    PASO 3 DE 3 · VISTO BUENO Y ENTREGA
                                </span>
                                <h2 class="text-base sm:text-lg font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    🔍 Auditoría de Calidad & Copiloto IA
                                </h2>
                            </div>

                            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                +{{ selectedMission.xp_reward }} PUNTOS
                            </span>
                        </div>

                        <!-- Botón de Auditoría con Gemini IA -->
                        <div class="p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3" :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'">
                            <div class="text-xs space-y-0.5">
                                <strong class="block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Control de Calidad Automático</strong>
                                <p class="text-[11px] text-slate-400">Verifica que tu archivo cumpla las reglas físicas de fabricación.</p>
                            </div>

                            <button
                                type="button"
                                @click="runPreflightCheck"
                                :disabled="preflightLoading || !bitacoraForm.file"
                                class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md disabled:opacity-40 cursor-pointer shrink-0"
                            >
                                <RefreshCw v-if="preflightLoading" class="w-3.5 h-3.5 animate-spin" />
                                <Sparkles v-else class="w-3.5 h-3.5" />
                                <span>{{ preflightLoading ? 'AUDITANDO CON GEMINI...' : '✨ AUDITAR CON GEMINI IA' }}</span>
                            </button>
                        </div>

                        <!-- Veredicto IA -->
                        <div 
                            v-if="qualityControlResult || existingEvidence" 
                            class="p-4 rounded-2xl border space-y-2 text-xs animate-fade-in"
                            :class="isDarkTheme 
                                ? ((qualityControlResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? 'bg-slate-900 border-emerald-500/40' : 'bg-slate-900 border-amber-500/40') 
                                : ((qualityControlResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200')"
                        >
                            <div class="flex items-center justify-between">
                                <span class="font-black flex items-center gap-1.5" :class="(preflightResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? 'text-emerald-400' : 'text-amber-400'">
                                    <span>●</span>
                                    <span>{{ preflightResult?.dashboard?.verdict_title || (existingEvidence?.status === 'approved' ? '¡EVIDENCIA APROBADA!' : 'REQUIERE AJUSTES') }}</span>
                                </span>
                                <span class="text-[10px] font-mono text-slate-400">Copiloto Maker</span>
                            </div>
                            <p class="leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">
                                {{ preflightResult?.dashboard?.headline || preflightResult?.ai_feedback || existingEvidence?.ai_feedback || 'Tu diseño está listo para ser guardado en la bitácora.' }}
                            </p>
                        </div>
                    </div>

                    <!-- Botones de Navegación y Finalización -->
                    <div class="pt-3 border-t flex items-center justify-between shrink-0" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                        <button type="button" @click="activeStep = 2" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                            <ArrowLeft class="w-3.5 h-3.5" />
                            <span>Volver al Paso 2</span>
                        </button>

                        <button
                            type="button"
                            @click="submitMissionEvidence"
                            :disabled="isSubmitting || !bitacoraForm.file"
                            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <RefreshCw v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                            <span v-else>COMPLETAR MISIÓN & CONTINUAR</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </main>
        </div>

        <!-- MODAL OVERLAY DE MICRO-APPS (Lienzo Maker 2D, Vectorizador, Slicer) -->
        <MicroAppOverlay
            :is-open="showMicroAppModal"
            :app="activeTestingApp"
            :initial-image-url="initialAppImageUrl"
            @close="showMicroAppModal = false"
            @assetReady="handleMicroAppAsset"
        />

    </div>
</template>
