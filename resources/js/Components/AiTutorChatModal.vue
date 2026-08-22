<script setup>
import { ref, nextTick, computed } from 'vue';
import {
    Sparkles, MessageSquare, Send, X, Bot, User,
    HelpCircle, Wrench, Flame, RefreshCw, ChevronDown, Zap
} from 'lucide-vue-next';
import axios from 'axios';

const props = defineProps({
    squad: Object,
    activeStudent: Object,
    selectedLevelId: [Number, String],
    activeModelInfo: Object,
});

const isOpen = ref(false);
const inputMessage = ref('');
const isTyping = ref(false);
const messagesContainer = ref(null);
const totalTokensSession = ref(0);

const firstName = computed(() => {
    return props.activeStudent?.name?.split(' ')[0] || 'Maker';
});

const messages = ref([
    {
        id: 1,
        sender: 'model',
        text: `¡Hola ${firstName.value}! Soy tu Tutor IA de Fabricación. Pregúntame dudas rápidas sobre tu diseño 3D, impresión, tolerancias o FabCoins.`,
        time: 'Ahora',
    }
]);

const quickPrompts = [
    '¿Debería imprimir en 1 o varios colores?',
    'Mi pieza se despega de la cama',
    '¿Cómo hago un orificio en TinkerCAD?',
    '¿Cómo ahorro FabCoins en este nivel?'
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

const formatMarkdown = (text) => {
    if (!text) return '';
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="text-cyan-200">$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-700">$1</code>');
    html = html.replace(/^[•\-] (.*)$/gm, '<li class="ml-3 list-disc text-slate-200 my-0.5">$1</li>');
    html = html.replace(/\n/g, '<br/>');

    return html;
};

const sendMessage = async () => {
    const text = inputMessage.value.trim();
    if (!text || isTyping.value) return;

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
            model_info: props.activeModelInfo || null,
        });

        if (response.data?.reply) {
            messages.value.push({
                id: Date.now() + 1,
                sender: 'model',
                text: response.data.reply,
                time: 'Ahora',
            });

            if (response.data?.tokens_used) {
                totalTokensSession.value += response.data.tokens_used;
            }
        }
    } catch (err) {
        messages.value.push({
            id: Date.now() + 1,
            sender: 'model',
            text: 'Disculpa, tuve un pequeño inconveniente de conexión. Por favor reintenta tu pregunta.',
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
            class="w-[360px] sm:w-[440px] h-[540px] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-fade-in"
        >
            <!-- HEADER -->
            <div class="p-3.5 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                        <Bot class="w-4 h-4" />
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5">
                            <h3 class="font-black text-xs text-white">TUTOR IA DE FABRICACIÓN</h3>
                            <span class="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Lite</span>
                        </div>
                        <p class="text-[10px] text-slate-400">
                            {{ activeModelInfo?.file_name ? `Conectado a: ${activeModelInfo.file_name}` : 'Mentor de la Escuadra' }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <span v-if="totalTokensSession > 0" class="text-[9px] font-mono text-amber-300/80 flex items-center gap-0.5 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800" title="Tokens consumidos en esta sesión">
                        <Zap class="w-3 h-3 text-amber-400" />
                        <span>~{{ totalTokensSession }} tk</span>
                    </span>

                    <button
                        type="button"
                        @click="isOpen = false"
                        class="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- CHAT BODY / MENSAJES -->
            <div ref="messagesContainer" class="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
                <!-- CHIPS DE CONSULTAS RÁPIDAS -->
                <div class="space-y-1 pb-1">
                    <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">⚡ Consultas rápidas:</p>
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
                        'flex gap-2 items-start',
                        m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    ]"
                >
                    <div :class="[
                        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-sm',
                        m.sender === 'user' ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                    ]">
                        <User v-if="m.sender === 'user'" class="w-3 h-3" />
                        <Bot v-else class="w-3 h-3" />
                    </div>

                    <div :class="[
                        'p-3 rounded-2xl max-w-[88%] space-y-1 text-xs leading-relaxed',
                        m.sender === 'user'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tr-none'
                            : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                    ]">
                        <div v-if="m.sender === 'model'" v-html="formatMarkdown(m.text)" class="space-y-1"></div>
                        <p v-else class="whitespace-pre-line">{{ m.text }}</p>
                    </div>
                </div>

                <!-- INDICADOR TYPING -->
                <div v-if="isTyping" class="flex items-center gap-2 text-cyan-400 text-xs font-medium p-2 bg-slate-950/60 rounded-xl w-fit">
                    <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                    <span class="text-[10px]">Tutor IA respondiendo...</span>
                </div>
            </div>

            <!-- INPUT FOOTER -->
            <form @submit.prevent="sendMessage" class="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                    v-model="inputMessage"
                    type="text"
                    placeholder="Pregunta sobre TinkerCAD, PLA o tu diseño..."
                    class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />

                <button
                    type="submit"
                    :disabled="!inputMessage.trim() || isTyping"
                    class="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition shadow-md shadow-cyan-500/20"
                >
                    <Send class="w-4 h-4" />
                </button>
            </form>
        </div>
    </div>
</template>
