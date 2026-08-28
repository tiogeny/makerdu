<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import {
    Sparkles, School, Users, Plus, CreditCard, ExternalLink,
    CheckCircle2, ArrowLeft, Key, UserCheck, Shield, Coins,
    UserPlus, Layers, FileText, ChevronRight, Zap
} from 'lucide-vue-next';
import AdminLayout from '@/Layouts/AdminLayout.vue';

const props = defineProps({
    classrooms: {
        type: Array,
        default: () => [],
    },
    projects: {
        type: Array,
        default: () => [],
    },
    teachers: {
        type: Array,
        default: () => [],
    },
});

const showNewClassModal = ref(false);
const showNewTeacherModal = ref(false);
const showEnrollModal = ref(false);
const selectedClassroom = ref(null);
const filterMode = ref('all');

const teacherForm = useForm({
    name: '',
    email: '',
    password: '',
});

const classroomForm = useForm({
    name: '',
    institution_name: '',
    teacher_id: props.teachers?.[0]?.id || '',
    access_code: '',
    project_id: props.projects?.[0]?.id || null,
    mode: 'private_workshop', // default to private_workshop / extracurricular
    total_fabcoins_pool: 500,
    tinkercad_link: '',
});

const enrollForm = useForm({
    students_text: '',
    squad_prefix: 'Escuadra Maker',
});

const filteredClassrooms = computed(() => {
    if (filterMode.value === 'all') return props.classrooms;
    return props.classrooms.filter(c => c.mode === filterMode.value);
});

