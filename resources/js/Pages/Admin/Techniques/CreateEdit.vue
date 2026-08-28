<script setup>
import { ref, computed } from 'vue';
import { Head, Link, useForm } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { 
    Layers, 
    Plus, 
    Trash2, 
    ArrowLeft, 
    Sparkles, 
    Cpu, 
    Box, 
    Video, 
    FileText, 
    CheckCircle2, 
    Save, 
    Eye, 
    ArrowRight,
    HelpCircle,
    Link2,
    Code2,
    RotateCcw,
    Award,
    Coins,
    UploadCloud,
    ExternalLink,
    AlertCircle,
    Check,
    Zap,
    Play
} from 'lucide-vue-next';
import { t, trans, currentLang } from '@/i18n.js';

const props = defineProps({
    technique: {
        type: Object,
        default: null,
    },
    microApps: {
        type: Array,
        default: () => [],
    },
    animations: {
        type: Array,
        default: () => [],
    },
});

const isEditing = !!props.technique;
const activeTab = ref('general'); // 'general', 'competencies', 'missions', 'gemini', 'preview'
const toastMessage = ref(null);
const toastType = ref('success');

const showToast = (msg, type = 'success') => {
    toastMessage.value = msg;
    toastType.value = type;
    setTimeout(() => {
        toastMessage.value = null;
    }, 4000);
};

// Marcos Curriculares y Competencias Predefinidas
const cnebCompetencies = [
    'CyT (C28): Diseña y construye soluciones tecnológicas',
    'EPT (C27): Gestiona proyectos de emprendimiento económico/social',
    'Arte y Cultura (C6): Crea proyectos desde los lenguajes artísticos',
    'Transversal (C29): Se desenvuelve en entornos virtuales TIC',
    'Matemática (C26): Resuelve problemas de forma, movimiento y localización',
];

const afterSchoolCompetencies = [
    'Pensamiento Geométrico y Espacial',
    'Resolución Creativa de Problemas',
    'Prototipado Rápido & Cultura Maker',
    'Resiliencia y Aprendizaje del Error',
    'Trabajo Colaborativo en Escuadra',
];

const availableTechnologies = [
    { id: '2.5d_relief', name: 'Relieves & Fresado 2.5D', icon: '🎨' },
    { id: '3d_printing', name: 'Impresión 3D (FDM / Resina)', icon: '🧊' },
    { id: 'laser_cutting', name: 'Corte y Grabado Láser', icon: '🪵' },
    { id: 'mold_casting', name: 'Moldes, Resina & Termoformado', icon: '🍫' },
    { id: 'electronics', name: 'Electrónica, IoT & Robótica', icon: '🤖' },
];

const ageRangesOptions = [
    { id: 'kids_6_8', label: '6 a 8 años (Kids / Exploradores)', badge: 'Primaria Inicial' },
    { id: 'juniors_9_12', label: '9 a 12 años (Juniors / Creadores)', badge: 'Primaria Media/Alta' },
    { id: 'teens_13_16', label: '13 a 16 años (Teens / Innovadores)', badge: 'Secundaria' },
    { id: 'advanced_17_plus', label: '17+ años (Avanzado / IEST / Superior)', badge: 'Superior / Adultos' },
];

const form = useForm({
    title_es: props.technique?.title_es || '',
    title_en: props.technique?.title_en || '',
    description_es: props.technique?.description_es || '',
    description_en: props.technique?.description_en || '',
    type: props.technique?.type || '2.5D',
    technologies: props.technique?.technologies || ['2.5d_relief'],
    age_ranges: props.technique?.age_ranges || ['juniors_9_12'],
    difficulty_level: props.technique?.difficulty_level || 'foundational',
    curriculum_framework: props.technique?.curriculum_framework || 'cneb_peru',
    competencies: props.technique?.competencies || [],
    competencies_custom: props.technique?.competencies_custom || [],
    skills: props.technique?.skills || [],
    animation_preset: props.technique?.animation_preset || 'art-toy-loop',
    custom_animation_html: props.technique?.custom_animation_html || '',
    recommended_age: props.technique?.recommended_age || '9 - 12 años',
    gemini_prompt_context: props.technique?.gemini_prompt_context || '',
    status: props.technique?.status || 'published',
    missions: props.technique?.missions || [
        {
            title_es: '',
            title_en: '',
            guide_es: '',
            resources_list: [],
            process_mode: 'micro_app',
            micro_app_slug: null,
            external_tool_name: '',
            external_url: '',
            process_instructions: '',
            deliverable_type: 'photo_sketch',
            max_dim_mm: 60,
            min_thickness_mm: 2.0,
            allows_iteration: true,
            skills_reward: [],
            xp_reward: 50,
            fabcoins_cost: 0,
        },
    ],
});

