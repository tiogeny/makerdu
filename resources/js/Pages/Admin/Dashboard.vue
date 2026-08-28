<script setup>
import { Head, Link } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { 
    Sparkles, 
    Layers, 
    Box, 
    Cpu, 
    School, 
    Plus, 
    ArrowRight, 
    CheckCircle2,
    ShieldCheck
} from 'lucide-vue-next';
import { t, currentLang } from '@/i18n.js';

defineProps({
    stats: Object,
    recent_projects: Array,
    recent_classrooms: Array,
});
</script>

<template>
    <AdminLayout>
        <Head title="SuperAdmin HQ · Makerdu v4.0" />

        <!-- HERO BANNER -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden mb-8">
            <div class="space-y-2 relative z-10">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold border border-cyan-500/20">
                    <ShieldCheck class="w-4 h-4 text-cyan-400" />
                    <span>SUPERADMIN HQ • MAKERDU v4.0</span>
                </div>
                <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Centro de Mando de Fabricación Digital STEAM
                </h2>
                <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Diseña Técnicas de Fabricación con misiones modulares (IPO), entrena al Copiloto Gemini y gestiona la Suite de 19 Micro-Apps.
                </p>
            </div>

            <div class="flex items-center gap-3 relative z-10 shrink-0">
                <Link
                    :href="route('admin.techniques.create')"
                    class="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-xl shadow-cyan-500/20"
                >
                    <Plus class="w-4 h-4" />
                    <span>NUEVA TÉCNICA MAESTRA</span>
                </Link>
            </div>
        </div>

        <!-- QUICK ACCESS TILES -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Card 1: Técnicas STEAM -->
            <Link
                :href="route('admin.techniques.index')"
                class="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition shadow-xl flex flex-col justify-between"
            >
                <div>
                    <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Layers class="w-6 h-6" />
                    </div>
                    <h3 class="text-base font-black text-white group-hover:text-cyan-300 transition">Técnicas STEAM Maestras</h3>
                    <p class="text-xs text-slate-400 mt-1">
                        Crea matrices de fabricación con misiones secuenciales (Input ➔ Process ➔ Output) y competencias CNEB/STEAM.
                    </p>
                </div>
                <div class="mt-6 flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
                    <span>Gestionar Catálogo</span>
                    <ArrowRight class="w-4 h-4" />
                </div>
            </Link>

            <!-- Card 2: Suite Micro-Apps -->
            <Link
                :href="route('admin.apps.index')"
                class="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition shadow-xl flex flex-col justify-between"
            >
                <div>
                    <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Box class="w-6 h-6" />
                    </div>
                    <h3 class="text-base font-black text-white group-hover:text-blue-300 transition">Suite Micro-Apps (19)</h3>
                    <p class="text-xs text-slate-400 mt-1">
                        Herramientas WebGL y Canvas 2D/3D independientes (Tinkercad-lite, SculptGL-lite, Engranajes, Waffle grid, etc.).
                    </p>
                </div>
                <div class="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition">
                    <span>Ver Catálogo de Apps</span>
                    <ArrowRight class="w-4 h-4" />
                </div>
            </Link>

            <!-- Card 3: Copiloto Gemini -->
            <Link
                :href="route('admin.ai-sandbox.index')"
                class="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition shadow-xl flex flex-col justify-between"
            >
                <div>
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <Cpu class="w-6 h-6" />
                    </div>
                    <h3 class="text-base font-black text-white group-hover:text-purple-300 transition">Copiloto IA Gemini</h3>
                    <p class="text-xs text-slate-400 mt-1">
                        Prueba en tiempo real la visión artificial y evaluación de entregables (Pre-flight check en 3D/Láser).
                    </p>
                </div>
                <div class="mt-6 flex items-center gap-1.5 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition">
                    <span>Probar Visión Artificial</span>
                    <ArrowRight class="w-4 h-4" />
                </div>
            </Link>
        </div>
    </AdminLayout>
</template>
