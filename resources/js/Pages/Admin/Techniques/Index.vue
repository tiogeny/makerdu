<script setup>
import { ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { 
    Plus, 
    Layers, 
    Sparkles, 
    Edit, 
    Trash2, 
    Eye, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Award, 
    Box, 
    Cpu,
    ArrowRight
} from 'lucide-vue-next';
import { t, trans, currentLang } from '@/i18n.js';

const props = defineProps({
    techniques: {
        type: Array,
        default: () => [],
    },
    microApps: {
        type: Array,
        default: () => [],
    },
    animations: {
        type: Array,
        default: () => [],
    },
});

const selectedTechniqueModal = ref(null);

const openMissionRoadmap = (tech) => {
    selectedTechniqueModal.value = tech;
};

const closeMissionRoadmap = () => {
    selectedTechniqueModal.value = null;
};

const toggleTechnique = (id) => {
    router.post(route('admin.techniques.toggle', id), {}, {
        preserveScroll: true,
    });
};

const deleteTechnique = (id) => {
    if (confirm('¿Eliminar esta técnica STEAM? Esta acción no se puede deshacer.')) {
        router.delete(route('admin.techniques.destroy', id));
    }
};

const getTechAnimation = (tech) => {
    if (tech.custom_animation_html) {
        return tech.custom_animation_html;
    }
    const found = props.animations.find(a => a.slug === tech.animation_preset);
    return found?.html_css_code || null;
};
</script>

<template>
    <AdminLayout>
        <Head title="Técnicas STEAM Maestras · SuperAdmin HQ" />

        <!-- HEADER SECTION -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                        CATÁLOGO MAESTRO V4.0
                    </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Técnicas de Fabricación STEAM</span>
                    <span class="text-xs px-2 py-0.5 rounded-xl bg-slate-800 text-slate-400 font-mono font-normal">
                        {{ techniques.length }} disponibles
                    </span>
                </h1>
                <p class="text-xs text-slate-400 mt-1">
                    Matrices maestras con rutas de misiones modulares (Input ➔ Process ➔ Output) y Copiloto Gemini en 3 capas.
                </p>
            </div>

            <Link
                :href="route('admin.techniques.create')"
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer"
            >
                <Plus class="w-4 h-4" />
                <span>NUEVA TÉCNICA MAESTRA</span>
            </Link>
        </div>

        <!-- LISTA DE TÉCNICAS (GRID) -->
        <div v-if="techniques.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="tech in techniques"
                :key="tech.id"
                class="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between group relative overflow-hidden"
            >
                <!-- Ambient Glow -->
                <div class="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition"></div>

                <div>
                    <!-- Badge Header -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider"
                            :class="{
                                'bg-purple-500/20 text-purple-300 border border-purple-500/30': tech.type === '2.5D',
                                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30': tech.type === '3D',
                                'bg-amber-500/20 text-amber-300 border border-amber-500/30': tech.type === 'Laser'
                            }"
                        >
                            {{ tech.type }}
                        </span>

                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold" :class="tech.status === 'draft' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'">
                                {{ tech.status === 'draft' ? 'BORRADOR' : 'PUBLICADA' }}
                            </span>
                            <button
                                @click="toggleTechnique(tech.id)"
                                :class="[
                                    'text-[10px] px-2 py-0.5 rounded-full font-bold transition flex items-center gap-1 cursor-pointer',
                                    tech.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                                ]"
                            >
                                <span class="w-1.5 h-1.5 rounded-full" :class="tech.is_active ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                                <span>{{ tech.is_active ? 'Activa' : 'Pausada' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Micro-Animación Demostrativa Preview (RENDER VIVO) -->
                    <div class="rounded-2xl bg-slate-950 border border-slate-800/80 mb-4 overflow-hidden group-hover:border-cyan-500/40 transition p-1 min-h-[140px] flex items-center justify-center relative">
                        <div v-if="getTechAnimation(tech)" v-html="getTechAnimation(tech)" class="w-full"></div>
                        <div v-else class="text-3xl animate-bounce">
                            <span v-if="tech.type === '2.5D'">🧸</span>
                            <span v-else-if="tech.type === 'Laser'">🪵</span>
                            <span v-else>🧊</span>
                        </div>
                    </div>

                    <!-- Title & Description -->
                    <h3 class="text-base font-black text-white group-hover:text-cyan-300 transition mb-1.5">
                        {{ trans(tech.title_json) }}
                    </h3>
                    <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {{ trans(tech.description_json) }}
                    </p>

                    <!-- Competencies Tags -->
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        <span 
                            v-for="comp in (tech.competencies_json || []).slice(0, 3)" 
                            :key="comp"
                            class="text-[9px] px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700"
                        >
                            {{ comp }}
                        </span>
                    </div>
                </div>

                <!-- Footer Stats & Actions -->
                <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                        @click="openMissionRoadmap(tech)"
                        class="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>{{ tech.total_levels }} Misiones IPO</span>
                        <ArrowRight class="w-3.5 h-3.5" />
                    </button>

                    <div class="flex items-center gap-2">
                        <Link
                            :href="route('admin.techniques.edit', tech.id)"
                            class="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            title="Editar Técnica"
                        >
                            <Edit class="w-3.5 h-3.5" />
                        </Link>
                        <button
                            @click="deleteTechnique(tech.id)"
                            class="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title="Eliminar Técnica"
                        >
                            <Trash2 class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ESTADO VACÍO -->
        <div v-else class="text-center py-20 px-4 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl max-w-lg mx-auto">
            <div class="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-3xl mx-auto mb-4 border border-cyan-500/20">
                🧬
            </div>
            <h3 class="text-base font-black text-white mb-1">No hay Técnicas STEAM Registradas</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Crea tu primera técnica de fabricación digital configurando sus misiones IPO y copiloto IA.
            </p>
            <Link
                :href="route('admin.techniques.create')"
                class="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
                <Plus class="w-4 h-4" />
                <span>DISEÑAR PRIMERA TÉCNICA</span>
            </Link>
        </div>

        <!-- MODAL DE HOJA DE RUTA DE MISIONES (ROADMAP MODAL) -->
        <div v-if="selectedTechniqueModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                        <span class="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Hoja de Ruta Metodológica</span>
                        <h2 class="text-base font-black text-white">{{ trans(selectedTechniqueModal.title_json) }}</h2>
                    </div>
                    <button @click="closeMissionRoadmap" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <div class="space-y-3">
                    <div
                        v-for="lvl in selectedTechniqueModal.levels"
                        :key="lvl.id"
                        class="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                                    {{ lvl.level_number }}
                                </span>
                                <span class="text-xs font-bold text-white">{{ trans(lvl.title_json) }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-[10px] font-mono">
                                <span class="text-amber-400 font-bold">⚡ {{ lvl.xp_reward }} PM</span>
                                <span class="text-cyan-400 font-bold" v-if="lvl.fabcoins_cost > 0">🪙 {{ lvl.fabcoins_cost }} FC</span>
                            </div>
                        </div>

                        <!-- IPO Mini Badges -->
                        <div class="grid grid-cols-3 gap-2 pt-2 text-[10px] border-t border-slate-900">
                            <div class="bg-slate-900 p-2 rounded-xl border border-slate-800">
                                <span class="text-cyan-400 font-bold block mb-0.5">📥 Entrada:</span>
                                <span class="text-slate-400 line-clamp-1">{{ lvl.inputs_json?.guide_text || 'Guía didáctica' }}</span>
                            </div>
                            <div class="bg-slate-900 p-2 rounded-xl border border-slate-800">
                                <span class="text-purple-400 font-bold block mb-0.5">⚙️ Proceso:</span>
                                <span class="text-slate-400 line-clamp-1">{{ lvl.process_json?.mode || 'Micro-App' }}</span>
                            </div>
                            <div class="bg-slate-900 p-2 rounded-xl border border-slate-800">
                                <span class="text-emerald-400 font-bold block mb-0.5">📤 Salida:</span>
                                <span class="text-slate-400 line-clamp-1">{{ lvl.outputs_json?.deliverable_type || 'STL / SVG' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-800 flex justify-end">
                    <button @click="closeMissionRoadmap" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer">
                        Cerrar Hoja de Ruta
                    </button>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>