// Helpers de Checkboxes
const toggleAgeRange = (rangeId) => {
    if (form.age_ranges.includes(rangeId)) {
        if (form.age_ranges.length > 1) {
            form.age_ranges = form.age_ranges.filter(r => r !== rangeId);
        }
    } else {
        form.age_ranges.push(rangeId);
    }
};

const toggleTechnology = (techId) => {
    if (form.technologies.includes(techId)) {
        if (form.technologies.length > 1) {
            form.technologies = form.technologies.filter(t => t !== techId);
        }
    } else {
        form.technologies.push(techId);
    }
};

const toggleCompetency = (comp) => {
    if (form.competencies.includes(comp)) {
        form.competencies = form.competencies.filter(c => c !== comp);
    } else {
        form.competencies.push(comp);
    }
};

// Competencias IEST
const addCustomCompetency = () => {
    form.competencies_custom.push({
        code: `C${form.competencies_custom.length + 1}`,
        title: '',
        expected_performances: '',
    });
};

const removeCustomCompetency = (index) => {
    form.competencies_custom.splice(index, 1);
};

// Manejo de Misiones
const addMission = () => {
    form.missions.push({
        title_es: `Misión ${form.missions.length + 1}: `,
        title_en: `Mission ${form.missions.length + 1}: `,
        guide_es: '',
        resources_list: [],
        process_mode: 'micro_app',
        micro_app_slug: null,
        external_tool_name: '',
        external_url: '',
        process_instructions: '',
        deliverable_type: 'stl_3d',
        max_dim_mm: 60,
        min_thickness_mm: 2.0,
        allows_iteration: true,
        skills_reward: [],
        xp_reward: 50,
        fabcoins_cost: 0,
    });
};

// ASISTENTE: Precargar Plantilla Estándar Ciclo Maker-Dual (4 Misiones)
const loadMakerCycleTemplate = () => {
    if (confirm('¿Cargar la plantilla metodológica del Ciclo Maker-Dual (4 Misiones)? Esto reemplazará las misiones actuales.')) {
        form.missions = [
            {
                title_es: 'Misión 1: Concebir — Del Papel a la Idea & Boceto',
                title_en: 'Mission 1: Conceive — From Sketch to Concept',
                guide_es: 'Dibuja en papel bond la silueta de tu pieza respetando las cotas máximas.',
                resources_list: [
                    { type: 'pdf', title: 'Ficha de Bocetado', url: '' },
                ],
                process_mode: 'manual_workshop',
                micro_app_slug: null,
                external_tool_name: '',
                external_url: '',
                process_instructions: 'Dibujo a mano alzada con plumón negro de trazo firme.',
                deliverable_type: 'photo_sketch',
                max_dim_mm: 60,
                min_thickness_mm: 2.0,
                allows_iteration: true,
                skills_reward: ['Pensamiento Espacial', 'Bocetado Rápido'],
                xp_reward: 30,
                fabcoins_cost: 0,
            },
            {
                title_es: 'Misión 2: Modelar — Digitalización Vectorial / 3D',
                title_en: 'Mission 2: Model — 2D/3D Digital Modeling',
                guide_es: 'Convierte tu boceto a un modelo paramétrico limpio cerrando todos los nodos.',
                resources_list: [
                    { type: 'animation', title: 'Tutorial Cierre de Nodos', animation_slug: 'bezier-nodes-close' },
                ],
                process_mode: 'micro_app',
                micro_app_slug: 'vectorizer',
                external_tool_name: '',
                external_url: '',
                process_instructions: 'Usa la micro-app asignada para vectorizar y extruir tu diseño.',
                deliverable_type: 'svg_laser',
                max_dim_mm: 60,
                min_thickness_mm: 2.0,
                allows_iteration: true,
                skills_reward: ['Geometría Vectorial', 'Curvas Bézier'],
                xp_reward: 50,
                fabcoins_cost: 0,
            },
            {
                title_es: 'Misión 3: Fabricar — Auditoría Pre-Flight & Máquina',
                title_en: 'Mission 3: Fabricate — AI Pre-flight Check & Machine',
                guide_es: 'Valida tu modelo con el Copiloto Gemini antes de enviar a impresión o corte.',
                resources_list: [
                    { type: 'video', title: 'Video: Preparación de Máquina', url: '' },
                ],
                process_mode: 'micro_app',
                micro_app_slug: 'viewer-3d',
                external_tool_name: '',
                external_url: '',
                process_instructions: 'Auditoría automática de grosor de pared y dimensiones milimétricas.',
                deliverable_type: 'stl_3d',
                max_dim_mm: 60,
                min_thickness_mm: 2.0,
                allows_iteration: true,
                skills_reward: ['Control de Calidad FabLab', 'Fabricación Digital'],
                xp_reward: 60,
                fabcoins_cost: 15,
            },
            {
                title_es: 'Misión 4: Exponer — Ensamble, Acabado Físico & Bitácora',
                title_en: 'Mission 4: Present — Assembly, Finish & Final Report',
                guide_es: 'Realiza el post-procesado físico, retira rebabas y documenta el resultado.',
                resources_list: [
                    { type: 'link', title: 'Guía de Bitácora Digital', url: '' },
                ],
                process_mode: 'manual_workshop',
                micro_app_slug: null,
                external_tool_name: '',
                external_url: '',
                process_instructions: 'Ensamble de la pieza real, fotografía de producto y registro de aprendizajes.',
                deliverable_type: 'photo_assembly',
                max_dim_mm: 60,
                min_thickness_mm: 2.0,
                allows_iteration: false,
                skills_reward: ['Documentación Técnica', 'Comunicación de Proyecto'],
                xp_reward: 100,
                fabcoins_cost: 0,
            },
        ];
        showToast('¡Plantilla del Ciclo Maker-Dual cargada con éxito!');
    }
};