const submitNewTeacher = () => {
    teacherForm.post(route('admin.teachers.store'), {
        preserveScroll: true,
        onSuccess: () => {
            teacherForm.reset();
            showNewTeacherModal.value = false;
        },
    });
};

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
    enrollForm.squad_prefix = c.mode === 'private_workshop' ? 'Mesa de Trabajo' : 'Escuadra';
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
    <AdminLayout>
        <Head title="Gestor de Aulas & Talleres · SuperAdmin HQ" />

        <!-- HEADER SECTION -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                        INSTITUCIONES, DOCENTES & AULAS
                    </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Aulas Escolares & Talleres Extracurriculares</span>
                    <span class="text-xs px-2 py-0.5 rounded-xl bg-slate-800 text-slate-400 font-mono font-normal">
                        {{ classrooms.length }} activas
                    </span>
                </h1>
                <p class="text-xs text-slate-400 mt-1">
                    Gestiona los grupos de trabajo, instructores responsables, asignación de técnicas y bolsas de FabCoins (80/20).
                </p>
            </div>

            <!-- BOTONES DE ACCIÓN RÁPIDA -->
            <div class="flex items-center gap-2.5 shrink-0">
                <button
                    type="button"
                    @click="showNewTeacherModal = true"
                    class="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                    <UserPlus class="w-4 h-4" />
                    <span>+ Registrar Docente / Tutor</span>
                </button>

                <button
                    type="button"
                    @click="showNewClassModal = true"
                    class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                    <Plus class="w-4 h-4" />
                    <span>+ CREAR AULA / TALLER</span>
                </button>
            </div>
        </div>

        <!-- FILTROS POR MODALIDAD -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
                v-for="filter in [
                    { id: 'all', label: 'Todas las Aulas y Talleres' },
                    { id: 'private_workshop', label: '🚀 Talleres Extracurriculares / After-School' },
                    { id: 'school_squads', label: '🏫 Colegios / Escuelas Formales' }
                ]"
                :key="filter.id"
                @click="filterMode = filter.id"
                :class="[
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer',
                    filterMode === filter.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                ]"
            >
                {{ filter.label }}
            </button>
        </div>

        <!-- GRID DE AULAS / TALLERES -->
        <div v-if="filteredClassrooms.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="c in filteredClassrooms"
                :key="c.id"
                class="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-xl transition flex flex-col justify-between group relative overflow-hidden"
            >
                <div>
                    <!-- Header -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span 
                            class="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border"
                            :class="c.mode === 'private_workshop' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'"
                        >
                            {{ c.mode === 'private_workshop' ? 'Taller Extracurricular' : 'Colegio Escolar' }}
                        </span>

                        <span class="text-xs font-mono font-black text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                            {{ c.access_code }}
                        </span>
                    </div>

                    <h3 class="text-base font-black text-white group-hover:text-cyan-300 transition mb-0.5">
                        {{ c.name }}
                    </h3>
                    <p class="text-xs text-slate-400 mb-3">
                        {{ c.institution_name }} · Tutor: <strong class="text-slate-200">{{ c.teacher_name }}</strong>
                    </p>

                    <!-- TÉCNICA ASIGNADA -->
                    <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 mb-4 space-y-1">
                        <div class="flex items-center justify-between text-[10px]">
                            <span class="text-slate-500 font-bold uppercase">Técnica Activa:</span>
                            <span class="text-cyan-400 font-bold">Chasis STEAM</span>
                        </div>
                        <p class="text-xs font-bold text-slate-200 truncate">
                            {{ c.project_title }}
                        </p>
                    </div>

                    <!-- BOLSA DE FABCOINS (MODELO 80/20) -->
                    <div class="grid grid-cols-2 gap-2 mb-4 text-center">
                        <div class="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                            <span class="text-[10px] text-amber-400/80 font-bold block">🪙 Bolsa Total</span>
                            <span class="text-xs font-mono font-black text-amber-300">{{ c.total_fabcoins_pool }} FC</span>
                        </div>
                        <div class="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                            <span class="text-[10px] text-purple-400/80 font-bold block">🎯 Reserva (20%)</span>
                            <span class="text-xs font-mono font-black text-purple-300">{{ c.fabcoins_reserve_pool }} FC</span>
                        </div>
                    </div>

                    <!-- ESTADÍSTICAS DE MATRÍCULA -->
                    <div class="flex items-center justify-between text-xs text-slate-400 pt-1 pb-3 border-b border-slate-800">
                        <span>{{ c.squads_count }} Escuadras / Mesas</span>
                        <span>{{ c.students_count }} Alumnos con PIN</span>
                    </div>
                </div>

                <!-- ACCIONES INFERIORES -->
                <div class="pt-4 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        @click="openEnrollModal(c)"
                        class="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                    >
                        <UserPlus class="w-3.5 h-3.5" />
                        <span>Matricular Alumnos</span>
                    </button>

                    <a
                        :href="route('teacher.pin-cards', c.id)"
                        target="_blank"
                        class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                        <CreditCard class="w-3.5 h-3.5 text-cyan-400" />
                        <span>PIN Cards (PDF)</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- ESTADO VACÍO -->
        <div v-else class="text-center py-20 px-4 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl max-w-lg mx-auto">
            <div class="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-3xl mx-auto mb-4 border border-cyan-500/20">
                🏫
            </div>
            <h3 class="text-base font-black text-white mb-1">No hay Aulas o Talleres Registrados</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Crea tu primer taller extracurricular o aula escolar para matricular alumnos y asignar técnicas.
            </p>
            <button
                @click="showNewClassModal = true"
                class="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
                <Plus class="w-4 h-4" />
                <span>CREAR PRIMER TALLER / AULA</span>
            </button>
        </div>

        <!-- MODAL: REGISTRAR NUEVO DOCENTE / TUTOR -->
        <div v-if="showNewTeacherModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 class="text-base font-black text-white">Registrar Nuevo Docente / Instructor</h2>
                    <button @click="showNewTeacherModal = false" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <form @submit.prevent="submitNewTeacher" class="space-y-3.5 text-xs">
                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Nombre Completo *:</label>
                        <input v-model="teacherForm.name" type="text" placeholder="Ej: Prof. Carlos Mendoza" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" required />
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Correo Electrónico *:</label>
                        <input v-model="teacherForm.email" type="email" placeholder="carlos@makerdu.com" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" required />
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Contraseña Inicial *:</label>
                        <input v-model="teacherForm.password" type="password" placeholder="Mínimo 6 caracteres" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" required />
                    </div>

                    <div class="pt-3 border-t border-slate-800 flex justify-end gap-2">
                        <button type="button" @click="showNewTeacherModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                        <button type="submit" :disabled="teacherForm.processing" class="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black cursor-pointer">Guardar Docente</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL: CREAR AULA / TALLER EXTRACURRICULAR -->
        <div v-if="showNewClassModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 class="text-base font-black text-white">Crear Nueva Aula o Taller Extracurricular</h2>
                    <button @click="showNewClassModal = false" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <form @submit.prevent="submitNewClassroom" class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Modalidad del Grupo *:</label>
                            <select v-model="classroomForm.mode" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-bold">
                                <option value="private_workshop">🚀 Taller Extracurricular / After-School</option>
                                <option value="school_squads">🏫 Colegio / Educación Formal</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Nombre del Aula / Grupo *:</label>
                            <input v-model="classroomForm.name" type="text" placeholder="Ej: Taller Digitoys 2.5D (Sábados)" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" required />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Institución / Academia / Sede:</label>
                            <input v-model="classroomForm.institution_name" type="text" placeholder="Ej: Makerdu Central o Colegio Newton" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" />
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Instructor / Tutor Responsable *:</label>
                            <select v-model="classroomForm.teacher_id" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" required>
                                <option v-for="t in teachers" :key="t.id" :value="t.id">
                                    {{ t.name }} ({{ t.email }})
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Técnica STEAM Inicial *:</label>
                            <select v-model="classroomForm.project_id" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-bold" required>
                                <option v-for="p in projects" :key="p.id" :value="p.id">
                                    {{ p.title }} ({{ p.type }})
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Código de Acceso Único (PIN Aula) *:</label>
                            <input v-model="classroomForm.access_code" type="text" placeholder="Ej: DIGI26" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase" required />
                        </div>
                    </div>

                    <!-- CALCULADORA DE ECONOMÍA 80/20 DE FABCOINS -->
                    <div class="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="font-bold text-amber-300 flex items-center gap-1.5">
                                <Coins class="w-4 h-4 text-amber-400" />
                                <span>Bolsa Total de FabCoins para este Grupo:</span>
                            </label>
                            <span class="text-xs font-mono font-bold text-amber-400">{{ classroomForm.total_fabcoins_pool }} FC</span>
                        </div>
                        <input
                            v-model.number="classroomForm.total_fabcoins_pool"
                            type="range"
                            min="100"
                            max="2000"
                            step="50"
                            class="w-full accent-amber-400"
                        />
                        <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                                <span>80% Asignación Base:</span>
                                <strong class="text-cyan-300 block font-mono">{{ Math.round(classroomForm.total_fabcoins_pool * 0.8) }} FC</strong>
                            </div>
                            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                                <span>20% Reserva Docente:</span>
                                <strong class="text-purple-300 block font-mono">{{ Math.round(classroomForm.total_fabcoins_pool * 0.2) }} FC</strong>
                            </div>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-slate-800 flex justify-end gap-2">
                        <button type="button" @click="showNewClassModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                        <button type="submit" :disabled="classroomForm.processing" class="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black cursor-pointer">Crear Grupo</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL: CARGA RÁPIDA DE ALUMNOS EN LOTE -->
        <div v-if="showEnrollModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                        <span class="text-[10px] font-mono text-cyan-400 font-bold">MATRÍCULA & ESCUADRAS AUTOMÁTICAS</span>
                        <h2 class="text-base font-black text-white">{{ selectedClassroom?.name }}</h2>
                    </div>
                    <button @click="showEnrollModal = false" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <form @submit.prevent="submitEnrollStudents" class="space-y-3.5 text-xs">
                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Prefijo para las Escuadras / Mesas:</label>
                        <input v-model="enrollForm.squad_prefix" type="text" placeholder="Ej: Mesa de Trabajo, Escuadra Alfa..." class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" />
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Pega la lista de alumnos (un nombre por línea):</label>
                        <textarea
                            v-model="enrollForm.students_text"
                            rows="6"
                            placeholder="Mateo Quispe&#10;Lucía Morales&#10;Gabriel Ramos&#10;Sofía Mendoza"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 font-mono"
                            required
                        ></textarea>
                    </div>

                    <div class="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300">
                        ⚡ Cada alumno recibirá un <strong>PIN de 4 dígitos</strong> automático para ingresar sin correo y cada escuadra recibirá su cuota de <strong>FabCoins</strong> según la regla 80/20.
                    </div>

                    <div class="pt-3 border-t border-slate-800 flex justify-end gap-2">
                        <button type="button" @click="showEnrollModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                        <button type="submit" :disabled="enrollForm.processing" class="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black cursor-pointer">Generar Escuadras & PINs</button>
                    </div>
                </form>
            </div>
        </div>
    </AdminLayout>
</template>
