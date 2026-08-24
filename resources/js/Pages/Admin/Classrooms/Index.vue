<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, School, Users, Plus, CreditCard, ExternalLink,
    CheckCircle2, ArrowLeft, Key, UserCheck, Shield
} from 'lucide-vue-next';
import AdminNavBar from '@/Components/AdminNavBar.vue';

const props = defineProps({
    classrooms: Array,
    projects: Array,
});

const showNewClassModal = ref(false);
const showEnrollModal = ref(false);
const selectedClassroom = ref(null);

const classroomForm = useForm({
    name: '',
    access_code: '',
    project_id: props.projects?.[0]?.id || null,
    mode: 'school_squads',
    tinkercad_link: '',
});

const enrollForm = useForm({
    students_text: '',
    squad_prefix: 'Escuadra Titanes',
});

const submitNewClassroom = () => {
    classroomForm.post(route('admin.classrooms.store'), {
        preserveScroll: true,
        onSuccess: () => {
            classroomForm.reset();
            showNewClassModal.value = false;
        },
    });
};

const openEnrollModal = (c) => {
    selectedClassroom.value = c;
    showEnrollModal.value = true;
};

const submitEnrollStudents = () => {
    if (!selectedClassroom.value) return;
    enrollForm.post(route('admin.classrooms.enroll', { classroom: selectedClassroom.value.id }), {
        preserveScroll: true,
        onSuccess: () => {
            enrollForm.reset();
            showEnrollModal.value = false;
        },
    });
};
</script>

<template>
    <Head title="Gestor de Aulas y Escuadras - Makerdu" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR UNIFICADA SUPER ADMIN -->
        <AdminNavBar active-section="classrooms" />

        <!-- SUB-HEADER DE ACCIÓN -->
        <div class="bg-slate-900/60 border-b border-slate-800/80 px-6 py-4">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 class="text-lg font-black text-white flex items-center gap-2">
                        <School class="w-5 h-5 text-purple-400" />
                        <span>GESTOR DE AULAS Y ESCUADRAS</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                            Auto-Grouping & PINs
                        </span>
                    </h1>
                    <p class="text-xs text-slate-400">Crea aulas, matricula alumnos en bloque y genera PINs automáticos para los colegios.</p>
                </div>

                <button
                    type="button"
                    @click="showNewClassModal = true"
                    class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-purple-500/20 shrink-0"
                >
                    <Plus class="w-4 h-4" />
                    <span>NUEVA AULA / TALLER</span>
                </button>
            </div>
        </div>

        <!-- MAIN -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
            
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <!-- GRID DE AULAS -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    v-for="c in classrooms"
                    :key="c.id"
                    class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-xl space-y-4"
                >
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {{ c.access_code }}
                            </span>
                            <span class="text-xs font-bold text-amber-400">
                                {{ c.squads_count }} Escuadras • {{ c.students_count }} Alumnos
                            </span>
                        </div>

                        <h3 class="font-black text-lg text-white leading-snug">{{ c.name }}</h3>
                        <p class="text-xs text-slate-400">Docente: {{ c.teacher_name }}</p>
                    </div>

                    <!-- Escuadras Preview -->
                    <div class="space-y-2 pt-2 border-t border-slate-800">
                        <div
                            v-for="sq in c.squads.slice(0, 3)"
                            :key="sq.id"
                            class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                            <span class="font-bold text-slate-200">{{ sq.name }}</span>
                            <span class="text-[11px] font-mono text-purple-400 font-bold">{{ sq.members.length }} miembros</span>
                        </div>
                        <p v-if="c.squads.length > 3" class="text-[10px] text-slate-500 text-center">+ {{ c.squads.length - 3 }} escuadras más</p>
                    </div>

                    <!-- Acciones -->
                    <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            @click="openEnrollModal(c)"
                            class="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-black transition flex items-center gap-1.5"
                        >
                            <Users class="w-3.5 h-3.5" />
                            <span>+ Matricular Alumnos</span>
                        </button>

                        <a
                            :href="route('teacher.pin-cards', { classroom: c.id })"
                            class="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-black transition flex items-center gap-1.5"
                        >
                            <CreditCard class="w-3.5 h-3.5" />
                            <span>Tarjetas PDF</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- MODAL: CREAR NUEVA AULA -->
            <div v-if="showNewClassModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                    <h3 class="text-base font-black text-white flex items-center gap-2">
                        <School class="w-5 h-5 text-cyan-400" />
                        <span>Nueva Aula / Taller Maker</span>
                    </h3>

                    <form @submit.prevent="submitNewClassroom" class="space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Nombre del Aula / Grado *</label>
                            <input
                                v-model="classroomForm.name"
                                type="text"
                                placeholder="Ej: Laboratorio FabLab - 5to Grado B"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                required
                            />
                        </div>

                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Código de Clase Único *</label>
                            <input
                                v-model="classroomForm.access_code"
                                type="text"
                                placeholder="Ej: MK-502"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                required
                            />
                        </div>

                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Enlace al Aula de TinkerCAD (Opcional)</label>
                            <input
                                v-model="classroomForm.tinkercad_link"
                                type="url"
                                placeholder="https://www.tinkercad.com/joinclass/..."
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                        </div>

                        <div class="pt-3 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                @click="showNewClassModal = false"
                                class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                :disabled="classroomForm.processing"
                                class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black"
                            >
                                Crear Aula
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL: MATRICULAR ALUMNOS EN BLOQUE -->
            <div v-if="showEnrollModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                    <div>
                        <h3 class="text-base font-black text-white flex items-center gap-2">
                            <Users class="w-5 h-5 text-amber-400" />
                            <span>Matricular Alumnos en {{ selectedClassroom?.name }}</span>
                        </h3>
                        <p class="text-xs text-slate-400 mt-1">
                            Pega la lista de alumnos (un nombre por línea). El sistema generará automáticamente sus **PINs de 4 dígitos** y los agrupará en escuadras de 4.
                        </p>
                    </div>

                    <form @submit.prevent="submitEnrollStudents" class="space-y-3 text-xs">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Prefijo de Nombre de Escuadra</label>
                            <input
                                v-model="enrollForm.squad_prefix"
                                type="text"
                                placeholder="Ej: Escuadra Titanes"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Nombres de Estudiantes (1 por línea) *</label>
                            <textarea
                                v-model="enrollForm.students_text"
                                rows="6"
                                placeholder="Mateo Alarcón&#10;Sofía Chang&#10;Lucas Ramos&#10;Camila Díaz&#10;Diego Flores&#10;Valentina Morales"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 font-sans"
                                required
                            ></textarea>
                        </div>

                        <div class="pt-2 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                @click="showEnrollModal = false"
                                class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                :disabled="enrollForm.processing || !enrollForm.students_text"
                                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black"
                            >
                                Generar Escuadras y PINs
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </main>
    </div>
</template>
