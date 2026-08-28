<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ArrowLeft, Sparkles, X, ExternalLink, CheckCircle2, Play } from 'lucide-vue-next';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: true,
    },
    app: {
        type: Object,
        default: null,
    },
    appName: String,
    appUrl: String,
    appIcon: {
        type: String,
        default: '⚡',
    },
    currentLevel: {
        type: Number,
        default: 1,
    },
    squadId: {
        type: Number,
        default: 1,
    },
});

const emit = defineEmits(['close', 'assetReady']);
const showSuccessNotification = ref(false);
const lastReceivedAsset = ref(null);

const computedAppName = computed(() => props.app?.name || props.appName || 'Herramienta de Fabricación Digital');
const computedAppIcon = computed(() => props.app?.icon || props.appIcon || '🛠️');
const computedAppUrl = computed(() => {
    if (props.app?.embed_path) {
        return props.app.embed_path.endsWith('/index.html') 
            ? props.app.embed_path 
            : `${props.app.embed_path.replace(/\/$/, '')}/index.html`;
    }
    if (props.appUrl) {
        return props.appUrl;
    }
    if (props.app?.slug) {
        return `/apps/${props.app.slug}/index.html`;
    }
    return '/apps/vectorizer/index.html';
});

const handleMessage = (event) => {
    if (!event.data || event.data.type !== 'MAKERDU_MICROAPP_ASSET') return;

    lastReceivedAsset.value = event.data;
    showSuccessNotification.value = true;

    emit('assetReady', event.data);

    setTimeout(() => {
        showSuccessNotification.value = false;
        emit('close');
    }, 1200);
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<template>
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in select-none"
    >
        <!-- TOPBAR DE CONTROL DEL LMS -->
        <header class="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-10 shrink-0">
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    @click="emit('close')"
                    class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                    <ArrowLeft class="w-4 h-4 text-cyan-400" />
                    <span>Volver al Panel</span>
                </button>

                <div class="flex items-center gap-2 border-l border-slate-800 pl-3">
                    <span class="text-base">{{ computedAppIcon }}</span>
                    <h2 class="text-xs font-black text-white tracking-wide uppercase">{{ computedAppName }}</h2>
                    <span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Makerdu Micro-App Suite
                    </span>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- Alerta Toast de Recepción de Archivo -->
                <div
                    v-if="showSuccessNotification"
                    class="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-bounce"
                >
                    <CheckCircle2 class="w-4 h-4 text-emerald-400" />
                    <span>¡Entregable generado con éxito!</span>
                </div>

                <a
                    :href="computedAppUrl"
                    target="_blank"
                    class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Abrir en pestaña independiente (Standalone)"
                >
                    <ExternalLink class="w-4 h-4" />
                </a>

                <button
                    type="button"
                    @click="emit('close')"
                    class="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                    title="Cerrar"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>
        </header>

        <!-- IFRAME DE LA MICRO-APP -->
        <div class="flex-1 w-full h-full relative bg-slate-950">
            <iframe
                :src="computedAppUrl"
                class="w-full h-full border-0"
                allow="camera; microphone; display-capture; clipboard-write; clipboard-read"
            ></iframe>
        </div>
    </div>
</template>