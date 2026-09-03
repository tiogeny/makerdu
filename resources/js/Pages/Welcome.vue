<script setup>
import { Head, Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, Users, Laptop, ShieldCheck, ArrowRight, BookOpen,
    Layers, Coins, Trophy, Globe, Lock, Cpu, Sun, Moon, Rocket, Palette
} from 'lucide-vue-next';
import { t, trans, currentLang, setLanguage } from '@/i18n.js';

defineProps({
    canLogin: Boolean,
    canRegister: Boolean,
});

const isDarkTheme = ref(false);
const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
};
</script>

<template>
    <div :class="isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'" class="min-h-screen transition-colors duration-300 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden">
        
        <!-- NAVBAR -->
        <header class="max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-cyan-500/20">
                    ⚡
                </div>
                <div>
                    <span class="text-xl font-black tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                        Makerdu Studio
                    </span>
                    <span class="text-[10px] block font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        MICRO-FÁBRICA DIGITAL · FABLAB NETWORK
                    </span>
                </div>
            </div>

            <nav class="flex items-center gap-2 sm:gap-3">
                <!-- Selector de Idioma -->
                <button
                    type="button"
                    @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                    :class="isDarkTheme ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'"
                    class="px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer"
                >
                    <Globe class="w-3.5 h-3.5" />
                    <span>{{ currentLang.toUpperCase() }}</span>
                </button>

                <!-- Switch Tema -->
                <button
                    type="button"
                    @click="toggleTheme"
                    :class="isDarkTheme ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200 shadow-sm'"
                    class="p-2 rounded-xl border transition cursor-pointer"
                >
                    <Sun v-if="isDarkTheme" class="w-4 h-4" />
                    <Moon v-else class="w-4 h-4" />
                </button>

                <Link
                    :href="route('student.login')"
                    class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition shadow-md shadow-cyan-500/20"
                >
                    {{ currentLang === 'en' ? 'ENTER STUDIO' : 'ENTRAR AL ESTUDIO' }}
                </Link>
            </nav>
        </header>

        <!-- HERO SECTION -->
        <main class="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center relative z-10 my-auto">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold mb-6 border" :class="isDarkTheme ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-800'">
                <Sparkles class="w-3.5 h-3.5 text-cyan-500" />
                <span>{{ currentLang === 'en' ? 'Challenge-Based Learning & Digital Fabrication' : 'Aprendizaje Basado en Retos & Fabricación Digital' }}</span>
            </div>

            <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl leading-tight mb-5" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                {{ currentLang === 'en' ? 'From Idea to Real Physical Product:' : 'De la Idea al Producto en tus Manos:' }} <br />
                <span class="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {{ currentLang === 'en' ? 'Your Personal Digital Micro-Factory' : 'Tu Micro-Fábrica Digital de Art Toys' }}
                </span>
            </h1>

            <p class="text-sm sm:text-base max-w-2xl mb-8 leading-relaxed" :class="isDarkTheme ? 'text-slate-400' : 'text-slate-600'">
                {{ currentLang === 'en' 
                    ? 'Empowering young creators to design, simulate, cost, and fabricate real 3D objects with the guidance of their AI Maker Copilot.'
                    : 'Aprende a transformar un boceto en papel en un producto físico tridimensional con herramientas digitales autónomas y la guía de tu Copiloto IA.' }}
            </p>

            <!-- TARJETAS DE ACCESO -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
                <!-- Tarjeta Creador / Alumno -->
                <Link
                    :href="route('student.login')"
                    class="group p-6 rounded-3xl border transition-all duration-300 shadow-md flex flex-col justify-between hover:scale-[1.02]"
                    :class="isDarkTheme ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50' : 'bg-white hover:bg-cyan-50/40 border-slate-200 hover:border-cyan-400'"
                >
                    <div>
                        <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-lg mb-3">
                            🎨
                        </div>
                        <h2 class="text-lg font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            {{ currentLang === 'en' ? 'Student Maker Access' : 'Acceso para Estudiantes Maker' }}
                        </h2>
                        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                            {{ currentLang === 'en' ? 'Enter with your 4-digit PIN to access your workbench, micro-apps, and missions.' : 'Ingresa con tu PIN de 4 dígitos para acceder a tu mesa de trabajo, herramientas y misiones.' }}
                        </p>
                    </div>

                    <div class="mt-4 flex items-center gap-2 text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition">
                        <span>{{ currentLang === 'en' ? 'Start creating ➔' : 'Comenzar a crear ➔' }}</span>
                    </div>
                </Link>

                <!-- Tarjeta Docente / Instructor -->
                <Link
                    :href="route('login')"
                    class="group p-6 rounded-3xl border transition-all duration-300 shadow-md flex flex-col justify-between hover:scale-[1.02]"
                    :class="isDarkTheme ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-purple-500/50' : 'bg-white hover:bg-purple-50/40 border-slate-200 hover:border-purple-400'"
                >
                    <div>
                        <div class="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg mb-3">
                            🎓
                        </div>
                        <h2 class="text-lg font-black" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                            {{ currentLang === 'en' ? 'Instructor Control Tower' : 'Torre de Control del Docente' }}
                        </h2>
                        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                            {{ currentLang === 'en' ? 'Manage workshops, customize pedagogical context, and monitor live fabrication.' : 'Gestiona tus talleres, personaliza tus retos y monitorea la fabricación física en vivo.' }}
                        </p>
                    </div>

                    <div class="mt-4 flex items-center gap-2 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition">
                        <span>{{ currentLang === 'en' ? 'Instructor Portal ➔' : 'Panel de Control ➔' }}</span>
                    </div>
                </Link>
            </div>
        </main>

        <!-- FOOTER -->
        <footer class="p-6 text-center text-xs text-slate-400 font-mono border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200/80'">
            Makerdu v4.0 · Open STEAM & Youth Maker Studio · FabLab Eco-Platform
        </footer>
    </div>
</template>
