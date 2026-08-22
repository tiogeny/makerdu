<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import { Sparkles, KeyRound, School, ArrowRight, ShieldCheck, UserCheck, Mail, Lock, Globe, User, Layers } from 'lucide-vue-next';
import { t, currentLang, setLanguage } from '@/i18n.js';

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
        default: 'student', // 'student' o 'adult'
    },
});

// Pestaña activa: 'student' (PIN) o 'adult' (Email/Password)
const activeTab = ref(props.defaultTab || 'student');

// Formulario 1: Alumno (PIN y Código de Aula)
const studentForm = useForm({
    access_code: 'MK402',
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

const addVirtualKey = (num) => {
    const emptyIndex = pinDigits.value.findIndex((d) => d === '');
    if (emptyIndex !== -1) {
        pinDigits.value[emptyIndex] = String(num);
        updatePinFromDigits();
        const nextInput = document.getElementById(`pin-${emptyIndex}`);
        if (nextInput) nextInput.focus();
    }
};

const clearPin = () => {
    pinDigits.value = ['', '', '', ''];
    updatePinFromDigits();
    const firstInput = document.getElementById('pin-0');
    if (firstInput) firstInput.focus();
};

const useDemoStudent = (code, pin) => {
    studentForm.access_code = code;
    pinDigits.value = pin.split('');
    updatePinFromDigits();
};

const submitStudent = () => {
    updatePinFromDigits();
    studentForm.post(route('student.login.post'));
};

// Formulario 2: Adulto / Docente (Email y Contraseña)
const adultForm = useForm({
    email: '',
    password: '',
    remember: true,
});

const useDemoTeacher = () => {
    adultForm.email = 'contacto@fablablima.org';
    adultForm.password = 'password';
};

const submitAdult = () => {
    adultForm.post(route('login'), {
        onFinish: () => adultForm.reset('password'),
    });
};
</script>

<template>
    <Head :title="`${t('auth.portal_title')} - ${t('app.name')}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 selection:bg-amber-500 selection:text-black relative overflow-hidden">
        <!-- Ambient Glows -->
        <div class="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <!-- TOP BAR: BRAND Y SELECTOR DE IDIOMA -->
        <div class="w-full max-w-5xl flex items-center justify-between py-4 relative z-10">
            <Link :href="route('welcome')" class="flex items-center gap-2.5 group">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md group-hover:scale-105 transition">
                    <Sparkles class="w-5 h-5" />
                </div>
                <span class="font-black tracking-tight text-white text-lg">
                    MAKER<span class="text-amber-400">DU</span>
                </span>
            </Link>

            <button
                type="button"
                @click="setLanguage(currentLang === 'es' ? 'en' : 'es')"
                class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold font-mono text-cyan-300 border border-slate-800 transition flex items-center gap-1.5"
                title="Change Language"
            >
                <Globe class="w-3.5 h-3.5" />
                <span>{{ currentLang.toUpperCase() }}</span>
            </button>
        </div>

        <!-- CARD PRINCIPAL DE ACCESO DUAL -->
        <div class="w-full max-w-md bg-slate-900/85 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 relative z-10 space-y-6">
            
            <!-- BRAND HEADER -->
            <div class="text-center space-y-1.5">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-500 text-slate-950 shadow-lg shadow-cyan-500/25 mb-2">
                    <Sparkles class="w-6 h-6" />
                </div>
                <h1 class="text-xl font-black text-white tracking-tight">{{ t('auth.portal_title') }}</h1>
                <p class="text-slate-400 text-xs">{{ t('auth.portal_subtitle') }}</p>
            </div>

            <!-- SELECTOR DUAL DE PESTAÑAS (PIN vs EMAIL) -->
            <div class="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                <button
                    type="button"
                    @click="activeTab = 'student'"
                    :class="[
                        'py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5',
                        activeTab === 'student'
                            ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-white'
                    ]"
                >
                    <KeyRound class="w-3.5 h-3.5" />
                    <span>{{ t('auth.tab_student') }}</span>
                </button>

                <button
                    type="button"
                    @click="activeTab = 'adult'"
                    :class="[
                        'py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5',
                        activeTab === 'adult'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                    ]"
                >
                    <Mail class="w-3.5 h-3.5" />
                    <span>{{ t('auth.tab_adult') }}</span>
                </button>
            </div>

            <!-- ============================================================= -->
            <!-- FORMULARIO A: ESTUDIANTE DE TALLER (PIN & AULA) -->
            <!-- ============================================================= -->
            <div v-if="activeTab === 'student'" class="space-y-5 animate-fade-in">
                <!-- Errores -->
                <div v-if="studentForm.errors.access_code || studentForm.errors.pin || studentForm.errors.general" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <p v-if="studentForm.errors.access_code">{{ studentForm.errors.access_code }}</p>
                    <p v-if="studentForm.errors.pin">{{ studentForm.errors.pin }}</p>
                    <p v-if="studentForm.errors.general">{{ studentForm.errors.general }}</p>
                </div>

                <form @submit.prevent="submitStudent" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <School class="w-4 h-4 text-cyan-400" />
                            {{ t('auth.class_code') }}
                        </label>
                        <input
                            v-model="studentForm.access_code"
                            type="text"
                            :placeholder="t('auth.class_code_placeholder')"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-base font-mono font-bold tracking-widest text-cyan-300 uppercase focus:ring-2 focus:ring-cyan-400 focus:outline-none"
                            maxlength="6"
                            required
                        />
                    </div>

                    <!-- PIN Inputs -->
                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <KeyRound class="w-4 h-4 text-amber-400" />
                                {{ t('auth.secret_pin') }}
                            </label>
                            <button type="button" @click="clearPin" class="text-[11px] text-slate-500 hover:text-slate-300 transition">
                                {{ t('auth.clear_btn') }}
                            </button>
                        </div>

                        <div class="grid grid-cols-4 gap-2.5">
                            <input
                                v-for="(digit, idx) in pinDigits"
                                :key="idx"
                                :id="`pin-${idx}`"
                                :value="digit"
                                type="password"
                                inputmode="numeric"
                                maxlength="1"
                                @input="handleDigitInput(idx, $event)"
                                @keydown="handleKeyDown(idx, $event)"
                                class="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-bold text-amber-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    <!-- Teclado Virtual -->
                    <div class="bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
                        <div class="grid grid-cols-3 gap-1.5">
                            <button
                                v-for="n in [1,2,3,4,5,6,7,8,9]"
                                :key="n"
                                type="button"
                                @click="addVirtualKey(n)"
                                class="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 font-bold text-slate-200 text-sm active:scale-95 transition"
                            >
                                {{ n }}
                            </button>
                            <button
                                type="button"
                                @click="clearPin"
                                class="py-2 rounded-lg bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 font-semibold text-xs active:scale-95 transition"
                            >
                                C
                            </button>
                            <button
                                type="button"
                                @click="addVirtualKey(0)"
                                class="py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 font-bold text-slate-200 text-sm active:scale-95 transition"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                @click="pinDigits[3] ? submitStudent() : null"
                                class="py-2 rounded-lg bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60 font-semibold text-xs active:scale-95 transition"
                            >
                                OK
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        :disabled="studentForm.processing || studentForm.pin.length < 4"
                        class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
                    >
                        <span>{{ studentForm.processing ? t('auth.entering') : t('auth.login_btn_student') }}</span>
                        <ArrowRight class="w-4 h-4" />
                    </button>
                </form>

                <!-- Accesos Demo Alumnos -->
                <div class="pt-4 border-t border-slate-800 text-xs">
                    <p class="text-slate-500 mb-2 font-bold text-center uppercase tracking-wider text-[10px]">
                        {{ t('auth.demo_title') }}
                    </p>
                    <div class="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            @click="useDemoStudent('MK402', '1234')"
                            class="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-left transition flex items-center justify-between"
                        >
                            <div>
                                <p class="font-bold text-cyan-300 text-[11px]">Mateo (Architect)</p>
                                <p class="text-[9px] text-slate-500 font-mono">PIN: 1234</p>
                            </div>
                            <UserCheck class="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        <button
                            type="button"
                            @click="useDemoStudent('MK402', '5678')"
                            class="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition flex items-center justify-between"
                        >
                            <div>
                                <p class="font-bold text-amber-300 text-[11px]">Sofía (Quality)</p>
                                <p class="text-[9px] text-slate-500 font-mono">PIN: 5678</p>
                            </div>
                            <UserCheck class="w-3.5 h-3.5 text-amber-400" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- ============================================================= -->
            <!-- FORMULARIO B: ADULTO / DOCENTE (EMAIL Y CONTRASEÑA) -->
            <!-- ============================================================= -->
            <div v-else-if="activeTab === 'adult'" class="space-y-5 animate-fade-in">
                <!-- Errores -->
                <div v-if="adultForm.errors.email || adultForm.errors.password" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <p v-if="adultForm.errors.email">{{ adultForm.errors.email }}</p>
                    <p v-if="adultForm.errors.password">{{ adultForm.errors.password }}</p>
                </div>

                <form @submit.prevent="submitAdult" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Mail class="w-4 h-4 text-amber-400" />
                            {{ t('auth.email') }}
                        </label>
                        <input
                            v-model="adultForm.email"
                            type="email"
                            :placeholder="t('auth.email_placeholder')"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            required
                            autofocus
                        />
                    </div>

                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Lock class="w-4 h-4 text-amber-400" />
                            {{ t('auth.password') }}
                        </label>
                        <input
                            v-model="adultForm.password"
                            type="password"
                            :placeholder="t('auth.password_placeholder')"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            required
                        />
                    </div>

                    <div class="flex items-center justify-between text-xs pt-1">
                        <label class="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                            <input type="checkbox" v-model="adultForm.remember" class="w-4 h-4 rounded text-amber-500 focus:ring-0" />
                            <span>{{ t('auth.remember_me') }}</span>
                        </label>

                        <Link
                            v-if="canResetPassword"
                            :href="route('password.request')"
                            class="text-cyan-400 hover:underline text-[11px]"
                        >
                            {{ t('auth.forgot_password') }}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        :disabled="adultForm.processing || !adultForm.email || !adultForm.password"
                        class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
                    >
                        <span>{{ adultForm.processing ? t('auth.entering') : t('auth.login_btn_adult') }}</span>
                        <ArrowRight class="w-4 h-4" />
                    </button>
                </form>

                <!-- Acceso Rápido Docente Demo -->
                <div class="pt-4 border-t border-slate-800 text-xs">
                    <button
                        type="button"
                        @click="useDemoTeacher"
                        class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition flex items-center justify-between"
                    >
                        <div>
                            <p class="font-bold text-amber-300 text-[11px]">⚡ Cargar Docente Demo</p>
                            <p class="text-[10px] text-slate-500">contacto@fablablima.org (pass: password)</p>
                        </div>
                        <UserCheck class="w-4 h-4 text-amber-400" />
                    </button>
                </div>
            </div>
        </div>

        <!-- FOOTER -->
        <footer class="text-center text-xs text-slate-600 py-4 relative z-10">
            Makerdu v2.6 • LMS Figital & Digital Fabrication
        </footer>
    </div>
</template>
