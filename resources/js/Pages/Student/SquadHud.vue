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
    ChevronDown, UserCheck, RefreshCw, Undo2, Target, MessageSquare, Bot, HelpCircle
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
const showHeroDetails = ref(false);

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
        
        // Agregar mensaje en el hilo conversacional
        copilotChatMessages.value.push({
            sender: 'user',
            text: `¡Listo! Acabamos de exportar nuestro diseño '${asset.fileName}' desde ${asset.appName || 'el estudio digital'}.`,
            time: 'Ahora'
        });

        setTimeout(() => {
            copilotChatMessages.value.push({
                sender: 'copilot',
                text: `¡Excelente trabajo de modelado! He recibido su archivo con ${asset.depth_mm || 10} mm de espesor. Asegúrense de presionar 'Auditar con IA' para que Gemini verifique la adherencia en la cama de impresión antes de fabricar.`,
                time: 'Ahora'
            });
        }, 600);
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

// Mensajes interactivos del hilo conversacional del Copiloto
const copilotChatMessages = ref([]);

// Píldoras Socráticas / Preguntas Frecuentes predefinidas por misión (0 tokens, respuesta instantánea)
const socraticQuestions = computed(() => {
    if (selectedMissionIndex.value === 0) {
        return [
            {
                q: '¿Por qué debe ser plumón negro grueso y no lápiz?',
                a: 'El software de escaneo y las máquinas de corte/3D necesitan un contraste fuerte blanco/negro. El grafito del lápiz genera sombras grises y líneas entrecortadas que confunden al algoritmo de vectorización.'
            },
            {
                q: '¿Cómo sé si mi personaje se parará solo en el escritorio?',
                a: '¡Regla de oro de los Digitoys! La base inferior (patas o soporte) debe medir al menos el 40% del ancho total y estar completamente plana en la parte inferior para que su centro de gravedad no lo haga volcarse.'
            },
            {
                q: '¿Qué es un espacio negativo?',
                a: 'Son los huecos interiores del dibujo (como el ojo de una letra "O" o el espacio entre las patas). El plumón negro define lo sólido, y el papel blanco interior define los huecos.'
            }
        ];
    } else if (selectedMissionIndex.value === 1) {
        return [
            {
                q: '¿Cuál es la diferencia entre 2D y 2.5D?',
                a: 'El 2D es un dibujo plano en papel (ancho X y alto Y). El 2.5D toma esa silueta plana y la extruye hacia arriba en el eje Z a un espesor fijo (3 mm para llavero o 10 mm para juguete autoportante) sin necesidad de modelar complejas curvas 3D.'
            },
            {
                q: '¿Por qué extruir a 10 mm y no a 2 mm?',
                a: 'A 10 mm de espesor, una figura de plástico PLA tiene suficiente masa y superficie de apoyo para pararse de pie sola en tu mesa. A 2 mm o 3 mm, sería muy delgada y solo serviría como llavero o arete.'
            }
        ];
    } else if (selectedMissionIndex.value === 2) {
        return [
            {
                q: '¿Qué es el Pre-Flight Check antes de imprimir?',
                a: 'Igual que los pilotos revisan su avión antes de despegar, en el FabLab revisamos el archivo STL antes de calentar la máquina: que la base esté 100% pegada a la bandeja, que no supere las medidas máximas y que no necesite soportes que desperdicien plástico.'
            },
            {
                q: '¿Por qué esta técnica no necesita soportes?',
                a: 'Porque el diseño se imprime "echado" (plano contra la cama de impresión). Todas las caras crecen verticalmente hacia arriba en ángulos rectos de 90°, lo que elimina los voladizos al aire.'
            }
        ];
    } else {
        return [
            {
                q: '¿Cómo retiro los hilitos de plástico al terminar?',
                a: 'Usa una pinza pequeña de punta fina o una lija al agua suave. El PLA se puede pulir fácilmente sin aplicar calor excesivo.'
            },
            {
                q: '¿Por qué es importante documentar en la bitácora?',
                a: 'En la cultura Maker, documentar lo que falló y cómo lo resolvieron es lo que transforma un simple objeto en conocimiento real para su Pasaporte Maker.'
            }
        ];
    }
});

