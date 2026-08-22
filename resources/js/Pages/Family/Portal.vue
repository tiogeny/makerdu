<script setup>
import { Head } from '@inertiajs/vue3';
import {
    Sparkles, Heart, Trophy, Coins, CheckCircle2, ShieldCheck,
    Layers, BookOpen, Clock, Users, ArrowRight
} from 'lucide-vue-next';

defineProps({
    squad: Object,
    project: Object,
    bitacoras: Array,
});
</script>

<template>
    <Head :title="`Seguimiento Familiar - ${squad.name}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- HEADER FAMILIAR -->
        <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-5 text-center">
            <div class="max-w-4xl mx-auto flex flex-col items-center">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 mb-3">
                    <Heart class="w-6 h-6" />
                </div>
                <h1 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    PORTAL FAMILIAR MAKERDU
                </h1>
                <p class="text-xs text-emerald-400 font-semibold mt-1">
                    Seguimiento pedagógico y avances de fabricación digital en vivo
                </p>
            </div>
        </header>

        <!-- MAIN CONTAINER -->
        <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
            
            <!-- TARJETA DE LA ESCUADRA -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Escuadra Maker</span>
                        <h2 class="text-2xl font-black text-white">{{ squad.name }}</h2>
                        <p class="text-xs text-slate-400 mt-0.5">{{ squad.classroom.name }}</p>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="px-3.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-center">
                            <p class="text-[10px] uppercase font-bold text-purple-400">XP Logrado</p>
                            <p class="text-sm font-mono font-black text-purple-300">{{ squad.members.reduce((a, m) => a + (m.xp_points || 0), 0) }} XP</p>
                        </div>
                        <div class="px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center">
                            <p class="text-[10px] uppercase font-bold text-amber-400">FabCoins</p>
                            <p class="text-sm font-mono font-black text-amber-300">{{ squad.fabcoins_balance }} FC</p>
                        </div>
                    </div>
                </div>

                <!-- Integrantes -->
                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Integrantes del Equipo:</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div
                            v-for="m in squad.members"
                            :key="m.id"
                            class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center"
                        >
                            <p class="font-bold text-xs text-white">{{ m.name }}</p>
                            <p class="text-[10px] text-cyan-400 font-medium">{{ m.pivot.current_role }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PROYECTO & EVIDENCIAS FOTOGRÁFICAS / BITÁCORAS -->
            <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div class="flex items-center gap-2">
                    <Layers class="w-5 h-5 text-amber-400" />
                    <h3 class="text-lg font-black text-white">Avances y Evidencias de Aprendizaje</h3>
                </div>

                <div v-if="bitacoras.length" class="space-y-3">
                    <div
                        v-for="b in bitacoras"
                        :key="b.id"
                        class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                    >
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-cyan-300">{{ b.active_role_user?.name || 'Alumno' }}</span>
                            <span class="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 class="w-3.5 h-3.5" /> Evidencia Aprobada
                            </span>
                        </div>
                        <p class="text-slate-300 leading-relaxed">{{ b.content_text }}</p>
                        <div v-if="b.ai_feedback" class="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-900/60 text-[11px] text-cyan-300">
                            🤖 <strong>Comentario Pedagógico IA:</strong> {{ b.ai_feedback }}
                        </div>
                    </div>
                </div>

                <div v-else class="text-center py-6 text-xs text-slate-500">
                    Las evidencias se irán publicando conforme los alumnos avancen en el taller.
                </div>
            </div>

        </main>
    </div>
</template>
