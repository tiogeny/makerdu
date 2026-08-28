<script setup>
import { ref, computed } from 'vue';
import { Head, Link, useForm, router } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { 
    Sparkles, 
    Plus, 
    Play, 
    Power, 
    Trash2, 
    Code2, 
    Layers, 
    CheckCircle2,
    Eye,
    SquarePen
} from 'lucide-vue-next';
import { t, trans, currentLang } from '@/i18n.js';

const props = defineProps({
    animations: {
        type: Array,
        default: () => [],
    },
});

const showNewModal = ref(false);
const showEditModal = ref(false);
const editingAnimationId = ref(null);
const activeFilter = ref('all');

const form = useForm({
    title_es: '',
    title_en: '',
    category: '3d',
    description_es: '',
    html_css_code: `<div style="background:#0f172a; border-radius:16px; padding:20px; text-align:center; color:#fff; font-family:sans-serif; border:1px solid #334155;">
  <div style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">Tutorial Animado</div>
  <div style="font-size:12px; color:#cbd5e1;">Paso 1 ➔ Paso 2 ➔ Paso 3</div>
  <div style="margin-top:12px; font-size:24px;">✨ ➔ 🧊</div>
</div>`,
});

const editForm = useForm({
    title_es: '',
    title_en: '',
    category: '3d',
    description_es: '',
    html_css_code: '',
});

const filteredAnimations = computed(() => {
    if (activeFilter.value === 'all') return props.animations;
    return props.animations.filter(a => a.category === activeFilter.value);
});

const openEditModal = (anim) => {
    editingAnimationId.value = anim.id;
    editForm.title_es = anim.title_json?.es || '';
    editForm.title_en = anim.title_json?.en || '';
    editForm.category = anim.category || '3d';
    editForm.description_es = anim.description_json?.es || '';
    editForm.html_css_code = anim.html_css_code || '';
    showEditModal.value = true;
};

const submitNewAnimation = () => {
    form.post(route('admin.animations.store'), {
        preserveScroll: true,
        onSuccess: () => {
            form.reset();
            showNewModal.value = false;
        },
    });
};

const submitUpdateAnimation = () => {
    if (!editingAnimationId.value) return;
    editForm.put(route('admin.animations.update', editingAnimationId.value), {
        preserveScroll: true,
        onSuccess: () => {
            showEditModal.value = false;
        },
    });
};

const toggleAnimation = (id) => {
    router.post(route('admin.animations.toggle', id), {}, { preserveScroll: true });
};

const deleteAnimation = (id) => {
    if (confirm('¿Eliminar esta micro-animación de la galería?')) {
        router.delete(route('admin.animations.destroy', id), { preserveScroll: true });
    }
};
</script>