const askSocraticQuestion = (item) => {
    copilotChatMessages.value.push({
        sender: 'user',
        text: item.q,
        time: 'Ahora'
    });

    setTimeout(() => {
        copilotChatMessages.value.push({
            sender: 'copilot',
            text: item.a,
            time: 'Ahora'
        });
    }, 300);
};

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

    copilotChatMessages.value.push({
        sender: 'user',
        text: `Adjunté el archivo: ${file.name} (${Math.round(file.size / 1024)} KB).`,
        time: 'Ahora'
    });
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
            const res = pageResp.props.flash?.preflight_result;
            preflightResult.value = res;

            if (res) {
                const verdictMsg = res.dashboard?.headline || res.ai_feedback || 'He analizado su evidencia.';
                const tipMsg = res.dashboard?.pedagogical_tip ? ` Consejo: ${res.dashboard.pedagogical_tip}` : '';
                
                copilotChatMessages.value.push({
                    sender: 'copilot',
                    text: `🔍 [Auditoría Gemini Vision]: ${verdictMsg}${tipMsg}`,
                    isVerdict: true,
                    verdictTitle: res.dashboard?.verdict_title || (res.is_valid ? '¡APROBADO!' : 'REQUIERE AJUSTES'),
                    isValid: res.is_valid,
                    time: 'Ahora'
                });
            }
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
    copilotChatMessages.value = []; // Reiniciar feed con contexto limpio
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
                
                <!-- Logo & Identificador del Estudio -->
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-cyan-500/20">
                        ⚡
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-black text-sm sm:text-base tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            Makerdu Studio
                        </span>
                        <span class="text-slate-400 text-xs hidden sm:inline">·</span>
                        <span class="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 hidden sm:inline">
                            Técnica {{ project.type || '2.5D' }}
                        </span>
                    </div>
                </div>

                <!-- Controles: Saldo FC, Puntos Maker, Tema & Avatar Minimalista -->
                <div class="flex items-center gap-2 sm:gap-3">
                    
                    <!-- Píldora FabCoins (FC) -->
                    <div 
                        :class="isDarkTheme ? 'bg-amber-950/30 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'"
                        class="px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                        title="Saldo disponible de FabCoins para fabricación física"
                    >
                        <span>🪙</span>
                        <span>{{ squad.fabcoins_balance }} FC</span>
                    </div>

                    <!-- Píldora Puntos Maker (PM) -->
                    <div 
                        :class="isDarkTheme ? 'bg-purple-950/30 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'"
                        class="px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm hidden sm:flex"
                        title="Puntos Maker de mérito acumulados"
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
        <!-- 2. LA GRAN CABECERA DEL RETO (CHALLENGE HERO CARD - ABR)          -->
        <!-- ================================================================= -->
        <section class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
            <div 
                :class="isDarkTheme 
                    ? 'bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border-slate-800' 
                    : 'bg-gradient-to-r from-cyan-50/60 via-white to-sky-50/60 border-cyan-200/80 shadow-sm'"
                class="rounded-3xl border p-5 sm:p-6 transition-all duration-300 relative overflow-hidden"
            >
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="space-y-1.5 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 uppercase tracking-wider shadow-sm">
                                🎯 RETO PRINCIPAL ABR
                            </span>
                            <span class="text-xs font-mono text-slate-400 font-bold">
                                Ciclo Maker de 4 Misiones
                            </span>
                        </div>

                        <h1 class="text-lg sm:text-2xl font-black tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            {{ squad.classroom?.custom_title || 'Diseñar, fabricar y presentar un Art Toy 2.5D auto-portante para tu escritorio' }}
                        </h1>

                        <p class="text-xs sm:text-sm leading-relaxed max-w-3xl" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                            {{ squad.classroom?.custom_description || project.description || 'Transforma una idea dibujada en papel con plumón en un objeto físico tridimensional impreso en 3D con 10 mm de espesor capaz de sostenerse de pie por sí mismo.' }}
                        </p>
                    </div>

                    <!-- Insignia de Recompensa Física -->
                    <div 
                        :class="isDarkTheme ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                        class="p-3.5 rounded-2xl border flex items-center gap-3 shrink-0"
                    >
                        <span class="text-3xl">🧸</span>
                        <div class="text-xs">
                            <span class="text-[10px] font-mono text-slate-400 uppercase font-bold block">Entregable Físico:</span>
                            <strong class="text-cyan-600 dark:text-cyan-400 font-black">Art Toy 3D en PLA</strong>
                            <span class="text-[10px] text-slate-500 block font-mono">10 mm auto-portante</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ================================================================= -->
        <!-- 3. LIENZO PRINCIPAL: RUTA (Izq) + FEED CONVERSACIONAL (Der)        -->
        <!-- ================================================================= -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- ============================================================= -->
            <!-- COLUMNA IZQUIERDA: RUTA DEL RETO (Timeline de Misiones)       -->
            <!-- ============================================================= -->
            <aside class="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-5 space-y-4 transition-colors duration-300"
                >
                    <!-- Cabecera de la Ruta -->
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <div>
                            <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                                MAPA DE EXPEDICIÓN
                            </span>
                            <h2 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Ruta de Misiones
                            </h2>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold" :class="isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'">
                            {{ selectedMissionIndex + 1 }} de {{ project.levels.length }}
                        </span>
                    </div>

                    <!-- LISTA VERTICAL DE MISIONES (Navegación No Restrictiva) -->
                    <nav class="space-y-2.5">
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
                                        : 'bg-cyan-50/80 border-cyan-400 shadow-sm ring-2 ring-cyan-500/20')
                                    : (isDarkTheme 
                                        ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400' 
                                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-600')
                            ]"
                        >
                            <div class="flex items-center gap-3">
                                <!-- Badge de Número / Check -->
                                <span 
                                    :class="[
                                        'w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 transition',
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
                                        :class="selectedMissionIndex === idx ? (isDarkTheme ? 'text-white' : 'text-slate-900 font-black') : ''"
                                    >
                                        {{ mission.title }}
                                    </h4>
                                    <span class="text-[10px] font-mono text-slate-400 block mt-0.5">
                                        ⚡ +{{ mission.xp_reward }} PM · 🪙 {{ mission.fabcoins_cost || 0 }} FC
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
                        <span>Puedes regresar a cualquier misión para reforzar trazos o ajustar medidas. El copiloto recordará sus progresos.</span>
                    </div>
                </div>
            </aside>

            <!-- ============================================================= -->
            <!-- COLUMNA DERECHA: FEED CONVERSACIONAL VIVO DEL COPILOTO        -->
            <!-- ============================================================= -->
            <section class="lg:col-span-8 space-y-6">
                
                <!-- 1. ENTRADA CONVERSACIONAL DEL COPILOTO (Bienvenida en Diálogo) -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center text-lg shadow-md shrink-0">
                            🤖
                        </div>
                        <div class="space-y-2 flex-1">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                    Copiloto Makerdu · Guía Activo
                                </span>
                                <span class="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    En línea
                                </span>
                            </div>

                            <!-- Saludo si el alumno regresa a una misión previa -->
                            <div v-if="isReturningToPreviousMission" class="space-y-1.5">
                                <h3 class="text-sm sm:text-base font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    ¡Qué bueno tenerlos de vuelta por la Misión {{ selectedMissionIndex + 1 }}! 🎨
                                </h3>
                                <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                                    ¿Quieren reforzar el trazo de su boceto, revisar las proporciones o probar una nueva variante antes de continuar con la fabricación? Todo ajuste que hagan aquí enriquecerá su modelo final.
                                </p>
                            </div>

                            <!-- Saludo estándar de la misión -->
                            <div v-else class="space-y-1.5">
                                <h3 class="text-sm sm:text-base font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                    ¡Hola, {{ activeStudent.name }} y equipo de la {{ squad.name }}! 👋
                                </h3>
                                <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                                    {{ selectedMission.inputs?.guide_text || 'En esta misión transformaremos la idea en un entregable concreto siguiendo los pasos de fabricación digital.' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- ========================================================= -->
                    <!-- TARJETA EMBEBIDA EN EL CHAT: MICRO-ANIMACIÓN / TUTORIAL   -->
                    <!-- ========================================================= -->
                    <div class="pt-2">
                        <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Miren este micro-tutorial antes de empezar:
                        </span>

                        <!-- RENDER DE MICRO-ANIMACIÓN EN VIVO (HTML/CSS) -->
                        <div v-if="getMissionAnimation(selectedMission)" class="rounded-2xl overflow-hidden border p-1" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
                            <div v-html="getMissionAnimation(selectedMission)" class="w-full"></div>
                        </div>

                        <!-- LISTA DE RECURSOS (VIDEOS, PDFS, ENLACES) -->
                        <div v-if="selectedMission.inputs?.resources_list?.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <div 
                                v-for="(res, rIdx) in selectedMission.inputs.resources_list" 
                                :key="rIdx"
                                :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'"
                                class="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                            >
                                <div class="flex items-center gap-2 truncate text-xs font-bold">
                                    <span>{{ res.type === 'video' ? '🎬' : (res.type === 'pdf' ? '📄' : '🔗') }}</span>
                                    <span class="truncate" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">{{ res.title }}</span>
                                </div>
                                <a v-if="res.url" :href="res.url" target="_blank" class="text-xs font-bold text-cyan-600 hover:underline shrink-0">
                                    Abrir ➔
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 2. TARJETA VIVA DE ACCIÓN MAKER: MICRO-APPS O TALLER     -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <span class="p-1 rounded-lg bg-purple-500/10 text-purple-500">⚙️</span>
                            <span>Manos a la Obra: Herramientas del Estudio</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Proceso Creativo</span>
                    </div>

                    <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                        {{ selectedMission.process?.instructions || 'Utiliza las herramientas digitales para modelar tu diseño y prepararlo para la fabricación física.' }}
                    </p>

                    <!-- BOTONES DE ACCIÓN DIRECTA PARA MICRO-APPS -->
                    <div v-if="selectedMission.process?.mode === 'micro_app'" class="space-y-2.5">
                        <span class="text-[11px] font-bold text-slate-400 block uppercase font-mono">
                            Herramientas Digitales Activas:
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

                    <!-- MODO TRABAJO MANUAL DE TALLER -->
                    <div v-else-if="selectedMission.process?.mode === 'manual_workshop'" class="p-4 rounded-2xl border" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
                        <div class="flex items-center gap-2 mb-1">
                            <Hammer class="w-4 h-4 text-amber-500" />
                            <h4 class="text-xs font-bold text-amber-600 dark:text-amber-300">Trabajo en la Mesa del Taller Físico</h4>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed">
                            Trabajen sobre papel bond con plumón indeleble negro grueso. Cierren completamente las líneas exteriores de su silueta para que la máquina pueda interpretar el sólido.
                        </p>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 3. DIÁLOGO VIVO & PÍLDORAS SOCRÁTICAS (0 Tokens, Instant) -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                            <HelpCircle class="w-4 h-4" />
                            <span>Preguntas Frecuentes al Copiloto (Respuestas al Instante)</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Píldoras Socráticas</span>
                    </div>

                    <!-- Hilo de Mensajes Conversacionales Dinámicos -->
                    <div v-if="copilotChatMessages.length > 0" class="space-y-3 pt-1">
                        <div 
                            v-for="(msg, mIdx) in copilotChatMessages" 
                            :key="mIdx"
                            :class="msg.sender === 'user' ? 'justify-end' : 'justify-start'"
                            class="flex items-start gap-2.5 text-xs animate-fade-in"
                        >
                            <div v-if="msg.sender === 'copilot'" class="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                🤖
                            </div>

                            <div 
                                :class="[
                                    'p-3.5 rounded-2xl max-w-[85%] leading-relaxed',
                                    msg.sender === 'user'
                                        ? 'bg-cyan-500 text-slate-950 font-bold rounded-tr-none ml-auto'
                                        : (isDarkTheme ? 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none' : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none')
                                ]"
                            >
                                <div v-if="msg.isVerdict" class="font-black text-xs mb-1" :class="msg.isValid ? 'text-emerald-500' : 'text-amber-500'">
                                    ● {{ msg.verdictTitle }}
                                </div>
                                <p>{{ msg.text }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Botones de Píldoras Socráticas -->
                    <div class="pt-2">
                        <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Haz clic para preguntar al mentor:
                        </span>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="(item, qIdx) in socraticQuestions"
                                :key="qIdx"
                                type="button"
                                @click="askSocraticQuestion(item)"
                                :class="isDarkTheme ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'"
                                class="px-3 py-1.5 rounded-full border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <span>💡</span>
                                <span>{{ item.q }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 4. TARJETA VIVA DE EVIDENCIA & AUDITORÍA CON GEMINI (Output) -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <span class="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">📤</span>
                            <span>Entrega de Evidencia & Auditoría en Vivo con Gemini</span>
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">Visión Multimodal</span>
                    </div>

                    <!-- CAJA DE ARRASTRE O SUBIDA DE ARCHIVO -->
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
                                Arrastra tu boceto o archivo STL aquí o haz clic para subir
                            </p>
                            <p class="text-[10px] text-slate-400 font-mono">
                                Acepta fotos con cámara (JPG/PNG) o archivos digitales (STL 3D / SVG)
                            </p>
                        </div>
                        <div v-else class="space-y-1">
                            <CheckCircle2 class="w-7 h-7 text-emerald-500 mx-auto" />
                            <p class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                {{ bitacoraForm.file.name }}
                            </p>
                            <p class="text-[10px] text-slate-400">Presiona el botón verde para auditar con Gemini IA</p>
                        </div>
                    </div>

                    <!-- BOTÓN PARA AUDITAR CON GEMINI IA -->
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
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
                            <span>{{ preflightLoading ? 'AUDITANDO CON GEMINI IA...' : '🔍 AUDITAR CON COPILOTO IA' }}</span>
                        </button>
                    </div>

                    <!-- TARJETA DE VEREDICTO DE GEMINI -->
                    <div v-if="preflightResult" class="p-5 rounded-2xl border space-y-3 animate-fade-in" :class="isDarkTheme ? 'bg-slate-950 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                                ● {{ preflightResult.dashboard?.verdict_title || 'EVALUACIÓN DE LA IA' }}
                            </span>
                            <span class="text-[10px] font-mono text-slate-400">Gemini 2.0 Flash Vision</span>
                        </div>

                        <p class="text-xs font-bold leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                            {{ preflightResult.dashboard?.headline || preflightResult.ai_feedback }}
                        </p>

                        <!-- Puntos Fuertes -->
                        <div v-if="preflightResult.dashboard?.strengths?.length > 0" class="space-y-1">
                            <span class="text-[10px] font-mono font-bold text-emerald-600 uppercase">Puntos Fuertes Detectados:</span>
                            <div v-for="(st, sIdx) in preflightResult.dashboard.strengths" :key="sIdx" class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span>✓</span>
                                <span>{{ st }}</span>
                            </div>
                        </div>

                        <!-- Consejo del Mentor -->
                        <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                            <Lightbulb class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                            <span>{{ preflightResult.dashboard?.pedagogical_tip || '¡Buen trabajo! Su diseño cumple las normas de fabricación.' }}</span>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 5. TARJETA DE CIERRE REFLEXIVO & AVANZAR MISIÓN           -->
                <!-- ========================================================= -->
                <div 
                    :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
                    class="rounded-3xl border p-6 space-y-4 transition-colors duration-300"
                >
                    <!-- Pregunta de Cierre del Excel ABR FabLab -->
                    <div>
                        <label class="block text-xs font-bold mb-1" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                            Cierre Reflexivo: ¿Qué funcionó y qué aprendieron en esta misión?
                        </label>
                        <textarea
                            v-model="bitacoraForm.reflection_text"
                            rows="2"
                            placeholder="Escribe una breve conclusión o aprendizaje de la mesa de trabajo..."
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
                            <span>COMPLETAR MISIÓN & SUMAR PUNTOS</span>
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
