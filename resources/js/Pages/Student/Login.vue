<script setup>
import { Head, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import { Sparkles, KeyRound, School, ArrowRight, ShieldCheck, UserCheck } from 'lucide-vue-next';

const props = defineProps({
    defaultClassCode: {
        type: String,
        default: 'MK402',
    },
    demoPin: {
        type: String,
        default: '1234',
    },
});

const form = useForm({
    access_code: props.defaultClassCode || '',
    pin: '',
});

const pinDigits = ref(['', '', '', '']);

const updatePinFromDigits = () => {
    form.pin = pinDigits.value.join('');
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

const useDemoCredentials = (code, pin) => {
    form.access_code = code;
    pinDigits.value = pin.split('');
    updatePinFromDigits();
};

const submit = () => {
    updatePinFromDigits();
    form.post(route('student.login.post'));
};
</script>

<template>
    <Head title="Ingreso Alumnos - Makerdu" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-black relative overflow-hidden">
        <!-- Ambient Glows -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-cyan-950/40 relative z-10">
            <!-- Header Brand -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-amber-500 text-slate-950 shadow-lg shadow-cyan-500/25 mb-4">
                    <Sparkles class="w-8 h-8" />
                </div>
                <h1 class="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    MAKER<span class="text-amber-400">DU</span>
                    <span class="text-xs uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">v2.6</span>
                </h1>
                <p class="text-slate-400 text-sm mt-1">Portal de Alumnos y Escuadras Maker</p>
            </div>

            <!-- Error Alerts -->
            <div v-if="form.errors.access_code || form.errors.pin || form.errors.general" class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                <p v-if="form.errors.access_code">{{ form.errors.access_code }}</p>
                <p v-if="form.errors.pin">{{ form.errors.pin }}</p>
                <p v-if="form.errors.general">{{ form.errors.general }}</p>
            </div>

            <form @submit.prevent="submit" class="space-y-6">
                <!-- Código de Aula -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                        <School class="w-4 h-4 text-cyan-400" />
                        Código de Clase o Taller
                    </label>
                    <input
                        v-model="form.access_code"
                        type="text"
                        placeholder="Ej. MK-402"
                        class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-cyan-300 uppercase placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
                        maxlength="6"
                        required
                    />
                </div>

                <!-- PIN de 4 dígitos -->
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                        <span class="flex items-center gap-1.5">
                            <KeyRound class="w-4 h-4 text-amber-400" />
                            Tu PIN Secreto de 4 Dígitos
                        </span>
                        <button type="button" @click="clearPin" class="text-[11px] text-slate-500 hover:text-slate-300 transition">
                            Borrar
                        </button>
                    </label>
                    
                    <div class="grid grid-cols-4 gap-3">
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
                            class="w-full h-14 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                        />
                    </div>
                </div>

                <!-- Teclado Numérico Virtual para Tablets/Pizarras -->
                <div class="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div class="grid grid-cols-3 gap-2">
                        <button
                            v-for="n in [1,2,3,4,5,6,7,8,9]"
                            :key="n"
                            type="button"
                            @click="addVirtualKey(n)"
                            class="py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 font-bold text-slate-200 text-base active:scale-95 transition"
                        >
                            {{ n }}
                        </button>
                        <button
                            type="button"
                            @click="clearPin"
                            class="py-2.5 rounded-lg bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 font-semibold text-xs active:scale-95 transition"
                        >
                            C
                        </button>
                        <button
                            type="button"
                            @click="addVirtualKey(0)"
                            class="py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 font-bold text-slate-200 text-base active:scale-95 transition"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            @click="pinDigits[3] ? submit() : null"
                            class="py-2.5 rounded-lg bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/60 font-semibold text-xs active:scale-95 transition"
                        >
                            OK
                        </button>
                    </div>
                </div>

                <!-- Botón de Entrar -->
                <button
                    type="submit"
                    :disabled="form.processing || form.pin.length < 4"
                    class="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"
                >
                    <span v-if="form.processing">Entrando al Taller...</span>
                    <span v-else class="flex items-center gap-2">
                        INGRESAR A LA ESCUADRA
                        <ArrowRight class="w-5 h-5" />
                    </span>
                </button>
            </form>

            <!-- Acceso Rápido Demo -->
            <div class="mt-8 pt-6 border-t border-slate-800/80">
                <p class="text-xs text-slate-500 mb-3 font-semibold text-center uppercase tracking-wider">
                    ⚡ Alumnos de prueba en clase MK-402:
                </p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <button
                        type="button"
                        @click="useDemoCredentials('MK402', '1234')"
                        class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between"
                    >
                        <div>
                            <p class="font-bold text-cyan-300">Mateo (Architect)</p>
                            <p class="text-[10px] text-slate-400">PIN: 1234</p>
                        </div>
                        <UserCheck class="w-4 h-4 text-cyan-400" />
                    </button>

                    <button
                        type="button"
                        @click="useDemoCredentials('MK402', '5678')"
                        class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between"
                    >
                        <div>
                            <p class="font-bold text-amber-300">Sofía (Quality)</p>
                            <p class="text-[10px] text-slate-400">PIN: 5678</p>
                        </div>
                        <UserCheck class="w-4 h-4 text-amber-400" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>