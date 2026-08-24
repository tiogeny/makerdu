<script setup>
import { Head, router, usePage, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, School, Users, Layers, Trophy, Coins, CheckCircle2,
    Clock, Lock, FileText, Download, Package, Truck, Printer,
    Flame, ArrowRight, ExternalLink, ShieldCheck, ChevronRight, BarChart3,
    Share2, MessageCircle, Award, CreditCard, FolderPlus, UserPlus,
    BookOpen, Box, Palette, Scissors, Wrench, Globe, LogOut, Check
} from 'lucide-vue-next';
import { t, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    classrooms: Array,
    activeClassroom: Object,
    project: Object,
    heatmap: Array,
    competencies: Object,
    batches: Array,
    allProjects: Array,
});

const page = usePage();
const activeTab = ref('catalog'); // 'catalog', 'warroom', 'classrooms'
const selectedClassroomId = ref(props.activeClassroom?.id || props.classrooms[0]?.id);
const isGeneratingBatch = ref(false);

const changeClassroom = (id) => {
    selectedClassroomId.value = id;
    router.get(route('teacher.war-room'), { classroom_id: id }, { preserveScroll: true });
};

const assignProjectToActive = (projectId) => {
    if (!props.activeClassroom) return;
    router.post(route('teacher.assign-project', { classroom: props.activeClassroom.id }), {
        project_id: projectId,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            activeTab.value = 'warroom';
        },
    });
};

const generateFabricationBatch = () => {
    if (!props.activeClassroom) return;
    isGeneratingBatch.value = true;
    router.post(route('teacher.generate-batch', { classroom: props.activeClassroom.id }), {}, {
        preserveScroll: true,
        onFinish: () => {
            isGeneratingBatch.value = false;
        },
    });
};

const updateStatus = (batchId, status) => {
    router.post(route('teacher.batch-status', { batch: batchId }), { status }, { preserveScroll: true });
};

// Matrícula rápida
const showEnrollModal = ref(false);
const enrollForm = useForm({
    students_text: '',
    squad_prefix: 'Escuadra',
});

const submitEnroll = () => {
    if (!props.activeClassroom) return;
    enrollForm.post(route('admin.classrooms.enroll', { classroom: props.activeClassroom.id }), {
        preserveScroll: true,
        onSuccess: () => {
            enrollForm.reset();
            showEnrollModal.value = false;
        },
    });
};

// ============================================================
// CARROCERÍA PEDAGÓGICA (Paso 4)
// ============================================================
const customizeForm = useForm({
    custom_title:             props.activeClassroom?.custom_title             || '',
    custom_description:       props.activeClassroom?.custom_description       || '',
    custom_video_url:         props.activeClassroom?.custom_video_url         || '',
    custom_context_image_url: props.activeClassroom?.custom_context_image_url || '',
    custom_welcome_message:   props.activeClassroom?.custom_welcome_message   || '',
    custom_accent_color:      props.activeClassroom?.custom_accent_color      || '#06b6d4',
});

const saveCustomization = () => {
    if (!props.activeClassroom) return;
    customizeForm.post(route('teacher.customize', { classroom: props.activeClassroom.id }), {
        preserveScroll: true,
    });
};

const resetCustomization = () => {
    if (!props.activeClassroom) return;
    if (!confirm('¿Resetear al diseño maestro del SuperAdmin? Se perderán tus personalizaciones.')) return;
    router.post(route('teacher.reset-customization', { classroom: props.activeClassroom.id }), {}, {
        preserveScroll: true,
        onSuccess: () => {
            customizeForm.reset();
            customizeForm.custom_accent_color = '#06b6d4';
        },
    });
};

// Colores de acento predefinidos para el selector rápido
const accentColors = [
    { hex: '#06b6d4', name: 'Cyan (defecto)' },
    { hex: '#8b5cf6', name: 'Violeta' },
    { hex: '#f59e0b', name: 'Ámbar' },
    { hex: '#10b981', name: 'Esmeralda' },
    { hex: '#ef4444', name: 'Rojo' },
    { hex: '#ec4899', name: 'Rosa' },
    { hex: '#f97316', name: 'Naranja' },
    { hex: '#3b82f6', name: 'Azul' },
];

