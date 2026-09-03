<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
    X, 
    ArrowRight, 
    ArrowLeft, 
    Rocket, 
    ShieldAlert, 
    Zap, 
    Coins, 
    Bot, 
    Layers, 
    Printer, 
    CheckCircle2, 
    Sparkles, 
    Target,
    Compass
} from 'lucide-vue-next';

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    project: {
        type: Object,
        required: true,
    },
    activeStudent: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['close', 'start']);

const currentSlide = ref(0);

// Extraer el briefing en español del proyecto o usar fallback inteligente
const briefingData = computed(() => {
    const raw = props.project?.briefing_json;
    if (raw && raw.es) return raw.es;
    if (raw && Array.isArray(raw.slides)) return raw;

    // Fallback dinámico si aún no tuviera briefing_json personalizado
    return {
        codename: 'OPERACIÓN: ' + (props.project?.title_json?.es || props.project?.type || 'CREACIÓN MAKER').toUpperCase(),
        access_level: 'NIVEL DE SEGURIDAD: MAKER LEVEL 1',
        slides: [
            {
                id: 'goal',
                phase_number: '01',
                tag: 'OBJETIVO TÁCTICO',
                title: props.project?.title_json?.es || 'Lanza tu Colección de Art Toys 2.5D',
                headline: 'De la hoja de papel a un producto real autoportante en tu escritorio.',
                description: props.project?.description_json?.es || 'Tu misión es concebir un personaje original, transferir su geometría al laboratorio digital y materializarlo en una pieza física autoportante con base plana.',
                specs: [
                    { label: 'Espesor Z', value: '10 mm' },
                    { label: 'Estructura', value: 'Base Autoportante' },
                    { label: 'Material', value: 'PLA Ecológico' }
                ],
                badge: 'MISIÓN OFICIAL MAKERDU'
            },
            {
                id: 'arsenal',
                phase_number: '02',
                tag: 'EQUIPAMIENTO ASIGNADO',
                title: 'Tu Arsenal Tecnológico de Grado Maker',
                headline: 'Todo el poder del laboratorio a disposición de tu escuadra.',
                description: 'Para superar este desafío, el comando te equipa con herramientas industriales y presupuesto:',
                items: [
                    { icon: '🪙', name: 'Bolsa de 400 FabCoins', desc: 'Presupuesto de producción e iteración.' },
                    { icon: '🤖', name: 'Copiloto Maker IA', desc: 'Mentor que audita física y reglas de estarcido.' },
                    { icon: '⚡', name: 'Vectorizador 2.5D', desc: 'Digitalización con curvas Bézier e infill.' },
                    { icon: '🖨️', name: 'Bandeja de Impresión 3D', desc: 'Boquilla de 0.4mm lista a 205°C.' }
                ]
            },
            {
                id: 'roadmap',
                phase_number: '03',
                tag: 'DESPLIEGUE EN 5 HITOS',
                title: 'La Ruta de los Entregables Clave',
                headline: 'Cada misión superada desbloqueará una fase crítica de tu producto.',
                description: 'El camino hacia tu pieza tangible producida en el taller:',
                deliverables: [
                    { mission: 'M1', title: 'Concebir', deliverable: 'Boceto de Autor con Plumón Negro', icon: '✍️', format: 'Foto / Papel' },
                    { mission: 'M2', title: 'Ingeniería', deliverable: 'Modelo 3D Extruido (10 mm)', icon: '🧊', format: 'Archivo STL Malla' },
                    { mission: 'M3', title: 'Producción', deliverable: 'Simulación de Laminado & Costeo', icon: '🍰', format: 'G-Code / FabCoins' },
                    { mission: 'M4', title: 'Post-Proceso', deliverable: 'Pieza Física Lijada & Packaging Maker', icon: '📦', format: 'Objeto Real' },
                    { mission: 'M5', title: 'Lanzamiento', deliverable: 'Catálogo Comercial & Pitch de 30s', icon: '🚀', format: 'Video / Afiche' }
                ]
            },
            {
                id: 'launch',
                phase_number: '04',
                tag: 'AUTORIZACIÓN OPERATIVA',
                title: '¿Lista tu Escuadra para el Despegue?',
                headline: 'Las máquinas están calibradas y la bitácora lista para registrar su avance.',
                description: 'Supera las 5 misiones para obtener tu acreditación y tu Art Toy tangible.',
                rewards: [
                    { icon: '🏆', title: '+300 Puntos Maker', desc: 'Escala a Maker Master Legend' },
                    { icon: '📜', title: 'Certificado de Diseñador 3D', desc: 'Acreditación oficial' },
                    { icon: '🧸', title: 'Tu Art Toy Físico', desc: 'El producto en tus manos' }
                ],
                cta_text: 'ACEPTAR MISIÓN & COMENZAR PASO 1'
            }
        ]
    };
});

const slides = computed(() => briefingData.value.slides || []);
const totalSlides = computed(() => slides.value.length);
const activeSlideData = computed(() => slides.value[currentSlide.value] || {});

