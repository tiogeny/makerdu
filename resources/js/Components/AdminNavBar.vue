<script setup>
import { Link, router } from '@inertiajs/vue3';
import {
    Sparkles, LayoutDashboard, Layers, School, Users, Cpu,
    Globe, Eye, LogOut, ShieldCheck, Plus, Package
} from 'lucide-vue-next';
import { t, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    activeSection: {
        type: String,
        default: 'dashboard', // 'dashboard', 'projects', 'classrooms', 'apps', 'aisandbox'
    },
});

const navLinks = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        route: 'admin.dashboard',
        icon: LayoutDashboard,
        color: 'text-amber-400',
    },
    {
        id: 'projects',
        name: 'Proyectos Maker',
        route: 'admin.projects.index',
        icon: Layers,
        color: 'text-cyan-400',
    },
    {
        id: 'classrooms',
        name: 'Aulas & PINs',
        route: 'admin.classrooms.index',
        icon: School,
        color: 'text-purple-400',
    },
    {
        id: 'apps',
        name: 'Micro-Apps Store',
        route: 'admin.apps.index',
        icon: Sparkles,
        color: 'text-emerald-400',
    },
    {
        id: 'aisandbox',
        name: 'AI Sandbox',
        route: 'admin.ai-sandbox.index',
        icon: Cpu,
        color: 'text-pink-400',
    },
];
</script>

<template>
    <header class="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-50 backdrop-blur-md">
        <div class="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            <!-- Brand & SuperAdmin Tag -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Link
                        :href="route('admin.dashboard')"
                        class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 hover:scale-105 transition"
                    >
                        <Sparkles class="w-5 h-5" />
                    </Link>
                    <div>
                        <div class="flex items-center gap-2">
                            <Link :href="route('admin.dashboard')" class="font-black text-base text-white tracking-tight hover:text-amber-300 transition">
                                MAKERDU
                            </Link>
                            <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                                👑 SuperAdmin
                            </span>
                        </div>
                        <p class="text-[10px] text-slate-400 font-mono">Consola Central de Operaciones FabLab</p>
                    </div>
                </div>
            </div>

            <!-- Central Nav Links -->
            <nav class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <Link
                    v-for="item in navLinks"
                    :key="item.id"
                    :href="route(item.route)"
                    :class="[
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0',
                        activeSection === item.id
                            ? 'bg-slate-800 text-white border border-slate-700 shadow-inner'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    ]"
                >
                    <component :is="item.icon" :class="['w-3.5 h-3.5', activeSection === item.id ? item.color : 'text-slate-500']" />
                    <span>{{ item.name }}</span>
                </Link>
            </nav>

            <!-- Right Actions: Language, Teacher View, Logout -->
            <div class="flex items-center gap-2 shrink-0">
                <!-- Language Toggle -->
                <button
                    type="button"
                    @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-[11px] font-mono font-bold border border-slate-800 transition flex items-center gap-1"
                    title="Cambiar Idioma"
                >
                    <Globe class="w-3 h-3" />
                    <span>{{ currentLang.toUpperCase() }}</span>
                </button>

                <!-- Vista Previa Docente -->
                <Link
                    :href="route('teacher.war-room')"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-950/60 text-purple-300 hover:text-purple-200 border border-slate-700 hover:border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    title="Ver cómo ven la plataforma los profesores"
                >
                    <Eye class="w-3.5 h-3.5" />
                    <span class="hidden sm:inline">Vista Docente</span>
                </Link>

                <!-- Logout -->
                <button
                    type="button"
                    @click="router.post(route('logout'))"
                    class="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 border border-slate-800 transition"
                    title="Cerrar Sesión"
                >
                    <LogOut class="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </header>
</template>
