<script setup>
import { Head, Link } from '@inertiajs/vue3';
import { Sparkles, Users, Laptop, ShieldCheck, ArrowRight, BookOpen, Layers, Coins, Trophy } from 'lucide-vue-next';

defineProps({
    canLogin: Boolean,
    canRegister: Boolean,
    laravelVersion: String,
    phpVersion: String,
});
</script>

<template>
    <Head title="Makerdu v2.6 - LMS Figital y Orquestador de Fabricación Digital" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black relative overflow-hidden">
        <!-- Ambient Lights -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-500/20 via-amber-500/10 to-transparent blur-3xl pointer-events-none"></div>

        <!-- NAVBAR -->
        <header class="max-w-7xl w-full mx-auto p-6 flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
                    <Sparkles class="w-6 h-6" />
                </div>
                <div>
                    <span class="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                        MAKER<span class="text-amber-400">DU</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">v2.6</span>
                    </span>
                </div>
            </div>

            <nav class="flex items-center gap-3">
                <Link
                    :href="route('student.login')"
                    class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs tracking-wide transition shadow-lg shadow-cyan-500/20"
                >
                    INGRESAR COMO ALUMNO
                </Link>
                <Link
                    :href="route('login')"
                    class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
                >
                    Acceso Docente
                </Link>
            </nav>
        </header>

        <!-- HERO SECTION -->
        <main class="max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center relative z-10">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300 mb-6 backdrop-blur-md">
                <ShieldCheck class="w-4 h-4 text-amber-400" />
                Plataforma LMS Figital & Orquestador de Fabricación Digital
            </div>

            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-none mb-6">
                Aprende en la nube. <br />
                <span class="bg-gradient-to-r from-cyan-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                    Fabrica en el mundo real.
                </span>
            </h1>

            <p class="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
                Conecta retos pedagógicos digitales con impresión 3D, corte láser y validación por Inteligencia Artificial. Flujos de trabajo colaborativos por escuadras y roles activos.
            </p>

            <!-- ACTION CARDS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left mb-16">
                <!-- Tarjeta Alumno -->
                <Link
                    :href="route('student.login')"
                    class="group p-8 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 relative shadow-2xl flex flex-col justify-between"
                >
                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <Laptop class="w-6 h-6" />
                        </div>
                        <h2 class="text-xl font-black text-white group-hover:text-cyan-300 transition">Portal de Escuadras</h2>
                        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                            Accede a tu taller con tu <strong>Código de Aula (MK-402)</strong> y tu <strong>PIN de 4 dígitos</strong>. Malla de niveles y regla de 1-PC.
                        </p>
                    </div>

                    <div class="mt-6 flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
                        <span>Entrar a mi Escuadra</span>
                        <ArrowRight class="w-4 h-4" />
                    </div>
                </Link>

                <!-- Tarjeta Docente / Admin -->
                <Link
                    :href="route('login')"
                    class="group p-8 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 relative shadow-2xl flex flex-col justify-between"
                >
                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <Layers class="w-6 h-6" />
                        </div>
                        <h2 class="text-xl font-black text-white group-hover:text-amber-300 transition">War Room Docente</h2>
                        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                            Supervisión de aulas en tiempo real, mapas de calor por competencias y despacho de lotes de fabricación (.ZIP + Rotulado).
                        </p>
                    </div>

                    <div class="mt-6 flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
                        <span>Iniciar Sesión Docente</span>
                        <ArrowRight class="w-4 h-4" />
                    </div>
                </Link>
            </div>

            <!-- FEATURES HIGHLIGHT -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl text-left">
                <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                    <Coins class="w-5 h-5 text-amber-400 mb-2" />
                    <h4 class="text-xs font-bold text-white">FabCoins vs. XP</h4>
                    <p class="text-[11px] text-slate-400 mt-1">Presupuesto real para materiales protegido por IA y XP ilimitado para gamificación.</p>
                </div>
                <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                    <Users class="w-5 h-5 text-cyan-400 mb-2" />
                    <h4 class="text-xs font-bold text-white">Regla de 1-PC</h4>
                    <p class="text-[11px] text-slate-400 mt-1">Rotación dinámica de roles (Arquitecto, Calidad, Finanzas, Relator) en una misma pantalla.</p>
                </div>
                <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                    <Sparkles class="w-5 h-5 text-purple-400 mb-2" />
                    <h4 class="text-xs font-bold text-white">Pre-flight Check IA</h4>
                    <p class="text-[11px] text-slate-400 mt-1">Validación geométrica de archivos STL/SVG antes de enviar a fabricación.</p>
                </div>
            </div>
        </main>

        <!-- FOOTER -->
        <footer class="max-w-7xl w-full mx-auto p-6 text-center text-xs text-slate-600 border-t border-slate-900">
            <p>Makerdu v2.6 • Laravel 11 + Vue 3 (Inertia.js) + Tailwind CSS • Optimizado para BanaHosting</p>
        </footer>
    </div>
</template>