const removeMission = (index) => {
    if (form.missions.length > 1) {
        form.missions.splice(index, 1);
    }
};

// Recursos Dinámicos para Input
const addResourceToMission = (missionIndex) => {
    if (!form.missions[missionIndex].resources_list) {
        form.missions[missionIndex].resources_list = [];
    }
    form.missions[missionIndex].resources_list.push({
        type: 'video', // 'video', 'animation', 'pdf', 'link', 'template'
        title: '',
        url: '',
        animation_slug: props.animations?.[0]?.slug || '',
    });
};

const removeResourceFromMission = (missionIndex, resIndex) => {
    form.missions[missionIndex].resources_list.splice(resIndex, 1);
};

// Validación y Guardado
const validateForm = () => {
    if (!form.title_es.trim()) {
        showToast('Por favor, ingresa el nombre de la técnica.', 'error');
        activeTab.value = 'general';
        return false;
    }
    if (!form.description_es.trim()) {
        showToast('Por favor, ingresa la descripción didáctica.', 'error');
        activeTab.value = 'general';
        return false;
    }
    if (form.missions.length === 0) {
        showToast('Debes añadir al menos 1 misión a la técnica.', 'error');
        activeTab.value = 'missions';
        return false;
    }
    return true;
};

const submitForm = (statusMode = 'published') => {
    form.status = statusMode;
    if (!validateForm()) return;

    if (isEditing) {
        form.put(route('admin.techniques.update', props.technique.id), {
            onSuccess: () => showToast(statusMode === 'draft' ? 'Borrador actualizado con éxito' : '¡Técnica publicada con éxito!'),
            onError: () => showToast('Hubo un error al guardar. Revisa los campos obligatorios.', 'error'),
        });
    } else {
        form.post(route('admin.techniques.store'), {
            onSuccess: () => showToast(statusMode === 'draft' ? 'Borrador guardado con éxito' : '¡Técnica creada con éxito!'),
            onError: () => showToast('Hubo un error al guardar. Revisa los campos obligatorios.', 'error'),
        });
    }
};
</script>

