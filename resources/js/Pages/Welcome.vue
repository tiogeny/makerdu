<script setup>
import { Head, Link } from '@inertiajs/vue3';
import { Sparkles, Users, Laptop, ShieldCheck, ArrowRight, BookOpen, Layers, Coins, Trophy, Globe, Lock, Cpu } from 'lucide-vue-next';
import { t, currentLang, setLanguage } from '@/i18n.js';

defineProps({
    canLogin: Boolean,
    canRegister: Boolean,
});
</script>

<template>
    <Head :title="`${t('app.name')} ${t('app.version')} - ${t('app.subtitle')}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black relative overflow-hidden">
        <!-- Ambient Lights -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/20 via-amber-500/10 to-transparent blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

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
                <!-- Selector de Idioma -->
                <button
                    type="button"
                    @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                    class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold font-mono text-cyan-300 border border-slate-800 transition flex items-center gap-1.5"
                    title="Change Language"
                >
                    <Globe class="w-4 h-4" />
                    <span>{{ currentLang.toUpperCase() }}</span>
                </button>

                <Link
                    :href="route('student.login')"
                    class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wide transition shadow-lg shadow-cyan-500/20"
                >
                    {{ t('welcome.card_student_btn') }}
                </Link>
                <Link
                    :href="route('login')"
                    class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition"
                >
                    {{ t('nav.teacher_portal') }}
                </Link>
            </nav>
        </header>

        <!-- HERO SECTION -->
        <main class="max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center relative z-10">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300 mb-6 backdrop-blur-md">
                <ShieldCheck class="w-4 h-4 text-amber-400" />
                {{ t('welcome.badge') }}
            </div>

            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-none mb-6">
                {{ t('welcome.hero_title') }} <br />
                <span class="bg-gradient-to-r from-cyan-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                    {{ t('welcome.hero_highlight') }}
                </span>
            </h1>

            <p class="text-slate-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
                {{ t('welcome.hero_subtitle') }}
            </p>

            <!-- ACTION CARDS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left mb-16">
                <!-- Tarjeta Alumno (PIN & Aula) -->
                <Link
                    :href="route('student.login')"
                    class="group p-8 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 relative shadow-2xl flex flex-col justify-between"
                >
                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <Laptop class="w-6 h-6" />
                        </div>
                        <h2 class="text-xl font-black text-white group-hover:text-cyan-300 transition">{{ t('welcome.card_student_title') }}</h2>
                        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                            {{ t('welcome.card_student_desc') }}
                        </p>
                    </div>

                    <div class="mt-6 flex items-center gap-2 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
                        <span>{{ t('welcome.card_student_btn') }}</span>
                        <ArrowRight class="w-4 h-4" />
                    </div>
                </Link>

                <!-- Tarjeta Docente / Adulto (Email) -->
                <Link
                    :href="route('login')"
                    class="group p-8 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 relative shadow-2xl flex flex-col justify-between"
                >
                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <Layers class="w-6 h-6" />
                        </div>
                        <h2 class="text-xl font-black text-white group-hover:text-amber-300 transition">{{ t('welcome.card_teacher_title') }}</h2>
                        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                            {{ t('welcome.card_teacher_desc') }}
                        </p>
                    </div>

                    <div class="mt-6 flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
                        <span>{{ t('welcome.card_teacher_btn') }}</span>
                        <ArrowRight class="w-4 h-4" />
                    </div>
                </Link>
            </div>

            <!-- FEATURE STATS -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl border-t border-slate-800/80 pt-8 text-center sm:text-left">
                <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                    <div class="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                        <Coins class="w-4 h-4 text-amber-400" />
                        <h3 class="text-xs font-black text-white">{{ t('welcome.stats_phygital') }}</h3>
                    </div>
                    <p class="text-[11px] text-slate-400">{{ t('welcome.stats_phygital_desc') }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                    <div class="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                        <Cpu class="w-4 h-4 text-cyan-400" />
                        <h3 class="text-xs font-black text-white">{{ t('welcome.stats_ai') }}</h3>
                    </div>
                    <p class="text-[11px] text-slate-400">{{ t('welcome.stats_ai_desc') }}</p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
                    <div class="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                        <Trophy class="w-4 h-4 text-purple-400" />
                        <h3 class="text-xs font-black text-white">{{ t('welcome.stats_cneb') }}</h3>
                    </div>
                    <p class="text-[11px] text-slate-400">{{ t('welcome.stats_cneb_desc') }}</p>
                </div>
            </div>
        </main>

        <!-- FOOTER -->
        <footer class="max-w-7xl w-full mx-auto p-6 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>Makerdu v2.6 • Google DeepMind & STEAM Phygital Education Platform</p>
            <p>Laravel v11 • Vue 3 • Three.js • Gemini Flash AI</p>
        </footer>
    </div>
</template>