<template>
    <AdminLayout>
        <Head title="Galería de Micro-Animaciones · SuperAdmin HQ" />

        <!-- HEADER SECTION -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                        CATÁLOGO DE TUTORIALES VISUALES
                    </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Galería de Micro-Animaciones Didácticas</span>
                    <span class="text-xs px-2 py-0.5 rounded-xl bg-slate-800 text-slate-400 font-mono font-normal">
                        {{ animations.length }} activas
                    </span>
                </h1>
                <p class="text-xs text-slate-400 mt-1">
                    Componentes HTML/CSS/SVG ultraligeros en bucle para guiar al estudiante sin consumir ancho de banda de video.
                </p>
            </div>

            <button
                type="button"
                @click="showNewModal = true"
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer"
            >
                <Plus class="w-4 h-4" />
                <span>NUEVA MICRO-ANIMACIÓN</span>
            </button>
        </div>

        <!-- FILTROS POR CATEGORÍA -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
                v-for="cat in [
                    { id: 'all', label: 'Todas las Animaciones' },
                    { id: '3d', label: '🧊 Impresión 3D' },
                    { id: 'laser', label: '🪵 Corte Láser' },
                    { id: '2.5d', label: '🎨 Relieves 2.5D' },
                    { id: 'electronics', label: '🤖 Robótica / IoT' }
                ]"
                :key="cat.id"
                @click="activeFilter = cat.id"
                :class="[
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer',
                    activeFilter === cat.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                ]"
            >
                {{ cat.label }}
            </button>
        </div>

        <!-- GRID DE MICRO-ANIMACIONES -->
        <div v-if="filteredAnimations.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="anim in filteredAnimations"
                :key="anim.id"
                class="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between group relative overflow-hidden"
            >
                <div>
                    <!-- Header -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-cyan-400 border border-slate-800 uppercase font-bold">
                            {{ anim.category }}
                        </span>

                        <div class="flex items-center gap-1.5">
                            <button
                                @click="openEditModal(anim)"
                                class="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition cursor-pointer"
                                title="Editar Animación"
                            >
                                <SquarePen class="w-3.5 h-3.5" />
                            </button>
                            <button
                                @click="toggleAnimation(anim.id)"
                                class="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                                :title="anim.is_active ? 'Desactivar' : 'Activar'"
                            >
                                <Power class="w-3.5 h-3.5" :class="anim.is_active ? 'text-emerald-400' : 'text-slate-600'" />
                            </button>
                            <button
                                @click="deleteAnimation(anim.id)"
                                class="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                title="Eliminar"
                            >
                                <Trash2 class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <!-- VISTA PREVIA RENDERIZADA EN VIVO (SANDBOX HTML) -->
                    <div class="rounded-2xl border border-slate-800/80 mb-4 overflow-hidden shadow-inner p-1 bg-slate-950">
                        <div v-html="anim.html_css_code"></div>
                    </div>

                    <h3 class="text-sm font-black text-white group-hover:text-cyan-300 transition mb-1">
                        {{ trans(anim.title_json) }}
                    </h3>
                    <p class="text-xs text-slate-400 line-clamp-2">
                        {{ trans(anim.description_json) }}
                    </p>
                </div>

                <div class="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Slug: {{ anim.slug }}</span>
                    <button
                        type="button"
                        @click="openEditModal(anim)"
                        class="text-cyan-400 hover:underline font-bold"
                    >
                        Editar Código ➔
                    </button>
                </div>
            </div>
        </div>

        <!-- ESTADO VACÍO -->
        <div v-else class="text-center py-16 px-4 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl max-w-md mx-auto">
            <p class="text-xs text-slate-400 mb-4">No hay micro-animaciones en esta categoría.</p>
            <button
                @click="showNewModal = true"
                class="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer"
            >
                + Crear Micro-Animación
            </button>
        </div>

        <!-- MODAL PARA REGISTRAR NUEVA ANIMACIÓN -->
        <div v-if="showNewModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 class="text-base font-black text-white">Registrar Nueva Micro-Animación Didáctica</h2>
                    <button @click="showNewModal = false" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <form @submit.prevent="submitNewAnimation" class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Nombre (Español) *:</label>
                            <input v-model="form.title_es" type="text" placeholder="Ej: Cómo Exportar STL en Tinkercad" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" required />
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Categoría:</label>
                            <select v-model="form.category" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                                <option value="3d">Impresión 3D</option>
                                <option value="laser">Corte Láser</option>
                                <option value="2.5d">Relieves 2.5D</option>
                                <option value="electronics">Robótica / IoT</option>
                                <option value="general">General / Taller</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Código HTML / CSS / SVG de la Animación *:</label>
                        <textarea
                            v-model="form.html_css_code"
                            rows="6"
                            placeholder="Pega el código HTML y estilos CSS en línea..."
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-cyan-300 font-mono"
                            required
                        ></textarea>
                    </div>

                    <!-- PREVISUALIZACIÓN EN TIEMPO REAL DENTRO DEL MODAL -->
                    <div>
                        <label class="block font-bold text-slate-400 mb-1">Previsualización en Tiempo Real:</label>
                        <div class="rounded-2xl border border-slate-800 p-2 bg-slate-950 min-h-[100px] flex items-center justify-center">
                            <div v-html="form.html_css_code" class="w-full"></div>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                        <button type="button" @click="showNewModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                        <button type="submit" :disabled="form.processing" class="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black cursor-pointer">Registrar en Galería</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL PARA EDITAR ANIMACIÓN EXISTENTE -->
        <div v-if="showEditModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 class="text-base font-black text-white">Editar Micro-Animación Didáctica</h2>
                    <button @click="showEditModal = false" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <form @submit.prevent="submitUpdateAnimation" class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Nombre (Español) *:</label>
                            <input v-model="editForm.title_es" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" required />
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Categoría:</label>
                            <select v-model="editForm.category" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                                <option value="3d">Impresión 3D</option>
                                <option value="laser">Corte Láser</option>
                                <option value="2.5d">Relieves 2.5D</option>
                                <option value="electronics">Robótica / IoT</option>
                                <option value="general">General / Taller</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Código HTML / CSS / SVG de la Animación *:</label>
                        <textarea
                            v-model="editForm.html_css_code"
                            rows="7"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-cyan-300 font-mono"
                            required
                        ></textarea>
                    </div>

                    <!-- PREVISUALIZACIÓN EN TIEMPO REAL DENTRO DEL MODAL -->
                    <div>
                        <label class="block font-bold text-slate-400 mb-1">Previsualización en Tiempo Real:</label>
                        <div class="rounded-2xl border border-slate-800 p-2 bg-slate-950 min-h-[100px] flex items-center justify-center">
                            <div v-html="editForm.html_css_code" class="w-full"></div>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                        <button type="button" @click="showEditModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer">Cancelar</button>
                        <button type="submit" :disabled="editForm.processing" class="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black cursor-pointer">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    </AdminLayout>
</template>
