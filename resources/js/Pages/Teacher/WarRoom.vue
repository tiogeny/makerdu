<script setup>
import { Head, router, usePage, Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, School, Users, Layers, Trophy, Coins, CheckCircle2,
    Clock, Lock, FileText, Download, Package, Truck, Printer,
    Flame, ArrowRight, ExternalLink, ShieldCheck, ChevronRight, BarChart3,
    Share2, MessageCircle, Award, CreditCard, FolderPlus, UserPlus
} from 'lucide-vue-next';
import { t } from '@/i18n.js';

const props = defineProps({
    classrooms: Array,
    activeClassroom: Object,
    project: Object,
    heatmap: Array,
    competencies: Object,
    batches: Array,
});

const page = usePage();
const selectedClassroomId = ref(props.activeClassroom?.id || props.classrooms[0]?.id);
const isGeneratingBatch = ref(false);

const changeClassroom = (id) => {
    selectedClassroomId.value = id;
    router.get(route('teacher.war-room'), { classroom_id: id }, { preserveScroll: true });
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
</script>

<template>
    <Head title="Torre de Control Maker - Makerdu v2.6" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR DOCENTE -->
        <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3.5">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                        <Flame class="w-5 h-5" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-black text-lg tracking-tight text-white">{{ t('teacher.tower_title') }}</h1>
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                                {{ t('teacher.tower_badge') }}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400">{{ t('teacher.tower_desc') }}</p>
                    </div>
                </div>

                <!-- Selector de Aula & Acciones -->
                <div class="flex flex-wrap items-center gap-2">
                    <select
                        :value="activeClassroom?.id"
                        @change="changeClassroom($event.target.value)"
                        class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                        <option v-for="c in classrooms" :key="c.id" :value="c.id">
                            {{ c.name }} ({{ c.access_code }})
                        </option>
                    </select>

                    <!-- Link Diseñador de Cursos -->
                    <Link
                        :href="route('admin.projects.index')"
                        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5"
                    >
                        <FolderPlus class="w-3.5 h-3.5" />
                        <span>Cursos</span>
                    </Link>

                    <!-- Link Gestor de Aulas -->
                    <Link
                        :href="route('admin.classrooms.index')"
                        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5"
                    >
                        <UserPlus class="w-3.5 h-3.5" />
                        <span>Aulas & PINs</span>
                    </Link>

                    <!-- Descargar Tarjetas PIN en PDF -->
                    <a
                        v-if="activeClassroom"
                        :href="route('teacher.pin-cards', { classroom: activeClassroom.id })"
                        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
                    >
                        <CreditCard class="w-3.5 h-3.5" />
                        <span>Tarjetas PDF</span>
                    </a>

                    <Link
                        :href="route('student.login')"
                        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition"
                    >
                        Vista Alumnos
                    </Link>
                </div>
            </div>
        </header>

        <!-- MAIN CONTAINER -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
            
            <!-- ALERTA DE ÉXITO -->
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <!-- SECCIÓN 1: RADAR DE AVANCE DEL AULA -->
            <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <BarChart3 class="w-5 h-5 text-cyan-400" />
                            <h2 class="text-lg font-black text-white">{{ t('teacher.heatmap_title') }}</h2>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Avance de cada equipo en los {{ project?.total_levels }} niveles dinámicos del proyecto figital.</p>
                    </div>

                    <!-- Botón Generar Lote de Fabricación -->
                    <button
                        type="button"
                        @click="generateFabricationBatch"
                        :disabled="isGeneratingBatch"
                        class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                    >
                        <Package class="w-4 h-4" />
                        <span>{{ isGeneratingBatch ? 'Empaquetando...' : t('teacher.btn_generate_batch') }}</span>
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
            </section>

            <!-- SECCIÓN 2: TRADUCCIÓN A COMPETENCIAS CNEB / MINEDU -->
            <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div class="flex items-center gap-2">
                    <ShieldCheck class="w-5 h-5 text-emerald-400" />
                    <h2 class="text-lg font-black text-white">{{ t('teacher.cneb_title') }}</h2>
                </div>
                <p class="text-xs text-slate-400">
                    Correspondencia automática entre los niveles pedagógicos del alumno y los estándares oficiales del currículo nacional.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div
                        v-for="(comp, num) in competencies"
                        :key="num"
                        class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
                    >
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-cyan-400">Nivel {{ num }}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Oficial</span>
                        </div>
                        <h4 class="text-xs font-bold text-white">{{ comp.name }}</h4>
                        <p class="text-[11px] text-amber-300/90 font-medium">{{ comp.cneb_competency }}</p>
                        <p class="text-[10px] text-slate-400 leading-relaxed">{{ comp.indicator }}</p>
                    </div>
                </div>
            </section>

            <!-- SECCIÓN 3: LOTES DE FABRICACIÓN DIGITAL (BATCHES FABLAB) -->
            <section class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Printer class="w-5 h-5 text-amber-400" />
                        <h2 class="text-lg font-black text-white">{{ t('teacher.batches_title') }}</h2>
                    </div>
                    <span class="text-xs text-slate-400">{{ batches.length }} lotes registrados</span>
                </div>

                <div v-if="batches.length" class="space-y-3">
                    <div
                        v-for="b in batches"
                        :key="b.id"
                        class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-black text-sm text-white">Lote #{{ b.id }}</span>
                                <span :class="['text-[10px] font-bold px-2.5 py-0.5 rounded-lg border', getBatchStatusBadge(b.status).class]">
                                    {{ getBatchStatusBadge(b.status).label }}
                                </span>
                            </div>
                            <p class="text-[11px] text-slate-400 mt-1">Destino: {{ b.shipping_address || 'FabLab Principal' }}</p>
                        </div>

                        <!-- Descargas & Estado -->
                        <div class="flex flex-wrap items-center gap-2">
                            <a
                                v-if="b.zip_file_url"
                                :href="b.zip_file_url"
                                download
                                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-xs font-bold transition"
                            >
                                <Download class="w-3.5 h-3.5" />
                                <span>{{ t('teacher.download_zip') }}</span>
                            </a>

                            <a
                                v-if="b.pdf_label_url"
                                :href="b.pdf_label_url"
                                target="_blank"
                                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 text-xs font-bold transition"
                            >
                                <FileText class="w-3.5 h-3.5" />
                                <span>{{ t('teacher.print_pdf') }}</span>
                            </a>

                            <select
                                :value="b.status"
                                @change="updateStatus(b.id, $event.target.value)"
                                class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-300"
                            >
                                <option value="queue">En Cola</option>
                                <option value="printing">Imprimiendo</option>
                                <option value="dispatched">Despachado</option>
                                <option value="delivered">Entregado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div v-else class="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-500">
                    Aún no se han generado lotes de fabricación para esta aula. Haz clic en "Empaquetar Lote FabLab" arriba cuando las escuadras estén listas.
                </div>
            </section>

        </main>
    </div>
</template>
