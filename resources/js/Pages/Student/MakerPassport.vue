<script setup>
import { Head, Link } from '@inertiajs/vue3';
import {
    Sparkles, Trophy, Coins, ShieldCheck, Award, Printer, CheckCircle2,
    Box, ArrowLeft, Heart, Calendar, Users, ExternalLink
} from 'lucide-vue-next';
import StlViewer3D from '@/Components/StlViewer3D.vue';

const props = defineProps({
    squad: Object,
    classroom: Object,
    project: Object,
    bitacoras: Array,
    competencies: Object,
    qrUrl: String,
});

const printCertificate = () => {
    window.print();
};
</script>

<template>
    <Head :title="`Pasaporte Maker - ${squad.name}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-black print:bg-white print:text-black">
        <!-- TOPBAR DE ACCIÓN (No imprimible) -->
        <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 backdrop-blur-md print:hidden">
            <div class="max-w-5xl mx-auto flex items-center justify-between">
                <Link
                    :href="route('student.hud')"
                    class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                >
                    <ArrowLeft class="w-4 h-4" />
                    <span>Volver a la Cabina</span>
                </Link>

                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        @click="printCertificate"
                        class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                        <Printer class="w-4 h-4" />
                        <span>IMPRIMIR CERTIFICADO & PORTAFOLIO</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- CONTENIDO PRINCIPAL: PASAPORTE MAKER -->
        <main class="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 print:p-0 print:space-y-4">
            
            <!-- TARJETA CERTIFICADO MAKER (ESTILO DIPLOMA TECNOLÓGICO) -->
            <div class="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-amber-500/50 p-8 sm:p-12 shadow-2xl relative overflow-hidden print:border-2 print:border-black print:bg-white print:p-6">
                <!-- Watermark -->
                <div class="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div class="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 print:border-black pb-8">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 print:border print:border-black">
                            <Award class="w-9 h-9" />
                        </div>
                        <div>
                            <span class="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 print:text-black">
                                PASAPORTE DE FABRICACIÓN DIGITAL VERIFICADO
                            </span>
                            <h1 class="text-3xl font-black text-white print:text-black mt-0.5">
                                {{ squad.name }}
                            </h1>
                            <p class="text-xs text-slate-400 print:text-black mt-1">
                                {{ classroom.name }} • Código: <span class="font-mono font-bold text-cyan-300 print:text-black">{{ classroom.access_code }}</span>
                            </p>
                        </div>
                    </div>

                    <!-- Insignia de Logros y QR -->
                    <div class="text-center sm:text-right flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-xs font-bold text-slate-400 print:text-black">Puntaje Total</p>
                            <p class="text-2xl font-black font-mono text-purple-400 print:text-black">
                                {{ squad.members.reduce((a, m) => a + (m.xp_points || 0), 0) }} XP
                            </p>
                        </div>
                        <div class="w-20 h-20 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-700">
                            <!-- QR Code SVG Simulado -->
                            <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl || `https://makerdu.com/family/${classroom.access_code}/squad/${squad.id}`)}`" alt="QR Verificado" class="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>

                <!-- INTEGRANTES DEL EQUIPO -->
                <div class="py-6 border-b border-slate-800 print:border-black">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black mb-3">Integrantes del Equipo Maker:</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div
                            v-for="m in squad.members"
                            :key="m.id"
                            class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 print:border-black print:bg-slate-50 text-center"
                        >
                            <p class="font-black text-xs text-white print:text-black">{{ m.name }}</p>
                            <p class="text-[10px] text-cyan-400 print:text-black font-semibold mt-0.5">{{ m.pivot.current_role }}</p>
                            <p class="text-[10px] font-mono text-purple-400 print:text-black font-bold mt-1">{{ m.xp_points }} XP</p>
                        </div>
                    </div>
                </div>

                <!-- COMPETENCIAS CNEB MASTERED -->
                <div class="py-6 space-y-3">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-black flex items-center gap-1.5">
                        <ShieldCheck class="w-4 h-4" />
                        <span>Competencias Curriculares CNEB Demostradas:</span>
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div
                            v-for="(comp, idx) in competencies"
                            :key="idx"
                            class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-black text-xs space-y-1"
                        >
                            <p class="font-bold text-cyan-300 print:text-black">{{ comp.cneb_competency }}</p>
                            <p class="text-[11px] text-slate-300 print:text-black leading-snug">{{ comp.name }}</p>
                            <p class="text-[10px] text-slate-500 print:text-black">{{ comp.indicator }}</p>
                        </div>
                    </div>
                </div>

                <!-- FIRMA DOCENTE -->
                <div class="pt-8 flex items-center justify-between text-xs text-slate-400 print:text-black border-t border-slate-800 print:border-black">
                    <div>
                        <p class="font-bold text-white print:text-black">Prof. {{ classroom.teacher_name || 'Docente Responsable' }}</p>
                        <p class="text-[10px]">Docente de Innovación y Fabricación Digital</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-amber-400 print:text-black">Makerdu LMS Figital v2.6</p>
                        <p class="text-[10px]">Certificación Escolar de Fabricación 3D</p>
                    </div>
                </div>
            </div>

            <!-- GALERÍA DE PROYECTOS Y EVIDENCIAS DE LA BITÁCORA -->
            <div class="space-y-4 print:page-break-before">
                <div class="flex items-center gap-2">
                    <Box class="w-5 h-5 text-cyan-400" />
                    <h2 class="text-lg font-black text-white">Portafolio de Piezas Fabricadas</h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        v-for="b in bitacoras"
                        :key="b.id"
                        class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3"
                    >
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-cyan-300">Nivel {{ b.level?.level_number }}: {{ b.level?.title_json?.es || 'Reto' }}</span>
                            <span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-600/40">
                                Aprobado
                            </span>
                        </div>

                        <p class="text-xs text-slate-300 leading-relaxed">{{ b.content_text }}</p>

                        <div v-if="b.file_url" class="rounded-2xl overflow-hidden border border-slate-800 max-h-48">
                            <img :src="b.file_url" class="w-full h-full object-cover" />
                        </div>

                        <div v-if="b.ai_feedback" class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-cyan-300">
                            🤖 <strong>Diagnóstico IA:</strong> {{ b.ai_feedback }}
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>
</template>
