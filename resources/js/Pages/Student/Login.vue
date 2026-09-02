<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, KeyRound, School, ArrowRight, ShieldCheck, UserCheck,
    Mail, Lock, Globe, User, Layers, Sun, Moon, Rocket, Check
} from 'lucide-vue-next';
import { t, trans, currentLang, setLanguage } from '@/i18n.js';

const props = defineProps({
    canResetPassword: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
    },
    defaultTab: {
        type: String,
        default: 'student',
    },
    defaultClassCode: {
        type: String,
        default: 'MK2026',
    },
    demoPin: {
        type: String,
        default: '1001',
    },
    demoFabbers: {
        type: Array,
        default: () => [
            { name: 'Benito Juarez', pin: '1001', code: 'MK2026', avatar: 'BJ' },
            { name: 'María Angela Mejía', pin: '1002', code: 'MK2026', avatar: 'MM' },
            { name: 'Delia Barriga', pin: '1003', code: 'MK2026', avatar: 'DB' },
            { name: 'Grace Schwan', pin: '1004', code: 'MK2026', avatar: 'GS' },
            { name: 'Silvana Espinoza', pin: '1005', code: 'MK2026', avatar: 'SE' },
            { name: 'Hayashi Mateo', pin: '1006', code: 'MK2026', avatar: 'HM' },
            { name: 'Esteban Valladares', pin: '1007', code: 'MK2026', avatar: 'EV' },
            { name: 'Evelyn Cuadrado', pin: '1008', code: 'MK2026', avatar: 'EC' },
            { name: 'Victor Freundt', pin: '1009', code: 'MK2026', avatar: 'VF' },
        ],
    },
});

const isDarkTheme = ref(false);
const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value;
};

// Pestaña activa: 'student' (PIN) o 'adult' (Email/Password)
const activeTab = ref(props.defaultTab || 'student');

// Formulario Alumno
const studentForm = useForm({
    access_code: props.defaultClassCode || 'MK2026',
    pin: '',
});

const pinDigits = ref(['', '', '', '']);

const updatePinFromDigits = () => {
    studentForm.pin = pinDigits.value.join('');
};

const handleDigitInput = (index, event) => {
    const val = event.target.value.replace(/\D/g, '');
    pinDigits.value[index] = val ? val.slice(-1) : '';
    updatePinFromDigits();

    if (val && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
    }
};

const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !pinDigits.value[index] && index > 0) {
        const prevInput = document.getElementById(`pin-${index - 1}`);
        if (prevInput) prevInput.focus();
    }
};

const clearPin = () => {
    pinDigits.value = ['', '', '', ''];
    studentForm.pin = '';
};

// Selección rápida de Fabber
const selectedFabber = ref(null);
const pickFabber = (fabber) => {
    selectedFabber.value = fabber;
    studentForm.access_code = fabber.code || 'MK2026';
    studentForm.pin = fabber.pin;
    pinDigits.value = fabber.pin.split('');
    submitStudent();
};

const submitStudent = () => {
    if (studentForm.pin.length !== 4) return;
    studentForm.post(route('student.login.post'), {
        preserveScroll: true,
        onError: () => {
            clearPin();
        },
    });
};

// Formulario Adulto
const adultForm = useForm({
    email: '',
    password: '',
    remember: false,
});

const submitAdult = () => {
    adultForm.post(route('login'), {
        onFinish: () => adultForm.reset('password'),
    });
};
</script>

