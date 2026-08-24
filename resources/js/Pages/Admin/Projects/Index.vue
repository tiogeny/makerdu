<script setup>
import { Head, Link, router } from '@inertiajs/vue3';
import {
    Sparkles, Layers, Plus, Edit, Trash2, ArrowLeft,
    CheckCircle2, Box, Calendar, Clock
} from 'lucide-vue-next';
import AdminNavBar from '@/Components/AdminNavBar.vue';

defineProps({
    projects: Array,
});

const deleteProject = (id, title) => {
    if (confirm(`¿Estás seguro de eliminar el proyecto "${title}"?`)) {
        router.delete(route('admin.projects.destroy', { project: id }));
    }
};
</script>

<template>
    <Head title="Diseñador de Proyectos Maker - Makerdu" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR UNIFICADA SUPER ADMIN -->
        <AdminNavBar active-section="projects" />

        <!-- SUB-HEADER DE ACCIÓN -->
        <div class="bg-slate-900/60 border-b border-slate-800/80 px-6 py-4">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 class="text-lg font-black text-white flex items-center gap-2">
                        <Layers class="w-5 h-5 text-cyan-400" />
                        <span>CATÁLOGO MAESTRO DE PROYECTOS MAKER</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                            Course Builder
                        </span>
                    </h1>
                    <p class="text-xs text-slate-400">Diseña los retos STEAM maestros, mallas de niveles y reglas de validación IA.</p>
                </div>

                <Link
                    :href="route('admin.projects.create')"
                    class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
                >
                    <Plus class="w-4 h-4" />
                    <span>NUEVO PROYECTO MAKER</span>
                </Link>
            </div>
        </div>

        <!-- MAIN -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
            
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    v-for="p in projects"
                    :key="p.id"
                    class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-xl"
                >
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800 uppercase">
                                {{ p.type }}
                            </span>
                            <span class="text-xs font-bold text-amber-400">
                                {{ p.levels_count }} Niveles Dinámicos
                            </span>
                        </div>

                        <h3 class="font-black text-lg text-white leading-snug">{{ p.title }}</h3>
                        <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed">{{ p.description }}</p>
                    </div>

                    <div class="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                        <span class="text-[10px] text-slate-500 font-mono">{{ p.created_at }}</span>
                        
                        <div class="flex items-center gap-2">
                            <Link
                                :href="route('admin.projects.edit', { project: p.id })"
                                class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                                title="Editar Proyecto"
                            >
                                <Edit class="w-4 h-4" />
                            </Link>

                            <button
                                type="button"
                                @click="deleteProject(p.id, p.title)"
                                class="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
                                title="Eliminar Proyecto"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>
</template>
