<script setup>
import { Head, Link, useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, Plus, ExternalLink, ArrowLeft, CheckCircle2,
    Layers, Scissors, Box, Cpu, Leaf, Play, Power, Globe
} from 'lucide-vue-next';
import MicroAppOverlay from '@/Components/MicroAppOverlay.vue';
import { t } from '@/i18n.js';

const props = defineProps({
    apps: Array,
});

const showNewModal = ref(false);
const activeTestingApp = ref(null);

const appForm = useForm({
    name: '',
    slug: '',
    category: '2.5D',
    description: '',
    embed_path: '/apps/',
    output_type: 'svg',
    icon: '🎨',
});

const submitNewApp = () => {
    appForm.post(route('admin.apps.store'), {
        preserveScroll: true,
        onSuccess: () => {
            appForm.reset();
            showNewModal.value = false;
        },
    });
};

const toggleStatus = (appId) => {
    router.post(route('admin.apps.toggle', { app: appId }), {}, { preserveScroll: true });
};

const testApp = (app) => {
    activeTestingApp.value = app;
};

const getCatBadge = (cat) => {
    switch (cat) {
        case '3D': return { label: 'Modelado 3D', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' };
        case 'Laser': return { label: 'Corte Láser', color: 'bg-purple-950 text-purple-300 border-purple-800' };
        case 'Electronics': return { label: 'IoT / Bloques', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
        case 'Sustainability': return { label: 'Sostenibilidad', color: 'bg-lime-950 text-lime-300 border-lime-800' };
        default: return { label: 'Relieves 2.5D', color: 'bg-amber-950 text-amber-300 border-amber-800' };
    }
};
</script>

<template>
    <Head title="Ecosistema de Micro-Apps - Makerdu v3.0" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
        
        <!-- TOPBAR -->
        <header class="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Link
                        :href="route('admin.dashboard')"
                        class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
                    >
                        <ArrowLeft class="w-4 h-4" />
                        <span>Centro de Mando</span>
                    </Link>

                    <div>
                        <h1 class="text-base font-black text-white flex items-center gap-2">
                            <span>ECOSISTEMA DE MICRO-APPS AUTÓNOMAS</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">apps.makerdu.com</span>
                        </h1>
                        <p class="text-xs text-slate-400">Herramientas creativas WebGL/WASM desacopladas que operan 100% en el navegador</p>
                    </div>
                </div>

                <button
                    type="button"
                    @click="showNewModal = true"
                    class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                    <Plus class="w-4 h-4" />
                    <span>REGISTRAR NUEVA MICRO-APP</span>
                </button>
            </div>
        </header>

        <!-- MAIN -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
            
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>

            <!-- GRID DE MICRO-APPS -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    v-for="app in apps"
                    :key="app.id"
                    class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden shadow-xl"
                >
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-2xl">{{ app.icon }}</span>
                            <div class="flex items-center gap-1.5">
                                <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-md border', getCatBadge(app.category).color]">
                                    {{ getCatBadge(app.category).label }}
                                </span>
                                <span class="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 uppercase font-bold border border-slate-800">
                                    Salida: {{ app.output_type }}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 class="text-base font-black text-white">{{ app.name }}</h3>
                            <p class="text-xs text-slate-400 mt-1 line-clamp-2">{{ app.description }}</p>
                        </div>

                        <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 truncate">
                            Ruta: {{ app.embed_path }}
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                        <!-- Botón Probar en Overlay Sandbox -->
                        <button
                            type="button"
                            @click="testApp(app)"
                            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                        >
                            <Play class="w-3.5 h-3.5" />
                            <span>Probar en Sandbox</span>
                        </button>

                        <div class="flex items-center gap-2">
                            <!-- Enlace Externo Standalone -->
                            <a
                                :href="app.embed_path"
                                target="_blank"
                                class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                title="Abrir Standalone"
                            >
                                <ExternalLink class="w-4 h-4" />
                            </a>

                            <!-- Toggle Activo -->
                            <button
                                type="button"
                                @click="toggleStatus(app.id)"
                                :class="[
                                    'p-2 rounded-xl border transition',
                                    app.is_active
                                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                                        : 'bg-rose-950/60 border-rose-800 text-rose-400'
                                ]"
                                :title="app.is_active ? 'Desactivar' : 'Activar'"
                            >
                                <Power class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </main>

        <!-- MODAL REGISTRO DE NUEVA MICRO-APP -->
        <div
            v-if="showNewModal"
            class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
            <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-black text-white flex items-center gap-2">
                        <span>REGISTRAR NUEVA MICRO-APP</span>
                    </h3>
                    <button type="button" @click="showNewModal = false" class="text-slate-500 hover:text-white text-xs font-bold">Cerrar</button>
                </div>

                <form @submit.prevent="submitNewApp" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-300 mb-1">Nombre de la App *</label>
                        <input
                            v-model="appForm.name"
                            type="text"
                            placeholder="Ej: Generador de Cajas con Encastre"
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                            required
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1">Slug Único *</label>
                            <input
                                v-model="appForm.slug"
                                type="text"
                                placeholder="box-generator"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1">Categoría *</label>
                            <select
                                v-model="appForm.category"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                            >
                                <option value="2.5D">2.5D (Sellos / Relieves)</option>
                                <option value="3D">3D (Modelado / Visores)</option>
                                <option value="Laser">Laser (Corte y Encastre)</option>
                                <option value="Electronics">Electronics (IoT / Circuitos)</option>
                                <option value="Sustainability">Sustainability (Biomateriales)</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1">Ruta de Embed *</label>
                            <input
                                v-model="appForm.embed_path"
                                type="text"
                                placeholder="/apps/box-generator"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-300 mb-1">Tipo de Salida *</label>
                            <select
                                v-model="appForm.output_type"
                                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                            >
                                <option value="svg">Archivo SVG (Vectores)</option>
                                <option value="stl">Archivo STL (Malla 3D)</option>
                                <option value="json">Datos JSON (Parámetros)</option>
                                <option value="image">Imagen PNG/JPG</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-300 mb-1">Descripción Breve</label>
                        <textarea
                            v-model="appForm.description"
                            rows="2"
                            placeholder="Herramienta interactiva para calcular ranuras de ensamble con compensación de corte (kerf)."
                            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        :disabled="appForm.processing || !appForm.name || !appForm.slug"
                        class="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                        <span>GUARDAR Y ACTIVAR MICRO-APP</span>
                    </button>
                </form>
            </div>
        </div>

        <!-- OVERLAY SANDBOX PARA PROBAR LA MICRO-APP EN VIVO -->
        <MicroAppOverlay
            :is-open="!!activeTestingApp"
            :app-name="activeTestingApp?.name"
            :app-url="activeTestingApp?.embed_path"
            :app-icon="activeTestingApp?.icon"
            @close="activeTestingApp = null"
            @asset-ready="(asset) => console.log('Asset recibido de micro-app:', asset)"
        />

    </div>
</template>