const getStatusBadge = (status) => {
    switch (status) {
        case 'completed':
            return { label: 'Aprobado', class: 'bg-emerald-500 text-slate-950 font-bold' };
        case 'in_progress':
            return { label: 'En Curso', class: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse' };
        case 'locked':
        default:
            return { label: 'Pendiente', class: 'bg-slate-800 text-slate-500' };
    }
};

const getBatchStatusBadge = (status) => {
    switch (status) {
        case 'queue':
            return { label: 'En Cola de Impresión', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
        case 'printing':
            return { label: 'Imprimiendo en 3D / Corte', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse' };
        case 'dispatched':
            return { label: 'Despachado a Colegio', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
        case 'delivered':
            return { label: 'Entregado a Alumnos', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
        default:
            return { label: status, class: 'bg-slate-800 text-slate-300' };
    }
};

const getTypeBadge = (type) => {
    switch (type) {
        case '3D': return { label: 'Impresión 3D', icon: Box, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' };
        case 'Laser': return { label: 'Corte Láser 2D', icon: Scissors, color: 'text-purple-400 bg-purple-950/60 border-purple-500/40' };
        default: return { label: 'Relieves 2.5D', icon: Palette, color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
    }
};
</script>

<template>
    <Head title="Portal del Docente - Makerdu v2.6" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR DOCENTE -->
        <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3.5">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-cyan-500/20">
                        <Flame class="w-5 h-5" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-black text-lg tracking-tight text-white">Taller del Docente</h1>
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                                {{ activeClassroom?.name || 'Mi Taller' }}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400">Selecciona proyectos STEAM, gestiona tus alumnos y monitorea la fabricación.</p>
                    </div>
                </div>

                <!-- Selector de Aula & Acciones -->
                <div class="flex flex-wrap items-center gap-2">
                    <!-- Selector de Aula del Profesor -->
                    <select
                        :value="activeClassroom?.id"
                        @change="changeClassroom($event.target.value)"
                        class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                        <option v-for="c in classrooms" :key="c.id" :value="c.id">
                            {{ c.name }} ({{ c.access_code }})
                        </option>
                    </select>

                    <!-- Selector Idioma -->
                    <button
                        type="button"
                        @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                        class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold font-mono text-cyan-300 border border-slate-800 transition flex items-center gap-1.5"
                    >
                        <Globe class="w-3.5 h-3.5" />
                        <span>{{ currentLang.toUpperCase() }}</span>
                    </button>

                    <!-- Vista Alumnos -->
                    <Link
                        :href="route('student.login')"
                        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition"
                    >
                        Vista Alumno (PIN)
                    </Link>

                    <!-- Salir -->
                    <button
                        type="button"
                        @click="router.post(route('logout'))"
                        class="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
                        title="Cerrar Sesión"
                    >
                        <LogOut class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>

        <!-- SUB-NAVIGATION BAR (3 PESTAÑAS INTUITIVAS) -->
        <div class="bg-slate-900/60 border-b border-slate-800/80 px-4 lg:px-8 py-2 sticky top-[69px] z-30 backdrop-blur-md">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <!-- Pestaña 1: Catálogo -->
                    <button
                        type="button"
                        @click="activeTab = 'catalog'"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2',
                            activeTab === 'catalog'
                                ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                : 'text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800'
                        ]"
                    >
                        <BookOpen class="w-4 h-4" />
                        <span>1. Catálogo de Proyectos Makerdu</span>
                    </button>

                    <!-- Pestaña 2: Torre de Control (War Room) -->
                    <button
                        type="button"
                        @click="activeTab = 'warroom'"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2',
                            activeTab === 'warroom'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800'
                        ]"
                    >
                        <BarChart3 class="w-4 h-4" />
                        <span>2. Torre de Control (Radar en Vivo)</span>
                    </button>

                    <!-- Pestaña 3: Mis Aulas & PINs -->
                    <button
                        type="button"
                        @click="activeTab = 'classrooms'"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2',
                            activeTab === 'classrooms'
                                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-slate-950 shadow-md shadow-purple-500/20'
                                : 'text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800'
                        ]"
                    >
                        <Users class="w-4 h-4" />
                        <span>3. Escuadras & Tarjetas PIN</span>
                    </button>

                    <!-- Pestaña 4: Carrocería Pedagógica -->
                    <button
                        type="button"
                        @click="activeTab = 'customize'"
                        :class="[
                            'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2',
                            activeTab === 'customize'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800'
                        ]"
                    >
                        <Palette class="w-4 h-4" />
                        <span>4. 🎨 Personalizar Aula</span>
                    </button>
                </div>

                <div v-if="activeClassroom" class="hidden md:flex items-center gap-2 text-xs">
                    <span class="text-slate-400">Proyecto actual de {{ activeClassroom.name }}:</span>
                    <span class="font-bold text-amber-300 font-mono">{{ project?.title_json?.es || 'Sellos 2.5D' }}</span>
                </div>
            </div>
        </div>

        <!-- MAIN CONTAINER -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
            
            <!-- ALERTA DE ÉXITO -->
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <!-- ============================================================= -->
            <!-- PESTAÑA 1: CATÁLOGO DE PROYECTOS MAESTROS (SELECCIÓN DEL DOCENTE) -->
            <!-- ============================================================= -->
            <section v-if="activeTab === 'catalog'" class="space-y-6 animate-fade-in">
                <div class="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <BookOpen class="w-5 h-5 text-cyan-400" />
                            <h2 class="text-xl font-black text-white">Catálogo de Proyectos STEAM Makerdu</h2>
                        </div>
                        <p class="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                            Explora los proyectos de fabricación digital listos para usar creados por Makerdu. Selecciona el proyecto que impartirás en el bimestre a tu grupo:
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                            {{ allProjects?.length || 3 }} Proyectos Disponibles
                        </span>
                    </div>
                </div>

                <!-- GRID DE TARJETAS DE PROYECTOS -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        v-for="p in allProjects"
                        :key="p.id"
                        :class="[
                            'p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden',
                            activeClassroom?.project_id === p.id
                                ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-400/40'
                                : 'bg-slate-900/70 hover:bg-slate-850 border-slate-800'
                        ]"
                    >
                        <!-- Badge Proyecto Activo -->
                        <div v-if="activeClassroom?.project_id === p.id" class="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950">
                            <Check class="w-3 h-3 stroke-[3]" /> ASIGNADO A {{ activeClassroom.access_code }}
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center gap-2">
                                <span :class="['flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border', getTypeBadge(p.type).color]">
                                    {{ getTypeBadge(p.type).label }}
                                </span>
                                <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                                    {{ p.total_levels }} Niveles
                                </span>
                            </div>

                            <div>
                                <h3 class="text-base font-black text-white leading-snug">{{ p.title }}</h3>
                                <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{{ p.description }}</p>
                            </div>

                            <!-- Malla de Niveles del Proyecto -->
                            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                                <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secuencia de Retos:</p>
                                <div class="space-y-1 text-[11px] text-slate-300">
                                    <div v-for="lvl in p.levels" :key="lvl.id" class="flex items-center justify-between">
                                        <span class="truncate">N{{ lvl.level_number }}: {{ lvl.title }}</span>
                                        <span class="text-[9px] font-mono text-cyan-400 shrink-0 ml-1">{{ lvl.deliverable_type }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Botón de Asignación -->
                        <div class="pt-5 border-t border-slate-800/80 mt-5">
                            <button
                                v-if="activeClassroom?.project_id !== p.id"
                                type="button"
                                @click="assignProjectToActive(p.id)"
                                class="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                            >
                                <span>USAR ESTE PROYECTO CON {{ activeClassroom?.name || 'MI AULA' }}</span>
                                <ArrowRight class="w-4 h-4" />
                            </button>

                            <button
                                v-else
                                type="button"
                                @click="activeTab = 'warroom'"
                                class="w-full py-3 rounded-2xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 font-black text-xs flex items-center justify-center gap-2"
                            >
                                <span>PROYECTO EN CURSO • VER RADAR</span>
                                <ArrowRight class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ============================================================= -->
            <!-- PESTAÑA 2: TORRE DE CONTROL (RADAR EN VIVO & LOTES FABLAB) -->
            <!-- ============================================================= -->
            <section v-else-if="activeTab === 'warroom'" class="space-y-8 animate-fade-in">
                
                <!-- RADAR DE AVANCE DEL AULA -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div class="flex items-center gap-2">
                                <BarChart3 class="w-5 h-5 text-cyan-400" />
                                <h2 class="text-lg font-black text-white">Radar de Avance: {{ activeClassroom?.name }}</h2>
                            </div>
                            <p class="text-xs text-slate-400 mt-0.5">
                                Proyecto en curso: <strong class="text-amber-300">{{ project?.title_json?.es || 'Sellos 2.5D' }}</strong> ({{ project?.total_levels }} Niveles).
                            </p>
                        </div>

                        <!-- Botón Generar Lote de Fabricación -->
                        <button
                            type="button"
                            @click="generateFabricationBatch"
                            :disabled="isGeneratingBatch"
                            class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                        >
                            <Package class="w-4 h-4" />
                            <span>{{ isGeneratingBatch ? 'Empaquetando...' : 'Generar Lote de Fabricación (.ZIP + PDF)' }}</span>
                        </button>
                    </div>

                    <!-- Heatmap Table -->
                    <div class="overflow-x-auto rounded-2xl border border-slate-800">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                                <tr>
                                    <th class="p-4">Escuadra Maker</th>
                                    <th class="p-4 text-center">FabCoins</th>
                                    <th class="p-4 text-center">XP Total</th>
                                    <th v-for="lvl in project?.levels" :key="lvl.id" class="p-4 text-center">
                                        Nivel {{ lvl.level_number }}
                                    </th>
                                    <th class="p-4 text-center">Pasaporte Maker</th>
                                    <th class="p-4 text-center">WhatsApp Familia</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/60 font-medium">
                                <tr v-for="sq in heatmap" :key="sq.squad_id" class="hover:bg-slate-800/30 transition">
                                    <td class="p-4">
                                        <p class="font-bold text-sm text-white">{{ sq.squad_name }}</p>
                                        <p class="text-[11px] text-slate-500">{{ sq.members_count }} alumnos asignados</p>
                                    </td>
                                    <td class="p-4 text-center font-mono font-bold text-amber-400">
                                        {{ sq.fabcoins_balance }} FC
                                    </td>
                                    <td class="p-4 text-center font-mono font-bold text-purple-400">
                                        {{ sq.total_xp }} XP
                                    </td>
                                    <td v-for="p in sq.levels_progress" :key="p.level_id" class="p-3 text-center">
                                        <span :class="['px-3 py-1.5 rounded-xl text-[10px] inline-block', getStatusBadge(p.status).class]">
                                            {{ getStatusBadge(p.status).label }}
                                        </span>
                                    </td>
                                    <td class="p-4 text-center">
                                        <Link
                                            :href="route('squad.passport', { squad: sq.squad_id })"
                                            target="_blank"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-600/40 text-[11px] font-bold transition"
                                        >
                                            <Award class="w-3.5 h-3.5" />
                                            <span>Certificado</span>
                                        </Link>
                                    </td>
                                    <td class="p-4 text-center">
                                        <Link
                                            :href="route('family.portal', { accessCode: activeClassroom.access_code, squad: sq.squad_id })"
                                            target="_blank"
                                            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-600/40 text-[11px] font-bold transition"
                                        >
                                            <MessageCircle class="w-3.5 h-3.5" />
                                            <span>WhatsApp</span>
                                        </Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- LOTES DE FABRICACIÓN FÍSICA -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex items-center gap-2">
                        <Package class="w-5 h-5 text-amber-400" />
                        <h3 class="text-base font-black text-white">Lotes de Producción para Impresión 3D / Láser</h3>
                    </div>
                    <p class="text-xs text-slate-400">Descarga los archivos .ZIP de los modelos 3D y la Hoja de Rotulado en PDF para el técnico del FabLab.</p>

                    <div v-if="batches?.length" class="space-y-3 pt-2">
                        <div
                            v-for="b in batches"
                            :key="b.id"
                            class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-xs text-white">Lote #{{ b.id }}</span>
                                    <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-md border', getBatchStatusBadge(b.status).class]">
                                        {{ getBatchStatusBadge(b.status).label }}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 mt-1">Generado el {{ new Date(b.created_at).toLocaleDateString() }}</p>
                            </div>

                            <div class="flex items-center gap-2">
                                <a
                                    v-if="b.zip_file_url"
                                    :href="b.zip_file_url"
                                    download
                                    class="px-3 py-1.5 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-600/40 text-xs font-bold transition flex items-center gap-1"
                                >
                                    <Download class="w-3.5 h-3.5" />
                                    <span>Descargar .ZIP Modelos</span>
                                </a>

                                <a
                                    v-if="b.pdf_label_url"
                                    :href="b.pdf_label_url"
                                    target="_blank"
                                    class="px-3 py-1.5 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-600/40 text-xs font-bold transition flex items-center gap-1"
                                >
                                    <FileText class="w-3.5 h-3.5" />
                                    <span>Rotulado PDF</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ============================================================= -->
            <!-- PESTAÑA 3: MIS AULAS, ESCUADRAS Y TARJETAS PIN -->
            <!-- ============================================================= -->
            <section v-else-if="activeTab === 'classrooms'" class="space-y-6 animate-fade-in">
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <Users class="w-5 h-5 text-purple-400" />
                            <h2 class="text-lg font-black text-white">Escuadras y Alumnos de {{ activeClassroom?.name }}</h2>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Código de Acceso para los alumnos: <strong class="text-cyan-300 font-mono">{{ activeClassroom?.access_code }}</strong></p>
                    </div>

                    <div class="flex items-center gap-2">
                        <!-- Botón Descargar Tarjetas PIN -->
                        <a
                            v-if="activeClassroom"
                            :href="route('teacher.pin-cards', { classroom: activeClassroom.id })"
                            class="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <CreditCard class="w-3.5 h-3.5" />
                            <span>Descargar Tarjetas PIN en PDF</span>
                        </a>

                        <!-- Botón Matricular Alumnos -->
                        <button
                            type="button"
                            @click="showEnrollModal = true"
                            class="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500 text-purple-300 hover:text-slate-950 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <UserPlus class="w-3.5 h-3.5" />
                            <span>Matricular Alumnos en Bloque</span>
                        </button>
                    </div>
                </div>

                <!-- Escuadras Activas del Aula -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        v-for="sq in heatmap"
                        :key="sq.squad_id"
                        class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4"
                    >
                        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 class="font-black text-sm text-white">{{ sq.squad_name }}</h3>
                                <p class="text-[11px] text-slate-400">{{ sq.members_count }} alumnos en escuadra</p>
                            </div>
                            <span class="font-mono font-bold text-xs text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                🪙 {{ sq.fabcoins_balance }} FC
                            </span>
                        </div>

                        <div class="space-y-1.5">
                            <p class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Integrantes y PINs:</p>
                            <div class="grid grid-cols-2 gap-2">
                                <div
                                    v-for="m in activeClassroom?.squads?.find(s => s.id === sq.squad_id)?.members"
                                    :key="m.id"
                                    class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                                >
                                    <div>
                                        <p class="font-bold text-white text-[11px]">{{ m.name }}</p>
                                        <p class="text-[9px] text-cyan-400">{{ m.pivot?.current_role || m.role }}</p>
                                    </div>
                                    <span class="font-mono font-bold text-amber-300 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        {{ m.pin }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- PESTAÑA 4: CARROCERÍA PEDAGÓGICA -->
            <section v-else-if="activeTab === 'customize'" class="space-y-6 animate-fade-in">
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-xl space-y-6">

                    <!-- Header -->
                    <div class="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <Palette class="w-5 h-5 text-emerald-400" />
                                <h2 class="text-lg font-black text-white">Carrocería Pedagógica</h2>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                    {{ activeClassroom?.name || 'Sin aula' }}
                                </span>
                            </div>
                            <p class="text-xs text-slate-400 max-w-xl">
                                Personaliza el título, video, imagen de contexto y color de tu aula sin tocar el diseño técnico del proyecto maestro.
                                El chasis (validación IA, rúbricas, FabCoins) lo gestiona el SuperAdmin.
                            </p>
                        </div>
                        <button
                            type="button"
                            @click="resetCustomization"
                            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-400 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                        >
                            <span>🔄 Resetear al diseño maestro</span>
                        </button>
                    </div>

                    <!-- Preview strip con el color actual -->
                    <div
                        class="h-2 rounded-full w-full transition-all duration-300"
                        :style="{ background: `linear-gradient(to right, ${customizeForm.custom_accent_color}, transparent)` }"
                    ></div>

                    <div v-if="!activeClassroom" class="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
                        <p class="text-sm text-slate-400">Selecciona un aula primero desde el selector superior.</p>
                    </div>

                    <form v-else @submit.prevent="saveCustomization" class="space-y-5">

                        <!-- Título personalizado -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <span>📌 Título del Proyecto para esta Aula</span>
                                <span class="text-slate-500 font-normal">(opcional — si está vacío usa el título maestro)</span>
                            </label>
                            <input
                                v-model="customizeForm.custom_title"
                                type="text"
                                maxlength="120"
                                placeholder="Ej: Sellos de Arcilla — Colegio San Ignacio 4to B"
                                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white text-sm placeholder-slate-600 outline-none transition"
                            />
                            <p v-if="customizeForm.errors.custom_title" class="text-xs text-red-400">{{ customizeForm.errors.custom_title }}</p>
                        </div>

                        <!-- Descripción contextual -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-300">
                                📝 Descripción Contextual del Reto
                            </label>
                            <textarea
                                v-model="customizeForm.custom_description"
                                rows="3"
                                maxlength="800"
                                placeholder="Ej: En este proyecto diseñaremos sellos inspirados en los patrones de la textilería andina de nuestra región..."
                                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white text-sm placeholder-slate-600 outline-none transition resize-none"
                            ></textarea>
                        </div>

                        <!-- Video de YouTube personalizado -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <span>🎬 URL del Video Tutorial (YouTube)</span>
                                <span class="text-slate-500 font-normal">reemplaza el video del proyecto maestro</span>
                            </label>
                            <input
                                v-model="customizeForm.custom_video_url"
                                type="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white text-sm placeholder-slate-600 outline-none transition font-mono"
                            />
                            <!-- Preview del video si hay URL -->
                            <div v-if="customizeForm.custom_video_url" class="mt-2 rounded-2xl overflow-hidden border border-slate-800 aspect-video">
                                <iframe
                                    :src="'https://www.youtube.com/embed/' + (customizeForm.custom_video_url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] || '')"
                                    class="w-full h-full"
                                    allowfullscreen
                                ></iframe>
                            </div>
                        </div>

                        <!-- Imagen de contexto -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <span>🖼️ URL de Imagen de Contexto del Reto</span>
                                <span class="text-slate-500 font-normal">foto del producto final esperado</span>
                            </label>
                            <input
                                v-model="customizeForm.custom_context_image_url"
                                type="url"
                                placeholder="https://i.imgur.com/ejemplo.jpg"
                                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white text-sm placeholder-slate-600 outline-none transition font-mono"
                            />
                            <div v-if="customizeForm.custom_context_image_url" class="mt-2 rounded-2xl overflow-hidden border border-slate-800 max-h-48">
                                <img :src="customizeForm.custom_context_image_url" class="w-full h-full object-cover" />
                            </div>
                        </div>

                        <!-- Mensaje de bienvenida -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-slate-300">
                                👋 Mensaje de Bienvenida para los Alumnos
                            </label>
                            <textarea
                                v-model="customizeForm.custom_welcome_message"
                                rows="2"
                                maxlength="400"
                                placeholder="Ej: ¡Bienvenidos Titanes! Este trimestre vamos a fabricar objetos reales para nuestra feria STEAM. ¡Manos a la obra!"
                                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white text-sm placeholder-slate-600 outline-none transition resize-none"
                            ></textarea>
                        </div>

                        <!-- Selector de color de acento -->
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-slate-300">🎨 Color Temático del Aula</label>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button
                                    v-for="color in accentColors"
                                    :key="color.hex"
                                    type="button"
                                    @click="customizeForm.custom_accent_color = color.hex"
                                    :title="color.name"
                                    :style="{ backgroundColor: color.hex }"
                                    :class="[
                                        'w-8 h-8 rounded-full transition ring-offset-2 ring-offset-slate-900',
                                        customizeForm.custom_accent_color === color.hex
                                            ? 'ring-2 ring-white scale-110'
                                            : 'hover:scale-105'
                                    ]"
                                ></button>
                                <!-- Input hex personalizado -->
                                <div class="flex items-center gap-2 ml-2">
                                    <input
                                        v-model="customizeForm.custom_accent_color"
                                        type="color"
                                        class="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                                    />
                                    <span class="text-xs font-mono text-slate-400">{{ customizeForm.custom_accent_color }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Botón guardar -->
                        <div class="flex items-center justify-between pt-2 border-t border-slate-800">
                            <p class="text-[11px] text-slate-500">Los cambios se reflejan en el HUD del alumno al guardar.</p>
                            <button
                                type="submit"
                                :disabled="customizeForm.processing"
                                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                <Check class="w-4 h-4" />
                                <span>{{ customizeForm.processing ? 'Guardando...' : 'GUARDAR CARROCERÍA' }}</span>
                            </button>
                        </div>

                        <!-- Mensaje de éxito -->
                        <div v-if="$page.props.flash?.success" class="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                            {{ $page.props.flash.success }}
                        </div>
                    </form>
                </div>
            </section>
        </main>

        <!-- MODAL DE MATRÍCULA RÁPIDA -->
        <div
            v-if="showEnrollModal"
            class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
            <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-black text-white flex items-center gap-2">
                        <UserPlus class="w-5 h-5 text-purple-400" />
                        <span>Matrícula en Bloque: {{ activeClassroom?.name }}</span>
                    </h3>
                    <button type="button" @click="showEnrollModal = false" class="text-slate-500 hover:text-white text-xs font-bold">Cerrar</button>
                </div>

                <p class="text-xs text-slate-400 leading-relaxed">
                    Pega la lista de nombres de tus alumnos (uno por línea). El sistema los dividirá automáticamente en escuadras de 4 y generará sus PINs de 4 dígitos.
                </p>

                <form @submit.prevent="submitEnroll" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-300 mb-1">Prefijo de Escuadra</label>
                        <input
                            v-model="enrollForm.squad_prefix"
                            type="text"
                            placeholder="Ej: Escuadra Fénix"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-300 mb-1">Nombres de los Alumnos (uno por línea) *</label>
                        <textarea
                            v-model="enrollForm.students_text"
                            rows="6"
                            placeholder="Mateo Alarcón&#10;Sofía Chang&#10;Lucas Ramos&#10;Camila Díaz"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none"
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        :disabled="enrollForm.processing || !enrollForm.students_text"
                        class="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                        <span>GENERAR ESCUADRAS Y TARJETAS PIN</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>