<template>
    <AdminLayout>
        <Head :title="isEditing ? 'Editar Técnica STEAM' : 'Diseñador de Técnica STEAM Maestra'" />

        <!-- TOAST FLOTANTE -->
        <div 
            v-if="toastMessage" 
            :class="[
                'fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold animate-bounce',
                toastType === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
            ]"
        >
            <CheckCircle2 v-if="toastType === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
            <AlertCircle v-else class="w-5 h-5 text-rose-400 shrink-0" />
            <span>{{ toastMessage }}</span>
        </div>

        <!-- TOP ACTIONS BAR -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
                <Link
                    :href="route('admin.techniques.index')"
                    class="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft class="w-4 h-4" />
                </Link>
                <div>
                    <div class="flex items-center gap-2 mb-0.5">
                        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" :class="form.status === 'draft' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'">
                            {{ form.status === 'draft' ? 'BORRADOR' : 'PUBLICADA' }}
                        </span>
                    </div>
                    <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {{ isEditing ? 'Editar Técnica Maestra' : 'Diseñador de Técnica STEAM Maestra' }}
                    </h1>
                </div>
            </div>

            <!-- Botones Guardar Borrador / Publicar -->
            <div class="flex items-center gap-2.5">
                <button
                    type="button"
                    @click="submitForm('draft')"
                    :disabled="form.processing"
                    class="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs transition flex items-center gap-2"
                >
                    <Save class="w-4 h-4 text-amber-400" />
                    <span>Guardar Borrador</span>
                </button>

                <button
                    type="button"
                    @click="submitForm('published')"
                    :disabled="form.processing"
                    class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                    <CheckCircle2 class="w-4 h-4" />
                    <span>{{ form.processing ? 'PUBLICANDO...' : 'PUBLICAR TÉCNICA' }}</span>
                </button>
            </div>
        </div>

        <!-- TABS DE NAVEGACIÓN -->
        <div class="flex items-center gap-2 border-b border-slate-800 mb-6 overflow-x-auto pb-2">
            <button
                type="button"
                @click="activeTab = 'general'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0',
                    activeTab === 'general' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Layers class="w-4 h-4" />
                <span>1. Ficha, Multi-Tecnología & Edades</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'competencies'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0',
                    activeTab === 'competencies' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Award class="w-4 h-4" />
                <span>2. Marco Curricular (CNEB / IEST)</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'missions'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0',
                    activeTab === 'missions' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Box class="w-4 h-4" />
                <span>3. Ciclo de Misiones IPO ({{ form.missions.length }})</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'gemini'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0',
                    activeTab === 'gemini' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Cpu class="w-4 h-4" />
                <span>4. Mentor IA Gemini (3 Capas)</span>
            </button>

            <button
                type="button"
                @click="activeTab = 'preview'"
                :class="[
                    'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0',
                    activeTab === 'preview' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                ]"
            >
                <Eye class="w-4 h-4" />
                <span>5. Previsualización</span>
            </button>
        </div>

        <!-- FORMULARIO POR PESTAÑAS -->
        <form @submit.prevent="submitForm('published')" class="space-y-6">

            <!-- PESTAÑA 1: FICHA, MULTI-TECNOLOGÍAS & EDADES -->
            <div v-show="activeTab === 'general'" class="space-y-6 animate-fade-in">
                
                <!-- Datos Principales -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>🏷️ Datos Principales de la Técnica</span>
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Nombre de la Técnica (Español) *:</label>
                            <input
                                v-model="form.title_es"
                                type="text"
                                placeholder="Ej: Fabricación 2.5D: Del Dibujo al Art Toy"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Nombre en Inglés (Opcional):</label>
                            <input
                                v-model="form.title_en"
                                type="text"
                                placeholder="Ej: 2.5D Digital Fabrication: From Sketch to Art Toy"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Descripción Didáctica & Técnica *:</label>
                            <textarea
                                v-model="form.description_es"
                                rows="3"
                                placeholder="Describe el objetivo tecnológico y el resultado físico de esta matriz..."
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                                required
                            ></textarea>
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Descripción en Inglés:</label>
                            <textarea
                                v-model="form.description_en"
                                rows="3"
                                placeholder="Describe pedagogical and technological outcomes in English..."
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <!-- SELECTOR MULTI-TECNOLOGÍAS FABLAB (CHECKBOXES) -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span>🛠️ Herramientas FabLab Combinables (Multi-Tecnología)</span>
                            </h2>
                            <p class="text-xs text-slate-400 mt-0.5">
                                Puedes seleccionar una o varias tecnologías para proyectos escolares o de nivel superior (IEST).
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        <button
                            v-for="tech in availableTechnologies"
                            :key="tech.id"
                            type="button"
                            @click="toggleTechnology(tech.id)"
                            :class="[
                                'p-3.5 rounded-2xl border text-left transition flex items-center justify-between',
                                form.technologies.includes(tech.id)
                                    ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            ]"
                        >
                            <div class="flex items-center gap-2.5">
                                <span class="text-xl">{{ tech.icon }}</span>
                                <span class="text-xs font-bold">{{ tech.name }}</span>
                            </div>
                            <CheckCircle2 v-if="form.technologies.includes(tech.id)" class="w-4 h-4 text-cyan-400 shrink-0" />
                        </button>
                    </div>
                </div>

                <!-- SEGMENTACIÓN: RANGOS DE EDAD MULTI-SELECCIÓN & DIFICULTAD -->
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div>
                        <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <span>👥 Rangos de Edad Aplicables (Selección Múltiple)</span>
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">
                            Marca todos los grupos de edad donde esta técnica puede ser adaptada por el docente.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                            v-for="opt in ageRangesOptions"
                            :key="opt.id"
                            type="button"
                            @click="toggleAgeRange(opt.id)"
                            :class="[
                                'p-3.5 rounded-2xl border text-left transition flex items-center justify-between',
                                form.age_ranges.includes(opt.id)
                                    ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            ]"
                        >
                            <div>
                                <span class="text-xs font-bold block">{{ opt.label }}</span>
                                <span class="text-[10px] text-slate-500 font-mono">{{ opt.badge }}</span>
                            </div>
                            <CheckCircle2 v-if="form.age_ranges.includes(opt.id)" class="w-4 h-4 text-purple-400 shrink-0" />
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Nivel de Dificultad:</label>
                            <select
                                v-model="form.difficulty_level"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="foundational">🟢 Nivel 1: Fundacional (Guiado / Plantillas)</option>
                                <option value="intermediate">🟡 Nivel 2: Constructor (Creación Paramétrica)</option>
                                <option value="master">🔴 Nivel 3: Maestro Maker (Multi-Tecnología)</option>
                            </select>
                        </div>

                        <div class="space-y-1.5">
                            <label class="block text-xs font-bold text-slate-300">Animación Demostrativa de Cabecera:</label>
                            <select
                                v-model="form.animation_preset"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:ring-2 focus:ring-cyan-500"
                            >
                                <option v-for="anim in animations" :key="anim.slug" :value="anim.slug">
                                    ✨ {{ trans(anim.title_json) }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 2: MARCO CURRICULAR & COMPETENCIAS IEST -->
            <div v-show="activeTab === 'competencies'" class="space-y-6 animate-fade-in">
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 class="text-sm font-black text-white uppercase tracking-wider">
                                🏛️ Marco Curricular de Evaluación
                            </h2>
                            <p class="text-xs text-slate-400 mt-0.5">
                                Selecciona el contexto estatal escolar o el perfil técnico de educación superior.
                            </p>
                        </div>

                        <select
                            v-model="form.curriculum_framework"
                            class="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="cneb_peru">🇵🇪 CNEB Perú (Colegios)</option>
                            <option value="iest_superior">🎓 Educación Superior / IEST</option>
                            <option value="after_school_steam">🚀 Extracurricular / STEAM After-School</option>
                        </select>
                    </div>

                    <!-- Competencias Escolares CNEB -->
                    <div v-if="form.curriculum_framework === 'cneb_peru'" class="space-y-2 pt-2">
                        <label class="block text-xs font-bold text-slate-300">Competencias CNEB Asociadas:</label>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="comp in cnebCompetencies"
                                :key="comp"
                                type="button"
                                @click="toggleCompetency(comp)"
                                :class="[
                                    'px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border',
                                    form.competencies.includes(comp)
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                ]"
                            >
                                <CheckCircle2 v-if="form.competencies.includes(comp)" class="w-3.5 h-3.5 text-cyan-400" />
                                <span>{{ comp }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Competencias After-School -->
                    <div v-else-if="form.curriculum_framework === 'after_school_steam'" class="space-y-2 pt-2">
                        <label class="block text-xs font-bold text-slate-300">Habilidades STEAM Blandas:</label>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="comp in afterSchoolCompetencies"
                                :key="comp"
                                type="button"
                                @click="toggleCompetency(comp)"
                                :class="[
                                    'px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border',
                                    form.competencies.includes(comp)
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                ]"
                            >
                                <CheckCircle2 v-if="form.competencies.includes(comp)" class="w-3.5 h-3.5 text-purple-400" />
                                <span>{{ comp }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Competencias Específicas Personalizadas IEST -->
                    <div v-else-if="form.curriculum_framework === 'iest_superior'" class="space-y-4 pt-2">
                        <div class="flex items-center justify-between">
                            <label class="block text-xs font-bold text-slate-300">
                                Competencias Específicas & Desempeños Esperados (IEST / Superior):
                            </label>
                            <button
                                type="button"
                                @click="addCustomCompetency"
                                class="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5"
                            >
                                <Plus class="w-3.5 h-3.5" />
                                <span>Añadir Competencia IEST</span>
                            </button>
                        </div>

                        <div v-if="form.competencies_custom.length === 0" class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                            No hay competencias personalizadas añadidas. Haz clic en el botón superior para agregar C1, C2 con sus criterios técnicos.
                        </div>

                        <div 
                            v-for="(custComp, cIndex) in form.competencies_custom" 
                            :key="cIndex"
                            class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative"
                        >
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-mono font-bold text-cyan-400">Competencia {{ custComp.code }}</span>
                                <button type="button" @click="removeCustomCompetency(cIndex)" class="p-1 rounded-lg text-slate-500 hover:text-rose-400">
                                    <Trash2 class="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <input
                                v-model="custComp.title"
                                type="text"
                                placeholder="Ej: Desarrolla un prototipo educativo funcional aplicando tecnologías de fabricación digital."
                                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <div>
                                <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Desempeños Esperados / Indicadores de Logro:</label>
                                <textarea
                                    v-model="custComp.expected_performances"
                                    rows="2"
                                    placeholder="Ej: Construye el prototipo funcional respondiendo a una necesidad real y documenta en bitácora digital con evidencias claras."
                                    class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 3: MISIONES MODULARES EN FILAS VERTICALES APILADAS -->
            <div v-show="activeTab === 'missions'" class="space-y-6 animate-fade-in">
                
                <!-- Barra de Asistente Pedagógico -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                                CICLO MAKER-DUAL
                            </span>
                        </div>
                        <h2 class="text-sm font-black text-white">Ruta Secuencial de Misiones (IPO + Iteración)</h2>
                        <p class="text-xs text-slate-400 mt-0.5">Estructura cada misión en 3 bloques verticales: Entradas, Proceso y Entregables.</p>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            @click="loadMakerCycleTemplate"
                            class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                            title="Precargar 4 misiones metodológicas estándar"
                        >
                            <Zap class="w-3.5 h-3.5" />
                            <span>⚡ Cargar Ciclo Maker (4 Misiones)</span>
                        </button>

                        <button
                            type="button"
                            @click="addMission"
                            class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5"
                        >
                            <Plus class="w-4 h-4" />
                            <span>+ Añadir Misión en Blanco</span>
                        </button>
                    </div>
                </div>

                <!-- LISTA DE MISIONES (DISPOSICIÓN VERTICAL APILADA) -->
                <div 
                    v-for="(mission, index) in form.missions" 
                    :key="index"
                    class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative"
                >
                    <!-- Cabecera de la Misión -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                        <div class="flex items-center gap-3 flex-1">
                            <span class="w-8 h-8 rounded-2xl bg-cyan-500/20 text-cyan-400 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-cyan-500/30">
                                {{ index + 1 }}
                            </span>
                            <input
                                v-model="mission.title_es"
                                type="text"
                                placeholder="Título de la Misión (Ej: Misión 1: Del Papel a la Idea)"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                        </div>

                        <div class="flex items-center gap-4">
                            <!-- Puntos Maker (PM) -->
                            <div class="flex items-center gap-1.5 text-xs text-amber-400 font-bold font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                                <span>⚡ Puntos Maker (PM):</span>
                                <input
                                    v-model.number="mission.xp_reward"
                                    type="number"
                                    class="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-xs text-amber-300 font-bold"
                                />
                            </div>

                            <button
                                type="button"
                                @click="removeMission(index)"
                                class="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                title="Eliminar Misión"
                            >
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <!-- ============================================================= -->
                    <!-- BLOQUE 1 VERTICAL: 📥 INPUT (RECURSOS DINÁMICOS & ANIMACIONES) -->
                    <!-- ============================================================= -->
                    <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-4">
                        <div class="flex items-center justify-between border-b border-slate-900 pb-2">
                            <span class="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                                <span>📥 1. ENTRADA (INPUTS & RECURSOS DIDÁCTICOS)</span>
                            </span>
                            <button
                                type="button"
                                @click="addResourceToMission(index)"
                                class="text-xs px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-bold flex items-center gap-1"
                            >
                                <Plus class="w-3.5 h-3.5" />
                                <span>Añadir Recurso</span>
                            </button>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs text-slate-300 font-bold">Guía / Instrucción Didáctica Inicial:</label>
                            <textarea
                                v-model="mission.guide_es"
                                rows="2"
                                placeholder="Qué debe leer, observar o preparar el alumno antes de empezar..."
                                class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                            ></textarea>
                        </div>

                        <!-- LISTA DINÁMICA DE RECURSOS -->
                        <div v-if="mission.resources_list && mission.resources_list.length > 0" class="space-y-2 pt-2">
                            <div 
                                v-for="(res, rIdx) in mission.resources_list" 
                                :key="rIdx"
                                class="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center gap-2.5"
                            >
                                <select v-model="res.type" class="bg-slate-950 text-xs text-cyan-300 border border-slate-800 rounded-xl p-2 font-bold shrink-0">
                                    <option value="video">🎬 Video (Bunny/YouTube)</option>
                                    <option value="animation">✨ Micro-Animación Didáctica</option>
                                    <option value="pdf">📄 Ficha / Guía PDF</option>
                                    <option value="link">🔗 Herramienta Externa (Link)</option>
                                    <option value="template">📦 Archivo Plantilla (SVG/STL)</option>
                                </select>

                                <input 
                                    v-model="res.title" 
                                    type="text" 
                                    placeholder="Título del recurso (Ej: Tutorial Tinkercad)" 
                                    class="w-full md:w-56 bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-2" 
                                />

                                <!-- Si es Animación de Galería -->
                                <select 
                                    v-if="res.type === 'animation'" 
                                    v-model="res.animation_slug" 
                                    class="flex-1 bg-slate-950 text-xs text-purple-300 border border-slate-800 rounded-xl p-2 font-mono"
                                >
                                    <option v-for="anim in animations" :key="anim.slug" :value="anim.slug">
                                        ✨ Galería: {{ trans(anim.title_json) }} ({{ anim.category }})
                                    </option>
                                </select>

                                <!-- Si es Video / Link / PDF -->
                                <input 
                                    v-else 
                                    v-model="res.url" 
                                    type="text" 
                                    placeholder="URL del recurso (https://...)" 
                                    class="flex-1 bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-xl px-3 py-2 font-mono" 
                                />

                                <button type="button" @click="removeResourceFromMission(index, rIdx)" class="p-2 text-slate-500 hover:text-rose-400 shrink-0">
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ============================================================= -->
                    <!-- BLOQUE 2 VERTICAL: ⚙️ PROCESS (PROCESO HÍBRIDO: APP / EXTERNO) -->
                    <!-- ============================================================= -->
                    <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-4">
                        <div class="border-b border-slate-900 pb-2">
                            <span class="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                <span>⚙️ 2. PROCESO (HERRAMIENTA CAD / CAM / TALLER)</span>
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-xs text-slate-300 font-bold">Modo de Trabajo:</label>
                                <select
                                    v-model="mission.process_mode"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                                >
                                    <option value="micro_app">🛠️ Micro-App Interna Makerdu (WebGL/Canvas Autónomo)</option>
                                    <option value="external_tool">🌐 Herramienta Externa (Autodesk Tinkercad, Inkscape, Canva)</option>
                                    <option value="manual_workshop">✍️ Trabajo Manual en Taller Físico</option>
                                </select>
                            </div>

                            <!-- Si usa Micro-App -->
                            <div v-if="mission.process_mode === 'micro_app'" class="space-y-1.5">
                                <label class="text-xs text-slate-300 font-bold">Seleccionar Micro-App Asignada:</label>
                                <select
                                    v-model="mission.micro_app_slug"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 font-bold"
                                >
                                    <option :value="null">-- Elegir entre las 19 Micro-Apps --</option>
                                    <option v-for="app in microApps" :key="app.slug" :value="app.slug">
                                        {{ app.icon }} {{ app.name }} ({{ app.category }})
                                    </option>
                                </select>
                            </div>

                            <!-- Si usa Herramienta Externa -->
                            <div v-else-if="mission.process_mode === 'external_tool'" class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-xs text-slate-300 font-bold">Nombre del Software:</label>
                                    <input
                                        v-model="mission.external_tool_name"
                                        type="text"
                                        placeholder="Ej: Autodesk Tinkercad"
                                        class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label class="text-xs text-slate-300 font-bold">Enlace Externo:</label>
                                    <input
                                        v-model="mission.external_url"
                                        type="text"
                                        placeholder="https://www.tinkercad.com"
                                        class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs text-slate-300 font-bold">Instrucción Técnica del Proceso:</label>
                            <textarea
                                v-model="mission.process_instructions"
                                rows="2"
                                placeholder="Cómo debe operar la herramienta o qué pasos seguir para modelar..."
                                class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500"
                            ></textarea>
                        </div>
                    </div>

                    <!-- ============================================================= -->
                    <!-- BLOQUE 3 VERTICAL: 📤 OUTPUT (ENTREGABLE, REGLAS & FABCOINS)  -->
                    <!-- ============================================================= -->
                    <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-4">
                        <div class="border-b border-slate-900 pb-2 flex items-center justify-between">
                            <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                <span>📤 3. SALIDA (ENTREGABLE, REGLAS FÍSICAS & FABCOINS)</span>
                            </span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="space-y-1.5">
                                <label class="text-xs text-slate-300 font-bold">Tipo de Entregable:</label>
                                <select
                                    v-model="mission.deliverable_type"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-300 font-bold"
                                >
                                    <option value="photo_sketch">📸 Foto de Boceto en Papel</option>
                                    <option value="svg_laser">📐 Archivo Vectorial SVG Láser</option>
                                    <option value="stl_3d">🧊 Archivo STL 3D Binario</option>
                                    <option value="photo_assembly">🛠️ Foto de Ensamble y Pieza Final</option>
                                    <option value="pitch_video">🎥 Video Pitch / Presentación</option>
                                    <option value="report_pdf">📄 Bitácora / Ficha Técnica PDF</option>
                                </select>
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs text-slate-300 font-bold">Dimensión Máx (mm):</label>
                                <input
                                    v-model.number="mission.max_dim_mm"
                                    type="number"
                                    placeholder="60"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                                />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs text-slate-300 font-bold">Grosor Mínimo (mm):</label>
                                <input
                                    v-model.number="mission.min_thickness_mm"
                                    type="number"
                                    step="0.5"
                                    placeholder="2.0"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white"
                                />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs text-amber-400 font-bold">🪙 Saldo FabCoins (FC):</label>
                                <input
                                    v-model.number="mission.fabcoins_cost"
                                    type="number"
                                    placeholder="0"
                                    class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-amber-400 font-bold"
                                />
                            </div>
                        </div>

                        <!-- Bucle de Iteración Ágil -->
                        <div class="pt-3 border-t border-slate-900 flex items-center justify-between">
                            <label class="text-xs text-slate-300 font-bold flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="mission.allows_iteration" class="rounded text-cyan-500 bg-slate-900 border-slate-800 w-4 h-4" />
                                <span>Permitir Bucle de Iteración (Falla Rápido, Aprende Rápido)</span>
                            </label>
                            <span class="text-xs font-mono text-cyan-400" v-if="mission.allows_iteration">
                                🔁 Habilita Re-envío y Mejora Continua
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 4: COPILOTO GEMINI (3 CAPAS) -->
            <div v-show="activeTab === 'gemini'" class="space-y-6 animate-fade-in">
                <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                            🤖
                        </span>
                        <div>
                            <h2 class="text-sm font-black text-white uppercase tracking-wider">
                                Contexto del Mentor IA (Gemini 2.0 Flash Vision)
                            </h2>
                            <p class="text-xs text-slate-400">
                                Configura los criterios de auditoría física y tono pedagógico para evaluar los entregables.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-bold text-slate-300">
                            🎯 Instrucciones y Prompt de Evaluación para esta Técnica:
                        </label>
                        <textarea
                            v-model="form.gemini_prompt_context"
                            rows="6"
                            placeholder="Ej: Eres el Mentor de Fabricación 2.5D de Makerdu. Tu objetivo es auditar que los bocetos tengan líneas cerradas y los modelos 3D cumplan con al menos 2.0 mm de grosor de pared..."
                            class="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-purple-200 font-mono leading-relaxed focus:ring-2 focus:ring-purple-500"
                        ></textarea>
                    </div>

                    <div class="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-300 flex items-start gap-2.5">
                        <Sparkles class="w-5 h-5 shrink-0 mt-0.5 text-purple-400" />
                        <div>
                            <span class="font-bold">Estructura en 3 Capas Activa:</span>
                            <p class="text-[11px] text-slate-400 mt-0.5">
                                Este prompt se fusionará en tiempo real con la Identidad Makerdu (Capa 1) y el Reto Específico del Aula (Capa 3).
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PESTAÑA 5: PREVISUALIZACIÓN -->
            <div v-show="activeTab === 'preview'" class="space-y-6 animate-fade-in">
                <div class="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                            {{ form.age_ranges.length }} Grupos de Edad
                        </span>
                        <span class="text-[10px] font-mono text-slate-500 font-bold uppercase">
                            {{ form.difficulty_level }}
                        </span>
                    </div>

                    <div class="h-32 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl animate-pulse">
                        <span v-if="form.technologies.includes('2.5d_relief')">🧸</span>
                        <span v-else-if="form.technologies.includes('laser_cutting')">🪵</span>
                        <span v-else>🧊</span>
                    </div>

                    <div>
                        <h3 class="text-base font-black text-white">
                            {{ form.title_es || 'Nombre de la Técnica STEAM' }}
                        </h3>
                        <p class="text-xs text-slate-400 mt-1 line-clamp-3">
                            {{ form.description_es || 'Aquí aparecerá la descripción didáctica y técnica...' }}
                        </p>
                    </div>

                    <div class="flex flex-wrap gap-1.5 pt-2">
                        <span v-for="tId in form.technologies" :key="tId" class="text-[9px] px-2 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {{ availableTechnologies.find(x => x.id === tId)?.name || tId }}
                        </span>
                    </div>

                    <div class="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-400">
                        <span>{{ form.missions.length }} Misiones IPO</span>
                        <span class="text-amber-400 font-mono">
                            ⚡ {{ form.missions.reduce((acc, m) => acc + (m.xp_reward || 0), 0) }} PM Total
                        </span>
                    </div>
                </div>
            </div>
        </form>
    </AdminLayout>
</template>
