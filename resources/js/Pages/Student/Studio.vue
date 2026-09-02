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
});

const page = usePage();

// Modal de Selección de Modalidad (Solo vs En Equipo)
const showTeamModal = ref(false);

const isSoloMode = computed(() => {
    return (props.squad.members || []).length <= 1;
});

const teamMembers = computed(() => {
    return props.squad.members || [];
});

const joinPeerTeam = (peer) => {
    router.post(route('squad.join-team'), { partner_user_id: peer.id }, {
        preserveScroll: true,
        onSuccess: () => {
            showTeamModal.value = false;
        },
    });
};

const setIndividual = () => {
    router.post(route('squad.set-individual'), {}, {
        preserveScroll: true,
        onSuccess: () => {
            showTeamModal.value = false;
        },
    });
};

// Obtener solo el primer nombre para un trato más humano y cercano
const getFirstName = (fullName) => {
    if (!fullName) return 'Creador';
    return fullName.trim().split(' ')[0];
};

// TEMA: Claro por defecto (Estilo Google Learn About / Papel limpio)
const isDarkTheme = ref(false);

const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
};

// Menú desplegable de Avatar de Escuadra
const showUserMenu = ref(false);

// Click-Outside infalible a nivel de ventana para cerrar el menú de usuario
const onWindowClick = (e) => {
    if (showUserMenu.value) {
        const trigger = document.getElementById('user-menu-trigger');
        const dropdown = document.getElementById('user-menu-dropdown');
        if (trigger && !trigger.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
            showUserMenu.value = false;
        }
    }
};

onMounted(() => {
    window.addEventListener('click', onWindowClick);
});

onUnmounted(() => {
    window.removeEventListener('click', onWindowClick);
});

// Micro-Apps Overlay
const activeTestingApp = ref(null);
const initialAppImageUrl = ref(null);
const showMicroAppModal = ref(false);

// Boceto aprobado de la Misión 1 (para precarga en Misión 2)
const mission1Evidence = computed(() => {
    const m1 = props.project.levels[0];
    if (!m1) return null;
    return (props.bitacoras || []).find(b => b.level_id === m1.id && b.file_url);
});

const openMicroAppModal = (app, imageUrl = null) => {
    activeTestingApp.value = app;
    initialAppImageUrl.value = imageUrl;
    showMicroAppModal.value = true;
};

const handleMicroAppAsset = (asset) => {
    if (asset && asset.content) {
        bitacoraForm.content_text = `Entregable generado con Micro-App '${asset.appName || 'Makerdu'}': ${asset.fileName || 'archivo'} (${asset.depth_mm || 10} mm espesor).`;
        showMicroAppModal.value = false;
        
        // Desbloquear Fase 3 y deslizar suavemente
        unlockPhase(3, 'phase-3');

        copilotChatMessages.value.push({
            sender: 'user',
            text: `¡Listo! Acabamos de exportar nuestro diseño '${asset.fileName}' desde ${asset.appName || 'el estudio digital'}.`,
            time: 'Ahora'
        });

        setTimeout(() => {
            copilotChatMessages.value.push({
                sender: 'copilot',
                text: `¡Gran avance en el modelado! Recibí su geometría de ${asset.depth_mm || 10} mm. Ahora solo nos queda la auditoría de calidad con Gemini antes de mandar a fabricar.`,
                time: 'Ahora'
            });
        }, 400);
    }
};

// Misión activa seleccionada (Navegación no restrictiva)
const selectedMissionIndex = ref(0);

// Nivel / Misión seleccionada
const selectedMission = computed(() => {
    return props.project.levels[selectedMissionIndex.value] || props.project.levels[0];
});

// MEMORIA DE PROGRESO POR MISIÓN:
// Cada misión recuerda qué fase desbloqueó el estudiante (1, 2 o 3)
const missionUnlockedPhases = ref({
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
});

// Fase activa actual para la misión seleccionada
const currentPhase = computed(() => {
    return missionUnlockedPhases.value[selectedMissionIndex.value] || 1;
});

