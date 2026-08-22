<script setup>
import { ref, computed } from 'vue';
import { Play, Pause, Maximize2, ExternalLink, Film, Sparkles } from 'lucide-vue-next';

const props = defineProps({
    source: {
        type: [String, Object],
        default: '',
    },
    title: {
        type: String,
        default: 'Tutorial del Nivel',
    },
    type: {
        type: String,
        default: 'bunny_stream', // 'bunny_stream', 'local_mp4', 'animation_gif', 'external_link'
    },
    thumbnail: {
        type: String,
        default: '',
    },
});

const isPlaying = ref(false);
const videoRef = ref(null);

const isBunnyStream = computed(() => {
    return props.type === 'bunny_stream' || (typeof props.source === 'string' && props.source.includes('mediadelivery.net'));
});

const isDirectVideo = computed(() => {
    return props.type === 'local_mp4' || (typeof props.source === 'string' && (props.source.endsWith('.mp4') || props.source.endsWith('.webm')));
});

const isGifAnimation = computed(() => {
    return props.type === 'animation_gif' || (typeof props.source === 'string' && props.source.endsWith('.gif'));
});

const togglePlay = () => {
    if (!videoRef.value) return;
    if (videoRef.value.paused) {
        videoRef.value.play();
        isPlaying.value = true;
    } else {
        videoRef.value.pause();
        isPlaying.value = false;
    }
};
</script>

<template>
    <div class="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden shadow-xl">
        <!-- HEADER DEL REPRODUCTOR -->
        <div class="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Film class="w-4 h-4 text-cyan-400" />
                <span class="text-xs font-bold text-white tracking-wide">{{ title }}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {{ isBunnyStream ? 'Bunny Stream' : isGifAnimation ? 'Animación' : 'Video HD' }}
            </span>
        </div>

        <!-- CUERPO DEL VIDEO -->
        <div class="relative aspect-video w-full bg-black flex items-center justify-center">
            <!-- 1. BUNNY.NET STREAM EMBED (Sin anuncios ni distracciones de YouTube) -->
            <iframe
                v-if="isBunnyStream && source"
                :src="source"
                loading="lazy"
                class="w-full h-full border-0"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowfullscreen
            ></iframe>

            <!-- 2. VIDEO DIRECTO LOCAL (MP4 / WEBM de BanaHosting o Bunny Storage) -->
            <div v-else-if="isDirectVideo && source" class="w-full h-full relative group">
                <video
                    ref="videoRef"
                    :src="source"
                    :poster="thumbnail"
                    controls
                    class="w-full h-full object-cover"
                ></video>
            </div>

            <!-- 3. ANIMACIÓN DE PASOS / GIF EN BUCLE -->
            <div v-else-if="isGifAnimation && source" class="w-full h-full flex flex-col items-center justify-center p-4">
                <img :src="source" :alt="title" class="max-h-full max-w-full rounded-xl object-contain shadow-md" />
            </div>

            <!-- 4. PLACEHOLDER / TUTORIAL DEMO INTERNO -->
            <div v-else class="p-8 text-center space-y-3">
                <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                    <Sparkles class="w-6 h-6" />
                </div>
                <div>
                    <h4 class="text-sm font-bold text-white">Video Tutorial Integrado (Bunny.net)</h4>
                    <p class="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                        Aquí se reproduce el video de instrucciones alojado en Bunny Stream para este nivel.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
