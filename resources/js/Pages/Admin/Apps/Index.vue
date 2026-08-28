<script setup>
import { Head, Link, useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    Sparkles, Plus, ExternalLink, ArrowLeft, CheckCircle2,
    Layers, Scissors, Box, Cpu, Leaf, Play, Power, Globe
} from 'lucide-vue-next';
import AdminLayout from '@/Layouts/AdminLayout.vue';
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
    <AdminLayout>
        <Head title="Suite de 19 Micro-Apps · Makerdu v4.0" />

        <!-- HEADER BANNER -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                        SUITE MAESTRA V4.0
                    </span>
                </div>
                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>Suite de Micro-Apps Autónomas</span>
                    <span class="text-xs px-2.5 py-0.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                        19 Apps Activas
                    </span>
                </h1>
                <p class="text-xs text-slate-400 mt-1">
                    Herramientas CAD/CAM 2D/3D que corren 100% en la GPU del cliente (WebGL / Three.js), sin consumir memoria en el servidor.
                </p>
            </div>

            <button
                type="button"
                @click="showNewModal = true"
                class="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
            >
                <Plus class="w-4 h-4" />
                <span>REGISTRAR MICRO-APP</span>
            </button>
        </div>

        <!-- GRID DE MICRO-APPS (19 APPS) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
                v-for="app in apps"
                :key="app.id"
                class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition shadow-xl flex flex-col justify-between group relative overflow-hidden"
            >
                <div>
                    <!-- Top header -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full border" :class="getCatBadge(app.category).color">
                            {{ getCatBadge(app.category).label }}
                        </span>
                        
                        <div class="flex items-center gap-1">
                            <span class="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold">
                                {{ app.output_type.toUpperCase() }}
                            </span>
                            <button
                                @click="toggleStatus(app.id)"
                                class="p-1 rounded-lg text-slate-400 hover:text-white transition"
                                :title="app.is_active ? 'Desactivar App' : 'Activar App'"
                            >
                                <Power class="w-3.5 h-3.5" :class="app.is_active ? 'text-emerald-400' : 'text-slate-600'" />
                            </button>
                        </div>
                    </div>

                    <!-- Icon & Title -->
                    <div class="flex items-start gap-3 mb-2">
                        <div class="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition">
                            {{ app.icon }}
                        </div>
                        <div>
                            <h3 class="text-sm font-black text-white group-hover:text-cyan-300 transition leading-tight">
                                {{ app.name }}
                            </h3>
                            <span class="text-[10px] font-mono text-slate-500">{{ app.embed_path }}</span>
                        </div>
                    </div>

                    <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {{ app.description }}
                    </p>
                </div>

                <!-- Action Button -->
                <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span class="text-[10px] font-mono text-slate-500">
                        Estado: <strong :class="app.is_active ? 'text-emerald-400' : 'text-slate-500'">{{ app.is_active ? 'Habilitada' : 'Inactiva' }}</strong>
                    </span>

                    <button
                        @click="testApp(app)"
                        class="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs transition border border-cyan-500/20 flex items-center gap-1.5"
                    >
                        <Play class="w-3 h-3" />
                        <span>Probar en Vivo</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL DE PRUEBA EN VIVO -->
        <MicroAppOverlay
            v-if="activeTestingApp"
            :app="activeTestingApp"
            :current-level="1"
            :squad-id="1"
            @close="activeTestingApp = null"
        />

        <!-- MODAL REGISTRAR NUEVA APP -->
        <div v-if="showNewModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 class="text-base font-black text-white">Registrar Nueva Micro-App</h2>
                    <button @click="showNewModal = false" class="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
                </div>

                <form @submit.prevent="submitNewApp" class="space-y-3 text-xs">
                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Nombre de la App:</label>
                        <input v-model="appForm.name" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" required />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Slug:</label>
                            <input v-model="appForm.slug" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" required />
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Icono (Emoji):</label>
                            <input v-model="appForm.icon" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" required />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Categoría:</label>
                            <select v-model="appForm.category" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                                <option value="2.5D">Relieves 2.5D</option>
                                <option value="3D">Modelado 3D</option>
                                <option value="Laser">Corte Láser</option>
                                <option value="Electronics">IoT / Robótica</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-300 mb-1">Salida:</label>
                            <select v-model="appForm.output_type" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                                <option value="stl">STL 3D Binario</option>
                                <option value="svg">SVG Vectorial Láser</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Ruta Embebida (URL):</label>
                        <input v-model="appForm.embed_path" type="text" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" required />
                    </div>

                    <div>
                        <label class="block font-bold text-slate-300 mb-1">Descripción:</label>
                        <textarea v-model="appForm.description" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" required></textarea>
                    </div>

                    <div class="pt-3 flex items-center justify-end gap-2">
                        <button type="button" @click="showNewModal = false" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancelar</button>
                        <button type="submit" :disabled="appForm.processing" class="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black">Registrar</button>
                    </div>
                </form>
            </div>
        </div>
    </AdminLayout>
</template>