// Desbloquear fase con auto-scroll suave hacia el elemento destino
const unlockPhase = (phaseNumber, targetElementId = null) => {
    if (phaseNumber > (missionUnlockedPhases.value[selectedMissionIndex.value] || 1)) {
        missionUnlockedPhases.value[selectedMissionIndex.value] = phaseNumber;
    }

    if (targetElementId) {
        nextTick(() => {
            const targetEl = document.getElementById(targetElementId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
};

// Mensajes interactivos del hilo conversacional del Copiloto (por cada misión)
const missionChatMessages = ref({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
});

const copilotChatMessages = computed(() => {
    return missionChatMessages.value[selectedMissionIndex.value] || [];
});

const customQuestionText = ref('');
const copilotAnswering = ref(false);

const sendCustomQuestion = async () => {
    const text = customQuestionText.value.trim();
    if (!text || copilotAnswering.value) return;

    if (!missionChatMessages.value[selectedMissionIndex.value]) {
        missionChatMessages.value[selectedMissionIndex.value] = [];
    }

    missionChatMessages.value[selectedMissionIndex.value].push({
        sender: 'user',
        text: text,
        time: 'Ahora'
    });

    customQuestionText.value = '';
    copilotAnswering.value = true;

    try {
        const response = await fetch(route('squad.ai-chat', { squad: props.squad.id }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                message: text,
                level_id: selectedMission.value.id,
            })
        });

        if (response.ok) {
            const data = await response.json();
            missionChatMessages.value[selectedMissionIndex.value].push({
                sender: 'copilot',
                text: data.reply || '¡Interesante pregunta! Recuerda asegurar una base amplia y espesor de 10 mm.',
                time: 'Ahora'
            });
        } else {
            missionChatMessages.value[selectedMissionIndex.value].push({
                sender: 'copilot',
                text: 'En esta misión, recuerda verificar que tu modelo tenga 10 mm de espesor y base estable.',
                time: 'Ahora'
            });
        }
    } catch (e) {
        missionChatMessages.value[selectedMissionIndex.value].push({
            sender: 'copilot',
            text: '¡Buena pregunta! Ten en cuenta siempre la base de apoyo y el espesor uniforme.',
            time: 'Ahora'
        });
    } finally {
        copilotAnswering.value = false;
        nextTick(() => {
            const chatBox = document.getElementById('chat-messages-container');
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
};

// Píldoras Socráticas disponibles por misión (se eliminan al hacer clic)
const missionSocraticPills = ref({
    0: [
        {
            id: 'p1_1',
            q: '¿Por qué debe ser plumón negro grueso y no lápiz?',
            a: 'El software de escaneo y las máquinas de corte/3D necesitan un contraste fuerte blanco/negro. El grafito del lápiz genera sombras grises y líneas entrecortadas que confunden al algoritmo de vectorización.'
        },
        {
            id: 'p1_2',
            q: '¿Cómo sé si mi personaje se parará solo en el escritorio?',
            a: '¡Regla de oro de los Art Toys! La base inferior (patas o soporte) debe medir al menos el 40% del ancho total y ser completamente recta para que su centro de gravedad no lo haga volcarse.'
        },
        {
            id: 'p1_3',
            q: '¿Qué es un espacio negativo en mi producto?',
            a: 'Son los huecos interiores del dibujo (como el ojo de una letra "O" o el espacio entre las piernas). El plumón negro define el plástico sólido, y el papel blanco interior define los huecos calados.'
        }
    ],
    1: [
        {
            id: 'p2_1',
            q: '¿Cuál es la diferencia entre 2D y 2.5D?',
            a: 'El 2D es un dibujo plano en papel (ancho y alto). El 2.5D toma esa silueta plana y la extruye hacia arriba en el eje Z a un espesor fijo (10 mm para un producto autoportante) sin necesidad de modelar complejas curvas 3D.'
        },
        {
            id: 'p2_2',
            q: '¿Por qué extruir a 10 mm y no a 2 mm?',
            a: 'A 10 mm de espesor, una figura de plástico PLA tiene suficiente masa y superficie de apoyo para pararse de pie sola en tu mesa. A 2 mm o 3 mm, sería muy delgada y solo serviría como llavero o arete.'
        }
    ],
    2: [
        {
            id: 'p3_1',
            q: '¿Qué es el Control de Calidad IA antes de fabricar?',
            a: 'Igual que los ingenieros revisan su prototipo antes de producirlo en masa, en el taller revisamos el archivo digital con IA: que la base esté plana, que no supere medidas y que gaste el plástico justo.'
        },
        {
            id: 'p3_2',
            q: '¿Por qué esta técnica no necesita soportes?',
            a: 'Porque el diseño se imprime "echado" (plano contra la cama de impresión). Todas las caras crecen verticalmente hacia arriba en ángulos rectos de 90°, lo que elimina los voladizos al aire.'
        }
    ],
    3: [
        {
            id: 'p4_1',
            q: '¿Por qué se usa lija al agua sobre el PLA?',
            a: 'La lija al agua evita que el calor de la fricción derrita el plástico. Absorbe las partículas y deja una superficie sedosa y suave, lista para exhibir o pintar.'
        },
        {
            id: 'p4_2',
            q: '¿Cómo influye el empaque en el valor del producto?',
            a: 'Un empaque con tu logo y la tarjeta de historia de tu personaje convierte una pieza de plástico en un objeto de diseño coleccionable de alto valor.'
        }
    ],
    4: [
        {
            id: 'p5_1',
            q: '¿Cómo estructuro mi pitch de 30 segundos?',
            a: '1) Gancho: ¿Quién es tu criatura? 2) Problema o historia: ¿Qué poder tiene? 3) Fabricación: hecho en PLA ecológico con impresión 3D 4) Llamado a la acción: ¡Consigue el tuyo para tu escritorio!'
        },
        {
            id: 'p5_2',
            q: '¿Cómo me pueden apoyar mis papás en el lanzamiento?',
            a: 'Tus papás pueden ayudarte a grabar tu video pitch con buena luz y sonido en su celular, y compartir el afiche en sus redes para tus primeras ventas.'
        }
    ]
});

// Píldoras activas para la misión actual
const currentPills = computed(() => {
    return missionSocraticPills.value[selectedMissionIndex.value] || [];
});

const askSocraticQuestion = (item) => {
    if (!missionChatMessages.value[selectedMissionIndex.value]) {
        missionChatMessages.value[selectedMissionIndex.value] = [];
    }

    missionChatMessages.value[selectedMissionIndex.value].push({
        sender: 'user',
        text: item.q,
        time: 'Ahora'
    });

    setTimeout(() => {
        missionChatMessages.value[selectedMissionIndex.value].push({
            sender: 'copilot',
            text: item.a,
            time: 'Ahora'
        });

        // Suave scroll al nuevo mensaje
        nextTick(() => {
            const chatBox = document.getElementById('chat-messages-container');
            if (chatBox) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        });
    }, 250);

    // 2. Eliminar la píldora de las opciones
    missionSocraticPills.value[selectedMissionIndex.value] = missionSocraticPills.value[selectedMissionIndex.value].filter(p => p.id !== item.id);
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

// Evidencia previa ya guardada en base de datos para la misión activa
const existingEvidence = computed(() => {
    return (props.bitacoras || []).find(b => b.level_id === selectedMission.value.id && b.file_url);
});

const isImageFile = (url) => {
    if (!url) return false;
    return /\.(png|jpe?g|webp|gif)$/i.test(url);
};

// Manejo de archivo
const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    bitacoraForm.file = file;

    if (!missionChatMessages.value[selectedMissionIndex.value]) {
        missionChatMessages.value[selectedMissionIndex.value] = [];
    }

    missionChatMessages.value[selectedMissionIndex.value].push({
        sender: 'user',
        text: `Subí el archivo de evidencia: ${file.name} (${Math.round(file.size / 1024)} KB).`,
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
                const tipMsg = res.dashboard?.pedagogical_tip ? ` Consejo del Mentor: ${res.dashboard.pedagogical_tip}` : '';
                
                if (!missionChatMessages.value[selectedMissionIndex.value]) {
                    missionChatMessages.value[selectedMissionIndex.value] = [];
                }

                missionChatMessages.value[selectedMissionIndex.value].push({
                    sender: 'copilot',
                    text: `🔍 [Control de Calidad IA]: ${verdictMsg}${tipMsg}`,
                    isVerdict: true,
                    verdictTitle: res.dashboard?.verdict_title || (res.is_valid ? '¡DISEÑO VALIDADO!' : 'REQUIERE AJUSTES'),
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

// Enviar Bitácora y Avanzar a la siguiente misión
const submitMissionEvidence = () => {
    bitacoraForm.content_text = bitacoraForm.reflection_text || bitacoraForm.content_text || 'Evidencia completada y validada por la escuadra.';
    bitacoraForm.post(route('squad.bitacora.submit', { squad: props.squad.id, level: selectedMission.value.id }), {
        preserveScroll: true,
        onSuccess: () => {
            const nextIdx = selectedMissionIndex.value + 1;
            if (nextIdx < props.project.levels.length) {
                selectMission(nextIdx);
            }
            bitacoraForm.reset();
            preflightResult.value = null;
        },
    });
};

// Seleccionar misión desde la ruta lateral preservando el progreso de fases de cada misión
const selectMission = (idx) => {
    selectedMissionIndex.value = idx;
    preflightResult.value = null;
    
    // Auto-scroll suave a la parte superior de la sección de trabajo
    nextTick(() => {
        window.scrollTo({ top: 120, behavior: 'smooth' });
    });
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
                            Micro-Fábrica Digital
                        </span>
                    </div>
                </div>

                <!-- Controles: Saldo FC, Puntos Maker, Tema & Avatar Minimalista -->
                <div class="flex items-center gap-2 sm:gap-3">
                    
                    <!-- Píldora FabCoins (FC) -->
                    <div 
                        :class="isDarkTheme ? 'bg-amber-950/30 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'"
                        class="px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
                        title="Saldo disponible de FabCoins para fabricar físicamente"
                    >
                        <span>🪙</span>
                        <span>{{ squad.fabcoins_balance }} FC</span>
                    </div>

                    <!-- Píldora Puntos Maker (PM) -->
                    <div 
                        :class="isDarkTheme ? 'bg-purple-950/30 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'"
                        class="px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm hidden sm:flex"
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

                    <!-- BOTÓN INDICADOR DE MODALIDAD (SOLO VS EQUIPO) -->
                    <button
                        type="button"
                        @click="showTeamModal = true"
                        :class="isDarkTheme ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'"
                        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-mono font-bold transition cursor-pointer"
                        title="Cambiar entre modo Individual y modo En Equipo"
                    >
                        <span v-if="isSoloMode" class="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <User class="w-3.5 h-3.5 text-cyan-500" />
                            <span>Solo</span>
                        </span>
                        <span v-else class="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                            <Users class="w-3.5 h-3.5" />
                            <span>Equipo ({{ teamMembers.length }})</span>
                        </span>
                    </button>

                    <!-- CHIP MINIMALISTA DE USUARIO (Estilo Google Avatar) -->
                    <div class="relative">
                        <button
                            id="user-menu-trigger"
                            type="button"
                            @click="showUserMenu = !showUserMenu"
                            :class="isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'"
                            class="px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                        >
                            <div class="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                                {{ squad.name.charAt(0) }}
                            </div>
                            <span class="truncate max-w-[90px] sm:max-w-[120px]">{{ getFirstName(activeStudent.name) }}</span>
                            <ChevronDown class="w-3 h-3 text-slate-400" />
                        </button>

                        <!-- Menú Desplegable Flotante -->
                        <div 
                            id="user-menu-dropdown"
                            v-if="showUserMenu"
                            :class="isDarkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-xl'"
                            class="absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-2xl z-50 space-y-1 text-xs animate-fade-in"
                        >
                            <div class="p-2 border-b border-slate-200 dark:border-slate-800">
                                <span class="text-[10px] text-slate-400 font-mono block">Creador / Mesa:</span>
                                <strong class="text-sm font-black">{{ activeStudent.name }}</strong>
                                <span class="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block mt-0.5">{{ squad.name }}</span>
                            </div>

                            <button
                                type="button"
                                @click="showTeamModal = true; showUserMenu = false;"
                                class="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-left cursor-pointer text-cyan-600 dark:text-cyan-400"
                            >
                                <Users class="w-4 h-4" />
                                <span>{{ isSoloMode ? 'Unirme a un Equipo' : 'Gestionar Mi Equipo' }}</span>
                            </button>

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
        <!-- 2. LA GRAN CABECERA DEL RETO EMPRENDEDOR (CHALLENGE HERO CARD)    -->
        <!-- ================================================================= -->
        <section class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
            <div 
                :class="isDarkTheme 
                    ? 'bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border-slate-800' 
                    : 'bg-white border-slate-200 shadow-sm'"
                class="rounded-3xl border p-5 sm:p-6 transition-all duration-300 relative overflow-hidden"
            >
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div class="space-y-2 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <Rocket class="w-3 h-3" />
                                <span>RETO DE PRODUCTO FÍSICO</span>
                            </span>
                            <span class="text-xs font-mono text-slate-400 font-bold">
                                Ciclo Maker de 5 Misiones
                            </span>
                        </div>

                        <!-- TÍTULO ENFOCADO AL MUNDO EMPRENDEDOR -->
                        <h1 class="text-xl sm:text-2xl font-black tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            {{ squad.classroom?.custom_title || 'Lanza tu Colección de Art Toys 2.5D' }}
                        </h1>

                        <!-- DESCRIPCIÓN CONCISA Y MOTIVADORA -->
                        <p class="text-xs sm:text-sm leading-relaxed max-w-2xl" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                            Diseña tu personaje de autor en papel, dale volumen digital y fabrícala en el taller para tener tu primer producto coleccionable de pie en tu escritorio.
                        </p>

                        <!-- FRASE GUÍA SUTIL -->
                        <div class="pt-1 flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                            <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            <span>A tu izquierda tienes tu <strong>Ruta del Reto</strong> para avanzar paso a paso con tu Copiloto IA.</span>
                        </div>
                    </div>

                    <!-- SHOWCASE VISUAL DE LA META DEL PRODUCTO -->
                    <div 
                        :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80 shadow-inner'"
                        class="p-4 rounded-3xl border flex items-center gap-4 shrink-0 max-w-sm"
                    >
                        <div class="relative w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm p-1.5 flex items-center justify-center shrink-0 group overflow-hidden">
                            <img 
                                src="/images/digitoys/digifeliz.png" 
                                alt="Art Toy 2.5D Autoportante" 
                                class="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                            />
                            <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[8px] font-mono shadow">
                                10 mm
                            </span>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 uppercase font-black tracking-wider block">
                                META DEL PRODUCTO
                            </span>
                            <strong class="text-sm font-black leading-tight block" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Art Toy 2.5D Autoportante
                            </strong>
                            <p class="text-[11px] text-slate-400 leading-snug">
                                PLA biodegradable · Base plana que se para sola en tu mesa sin soportes.
                            </p>
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
                                RUTA DEL PRODUCTO
                            </span>
                            <h2 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Misiones del Taller
                            </h2>
                        </div>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold" :class="isDarkTheme ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'">
                            Misión {{ selectedMissionIndex + 1 }} de {{ project.levels.length }}
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
                                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30' 
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
                        <span>Puedes regresar a cualquier misión para pulir tu silueta o probar ideas nuevas. Nada queda bloqueado.</span>
                    </div>
                </div>
            </aside>

            <!-- ============================================================= -->
            <!-- COLUMNA DERECHA: EXPERIENCIA CONVERSACIONAL POR FASES         -->
            <!-- ============================================================= -->
            <section class="lg:col-span-8 space-y-6">
                
                <!-- CABECERA DE LA MISIÓN ACTIVA (El verdadero título) -->
                <div class="flex items-center justify-between pb-1">
                    <div>
                        <span class="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
                            MISIÓN {{ selectedMissionIndex + 1 }} DE 5
                        </span>
                        <h2 class="text-xl sm:text-2xl font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            {{ selectedMission.title }}
                        </h2>
                    </div>

                    <!-- Indicador de Fases Dinámico -->
                    <div class="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                        <span 
                            :class="currentPhase >= 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-200 text-slate-500'"
                            class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        >1</span>
                        <span class="text-slate-300">➔</span>
                        <span 
                            :class="currentPhase >= 2 ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'"
                            class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        >2</span>
                        <span class="text-slate-300">➔</span>
                        <span 
                            :class="currentPhase >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'"
                            class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        >3</span>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- FASE 1: RECURSOS PARA TU MISIÓN (Input)                   -->
                <!-- ========================================================= -->
                <div 
                    id="phase-1"
                    :class="[
                        'rounded-3xl border transition-all duration-300 p-6 space-y-4 scroll-mt-28',
                        currentPhase === 1
                            ? (isDarkTheme ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/40' : 'bg-white border-cyan-400 shadow-md ring-2 ring-cyan-500/10')
                            : (isDarkTheme ? 'bg-slate-900/60 border-slate-800 opacity-90' : 'bg-slate-50/90 border-slate-200')
                    ]"
                >
                    <!-- Header de Fase 1 -->
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200/70'">
                        <div class="flex items-center gap-2.5">
                            <span 
                                :class="currentPhase > 1 ? 'bg-emerald-500 text-white' : 'bg-cyan-500 text-slate-950'"
                                class="w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center"
                            >
                                <Check v-if="currentPhase > 1" class="w-3.5 h-3.5 stroke-[3]" />
                                <span v-else>1</span>
                            </span>
                            <span class="text-xs font-black uppercase tracking-wider" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Paso 1: Recursos para tu Misión
                            </span>
                        </div>

                        <span 
                            v-if="currentPhase === 1" 
                            class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/30 animate-pulse"
                        >
                            ⚡ EN CURSO
                        </span>
                        <span 
                            v-else 
                            class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                        >
                            <Check class="w-3.5 h-3.5" />
                            <span>Recursos listos</span>
                        </span>
                    </div>

                    <!-- Diálogo vivo del Copiloto -->
                    <div class="flex items-start gap-3 pt-1">
                        <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center text-base shadow-md shrink-0">
                            🤖
                        </div>
                        <div class="space-y-1.5 flex-1 text-xs">
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-[11px]">Copiloto Maker</span>
                                <span class="text-[10px] text-slate-400">· mentor en vivo</span>
                            </div>

                            <!-- 3 ESTADOS HUMANOS DE MENSAJE: -->
                            <!-- Estado A: Misión completada -->
                            <p v-if="selectedMission.is_completed" class="leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">
                                ¡Esta misión ya fue superada con éxito! 🎉 Tienen su evidencia aprobada. Si desean pulir algún detalle del trazo o experimentar con otra versión, pueden hacerlo con total libertad.
                            </p>
                            <!-- Estado B: Revisitando a medias -->
                            <p v-else-if="currentPhase > 1" class="leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">
                                ¡De vuelta en acción! Ya tienen este tutorial revisado. Continuemos avanzando en la <strong class="font-bold">Fase {{ currentPhase }}</strong> para completar su diseño.
                            </p>
                            <!-- Estado C: Primera vez que llega a la misión -->
                            <p v-else class="leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-700'">
                                ¡Hola, {{ getFirstName(activeStudent.name) }}! Para esta misión de <strong class="font-black">{{ selectedMission.title }}</strong>, miren primero este micro-tutorial de 20 segundos para entender cómo debe ser la silueta antes de pasar a las herramientas.
                            </p>
                        </div>
                    </div>

                    <!-- RENDER DE MICRO-ANIMACIÓN DIDÁCTICA EN VIVO -->
                    <div v-if="getMissionAnimation(selectedMission)" class="rounded-2xl overflow-hidden border p-1" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'">
                        <div v-html="getMissionAnimation(selectedMission)" class="w-full"></div>
                    </div>

                    <!-- 4 REGLAS DE ORO MAKER DEL BOCETO (Exclusivo Misión 1) -->
                    <div v-if="selectedMissionIndex === 0" class="pt-2 space-y-2">
                        <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            📋 4 Reglas de Oro para que tu Dibujo se Convierta en Juguete 3D:
                        </span>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'">
                                <span class="text-base">✍️</span>
                                <div class="text-xs space-y-0.5">
                                    <strong class="font-bold block" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">Plumón Negro Grueso</strong>
                                    <p class="text-[11px] text-slate-400 leading-tight">Trazo nítido y continuo sobre papel blanco. Evita sombras a lápiz.</p>
                                </div>
                            </div>
                            <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'">
                                <span class="text-base">📐</span>
                                <div class="text-xs space-y-0.5">
                                    <strong class="font-bold block" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">Base Plana Autoportante</strong>
                                    <p class="text-[11px] text-slate-400 leading-tight">La base debe medir al menos 40% del ancho para no caerse.</p>
                                </div>
                            </div>
                            <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'">
                                <span class="text-base">🔒</span>
                                <div class="text-xs space-y-0.5">
                                    <strong class="font-bold block" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">Silueta 100% Cerrada</strong>
                                    <p class="text-[11px] text-slate-400 leading-tight">Cierra el contorno exterior sin huecos para poder extruir el sólido.</p>
                                </div>
                            </div>
                            <div class="p-3 rounded-2xl border flex items-start gap-2.5" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'">
                                <span class="text-base">👁️</span>
                                <div class="text-xs space-y-0.5">
                                    <strong class="font-bold block" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">Regla del Estarcido</strong>
                                    <p class="text-[11px] text-slate-400 leading-tight">Conecta pupilas o detalles interiores con puentes de unión.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Botón para avanzar a la Fase 2 con auto-scroll -->
                    <div class="pt-2 flex justify-end">
                        <button
                            type="button"
                            @click="unlockPhase(2, 'phase-2')"
                            class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                            <span>{{ currentPhase > 1 ? 'CONTINUAR A LA MESA DE TRABAJO' : '¡ENTENDIDO, VAMOS A DIBUJAR!' }}</span>
                            <ArrowDown class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- FASE 2: ACCIÓN MAKER & HERRAMIENTAS (Process)             -->
                <!-- ========================================================= -->
                <div 
                    v-if="currentPhase >= 2"
                    id="phase-2"
                    :class="[
                        'rounded-3xl border transition-all duration-300 p-6 space-y-4 animate-fade-in scroll-mt-28',
                        currentPhase === 2
                            ? (isDarkTheme ? 'bg-slate-900 border-purple-500/50 shadow-lg shadow-purple-950/40' : 'bg-white border-purple-400 shadow-md ring-2 ring-purple-500/10')
                            : (isDarkTheme ? 'bg-slate-900/60 border-slate-800 opacity-90' : 'bg-slate-50/90 border-slate-200')
                    ]"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200/70'">
                        <div class="flex items-center gap-2.5">
                            <span 
                                :class="currentPhase > 2 ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white'"
                                class="w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center"
                            >
                                <Check v-if="currentPhase > 2" class="w-3.5 h-3.5 stroke-[3]" />
                                <span v-else>2</span>
                            </span>
                            <span class="text-xs font-black uppercase tracking-wider" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                Paso 2: Mesa de Trabajo & Herramientas
                            </span>
                        </div>

                        <span 
                            v-if="currentPhase === 2" 
                            class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/30 animate-pulse"
                        >
                            ⚡ EN CURSO
                        </span>
                        <span 
                            v-else 
                            class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                        >
                            <Check class="w-3.5 h-3.5" />
                            <span>Herramienta lista</span>
                        </span>
                    </div>

                    <p class="text-xs leading-relaxed" :class="isDarkTheme ? 'text-slate-300' : 'text-slate-600'">
                        {{ selectedMission.process?.instructions || 'Utiliza las herramientas para modelar tu diseño y prepararlo para la fabricación.' }}
                    </p>

                    <!-- TARJETA DE INSUMO: BOCETO APROBADO EN MISIÓN 1 (Para Misión 2) -->
                    <div 
                        v-if="selectedMissionIndex === 1 && mission1Evidence" 
                        class="p-4 rounded-2xl border bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                        <div class="flex items-center gap-3.5">
                            <div class="relative">
                                <img :src="mission1Evidence.file_url" class="w-14 h-14 rounded-xl object-contain bg-white border border-cyan-300 shadow-sm p-0.5" alt="Boceto M1" />
                                <span class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[8px] font-mono">
                                    M1
                                </span>
                            </div>
                            <div>
                                <span class="text-[10px] font-mono font-bold uppercase text-cyan-600 dark:text-cyan-400 block">
                                    Insumo de Misión 1:
                                </span>
                                <strong class="text-xs text-slate-900 dark:text-white block">
                                    Tu Boceto de Criatura Aprobado
                                </strong>
                                <span class="text-[10px] text-slate-400">
                                    Pásalo directamente al Vectorizador para limpiarlo y extruirlo a 10 mm.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            @click="openMicroAppModal(props.microApps.find(a => a.slug === 'vectorizer') || { slug: 'vectorizer', name: 'Vectorizador & Extrusor 2.5D' }, mission1Evidence.file_url)"
                            class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
                        >
                            <Sparkles class="w-3.5 h-3.5" />
                            <span>Abrir en Vectorizador con este Boceto</span>
                        </button>
                    </div>

                    <!-- BOTONES DE MICRO-APPS DIGITALES -->
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
                            <h4 class="text-xs font-bold text-amber-600 dark:text-amber-300">Trabajo en la Mesa del Taller</h4>
                        </div>
                        <p class="text-xs text-slate-500 leading-relaxed">
                            Dibujen sobre papel bond con plumón indeleble negro grueso. Cierren completamente las líneas exteriores para que el escáner detecte el sólido.
                        </p>
                    </div>

                    <!-- HILO CONVERSACIONAL DE PREGUNTAS (Aparece primero para el flujo visual) -->
                    <div id="chat-messages-container" v-if="copilotChatMessages.length > 0" class="space-y-2.5 pt-2 max-h-60 overflow-y-auto">
                        <div 
                            v-for="(msg, mIdx) in copilotChatMessages" 
                            :key="mIdx"
                            :class="msg.sender === 'user' ? 'justify-end' : 'justify-start'"
                            class="flex items-start gap-2 text-xs animate-fade-in"
                        >
                            <div v-if="msg.sender === 'copilot'" class="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                🤖
                            </div>
                            <div 
                                :class="[
                                    'p-3 rounded-2xl max-w-[85%] leading-relaxed',
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

                    <!-- PÍLDORAS SOCRÁTICAS AL FINAL DEL DIÁLOGO (Flujo natural hacia abajo) -->
                    <div v-if="currentPills.length > 0" class="pt-2 border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            💡 Preguntas Frecuentes al Copiloto (Haz clic para despejar dudas):
                        </span>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="item in currentPills"
                                :key="item.id"
                                type="button"
                                @click="askSocraticQuestion(item)"
                                :class="isDarkTheme ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'"
                                class="px-3 py-1.5 rounded-full border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
                            >
                                <span>❓</span>
                                <span>{{ item.q }}</span>
                            </button>
                        </div>

                        <!-- PREGUNTA LIBRE A LA IA (Escribir directamente a Gemini) -->
                        <form @submit.prevent="sendCustomQuestion" class="flex items-center gap-2 pt-3">
                            <input
                                v-model="customQuestionText"
                                type="text"
                                placeholder="Escribe cualquier pregunta a tu Copiloto IA sobre tu diseño..."
                                class="flex-1 rounded-2xl border px-3.5 py-2 text-xs transition"
                                :class="isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'"
                                :disabled="copilotAnswering"
                            />
                            <button
                                type="submit"
                                :disabled="!customQuestionText.trim() || copilotAnswering"
                                class="px-4 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
                            >
                                <RefreshCw v-if="copilotAnswering" class="w-3.5 h-3.5 animate-spin" />
                                <Send v-else class="w-3.5 h-3.5" />
                                <span>Preguntar</span>
                            </button>
                        </form>
                    </div>

                    <!-- Botón para avanzar a la Fase 3 con auto-scroll suave -->
                    <div class="pt-2 flex justify-end">
                        <button
                            type="button"
                            @click="unlockPhase(3, 'phase-3')"
                            class="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs transition flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
                        >
                            <span>{{ currentPhase > 2 ? 'CONTINUAR A LA AUDITORÍA' : 'TENGO MI EVIDENCIA LISTA' }}</span>
                            <ArrowDown class="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- FASE 3: ENTREGA, AUDITORÍA GEMINI & CIERRE (Output)       -->
                <!-- ========================================================= -->
                <div 
                    v-if="currentPhase >= 3"
                    id="phase-3"
                    :class="[
                        'rounded-3xl border transition-all duration-300 p-6 space-y-4 animate-fade-in scroll-mt-28',
                        currentPhase === 3
                            ? (isDarkTheme ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/40' : 'bg-white border-emerald-400 shadow-md ring-2 ring-emerald-500/10')
                            : (isDarkTheme ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/90 border-slate-200')
                    ]"
                >
                    <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200/70'">
                        <div class="flex items-center gap-2.5">
                            <span class="w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center bg-emerald-500 text-white">
                                3
                            </span>
                            <span class="text-xs font-black uppercase tracking-wider" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                {{ selectedMissionIndex === 0 ? 'Paso 3: Entrega de Boceto & Control de Calidad IA' : 'Paso 3: Entrega de Evidencia & Control de Calidad IA' }}
                            </span>
                        </div>

                        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 animate-pulse">
                            ⚡ VALIDACIÓN FINAL
                        </span>
                    </div>

                    <!-- CAJA DE ARRASTRE O SUBIDA DE ARCHIVO -->
                    <div class="border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer relative" :class="isDarkTheme ? 'border-slate-800 hover:border-emerald-500/50 bg-slate-950' : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'">
                        <input
                            type="file"
                            @change="handleFileUpload"
                            accept=".stl,.svg,.jpg,.jpeg,.png,.webp"
                            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <!-- Estado A: Archivo recién seleccionado por el usuario -->
                        <div v-if="bitacoraForm.file" class="space-y-1">
                            <CheckCircle2 class="w-7 h-7 text-emerald-500 mx-auto" />
                            <p class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                {{ bitacoraForm.file.name }}
                            </p>
                            <p class="text-[10px] text-slate-400">
                                {{ selectedMissionIndex === 0 ? 'Presiona el botón verde para validar tu silueta con Gemini IA' : 'Presiona el botón verde para auditar con Gemini IA' }}
                            </p>
                        </div>

                        <!-- Estado B: Evidencia ya guardada en base de datos previamente -->
                        <div v-else-if="existingEvidence" class="space-y-2 py-1">
                            <div v-if="isImageFile(existingEvidence.file_url)" class="relative inline-block">
                                <img :src="existingEvidence.file_url" alt="Evidencia Guardada" class="max-h-40 mx-auto rounded-2xl border shadow-md object-contain bg-white p-1" />
                                <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[9px] font-black shadow">
                                    ✓ GUARDADA
                                </span>
                            </div>
                            <div v-else class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
                                📦 Archivo digital entregado (STL 3D / SVG)
                            </div>
                            <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Tu evidencia ya está registrada para esta misión.
                            </p>
                            <p class="text-[10px] text-slate-400">
                                Arrastra o haz clic aquí si deseas reemplazarla por una nueva versión.
                            </p>
                        </div>

                        <!-- Estado C: Caja vacía inicial -->
                        <div v-else class="space-y-2">
                            <UploadCloud class="w-8 h-8 text-emerald-500 mx-auto" />
                            <p class="text-xs font-bold" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                                <template v-if="selectedMissionIndex === 0">
                                    Toma una foto de tu dibujo en papel y arrástrala aquí o haz clic para subir
                                </template>
                                <template v-else-if="selectedMissionIndex === 1">
                                    Arrastra tu modelo digital extruido (STL 3D o SVG) o haz clic para subir
                                </template>
                                <template v-else>
                                    Arrastra tu foto o archivo de evidencia aquí o haz clic para subir
                                </template>
                            </p>
                            <p class="text-[10px] text-slate-400 font-mono">
                                {{ selectedMissionIndex === 0 ? 'Acepta fotos nítidas con celular o cámara (JPG, PNG o WEBP)' : 'Acepta fotos (JPG/PNG) o modelos digitales (STL / SVG)' }}
                            </p>
                        </div>
                    </div>

                    <!-- BOTÓN PARA AUDITAR CON GEMINI IA -->
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <span class="text-xs font-mono text-slate-400">
                            Costo en materiales: <strong class="text-amber-500 font-bold">🪙 {{ selectedMission.fabcoins_cost || 0 }} FC</strong>
                        </span>

                        <button
                            type="button"
                            @click="runPreflightCheck"
                            :disabled="preflightLoading || !bitacoraForm.file"
                            class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <RefreshCw v-if="preflightLoading" class="w-4 h-4 animate-spin" />
                            <Sparkles v-else class="w-4 h-4" />
                            <span>{{ preflightLoading ? 'AUDITANDO CON GEMINI IA...' : (selectedMissionIndex === 0 ? '✨ AUDITAR SILUETA CON GEMINI IA' : '🔍 AUDITAR CON COPILOTO IA') }}</span>
                        </button>
                    </div>

                    <!-- TARJETA DE VEREDICTO DE GEMINI -->
                    <div 
                        v-if="preflightResult" 
                        class="p-5 rounded-2xl border space-y-3.5 animate-fade-in" 
                        :class="isDarkTheme 
                            ? (preflightResult.is_valid ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950 border-amber-500/40') 
                            : (preflightResult.is_valid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/70 border-amber-200')"
                    >
                        <div class="flex items-center justify-between">
                            <span 
                                class="text-xs font-mono font-black flex items-center gap-1.5"
                                :class="preflightResult.is_valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'"
                            >
                                <span>{{ preflightResult.is_valid ? '●' : '⚠️' }}</span>
                                <span>{{ preflightResult.dashboard?.verdict_title || (preflightResult.is_valid ? '¡SILUETA APROBADA!' : 'REQUIERE AJUSTES') }}</span>
                            </span>
                            <span class="text-[10px] font-mono text-slate-400">Gemini 2.0 Flash Vision</span>
                        </div>

                        <p class="text-xs font-bold leading-relaxed" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                            {{ preflightResult.dashboard?.headline || preflightResult.ai_feedback }}
                        </p>

                        <!-- Violaciones / Ajustes Detectados -->
                        <div v-if="preflightResult.violations?.length > 0" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <span class="font-bold flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
                                ⚠️ Detalle a Corregir:
                            </span>
                            <div v-for="(v, vIdx) in preflightResult.violations" :key="vIdx" class="flex items-start gap-1.5 leading-relaxed">
                                <span class="font-bold">➔</span>
                                <span>{{ v }}</span>
                            </div>
                        </div>

                        <!-- Puntos Fuertes -->
                        <div v-if="preflightResult.dashboard?.strengths?.length > 0" class="space-y-1">
                            <span class="text-[10px] font-mono font-bold text-emerald-600 uppercase">Puntos Fuertes Detectados:</span>
                            <div v-for="(st, sIdx) in preflightResult.dashboard.strengths" :key="sIdx" class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span class="text-emerald-500 font-bold">✓</span>
                                <span>{{ st }}</span>
                            </div>
                        </div>

                        <!-- Consejo del Mentor con las Soluciones Exactas -->
                        <div 
                            class="p-3.5 rounded-xl border text-xs flex items-start gap-2.5" 
                            :class="preflightResult.is_valid 
                                ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                                : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'"
                        >
                            <Lightbulb class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                            <div class="space-y-1 flex-1">
                                <strong class="font-mono text-[10px] uppercase tracking-wider block text-amber-600 dark:text-amber-400">
                                    💡 Sugerencia del Mentor Maker:
                                </strong>
                                <p class="leading-relaxed">
                                    {{ preflightResult.dashboard?.pedagogical_tip || 'Asegúrate de seguir las 4 reglas del boceto.' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- PREGUNTA DE CIERRE REFLEXIVO (Únicamente al final del reto en Misión 5) -->
                    <div v-if="selectedMissionIndex === 4" class="pt-3 border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                        <label class="block text-xs font-bold mb-1" :class="isDarkTheme ? 'text-slate-200' : 'text-slate-800'">
                            🎓 Cierre Reflexivo del Emprendedor Maker: ¿Qué fue lo más desafiante de todo el ciclo y qué mejorarías para tu próxima colección?
                        </label>
                        <textarea
                            v-model="bitacoraForm.reflection_text"
                            rows="2"
                            placeholder="Escribe tu reflexión final para que quede registrada en tu Pasaporte Maker..."
                            class="w-full rounded-2xl border p-3 text-xs leading-relaxed"
                            :class="isDarkTheme ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'"
                        ></textarea>
                    </div>

                    <div class="flex items-center justify-between pt-2">
                        <span class="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            Recompensa: +{{ selectedMission.xp_reward }} Puntos Maker
                        </span>

                        <button
                            type="button"
                            @click="submitMissionEvidence"
                            :disabled="bitacoraForm.processing || !bitacoraForm.file"
                            class="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <span>{{ selectedMissionIndex === 4 ? 'LANZAR PRODUCTO & GRADUARSE' : `COMPLETAR MISIÓN ${selectedMissionIndex + 1} & SUMAR PUNTOS` }}</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>
        </main>

        <!-- ================================================================= -->
        <!-- MODAL INTERACTIVO: MODALIDAD DE RETO (SOLO VS EN EQUIPO)          -->
        <!-- ================================================================= -->
        <div 
            v-if="showTeamModal" 
            class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
            <div 
                :class="isDarkTheme ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'"
                class="w-full max-w-md rounded-3xl border p-6 space-y-5 relative"
            >
                <!-- Cabecera del modal -->
                <div class="flex items-center justify-between border-b pb-3" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-sm font-bold">
                            👥
                        </div>
                        <div>
                            <h3 class="text-sm font-black uppercase tracking-wide">Modalidad del Reto</h3>
                            <span class="text-[10px] text-slate-400 font-mono">Elige cómo deseas conquistar este proyecto</span>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        @click="showTeamModal = false"
                        class="p-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>

                <!-- Estado Actual -->
                <div class="p-3.5 rounded-2xl border" :class="isDarkTheme ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'">
                    <span class="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">Tu Estado Actual:</span>
                    <div v-if="isSoloMode" class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <User class="w-4 h-4 text-cyan-500" />
                            <span class="text-xs font-bold">Creador Individual (Tu propia mesa)</span>
                        </div>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 font-mono font-bold">Activo</span>
                    </div>
                    <div v-else class="space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Users class="w-4 h-4 text-purple-500" />
                                <span class="text-xs font-bold">Trabajando en equipo en: {{ squad.name }}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            @click="setIndividual"
                            class="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <User class="w-3.5 h-3.5" />
                            <span>Volver a Mesa Individual</span>
                        </button>
                    </div>
                </div>

                <!-- Lista de Compañeros en el Taller para Unirse -->
                <div class="space-y-2.5">
                    <span class="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                        Unirte a la mesa de un creador:
                    </span>

                    <div v-if="peers.length === 0" class="text-xs text-slate-400 p-4 text-center border rounded-2xl border-dashed">
                        No hay otros creadores en esta sesión de taller por ahora.
                    </div>

                    <div v-else class="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                        <div 
                            v-for="peer in peers" 
                            :key="peer.id"
                            class="p-2.5 rounded-2xl border flex items-center justify-between transition"
                            :class="isDarkTheme ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'"
                        >
                            <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-600 font-bold text-[10px] flex items-center justify-center font-mono">
                                    {{ peer.name.charAt(0) }}
                                </div>
                                <div>
                                    <strong class="text-xs block">{{ peer.short_name || peer.name }}</strong>
                                    <span class="text-[9px] text-slate-400 font-mono">{{ peer.xp_points || 0 }} XP</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                @click="joinPeerTeam(peer)"
                                class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black transition flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                                <span>Unirme</span>
                                <ArrowRight class="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- MODAL OVERLAY PARA PROBAR MICRO-APPS EN VIVO                      -->
        <!-- ================================================================= -->
        <MicroAppOverlay
            :is-open="showMicroAppModal"
            :app="activeTestingApp"
            :initial-image-url="initialAppImageUrl"
            @close="showMicroAppModal = false"
            @asset-generated="handleMicroAppAsset"
        />
    </div>
</template>