<template>
    <div :class="isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'" class="min-h-screen transition-colors duration-300 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-slate-950">
        <Head title="Acceso al Taller · Makerdu Studio" />

        <!-- NAVBAR -->
        <header class="max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between relative z-10">
            <Link href="/" class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-cyan-500/20">
                    ⚡
                </div>
                <div>
                    <span class="text-xl font-black tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                        Makerdu Studio
                    </span>
                    <span class="text-[10px] block font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        LABORATORIO DE FABRICACIÓN DIGITAL
                    </span>
                </div>
            </Link>

            <div class="flex items-center gap-2 sm:gap-3">
                <!-- Selector Idioma -->
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
            </div>
        </header>

        <!-- CONTENIDO PRINCIPAL -->
        <main class="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
            <div 
                :class="isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'"
                class="w-full max-w-lg rounded-3xl border p-6 sm:p-8 space-y-6 transition-all duration-300 relative"
            >
                <!-- CABECERA -->
                <div class="text-center space-y-1.5">
                    <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xl mx-auto mb-2">
                        🚀
                    </div>
                    <h1 class="text-xl sm:text-2xl font-black tracking-tight" :class="isDarkTheme ? 'text-white' : 'text-slate-900'">
                        {{ currentLang === 'en' ? 'Welcome to Makerdu Studio' : 'Bienvenido a Makerdu Studio' }}
                    </h1>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto">
                        {{ currentLang === 'en' ? 'Select your creator profile or enter your workshop PIN.' : 'Selecciona tu perfil de creador o ingresa con tu código y PIN.' }}
                    </p>
                </div>

                <!-- SELECTOR DE PESTAÑAS (Estudiante vs Adulto) -->
                <div class="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border" :class="isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'">
                    <button
                        type="button"
                        @click="activeTab = 'student'"
                        :class="[
                            'py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer',
                            activeTab === 'student'
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                : (isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                        ]"
                    >
                        <KeyRound class="w-3.5 h-3.5" />
                        <span>{{ currentLang === 'en' ? 'Workshop Creator' : 'Creador Maker' }}</span>
                    </button>

                    <button
                        type="button"
                        @click="activeTab = 'adult'"
                        :class="[
                            'py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer',
                            activeTab === 'adult'
                                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                                : (isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                        ]"
                    >
                        <Mail class="w-3.5 h-3.5" />
                        <span>{{ currentLang === 'en' ? 'Instructor / Admin' : 'Docente / Admin' }}</span>
                    </button>
                </div>

                <!-- ========================================================= -->
                <!-- PESTAÑA A: ALUMNO / FABBER                                -->
                <!-- ========================================================= -->
                <div v-if="activeTab === 'student'" class="space-y-6 animate-fade-in">
                    
                    <!-- ACCESO RÁPIDO PARA LOS FABBERS (1 CLIC) -->
                    <div class="space-y-2.5">
                        <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                            <Sparkles class="w-3.5 h-3.5" />
                            <span>{{ currentLang === 'en' ? 'Quick Access (Select your name):' : 'Acceso Rápido (Haz clic en tu nombre):' }}</span>
                        </span>

                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                                v-for="fabber in demoFabbers"
                                :key="fabber.pin"
                                type="button"
                                @click="pickFabber(fabber)"
                                :class="[
                                    'p-2.5 rounded-2xl border text-left transition flex items-center gap-2 group cursor-pointer shadow-sm',
                                    selectedFabber?.pin === fabber.pin
                                        ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-md ring-2 ring-cyan-500/30'
                                        : (isDarkTheme ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-cyan-50/70 border-slate-200 text-slate-700')
                                ]"
                            >
                                <div 
                                    :class="selectedFabber?.pin === fabber.pin ? 'bg-slate-950 text-white' : 'bg-cyan-500/20 text-cyan-600 font-bold'"
                                    class="w-6 h-6 rounded-full text-[10px] flex items-center justify-center shrink-0 font-mono"
                                >
                                    {{ fabber.avatar || fabber.name.charAt(0) }}
                                </div>
                                <div class="truncate">
                                    <span class="text-xs font-bold block truncate">{{ fabber.name }}</span>
                                    <span class="text-[9px] font-mono text-slate-400 block">PIN: {{ fabber.pin }}</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- DIVISOR -->
                    <div class="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <div class="flex-1 h-px border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'"></div>
                        <span>{{ currentLang === 'en' ? 'or enter manually' : 'o ingresa manualmente' }}</span>
                        <div class="flex-1 h-px border-t" :class="isDarkTheme ? 'border-slate-800' : 'border-slate-200'"></div>
                    </div>

                    <!-- FORMULARIO MANUAL CON CÓDIGO Y PIN -->
                    <form @submit.prevent="submitStudent" class="space-y-4">
                        <!-- Errores -->
                        <div v-if="studentForm.errors.access_code || studentForm.errors.pin" class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                            {{ studentForm.errors.access_code || studentForm.errors.pin }}
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    {{ currentLang === 'en' ? 'Workshop Code' : 'Código de Taller' }}
                                </label>
                                <input
                                    v-model="studentForm.access_code"
                                    type="text"
                                    placeholder="MK2026"
                                    class="w-full rounded-2xl border p-2.5 text-center text-sm font-mono font-black uppercase tracking-wider focus:ring-2 focus:ring-cyan-500"
                                    :class="isDarkTheme ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'"
                                    required
                                />
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        PIN (4 Dígitos)
                                    </label>
                                    <button type="button" @click="clearPin" class="text-[10px] text-slate-400 hover:text-cyan-500 font-mono">
                                        Limpiar
                                    </button>
                                </div>

                                <div class="grid grid-cols-4 gap-1.5">
                                    <input
                                        v-for="(digit, idx) in pinDigits"
                                        :key="idx"
                                        :id="`pin-${idx}`"
                                        :value="digit"
                                        type="password"
                                        inputmode="numeric"
                                        maxlength="1"
                                        class="h-10 text-center text-sm font-mono font-black rounded-xl border focus:ring-2 focus:ring-cyan-500"
                                        :class="isDarkTheme ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'"
                                        @input="handleDigitInput(idx, $event)"
                                        @keydown="handleKeyDown(idx, $event)"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            :disabled="studentForm.processing || studentForm.pin.length !== 4"
                            class="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <span>{{ currentLang === 'en' ? 'ENTER WORKSHOP STUDIO' : 'ENTRAR AL ESTUDIO MAKER' }}</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </form>
                </div>

                <!-- ========================================================= -->
                <!-- PESTAÑA B: DOCENTE / ADMINISTRADOR                        -->
                <!-- ========================================================= -->
                <div v-else class="space-y-4 animate-fade-in">
                    <form @submit.prevent="submitAdult" class="space-y-3.5 text-xs">
                        <div>
                            <label class="block font-bold text-slate-400 mb-1">
                                {{ currentLang === 'en' ? 'Email address' : 'Correo electrónico' }}
                            </label>
                            <input
                                v-model="adultForm.email"
                                type="email"
                                placeholder="tu@correo.com"
                                class="w-full rounded-2xl border p-2.5"
                                :class="isDarkTheme ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'"
                                required
                            />
                        </div>

                        <div>
                            <label class="block font-bold text-slate-400 mb-1">
                                {{ currentLang === 'en' ? 'Password' : 'Contraseña' }}
                            </label>
                            <input
                                v-model="adultForm.password"
                                type="password"
                                placeholder="••••••••"
                                class="w-full rounded-2xl border p-2.5"
                                :class="isDarkTheme ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            :disabled="adultForm.processing"
                            class="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
                        >
                            <span>{{ currentLang === 'en' ? 'SIGN IN AS INSTRUCTOR' : 'INGRESAR COMO DOCENTE' }}</span>
                            <ArrowRight class="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </main>

        <!-- FOOTER -->
        <footer class="p-4 text-center text-xs text-slate-400 font-mono">
            Makerdu v4.0 · FabLab Youth & Maker Studio · Open Community
        </footer>
    </div>
</template>
