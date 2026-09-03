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

// Modal de Briefing Táctico del Reto (Avengers HUD)
const showBriefingModal = ref(false);

const openBriefingModal = () => {
    showBriefingModal.value = true;
};

const onStartBriefing = () => {
    const seenKey = 'makerdu_briefing_seen_' + (props.project?.id || 1);
    localStorage.setItem(seenKey, 'true');
    showBriefingModal.value = false;
    selectedMissionIndex.value = 0;
    currentPhase.value = 1;
    scrollToPhase('phase-1');
};

const onCloseBriefing = () => {
    const seenKey = 'makerdu_briefing_seen_' + (props.project?.id || 1);
    localStorage.setItem(seenKey, 'true');
    showBriefingModal.value = false;
};

onMounted(() => {
    window.addEventListener('click', onWindowClick);
    const seenKey = 'makerdu_briefing_seen_' + (props.project?.id || 1);
    const hasProgress = (props.bitacoras || []).some(b => b.status === 'approved');
    if (!hasProgress || !localStorage.getItem(seenKey)) {
        showBriefingModal.value = true;
    }
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

// Modelo 3D aprobado de la Misión 2 (para Misión 3)
const mission2Evidence = computed(() => {
    const m2 = props.project.levels[1];
    if (!m2) return null;
    return (props.bitacoras || []).find(b => b.level_id === m2.id && b.file_url);
});

// Progreso General del Reto Estilo Videojuego
const completedMissionsCount = computed(() => {
    const approvedLevelIds = new Set(
        (props.bitacoras || [])
            .filter(b => b.status === 'approved')
            .map(b => b.level_id)
    );
    const total = props.project.levels?.length || 5;
    return Math.min(total, approvedLevelIds.size);
});

const progressPercentage = computed(() => {
    const total = props.project.levels?.length || 5;
    return Math.min(100, Math.round((completedMissionsCount.value / total) * 100));
});

const gamerRank = computed(() => {
    const count = completedMissionsCount.value;
    if (count >= 5) return { title: 'MAKER MASTER LEGEND', color: 'from-amber-400 to-yellow-500', icon: '👑' };
    if (count >= 3) return { title: 'INGENIERO DE FABRICACIÓN', color: 'from-purple-400 to-indigo-500', icon: '⚡' };
    if (count >= 1) return { title: 'DISEÑADOR EXPLORADOR', color: 'from-cyan-400 to-blue-500', icon: '🚀' };
    return { title: 'MAKER APRENDIZ', color: 'from-emerald-400 to-teal-500', icon: '🌱' };
});

const resetEvidence = () => {
    bitacoraForm.file = null;
    bitacoraForm.image_snapshot = null;
    bitacoraForm.content_text = '';
    qualityControlResult.value = null;
    if (evidenceFileInput.value) {
        evidenceFileInput.value.value = '';
    }
    evidenceFileInput.value?.click();
};

const openMicroAppModal = (app, imageUrl = null) => {
    activeTestingApp.value = app;
    initialAppImageUrl.value = imageUrl;
    showMicroAppModal.value = true;
};

// Misión activa seleccionada (Navegación no restrictiva)
const selectedMissionIndex = ref(0);
const activeStep = ref(1);

// Nivel / Misión seleccionada
const selectedMission = computed(() => {
    return props.project.levels[selectedMissionIndex.value] || props.project.levels[0];
});

watch(selectedMissionIndex, () => {
    activeStep.value = 1;
    qualityControlResult.value = null;
    bitacoraForm.file = null;
    bitacoraForm.image_snapshot = null;
    bitacoraForm.content_text = '';
    if (evidenceFileInput.value) {
        evidenceFileInput.value.value = '';
    }
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
    activeStep.value = phaseNumber;
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
    if (!text) {
        document.getElementById('customQuestionInput')?.focus();
        return;
    }
    if (copilotAnswering.value) return;

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
    image_snapshot: null,
    reflection_text: '',
    allow_iteration: true,
});

const qualityControlLoading = ref(false);
const qualityControlResult = ref(props.flash?.quality_control_result || props.flash?.preflight_result || null);

// Alias para compatibilidad interna
const preflightLoading = qualityControlLoading;
const preflightResult = qualityControlResult;

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

    // Limpiar de inmediato el resultado previo de la IA al seleccionar un nuevo archivo
    qualityControlResult.value = null;

    if (!missionChatMessages.value[selectedMissionIndex.value]) {
        missionChatMessages.value[selectedMissionIndex.value] = [];
    }

    missionChatMessages.value[selectedMissionIndex.value].push({
        sender: 'user',
        text: `Subí el archivo de evidencia: ${file.name} (${Math.round(file.size / 1024)} KB).`,
        time: 'Ahora'
    });
};

// Ejecutar Auditoría / Control de Calidad con Gemini Vision
const runQualityControl = () => {
    if (!bitacoraForm.file) {
        alert('Por favor selecciona o arrastra una foto o archivo STL antes de auditar.');
        return;
    }

    qualityControlLoading.value = true;
    qualityControlResult.value = null;

    const formData = new FormData();
    formData.append('file', bitacoraForm.file);
    formData.append('level_id', selectedMission.value.id);

    router.post(route('squad.quality-control', { squad: props.squad.id }), formData, {
        preserveScroll: true,
        onSuccess: (pageResp) => {
            qualityControlLoading.value = false;
            const res = pageResp.props.flash?.quality_control_result || pageResp.props.flash?.preflight_result;
            qualityControlResult.value = res;

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
            qualityControlLoading.value = false;
            alert('Error al conectar con el Copiloto IA. Inténtalo de nuevo.');
        },
    });
};
const runPreflightCheck = runQualityControl;

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

// Referencia al input de subida de evidencia
const evidenceFileInput = ref(null);

// Procesar asset generado por Micro-Apps (ej. Vectorizador 3D)
const handleMicroAppAsset = (asset) => {
    showMicroAppModal.value = false;
    if (!asset) return;

    // Caso A: Boceto 2D desde Lienzo Maker (dataUrl)
    if (asset.assetType === 'image' || (asset.dataUrl && !asset.stlContent)) {
        const dataUrl = asset.dataUrl || asset.image_snapshot;
        bitacoraForm.image_snapshot = dataUrl;

        // Convertir dataURL a File
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

        // Limpiar auditorías anteriores para evitar feedback desactualizado
        qualityControlResult.value = null;

        // Desbloquear Paso 2
        unlockPhase(2);

        if (!missionChatMessages.value[selectedMissionIndex.value]) {
            missionChatMessages.value[selectedMissionIndex.value] = [];
        }
        missionChatMessages.value[selectedMissionIndex.value].push({
            sender: 'copilot',
            text: '🎨 ¡Boceto recibido con éxito desde el Lienzo Maker 2D! Tu dibujo está listo en la mesa de trabajo. Cuando quieras, pulsa en el Paso 3 para auditar que cumpla las 4 reglas físicas.',
            time: 'Ahora'
        });
        return;
    }

    // Caso B: Archivo 3D (STL) o Vectorial (SVG)
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

    // Desbloquear Fase 3 de entrega
    unlockPhase(3);

    // Registrar en el chat del Copiloto
    if (!missionChatMessages.value[selectedMissionIndex.value]) {
        missionChatMessages.value[selectedMissionIndex.value] = [];
    }

    missionChatMessages.value[selectedMissionIndex.value].push({
        sender: 'copilot',
        text: `📐 ¡He recibido tu archivo 3D extruido ('${fileName}', espesor ${asset.depth_mm || 10} mm) desde el Vectorizador! Lo he colocado en tu entrega de Fase 3. Presiona el botón verde de auditoría para verificar los parámetros de impresión y FabCoins.`,
        time: 'Ahora'
    });
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
                class="rounded-3xl border p-5 sm:p-6 transition-all duration-300 relative overflow-hidden bg-slate-950 border-slate-800 text-white shadow-xl ring-1 ring-cyan-500/20"
            >
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div class="space-y-2 flex-1">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    <Rocket class="w-3 h-3" />
                                    <span>RETO DE PRODUCTO FÍSICO</span>
                                </span>
                                <span class="text-xs font-mono text-slate-400 font-bold">
                                    Ciclo Maker de 5 Misiones
                                </span>
                            </div>

                            <!-- BOTÓN TÁCTICO PARA VER EL EXPEDIENTE DEL RETO EN CUALQUIER MOMENTO -->
                            <button
                                type="button"
                                @click="openBriefingModal"
                                class="px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:border-cyan-400"
                                title="Ver Expediente Oficial del Reto"
                            >
                                <span>🎬 Expediente del Reto</span>
                            </button>
                        </div>

                        <!-- TÍTULO ENFOCADO AL MUNDO EMPRENDEDOR -->
                        <h1 class="text-xl sm:text-2xl font-black tracking-tight text-white">
                            {{ squad.classroom?.custom_title || 'Lanza tu Colección de Art Toys 2.5D' }}
                        </h1>

                        <!-- DESCRIPCIÓN CONCISA Y MOTIVADORA -->
                        <p class="text-xs sm:text-sm leading-relaxed max-w-2xl text-slate-300">
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

                <!-- BARRA DE PROGRESO DE QUEST / RETO ESTILO VIDEOJUEGO -->
                <div class="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-2.5">
                        <span class="text-xl">{{ gamerRank.icon }}</span>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-mono font-black text-[10px] tracking-wider text-cyan-400 uppercase">
                                    {{ gamerRank.title }}
                                </span>
                                <span class="text-slate-600">·</span>
                                <span class="text-[11px] font-bold text-slate-300">
                                    {{ completedMissionsCount }} de {{ project.levels.length }} misiones superadas
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 flex-1 max-w-xs">
                        <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 relative shadow-inner">
                            <div 
                                class="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm shadow-cyan-500/50"
                                :style="{ width: progressPercentage + '%' }"
                            ></div>
                        </div>
                        <span class="font-mono font-black text-xs text-cyan-300 shrink-0">
                            {{ progressPercentage }}%
                        </span>
                    </div>
                </div>
            </div>
        </section>

        <!-- ================================================================= -->
        <!-- 3. MAPA DE AVENTURA DEL RETO: TABLERO DE LAS 5 MISIONES           -->
        <!-- ================================================================= -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            
            <!-- CABECERA DEL MAPA DE AVENTURA -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'">
                <div>
                    <span class="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
                        HOJA DE RUTA TÁCTICA
                    </span>
                    <h2 class="text-xl sm:text-2xl font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                        🗺️ Mapa de Misiones del Reto
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        Selecciona cualquier misión para entrar a su estación de creación a pantalla completa. Avanza a tu ritmo.
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        @click="showMissionBriefingModal = true"
                        class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                        :class="isDarkTheme ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200'"
                    >
                        <span>🎬 Expediente del Reto</span>
                    </button>
                </div>
            </div>

            <!-- TABLERO / ROADMAP DE LAS 5 MISIONES EN FRANJA COMPACTA (1 PANTALLA) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div 
                    v-for="(mission, idx) in project.levels" 
                    :key="mission.id"
                    class="rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:scale-[1.02] p-4 space-y-3"
                    :class="[
                        mission.is_completed 
                            ? (isDarkTheme ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm' : 'bg-white border-emerald-300 shadow-xs')
                            : (idx === 0 || project.levels[idx - 1]?.is_completed 
                                ? (isDarkTheme ? 'bg-slate-900 border-cyan-500/30 shadow-sm hover:border-cyan-500/60' : 'bg-white border-cyan-300 shadow-xs')
                                : (isDarkTheme ? 'bg-slate-900/50 border-slate-800 opacity-80' : 'bg-slate-50 border-slate-200 opacity-85'))
                    ]"
                >
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span 
                                class="w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0"
                                :class="mission.is_completed ? 'bg-emerald-500 text-white' : (idx === 0 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400')"
                            >
                                <Check v-if="mission.is_completed" class="w-4 h-4 stroke-[3]" />
                                <span v-else>{{ idx + 1 }}</span>
                            </span>

                            <span class="text-xl">
                                {{ idx === 0 ? '🎨' : (idx === 1 ? '🧊' : (idx === 2 ? '🍰' : (idx === 3 ? '📦' : '🚀'))) }}
                            </span>
                        </div>

                        <div>
                            <span class="text-[9px] font-mono font-bold uppercase tracking-wider block" :class="mission.is_completed ? 'text-emerald-500' : 'text-cyan-500'">
                                ETAPA {{ idx + 1 }}
                            </span>
                            <h3 class="text-xs font-black leading-snug line-clamp-2" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                                {{ mission.title }}
                            </h3>
                        </div>

                        <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-100'">
                            <span>🪙 {{ mission.fabcoins_cost || 0 }} FC</span>
                            <span class="text-emerald-400">+{{ mission.xp_reward || 50 }} PM</span>
                        </div>
                    </div>

                    <Link
                        :href="route('student.studio.mission', { level_number: mission.level_number })"
                        class="w-full py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        :class="mission.is_completed 
                            ? (isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200')
                            : (idx === 0 
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950' 
                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700')"
                    >
                        <span>{{ mission.is_completed ? 'Revisar' : 'Entrar' }}</span>
                        <ArrowRight class="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            <!-- RESUMEN DIDÁCTICO DEL CICLO ART TOYS -->
            <div 
                class="p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6"
                :class="isDarkTheme ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'"
            >
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center text-2xl shrink-0">
                        🧭
                    </div>
                    <div class="space-y-1">
                        <h4 class="text-sm font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            Metodología STEAM de Creación & Emprendimiento
                        </h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                            Cada misión representa una fase profesional de fabricación digital: desde el concepto de autor hasta la producción física y la ficha de venta. Puedes volver a cualquier misión para perfeccionar tu diseño.
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                    <a
                        href="/images/digitoys/DIGITOYS-construccion.pdf"
                        target="_blank"
                        class="px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        :class="isDarkTheme ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'"
                    >
                        <span>📄 Catálogo Digitoys (PDF)</span>
                        <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

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

        <!-- ================================================================= -->
        <!-- EXPEDIENTE TÁCTICO DEL RETO (AVENGERS BRIEFING EN ESPAÑOL)         -->
        <!-- ================================================================= -->
        <MissionBriefingModal
            :show="showBriefingModal"
            :project="project"
            :active-student="activeStudent"
            :is-solo-mode="isSoloMode"
            :is-dark-theme="isDarkTheme"
            @close="onCloseBriefing"
            @start="onStartBriefing"
        />
    </div>
</template>
