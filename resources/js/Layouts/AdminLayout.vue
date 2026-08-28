<script setup>
import { ref } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import { 
    Sparkles, 
    Layers, 
    Cpu, 
    Box, 
    Coins, 
    Settings, 
    LogOut, 
    Globe, 
    Menu, 
    X, 
    ChevronRight, 
    FolderKanban, 
    School,
    ShieldAlert
} from 'lucide-vue-next';
import { t, currentLang, setLanguage } from '@/i18n.js';

const isSidebarCollapsed = ref(false);
const isMobileOpen = ref(false);
const page = usePage();

const navItems = [
    {
        name: 'Técnicas STEAM',
        nameEn: 'STEAM Techniques',
        route: 'admin.techniques.index',
        icon: Layers,
        badge: 'v4.0',
    },
    {
        name: 'Suite Micro-Apps (19)',
        nameEn: 'Micro-Apps Suite (19)',
        route: 'admin.apps.index',
        icon: Box,
    },
    {
        name: 'Galería de Animaciones',
        nameEn: 'Animation Gallery',
        route: 'admin.animations.index',
        icon: Sparkles,
    },
    {
        name: 'Copiloto IA Gemini',
        nameEn: 'Gemini AI Copilot',
        route: 'admin.ai-sandbox.index',
        icon: Cpu,
    },
    {
        name: 'Gestor de Aulas',
        nameEn: 'Classrooms Manager',
        route: 'admin.classrooms.index',
        icon: School,
    },
];

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
</script>

<template>
    <div class="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
        
        <!-- SIDEBAR PARA DESKTOP -->
        <aside 
            :class="[
                'hidden md:flex flex-col justify-between border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl transition-all duration-300 z-30',
                isSidebarCollapsed ? 'w-20' : 'w-64'
            ]"
        >
            <!-- Logo & Brand Header -->
            <div>
                <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    <Link :href="route('admin.dashboard')" class="flex items-center gap-3 overflow-hidden">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
                            <Sparkles class="w-5 h-5 text-slate-950" />
                        </div>
                        <div v-show="!isSidebarCollapsed" class="transition-opacity duration-200">
                            <div class="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                                <span>MAKER<span class="text-cyan-400">DU</span></span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">v4.0</span>
                            </div>
                            <p class="text-[10px] text-slate-400 font-mono">SuperAdmin HQ</p>
                        </div>
                    </Link>

                    <button 
                        @click="toggleSidebar"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        :title="isSidebarCollapsed ? 'Expandir' : 'Colapsar'"
                    >
                        <ChevronRight :class="['w-4 h-4 transition-transform duration-300', !isSidebarCollapsed && 'rotate-180']" />
                    </button>
                </div>

                <!-- Navigation Links -->
                <nav class="p-3 space-y-1.5">
                    <Link
                        v-for="item in navItems"
                        :key="item.route"
                        :href="route(item.route)"
                        :class="[
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition group relative',
                            route().current(item.route) || route().current(item.route.replace('.index', '.*'))
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        ]"
                    >
                        <component :is="item.icon" class="w-4 h-4 shrink-0" />
                        <span v-show="!isSidebarCollapsed" class="truncate">
                            {{ currentLang === 'es' ? item.name : item.nameEn }}
                        </span>
                        
                        <span 
                            v-if="item.badge && !isSidebarCollapsed" 
                            class="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold"
                        >
                            {{ item.badge }}
                        </span>
                    </Link>
                </nav>
            </div>

            <!-- Footer Sidebar (Language & Logout) -->
            <div class="p-3 border-t border-slate-800 space-y-2">
                <!-- Selector de Idioma -->
                <button
                    type="button"
                    @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                    :class="[
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition border border-transparent hover:border-slate-700',
                        isSidebarCollapsed && 'justify-center'
                    ]"
                    title="Cambiar Idioma"
                >
                    <Globe class="w-4 h-4 text-cyan-400 shrink-0" />
                    <span v-show="!isSidebarCollapsed">Idioma: {{ currentLang.toUpperCase() }}</span>
                </button>

                <!-- Logout -->
                <Link
                    :href="route('logout')"
                    method="post"
                    as="button"
                    :class="[
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition',
                        isSidebarCollapsed && 'justify-center'
                    ]"
                >
                    <LogOut class="w-4 h-4 shrink-0" />
                    <span v-show="!isSidebarCollapsed">{{ t('nav.logout') }}</span>
                </Link>
            </div>
        </aside>

        <!-- CONTENIDO PRINCIPAL -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
            
            <!-- Topbar Móvil -->
            <header class="md:hidden h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-20">
                <Link :href="route('admin.dashboard')" class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-black">
                        <Sparkles class="w-4 h-4" />
                    </div>
                    <span class="font-black text-sm text-white">MAKERDU <span class="text-cyan-400">v4.0</span></span>
                </Link>
                
                <button @click="isMobileOpen = !isMobileOpen" class="p-2 text-slate-400 hover:text-white">
                    <Menu v-if="!isMobileOpen" class="w-6 h-6" />
                    <X v-else class="w-6 h-6" />
                </button>
            </header>

            <!-- Menú Desplegable Móvil -->
            <div v-if="isMobileOpen" class="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2 animate-fade-in z-20">
                <Link
                    v-for="item in navItems"
                    :key="item.route"
                    :href="route(item.route)"
                    class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800"
                    @click="isMobileOpen = false"
                >
                    <component :is="item.icon" class="w-4 h-4 text-cyan-400" />
                    <span>{{ currentLang === 'es' ? item.name : item.nameEn }}</span>
                </Link>
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button @click="setLanguage(currentLang === 'es' ? 'en' : 'es')" class="text-xs font-mono text-cyan-400 font-bold">
                        IDIOMA: {{ currentLang.toUpperCase() }}
                    </button>
                    <Link :href="route('logout')" method="post" as="button" class="text-xs font-bold text-rose-400">
                        Cerrar Sesión
                    </Link>
                </div>
            </div>

            <!-- Page Slot -->
            <main class="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
                <slot />
            </main>
        </div>
    </div>
</template>
