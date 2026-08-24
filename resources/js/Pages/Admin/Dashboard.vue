<script setup>
import { Head, Link, router } from '@inertiajs/vue3';
import {
    Sparkles, Layers, School, Users, Coins, Printer,
    Plus, ArrowRight, ShieldCheck, BarChart3, FolderPlus,
    UserPlus, ExternalLink, Globe, LogOut, Award, Cpu, BookOpen
} from 'lucide-vue-next';
import { t, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    stats: Object,
    recent_projects: Array,
    recent_classrooms: Array,
});
</script>

<template>
    <Head :title="`${t('admin.dashboard_title')} - ${t('app.name')}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR SUPER ADMIN -->
        <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                        <Sparkles class="w-5 h-5" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-black text-lg tracking-tight text-white">{{ t('admin.dashboard_title') }}</h1>
                            <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                                👑 {{ t('admin.badge_superadmin') }}
                            </span>
                        </div>
                        <p class="text-xs text-slate-400">{{ t('admin.dashboard_desc') }}</p>
                    </div>
                </div>

                <!-- Botones de Navegación Rápida -->
                <div class="flex flex-wrap items-center gap-2.5">
                    <!-- Selector de Idioma -->
                    <button
                        type="button"
                        @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                        class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold font-mono text-cyan-300 border border-slate-800 transition flex items-center gap-1.5"
                    >
                        <Globe class="w-3.5 h-3.5" />
                        <span>{{ currentLang.toUpperCase() }}</span>
                    </button>

                                        <!-- Micro-Apps Store -->
                    <Link
                        :href="route('admin.apps.index')"
                        class="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <Sparkles class="w-3.5 h-3.5" />
                        <span>Micro-Apps Store</span>
                    </Link>

                                        <!-- AI Sandbox -->
                    <Link
                        :href="route('admin.ai-sandbox.index')"
                        class="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <Cpu class="w-3.5 h-3.5" />
                        <span>AI Sandbox</span>
                    </Link>

                    <!-- Acceso Diseñador de Cursos -->
                    <Link
                        :href="route('admin.projects.index')"
                        class="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <FolderPlus class="w-3.5 h-3.5" />
                        <span>{{ t('nav.courses') }}</span>
                    </Link>

                    <!-- Acceso Gestor de Aulas -->
                    <Link
                        :href="route('admin.classrooms.index')"
                        class="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500 text-purple-300 hover:text-slate-950 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <UserPlus class="w-3.5 h-3.5" />
                        <span>{{ t('nav.classrooms') }}</span>
                    </Link>

                    <!-- Torre de Control -->
                    <Link
                        :href="route('teacher.war-room')"
                        class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                    >
                        <BarChart3 class="w-3.5 h-3.5" />
                        <span>{{ t('nav.warroom') }}</span>
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

        <!-- MAIN -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
            
            <!-- HERO BANNER CON DATOS DEL CENTRO DE MANDO -->
            <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div class="space-y-2 relative z-10">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                        <ShieldCheck class="w-4 h-4" />
                        <span>{{ t('admin.hero_badge') }}</span>
                    </div>
                    <h2 class="text-2xl sm:text-3xl font-black text-white">
                        {{ t('admin.hero_title') }}
                    </h2>
                    <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                        {{ t('admin.hero_subtitle') }}
                    </p>
                </div>

                <div class="flex items-center gap-3 relative z-10 shrink-0">
                    <Link
                        :href="route('admin.projects.create')"
                        class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-xl shadow-amber-500/20"
                    >
                        <Plus class="w-4 h-4" />
                        <span>{{ t('admin.btn_create_course').toUpperCase() }}</span>
                    </Link>
                </div>
            </div>

            <!-- KPI STATS CARDS -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-cyan-400">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{{ t('admin.kpi_projects') }}</span>
                        <FolderPlus class="w-4 h-4" />
                    </div>
                    <p class="text-2xl font-black text-white font-mono">{{ stats.total_projects }}</p>
                    <p class="text-[10px] text-slate-500">{{ currentLang === 'es' ? 'En catálogo maestro' : 'In master catalog' }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-purple-400">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{{ t('admin.kpi_classrooms') }}</span>
                        <School class="w-4 h-4" />
                    </div>
                    <p class="text-2xl font-black text-white font-mono">{{ stats.total_classrooms }}</p>
                    <p class="text-[10px] text-slate-500">{{ currentLang === 'es' ? 'Talleres activos' : 'Active workshops' }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-emerald-400">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{{ t('admin.kpi_teachers') }}</span>
                        <Users class="w-4 h-4" />
                    </div>
                    <p class="text-2xl font-black text-white font-mono">{{ stats.total_teachers }}</p>
                    <p class="text-[10px] text-slate-500">{{ currentLang === 'es' ? 'Instructores asignados' : 'Assigned instructors' }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-sky-400">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{{ t('admin.kpi_squads') }}</span>
                        <Layers class="w-4 h-4" />
                    </div>
                    <p class="text-2xl font-black text-white font-mono">{{ stats.total_squads }}</p>
                    <p class="text-[10px] text-slate-500">{{ currentLang === 'es' ? 'Equipos de 4 alumnos' : 'Teams of 4 students' }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-amber-400">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{{ t('admin.kpi_students') }}</span>
                        <Award class="w-4 h-4" />
                    </div>
                    <p class="text-2xl font-black text-white font-mono">{{ stats.total_students }}</p>
                    <p class="text-[10px] text-slate-500">{{ currentLang === 'es' ? 'Con PINs generados' : 'With generated PINs' }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-amber-400">
                        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{{ t('admin.kpi_fabcoins') }}</span>
                        <Coins class="w-4 h-4" />
                    </div>
                    <p class="text-2xl font-black text-amber-300 font-mono">{{ stats.total_fabcoins }}</p>
                    <p class="text-[10px] text-slate-500">{{ currentLang === 'es' ? 'Insumos físicos reales' : 'Real physical materials' }}</p>
                </div>
            </div>

            <!-- ACCESOS RÁPIDOS: MICRO-APPS STORE & AI SANDBOX (solo SuperAdmin) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Micro-Apps Store Card -->
                <Link
                    :href="route('admin.apps.index')"
                    class="group p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 shadow-xl flex items-center gap-4 transition"
                >
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition">
                        ⚡
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-black text-sm text-white">{{ t('admin.apps_store_title') }}</p>
                        <p class="text-[11px] text-slate-400 leading-snug mt-0.5">{{ t('admin.apps_store_desc') }}</p>
                    </div>
                    <ArrowRight class="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition shrink-0" />
                </Link>

                <!-- AI Sandbox Card -->
                <Link
                    :href="route('admin.ai-sandbox.index')"
                    class="group p-5 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 shadow-xl flex items-center gap-4 transition"
                >
                    <div class="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                        <Cpu class="w-6 h-6 text-cyan-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-black text-sm text-white">{{ t('admin.ai_sandbox_title') }}</p>
                        <p class="text-[11px] text-slate-400 leading-snug mt-0.5">{{ t('admin.ai_sandbox_desc') }}</p>
                    </div>
                    <ArrowRight class="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition shrink-0" />
                </Link>
            </div>

            <!-- SECCIÓN DE 2 COLUMNAS: CURSOS MAESTROS Y AULAS ACTIVAS -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Columna 1: Catálogo de Cursos Maestros -->
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <FolderPlus class="w-5 h-5 text-cyan-400" />
                            <h3 class="text-base font-black text-white">Catálogo de Cursos Maestros</h3>
                        </div>

                        <Link
                            :href="route('admin.projects.index')"
                            class="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                        >
                            <span>Ver todos ({{ stats.total_projects }})</span>
                            <ArrowRight class="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div class="space-y-2.5">
                        <div
                            v-for="p in recent_projects"
                            :key="p.id"
                            class="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between"
                        >
                            <div>
                                <div class="flex items-center gap-2">
                                    <h4 class="font-bold text-xs text-white">{{ p.title }}</h4>
                                    <span class="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                                        {{ p.type }}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 mt-0.5">{{ p.total_levels }} Niveles dinámicos • Creado el {{ p.created_at }}</p>
                            </div>

                            <Link
                                :href="route('admin.projects.edit', { project: p.id })"
                                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                            >
                                Editar Malla
                            </Link>
                        </div>
                    </div>
                </div>

                <!-- Columna 2: Aulas y Talleres Asignados -->
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <School class="w-5 h-5 text-purple-400" />
                            <h3 class="text-base font-black text-white">Aulas y Talleres Asignados</h3>
                        </div>

                        <Link
                            :href="route('admin.classrooms.index')"
                            class="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
                        >
                            <span>Gestionar Aulas ({{ stats.total_classrooms }})</span>
                            <ArrowRight class="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div class="space-y-2.5">
                        <div
                            v-for="c in recent_classrooms"
                            :key="c.id"
                            class="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 transition flex items-center justify-between"
                        >
                            <div>
                                <div class="flex items-center gap-2">
                                    <h4 class="font-bold text-xs text-white">{{ c.name }}</h4>
                                    <span class="text-[9px] px-2 py-0.5 rounded-md font-mono bg-purple-950 text-purple-300 border border-purple-800">
                                        {{ c.access_code }}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 mt-0.5">
                                    Docente: <strong class="text-slate-300">{{ c.teacher_name }}</strong> • Curso: <span class="text-cyan-400">{{ c.project_title }}</span>
                                </p>
                            </div>

                            <span class="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                {{ c.squads_count }} Escuadras
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
