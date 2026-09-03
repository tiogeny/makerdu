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

// MISIÓN ACTIVA
const currentLevelNumber = ref(props.selected_level_number || 1);
const selectedMissionIndex = computed(() => {
    const idx = props.project.levels.findIndex(l => l.level_number === currentLevelNumber.value);
    return idx >= 0 ? idx : 0;
});
const selectedMission = computed(() => {
    return props.project.levels[selectedMissionIndex.value] || props.project.levels[0];
});

// PASO ACTIVO (1, 2, 3)
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

    // Convertir a File
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

// ENVÍO FINAL DE LA MISIÓN
const submitMissionEvidence = () => {
    if (!bitacoraForm.file) {
        alert('Debes adjuntar o generar tu archivo antes de completar la misión.');
        return;
    }

    bitacoraForm.post(route('squad.bitacora.submit', { squad: props.squad.id, level: selectedMission.value.id }), {
        preserveScroll: true,
        onSuccess: () => {
            // Regresar al mapa del reto con la misión completada
            router.visit(route('student.studio'));
        }
    });
};

const getFirstName = (name) => {
    return name ? name.split(' ')[0] : 'Maker';
};
</script>

<template>
    <Head :title="selectedMission.title + ' — Makerdu Studio'" />

    <div class="min-h-screen flex flex-col font-sans transition-colors duration-300" :class="isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'">
        
        <!-- ================================================================= -->
        <!-- SLIM TOP HUD (54px) - NAVEGACIÓN INMERSIVA A PANTALLA COMPLETA    -->
        <!-- ================================================================= -->
        <header class="sticky top-0 z-40 h-14 border-b backdrop-blur-md px-4 sm:px-6 flex items-center justify-between" :class="isDarkTheme ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'">
            
            <!-- Izquierda: Botón Salir al Mapa del Reto -->
            <div class="flex items-center gap-3">
                <Link
                    :href="route('student.studio')"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    :class="isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'"
                >
                    <ArrowLeft class="w-3.5 h-3.5 text-cyan-400" />
                    <span class="hidden sm:inline">Mapa del Reto</span>
                </Link>

                <div class="h-4 w-px bg-slate-700/50 hidden sm:block"></div>

                <!-- Título compacto de la Misión -->
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-mono text-[10px] font-black uppercase tracking-wider border border-cyan-500/20">
                        Misión {{ selectedMissionIndex + 1 }}
                    </span>
                    <h1 class="text-xs sm:text-sm font-black truncate max-w-[200px] md:max-w-xs" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                        {{ selectedMission.title }}
                    </h1>
                </div>
            </div>

            <!-- Centro: Stepper 1-2-3 Compacto -->
            <div class="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700/60 text-xs">
                <button
                    type="button"
                    @click="activeStep = 1"
                    class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5"
                    :class="activeStep === 1 
                        ? (isDarkTheme ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-cyan-500 text-slate-950 shadow-sm') 
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
                        ? (isDarkTheme ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm') 
                        : (isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')"
                >
                    <span class="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center bg-black/20">
                        <Check v-if="bitacoraForm.file || bitacoraForm.image_snapshot" class="w-2.5 h-2.5 stroke-[3]" />
                        <span v-else>2</span>
                    </span>
                    <span class="hidden md:inline text-[11px]">Taller</span>
                </button>

                <button
                    type="button"
                    @click="activeStep = 3"
                    class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5"
                    :class="activeStep === 3 
                        ? (isDarkTheme ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-emerald-500 text-slate-950 shadow-sm') 
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
            <div class="flex items-center gap-3">
                <div class="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-xs font-black flex items-center gap-1.5">
                    <span>🪙</span>
                    <span>{{ props.squad.fabcoins_balance }} FC</span>
                </div>

                <button
                    type="button"
                    @click="toggleTheme"
                    class="w-8 h-8 rounded-xl border flex items-center justify-center transition cursor-pointer"
                    :class="isDarkTheme ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'"
                >
                    <Sun v-if="isDarkTheme" class="w-4 h-4" />
                    <Moon v-else class="w-4 h-4" />
                </button>
            </div>
        </header>

        <!-- ================================================================= -->
        <!-- VIEWPORT PRINCIPAL DE CREACIÓN (100% ANCHO Y ALTO ENFOCADO)       -->
        <!-- ================================================================= -->
        <main class="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
            
            <!-- HERO BANNER TÁCTICO DE LA MISIÓN -->
            <div 
                class="rounded-3xl border p-5 transition-all duration-300 relative overflow-hidden"
                :class="isDarkTheme ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'"
            >
                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent border border-cyan-500/20 p-2 shrink-0 flex items-center justify-center">
                        <img 
                            src="/images/digitoys/digifeliz.png" 
                            alt="Criatura Maker" 
                            class="w-full h-full object-contain drop-shadow-md"
                        />
                    </div>

                    <div class="space-y-1.5 flex-1 text-center sm:text-left">
                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-black uppercase tracking-wider border border-cyan-500/30">
                                MISIÓN {{ selectedMissionIndex + 1 }} DE 5
                            </span>
                            <span class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold">
                                NIVEL INICIAL
                            </span>
                        </div>

                        <div>
                            <h2 class="text-lg sm:text-xl font-black tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                {{ selectedMissionIndex === 0 ? 'Misión 1: Concebir — Nace tu Personaje y tu Marca de Autor' : selectedMission.title }}
                            </h2>
                            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                                {{ selectedMissionIndex === 0 
                                    ? 'Darás vida a una criatura original sobre papel o pantalla, asegurando que su base sea ancha y plana para que pueda sostenerse sola en el mundo físico.' 
                                    : (selectedMission.description || 'Supera cada paso con las herramientas del taller y la auditoría de tu Copiloto IA.') }}
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                            <span class="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold flex items-center gap-1.5" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-700'">
                                <span>📦</span>
                                <span>Entregable: <strong>{{ selectedMissionIndex === 0 ? 'Boceto B/N nítido' : 'Archivo digital' }}</strong></span>
                            </span>
                            <span class="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold flex items-center gap-1.5" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-700'">
                                <span>🪙</span>
                                <span>Costo: <strong>{{ selectedMission.fabcoins_cost || 0 }} FabCoins</strong></span>
                            </span>
                            <span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <span>🏆</span>
                                <span>Recompensa: <strong>+{{ selectedMission.xp_reward || 50 }} Puntos Maker</strong></span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ============================================================= -->
            <!-- PASO 1: INSPÍRATE & REGLAS DE DISEÑO                          -->
            <!-- ============================================================= -->
            <div 
                v-show="activeStep === 1"
                class="rounded-3xl border border-l-4 border-l-cyan-500 p-6 space-y-5 animate-fade-in"
                :class="isDarkTheme ? 'bg-slate-900 border-cyan-500/40 shadow-xl' : 'bg-white border-cyan-300 shadow-sm'"
            >
                <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                    <div class="flex items-center gap-2.5">
                        <span class="w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center bg-cyan-500 text-slate-950">
                            1
                        </span>
                        <div>
                            <span class="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
                                INICIO & BRIEFING
                            </span>
                            <h3 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                💡 Paso 1: Inspírate & Reglas de Diseño
                            </h3>
                        </div>
                    </div>
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/30">
                        PASO ACTIVO
                    </span>
                </div>

                <!-- Diálogo del Copiloto -->
                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center text-base shadow-md shrink-0">
                        🤖
                    </div>
                    <div class="space-y-1 flex-1 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-[11px]">Copiloto Maker</span>
                            <span class="text-[10px] text-slate-400">· mentor en vivo</span>
                        </div>
                        <p class="leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">
                            ¡Hola, {{ getFirstName(activeStudent.name) }}! Para que tu dibujo se convierta con éxito en un juguete 3D que se mantenga de pie, asegúrate de cumplir estas 4 reglas físicas antes de pasar a la mesa de dibujo.
                        </p>
                    </div>
                </div>

                <!-- 4 Reglas de Oro en Tarjetas Pastel Google Learn About -->
                <div class="space-y-2 pt-1">
                    <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        📋 4 Reglas de Oro para que tu Dibujo se Convierta en Juguete 3D:
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="p-3.5 rounded-2xl border flex items-start gap-3 transition" :class="isDarkTheme ? 'bg-slate-900/90 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'">
                            <span class="text-lg p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">✍️</span>
                            <div class="text-xs space-y-0.5">
                                <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Plumón Negro Grueso</strong>
                                <p class="text-[11px] leading-relaxed" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Trazo nítido y continuo sobre fondo blanco puro. Evita lápices y sombras.</p>
                            </div>
                        </div>
                        <div class="p-3.5 rounded-2xl border flex items-start gap-3 transition" :class="isDarkTheme ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'">
                            <span class="text-lg p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">📐</span>
                            <div class="text-xs space-y-0.5">
                                <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Base Plana Autoportante</strong>
                                <p class="text-[11px] leading-relaxed" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">La base debe medir al menos 40% del ancho del cuerpo para no volcarse.</p>
                            </div>
                        </div>
                        <div class="p-3.5 rounded-2xl border flex items-start gap-3 transition" :class="isDarkTheme ? 'bg-slate-900/90 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'">
                            <span class="text-lg p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">🔒</span>
                            <div class="text-xs space-y-0.5">
                                <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Silueta 100% Cerrada</strong>
                                <p class="text-[11px] leading-relaxed" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Cierra completamente el perímetro exterior para poder extruir el sólido.</p>
                            </div>
                        </div>
                        <div class="p-3.5 rounded-2xl border flex items-start gap-3 transition" :class="isDarkTheme ? 'bg-slate-900/90 border-purple-500/30' : 'bg-purple-50/70 border-purple-200'">
                            <span class="text-lg p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">👁️</span>
                            <div class="text-xs space-y-0.5">
                                <strong class="font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">Regla del Estarcido</strong>
                                <p class="text-[11px] leading-relaxed" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">Conecta pupilas o detalles interiores con puentes para que no se caigan.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recurso PDF de Digitoys -->
                <div 
                    class="p-4 rounded-2xl border transition flex flex-col sm:flex-row items-center justify-between gap-3"
                    :class="isDarkTheme ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/30' : 'bg-gradient-to-r from-cyan-50/80 via-white to-white border-cyan-200'"
                >
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-2xl shrink-0 border border-cyan-500/20">
                            📄
                        </div>
                        <div>
                            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                                CATÁLOGO DIDÁCTICO DE CONSTRUCCIÓN
                            </span>
                            <strong class="text-xs font-black block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Guía Visual de Siluetas y Expresiones Digitoys (PDF)
                            </strong>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pt-0.5">
                                Modelos de dinosaurios, robots, monstruos, ojos y bocas para recortar en papel o usar de inspiración.
                            </p>
                        </div>
                    </div>

                    <a 
                        href="/images/digitoys/DIGITOYS-construccion.pdf" 
                        target="_blank" 
                        class="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                    >
                        <span>👁️ Ver / Descargar PDF</span>
                        <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                </div>

                <!-- Botón de Avance a Paso 2 -->
                <div class="pt-3 border-t flex justify-end" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                    <button
                        type="button"
                        @click="activeStep = 2"
                        class="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                        <span>Continuar al Paso 2: Dibujar mi Criatura</span>
                        <ArrowRight class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- ============================================================= -->
            <!-- PASO 2: DIBUJA TU CRIATURA (MESA DE TRABAJO & SELECTOR 2D)    -->
            <!-- ============================================================= -->
            <div 
                v-show="activeStep === 2"
                class="rounded-3xl border border-l-4 border-l-amber-500 p-6 space-y-5 animate-fade-in"
                :class="isDarkTheme ? 'bg-slate-900 border-amber-500/40 shadow-xl' : 'bg-white border-amber-300 shadow-sm'"
            >
                <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                    <div class="flex items-center gap-2.5">
                        <span class="w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center bg-amber-500 text-slate-950">
                            2
                        </span>
                        <div>
                            <span class="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                                ACCIÓN & EXPERIMENTACIÓN
                            </span>
                            <h3 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                ✍️ Paso 2: Dibuja tu Criatura (Papel o Pantalla)
                            </h3>
                        </div>
                    </div>
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        PASO ACTIVO
                    </span>
                </div>

                <!-- SELECTOR DE LOS 2 CAMINOS EN MISIÓN 1 -->
                <div class="space-y-4">
                    <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        ELIGE CÓMO DESEAS CREAR TU BOCETO:
                    </span>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- CAMINO A: PAPEL Y PLUMÓN -->
                        <div 
                            class="p-5 rounded-2xl border transition flex flex-col justify-between gap-4"
                            :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'"
                        >
                            <div class="space-y-1.5">
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl">📷</span>
                                    <strong class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                        Camino A: Papel y Plumón Negro
                                    </strong>
                                </div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Dibuja en una hoja bond con plumón negro grueso. Luego tómale una foto con tu celular o usa tu cámara web.
                                </p>
                            </div>

                            <div class="flex items-center gap-2 pt-2">
                                <input 
                                    ref="evidenceFileInput"
                                    type="file" 
                                    accept="image/*" 
                                    class="hidden" 
                                    @change="onFileChange"
                                />
                                <button
                                    type="button"
                                    @click="evidenceFileInput?.click()"
                                    class="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                                >
                                    <span>📁 Subir Foto</span>
                                </button>
                                <button
                                    type="button"
                                    @click="isCameraOpen ? capturePhoto() : startCamera()"
                                    class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                                >
                                    <span>📸 Cámara</span>
                                </button>
                            </div>

                            <!-- Modal / Stream de Cámara Web -->
                            <div v-if="isCameraOpen" class="space-y-2 pt-2">
                                <video ref="videoElement" autoplay playsinline class="w-full h-48 rounded-xl bg-black object-cover"></video>
                                <div class="flex gap-2">
                                    <button
                                        type="button"
                                        @click="capturePhoto"
                                        class="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
                                    >
                                        📸 Capturar Foto
                                    </button>
                                    <button
                                        type="button"
                                        @click="stopCamera"
                                        class="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- CAMINO B: LIENZO DIGITAL MAKER 2D -->
                        <div 
                            class="p-5 rounded-2xl border transition flex flex-col justify-between gap-4 relative overflow-hidden"
                            :class="isDarkTheme ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40 shadow-lg shadow-cyan-950/30' : 'bg-gradient-to-br from-cyan-50 via-white to-white border-cyan-300 shadow-sm'"
                        >
                            <div class="space-y-1.5">
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl">🖌️</span>
                                    <strong class="text-sm font-black text-cyan-600 dark:text-cyan-300">
                                        Camino B: Lienzo Maker 2D
                                    </strong>
                                    <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-500 font-mono text-[9px] font-black uppercase">
                                        Digital
                                    </span>
                                </div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Dibuja en pantalla con 3 modos: <strong>Plumón Libre</strong>, <strong>Armador Digitoys</strong> (dinos, robots, ojos) o <strong>Pixel Art</strong>.
                                </p>
                            </div>

                            <div class="pt-2">
                                <button
                                    type="button"
                                    @click="openMicroAppModal({ slug: 'sketch-pad', name: 'Lienzo Maker 2D', icon: '🖌️' })"
                                    class="w-full px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-cyan-500/25 cursor-pointer"
                                >
                                    <span>🖌️ ABRIR LIENZO MAKER 2D</span>
                                    <Sparkles class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- PREVISUALIZACIÓN DEL BOCETO CARGADO -->
                    <div 
                        v-if="bitacoraForm.image_snapshot || bitacoraForm.file" 
                        class="p-5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in"
                    >
                        <div class="flex items-center gap-4">
                            <img 
                                :src="bitacoraForm.image_snapshot || previewUrl" 
                                class="w-20 h-20 rounded-xl object-contain bg-white border border-emerald-400 shadow-sm p-1 shrink-0" 
                                alt="Boceto cargado"
                            />
                            <div class="space-y-1">
                                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono text-[9px] font-bold">
                                    ✔ BOCETO LISTO EN LA MESA
                                </span>
                                <strong class="text-xs text-slate-900 dark:text-white block">
                                    {{ bitacoraForm.file?.name || 'boceto_maker_2d.png' }}
                                </strong>
                                <span class="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                                    Tu diseño está listo. Pasemos al Paso 3 para auditar la base y silueta con el Copiloto IA.
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                @click="openMicroAppModal({ slug: 'sketch-pad', name: 'Lienzo Maker 2D', icon: '🖌️' })"
                                class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-700 cursor-pointer"
                            >
                                <span>✏️ Redibujar</span>
                            </button>
                            <button
                                type="button"
                                @click="activeStep = 3"
                                class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer"
                            >
                                <span>Auditar con IA en Paso 3</span>
                                <ArrowRight class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Botones de Navegación Paso 2 -->
                <div class="pt-4 border-t flex items-center justify-between" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                    <button
                        type="button"
                        @click="activeStep = 1"
                        class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                        <ArrowLeft class="w-3.5 h-3.5" />
                        <span>Volver a Reglas de Diseño</span>
                    </button>

                    <button
                        type="button"
                        @click="activeStep = 3"
                        class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                        <span>Continuar a la Auditoría IA (Paso 3)</span>
                        <ArrowRight class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- ============================================================= -->
            <!-- PASO 3: AUDITORÍA DE CALIDAD & VISTO BUENO IA                 -->
            <!-- ============================================================= -->
            <div 
                v-show="activeStep === 3"
                class="rounded-3xl border border-l-4 border-l-emerald-500 p-6 space-y-5 animate-fade-in"
                :class="isDarkTheme ? 'bg-slate-900 border-emerald-500/40 shadow-xl' : 'bg-white border-emerald-300 shadow-sm'"
            >
                <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                    <div class="flex items-center gap-2.5">
                        <span class="w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center bg-emerald-500 text-slate-950">
                            3
                        </span>
                        <div>
                            <span class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                CONTROL DE CALIDAD & ENTREGA
                            </span>
                            <h3 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                🔍 Paso 3: Auditoría de Calidad & Visto Bueno IA
                            </h3>
                        </div>
                    </div>
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                        PASO ACTIVO
                    </span>
                </div>

                <!-- Botón de Auditoría con Gemini IA -->
                <div class="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
                    <div class="space-y-1 text-center sm:text-left">
                        <strong class="text-xs font-bold block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            Verificación de Estabilidad Física & Trazos
                        </strong>
                        <p class="text-[11px] text-slate-500 leading-relaxed">
                            La IA verificará que la base mida al menos 40% del ancho del cuerpo y que no tenga líneas abiertas.
                        </p>
                    </div>

                    <button
                        type="button"
                        @click="runPreflightCheck"
                        :disabled="preflightLoading || !bitacoraForm.file"
                        class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                        <RefreshCw v-if="preflightLoading" class="w-4 h-4 animate-spin" />
                        <Sparkles v-else class="w-4 h-4" />
                        <span>{{ preflightLoading ? 'AUDITANDO CON GEMINI IA...' : '✨ AUDITAR SILUETA CON GEMINI IA' }}</span>
                    </button>
                </div>

                <!-- Tarjeta de Veredicto IA -->
                <div 
                    v-if="qualityControlResult || (!bitacoraForm.file && existingEvidence && existingEvidence.ai_feedback)" 
                    class="p-5 rounded-2xl border space-y-3.5 animate-fade-in" 
                    :class="isDarkTheme 
                        ? ((qualityControlResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950 border-amber-500/40') 
                        : ((qualityControlResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/70 border-amber-200')"
                >
                    <div class="flex items-center justify-between">
                        <span 
                            class="text-xs font-mono font-black flex items-center gap-1.5"
                            :class="(preflightResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'"
                        >
                            <span>{{ (preflightResult?.is_valid ?? (existingEvidence?.status === 'approved')) ? '●' : '⚠️' }}</span>
                            <span>{{ preflightResult?.dashboard?.verdict_title || (existingEvidence?.status === 'approved' ? '¡SILUETA APROBADA!' : 'REQUIERE AJUSTES') }}</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Control de Calidad IA</span>
                    </div>

                    <p class="text-xs font-bold leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                        {{ preflightResult?.dashboard?.headline || preflightResult?.ai_feedback || existingEvidence?.ai_feedback }}
                    </p>
                </div>

                <!-- Botones de Navegación y Finalización -->
                <div class="flex items-center justify-between pt-4 border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                    <button
                        type="button"
                        @click="activeStep = 2"
                        class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                        <ArrowLeft class="w-3.5 h-3.5" />
                        <span>Volver a la Mesa de Trabajo</span>
                    </button>

                    <button
                        type="button"
                        @click="submitMissionEvidence"
                        :disabled="bitacoraForm.processing || !bitacoraForm.file"
                        class="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
                    >
                        <span>COMPLETAR MISIÓN 1 & SUMAR PUNTOS</span>
                        <ArrowRight class="w-4 h-4" />
                    </button>
                </div>
            </div>

        </main>

        <!-- MODAL OVERLAY DE MICRO-APPS (Lienzo Maker 2D, etc.) -->
        <MicroAppOverlay
            :is-open="showMicroAppModal"
            :app="activeTestingApp"
            :initial-image-url="initialAppImageUrl"
            @close="showMicroAppModal = false"
            @assetReady="handleMicroAppAsset"
        />

    </div>
</template>
