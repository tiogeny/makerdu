<script setup>
import { ref, nextTick } from 'vue';
import {
    Sparkles, MessageSquare, Send, X, Bot, User,
    HelpCircle, Wrench, Flame, RefreshCw, ChevronDown
} from 'lucide-vue-next';
import axios from 'axios';

const props = defineProps({
    squad: Object,
    activeStudent: Object,
    selectedLevelId: [Number, String],
});

const isOpen = ref(false);
const inputMessage = ref('');
const isTyping = ref(false);
const messagesContainer = ref(null);

const messages = ref([
    {
        id: 1,
        sender: 'model',
        text: `¡Hola ${props.activeStudent?.name || 'Maker'}! Soy tu Tutor IA de Fabricación Digital. Estoy aquí para ayudarte con técnicas de modelado 3D, solución de errores de impresión y optimización de FabCoins. ¿En qué puedo guiarte hoy?`,
        time: 'Ahora',
    }
]);

const quickPrompts = [
    '¿Cómo hago un orificio en TinkerCAD?',
    'Mi pieza se despega de la cama',
    '¿Cómo ahorro FabCoins en este nivel?',
    '¿Qué temperatura necesita el filamento PLA?'
];

const toggleChat = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        scrollToBottom();
    }
};

const sendQuickPrompt = (promptText) => {
    inputMessage.value = promptText;
    sendMessage();
};

const sendMessage = async () => {
    const text = inputMessage.value.trim();
    if (!text || isTyping.value) return;

    // Agregar mensaje del usuario
    messages.value.push({
        id: Date.now(),
        sender: 'user',
        text: text,
        time: 'Ahora',
    });

    inputMessage.value = '';
    isTyping.value = true;
    scrollToBottom();

    try {
        const historyPayload = messages.value.slice(-6).map(m => ({
            sender: m.sender,
            text: m.text,
        }));

        const response = await axios.post(route('squad.ai-chat', { squad: props.squad.id }), {
            message: text,
            level_id: props.selectedLevelId,
            history: historyPayload,
        });

        if (response.data?.reply) {
            messages.value.push({
                id: Date.now() + 1,
                sender: 'model',
                text: response.data.reply,
                time: 'Ahora',
            });
        }
    } catch (err) {
        messages.value.push({
            id: Date.now() + 1,
            sender: 'model',
            text: 'Disculpa, tuve un pequeño inconveniente de conexión. Por favor verifica tu consulta o reintenta en un momento.',
            time: 'Ahora',
        });
    } finally {
        isTyping.value = false;
        scrollToBottom();
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
};
</script>

<template>
    <div class="fixed bottom-6 right-6 z-50">
        <!-- BOTÓN FLOTANTE LAUNCHER -->
        <button
            v-if="!isOpen"
            type="button"
            @click="toggleChat"
            class="group px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-2xl shadow-cyan-500/40 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95"
        >
            <div class="relative">
                <Bot class="w-5 h-5" />
                <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping"></span>
                <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950"></span>
            </div>
            <span class="tracking-wide">TUTOR IA MAKER</span>
        </button>

        <!-- VENTANA DE CHAT EXPANDIBLE -->
        <div
            v-else
            class="w-[360px] sm:w-[420px] h-[540px] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-fade-in"
        >
            <!-- HEADER -->
            <div class="p-4 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                        <Bot class="w-5 h-5" />
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5">
                            <h3 class="font-black text-xs text-white">TUTOR IA DE FABRICACIÓN</h3>
                            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Gemini 2.0</span>
                        </div>
                        <p class="text-[10px] text-slate-400">Copiloto pedagógico de la Escuadra</p>
                    </div>
                </div>

                <button
                    type="button"
                    @click="isOpen = false"
                    class="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>

            <!-- CHAT BODY / MENSAJES -->
            <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                <!-- CHIPS DE CONSULTAS RÁPIDAS -->
                <div class="space-y-1.5 pb-2">
                    <p class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">⚡ Preguntas frecuentes:</p>
                    <div class="flex flex-wrap gap-1.5">
                        <button
                            v-for="(qp, idx) in quickPrompts"
                            :key="idx"
                            type="button"
                            @click="sendQuickPrompt(qp)"
                            class="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-cyan-300 transition text-left"
                        >
                            {{ qp }}
                        </button>
                    </div>
                </div>

                <!-- LISTA DE MENSAJES -->
                <div
                    v-for="m in messages"
                    :key="m.id"
                    :class="[
                        'flex gap-2.5 items-start',
                        m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    ]"
                >
                    <div :class="[
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-sm',
                        m.sender === 'user' ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                    ]">
                        <User v-if="m.sender === 'user'" class="w-3.5 h-3.5" />
                        <Bot v-else class="w-3.5 h-3.5" />
                    </div>

                    <div :class="[
                        'p-3 rounded-2xl max-w-[82%] space-y-1 text-xs leading-relaxed',
                        m.sender === 'user'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tr-none'
                            : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    ]">
                        <p class="whitespace-pre-line">{{ m.text }}</p>
                    </div>
                </div>

                <!-- INDICADOR TYPING -->
                <div v-if="isTyping" class="flex items-center gap-2 text-cyan-400 text-xs font-medium p-2 bg-slate-950/60 rounded-xl w-fit">
                    <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                    <span class="text-[11px]">Gemini IA está redactando respuesta...</span>
                </div>
            </div>

            <!-- INPUT FOOTER -->
            <form @submit.prevent="sendMessage" class="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                    v-model="inputMessage"
                    type="text"
                    placeholder="Escribe tu consulta sobre diseño o 3D..."
                    class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />

                <button
                    type="submit"
                    :disabled="!inputMessage.trim() || isTyping"
                    class="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition shadow-md shadow-cyan-500/20"
                >
                    <Send class="w-4 h-4" />
                </button>
            </form>
        </div>
    </div>
</template>