const nextSlide = () => {
    if (currentSlide.value < totalSlides.value - 1) {
        currentSlide.value++;
    } else {
        handleStart();
    }
};

const prevSlide = () => {
    if (currentSlide.value > 0) {
        currentSlide.value--;
    }
};

const goToSlide = (index) => {
    if (index >= 0 && index < totalSlides.value) {
        currentSlide.value = index;
    }
};

const handleStart = () => {
    emit('start');
    emit('close');
};

const handleClose = () => {
    emit('close');
};

const handleKeyDown = (e) => {
    if (!props.show) return;
    if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
    } else if (e.key === 'ArrowLeft') {
        prevSlide();
    } else if (e.key === 'Escape') {
        handleClose();
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
    >
        <div 
            v-if="show"
            class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl selection:bg-cyan-500 selection:text-slate-950 select-none overflow-hidden"
            role="dialog"
            aria-modal="true"
        >
            <!-- CONTENEDOR TÁCTICO HUD (PANTALLA DE COMANDO) -->
            <div 
                class="relative w-full max-w-5xl h-[92vh] max-h-[720px] bg-slate-900 border-2 border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/60 flex flex-col overflow-hidden text-slate-100"
            >
                <!-- LÍNEA DE DETECCIÓN SUPERIOR ANIMADA -->
                <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <!-- CABECERA TÁCTICA HUD (AVENGERS COMMAND CENTER) -->
                <header class="px-5 py-3.5 bg-slate-950/90 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="relative flex items-center justify-center">
                            <span class="w-3 h-3 rounded-full bg-red-500 animate-ping absolute"></span>
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500 relative"></span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-[10px] tracking-widest text-red-400 font-bold uppercase">
                                    ALERTA DE RETO CLASIFICADO // CUARTEL GENERAL
                                </span>
                                <span class="text-slate-600">·</span>
                                <span class="font-mono text-[10px] text-cyan-400 tracking-wider font-bold">
                                    {{ briefingData.access_level }}
                                </span>
                            </div>
                            <h2 class="font-mono font-black text-xs sm:text-sm text-white tracking-tight flex items-center gap-2">
                                <span>🛰️ {{ briefingData.codename }}</span>
                            </h2>
                        </div>
                    </div>

                    <!-- STEPPER TÁCTICO DE 4 PÍLDORAS -->
                    <div class="hidden sm:flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
                        <button
                            v-for="(slide, idx) in slides"
                            :key="slide.id"
                            @click="goToSlide(idx)"
                            :class="[
                                'px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer',
                                currentSlide === idx 
                                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' 
                                    : (idx < currentSlide ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white')
                            ]"
                        >
                            <span>{{ slide.phase_number }}</span>
                            <span class="hidden md:inline">{{ slide.tag }}</span>
                        </button>
                    </div>

                    <!-- BOTÓN SALTAR / CERRAR -->
                    <button
                        type="button"
                        @click="handleClose"
                        class="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono font-bold transition flex items-center gap-1.5 border border-slate-700/60 cursor-pointer"
                        title="Saltar briefing"
                    >
                        <span>Saltar Intro</span>
                        <X class="w-3.5 h-3.5" />
                    </button>
                </header>

                <!-- CUERPO DE LA DIAPOSITIVA TÁCTICA -->
                <div class="flex-1 min-h-0 relative overflow-y-auto p-5 sm:p-8 flex flex-col justify-between">
                    
                    <!-- SLIDE 1: OBJETIVO TÁCTICO & META DEL PRODUCTO -->
                    <div v-if="currentSlide === 0" class="space-y-6 my-auto animate-fade-in">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Target class="w-3.5 h-3.5 text-cyan-400" />
                                <span>{{ activeSlideData.tag }}</span>
                            </span>
                            <span class="text-xs font-mono text-slate-500 font-bold">FASE 01 DE 04</span>
                        </div>

                        <div class="space-y-2 max-w-3xl">
                            <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                                {{ activeSlideData.title }}
                            </h1>
                            <p class="text-sm sm:text-base text-cyan-300 font-mono font-bold">
                                {{ activeSlideData.headline }}
                            </p>
                        </div>

                        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                            {{ activeSlideData.description }}
                        </p>

                        <!-- ESPECIFICACIONES TÁCTICAS DEL PRODUCTO -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-2xl">
                            <div 
                                v-for="(spec, sIdx) in activeSlideData.specs" 
                                :key="sIdx"
                                class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
                            >
                                <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                                    {{ spec.label }}
                                </span>
                                <strong class="text-sm font-black text-cyan-300 font-mono block pt-1">
                                    {{ spec.value }}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <!-- SLIDE 2: ARSENAL TECNOLÓGICO ASIGNADO -->
                    <div v-else-if="currentSlide === 1" class="space-y-6 my-auto animate-fade-in">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Zap class="w-3.5 h-3.5 text-amber-400" />
                                <span>{{ activeSlideData.tag }}</span>
                            </span>
                            <span class="text-xs font-mono text-slate-500 font-bold">FASE 02 DE 04</span>
                        </div>

                        <div class="space-y-1.5 max-w-3xl">
                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                {{ activeSlideData.title }}
                            </h1>
                            <p class="text-xs sm:text-sm text-slate-300">
                                {{ activeSlideData.description }}
                            </p>
                        </div>

                        <!-- CUADRÍCULA DEL ARSENAL ASIGNADO -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 max-w-3xl">
                            <div 
                                v-for="(item, aIdx) in activeSlideData.items" 
                                :key="aIdx"
                                class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/40 transition flex items-start gap-3.5"
                            >
                                <span class="text-2xl shrink-0 p-2 rounded-xl bg-slate-900 border border-slate-800">
                                    {{ item.icon }}
                                </span>
                                <div class="space-y-0.5 text-xs">
                                    <strong class="font-black text-white text-xs block font-mono">
                                        {{ item.name }}
                                    </strong>
                                    <p class="text-[11px] text-slate-400 leading-relaxed">
                                        {{ item.desc }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SLIDE 3: LA RUTA DE LOS 5 ENTREGABLES -->
                    <div v-else-if="currentSlide === 2" class="space-y-6 my-auto animate-fade-in">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Compass class="w-3.5 h-3.5 text-emerald-400" />
                                <span>{{ activeSlideData.tag }}</span>
                            </span>
                            <span class="text-xs font-mono text-slate-500 font-bold">FASE 03 DE 04</span>
                        </div>

                        <div class="space-y-1.5 max-w-3xl">
                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                {{ activeSlideData.title }}
                            </h1>
                            <p class="text-xs sm:text-sm text-slate-300">
                                {{ activeSlideData.headline }}
                            </p>
                        </div>

                        <!-- TIMELINE DE LOS 5 ENTREGABLES -->
                        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                            <div 
                                v-for="(step, sIdx) in activeSlideData.deliverables" 
                                :key="sIdx"
                                class="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-2"
                            >
                                <div>
                                    <div class="flex items-center justify-between mb-1.5">
                                        <span class="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                                            {{ step.mission }}
                                        </span>
                                        <span class="text-lg">{{ step.icon }}</span>
                                    </div>
                                    <strong class="text-xs font-black text-white block">
                                        {{ step.title }}
                                    </strong>
                                    <p class="text-[11px] text-slate-300 leading-tight pt-1">
                                        {{ step.deliverable }}
                                    </p>
                                </div>
                                <span class="text-[9px] font-mono text-cyan-400 block pt-1 border-t border-slate-900 uppercase">
                                    {{ step.format }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- SLIDE 4: AUTORIZACIÓN FINAL & DESPEGUE -->
                    <div v-else-if="currentSlide === 3" class="space-y-6 my-auto animate-fade-in text-center max-w-2xl mx-auto">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-black uppercase tracking-wider">
                            <Sparkles class="w-3.5 h-3.5 text-cyan-400" />
                            <span>{{ activeSlideData.tag }}</span>
                        </div>

                        <div class="space-y-2">
                            <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                                {{ activeSlideData.title }}
                            </h1>
                            <p class="text-xs sm:text-sm text-slate-300">
                                {{ activeSlideData.description }}
                            </p>
                        </div>

                        <!-- TARJETAS DE RECOMPENSA -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div 
                                v-for="(rew, rIdx) in activeSlideData.rewards" 
                                :key="rIdx"
                                class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1"
                            >
                                <span class="text-2xl block">{{ rew.icon }}</span>
                                <strong class="text-xs font-black text-white block font-mono">{{ rew.title }}</strong>
                                <p class="text-[10px] text-slate-400">{{ rew.desc }}</p>
                            </div>
                        </div>

                        <!-- BOTÓN CENTRAL DE DESPEGUE -->
                        <div class="pt-4 flex justify-center">
                            <button
                                type="button"
                                @click="handleStart"
                                class="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wide transition flex items-center gap-3 shadow-xl shadow-cyan-500/25 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Rocket class="w-5 h-5 text-slate-950" />
                                <span>{{ activeSlideData.cta_text || 'ACEPTAR MISIÓN & ENTRAR AL TALLER' }}</span>
                            </button>
                        </div>
                    </div>

                </div>

                <!-- PIE DE PÁGINA: NAVEGADOR DE SLIDES -->
                <footer class="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-xs text-slate-400 font-bold">
                            Diapositiva {{ currentSlide + 1 }} de {{ totalSlides }}
                        </span>
                        <!-- Puntos de progreso -->
                        <div class="flex items-center gap-1.5">
                            <span 
                                v-for="i in totalSlides" 
                                :key="i"
                                @click="goToSlide(i - 1)"
                                :class="[
                                    'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                                    (i - 1) === currentSlide ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                                ]"
                            ></span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button
                            v-if="currentSlide > 0"
                            type="button"
                            @click="prevSlide"
                            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowLeft class="w-3.5 h-3.5" />
                            <span>Anterior</span>
                        </button>

                        <button
                            v-if="currentSlide < totalSlides - 1"
                            type="button"
                            @click="nextSlide"
                            class="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-black transition flex items-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                            <span>Siguiente</span>
                            <ArrowRight class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </footer>

            </div>
        </div>
    </Transition>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
