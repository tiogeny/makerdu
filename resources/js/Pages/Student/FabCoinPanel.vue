<script setup>
import { Head, Link, router, useForm, usePage } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import {
    Coins, Trophy, Sparkles, ArrowLeft, ArrowUpRight, ArrowDownLeft,
    Clock, CheckCircle2, Gift, ShoppingBag, Flame, Layers, ShieldCheck,
    History, Award, Users, AlertCircle, Check, Package, Zap, ExternalLink
} from 'lucide-vue-next';
import { t, currentLang } from '@/i18n.js';

const props = defineProps({
    squad: Object,
    history: Array,
    catalog: Array,
    pendingRedemptions: Array,
    ranking: Array,
});

const page = usePage();
const activeTab = ref('store'); // 'store', 'history', 'ranking'
const selectedReward = ref(null);
const isRedeeming = ref(false);

const redeemForm = useForm({
    reward_id: null,
});

const openRedeemConfirm = (reward) => {
    selectedReward.value = reward;
};

const submitRedeem = () => {
    if (!selectedReward.value) return;
    redeemForm.reward_id = selectedReward.value.id;
    isRedeeming.value = true;
    redeemForm.post(route('squad.redeem', { squad: props.squad.id }), {
        preserveScroll: true,
        onSuccess: () => {
            selectedReward.value = null;
            isRedeeming.value = false;
        },
        onError: () => {
            isRedeeming.value = false;
        },
    });
};

const getCategoryBadge = (cat) => {
    switch (cat) {
        case 'material':
            return { label: 'Insumo Maker', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
        case 'time':
            return { label: 'Tiempo Máquina', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
        case 'tool':
            return { label: 'Herramienta Pro', class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
        case 'privilege':
            return { label: 'Privilegio Taller', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
        case 'recognition':
            return { label: 'Insignia / Sticker', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
        case 'digital':
            return { label: 'Recurso Digital', class: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
        default:
            return { label: cat, class: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
};
</script>

<template>
    <Head :title="`FabCoins & Recompensas — ${squad.name}`" />

    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
        <!-- TOPBAR -->
        <header class="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3">
            <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <Link
                        :href="route('student.hud')"
                        class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
                    >
                        <ArrowLeft class="w-4 h-4" />
                        <span class="hidden sm:inline">Volver al HUD</span>
                    </Link>
                    <div>
                        <div class="flex items-center gap-2">
                            <Coins class="w-5 h-5 text-amber-400" />
                            <h1 class="font-black text-lg text-white">Economía FabCoins</h1>
                        </div>
                        <p class="text-xs text-slate-400">
                            {{ squad.name }} • {{ squad.classroom_name }}
                        </p>
                    </div>
                </div>

                <!-- Billetera Balance Hero -->
                <div class="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 shadow-lg shadow-amber-950/30">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                        <Coins class="w-5 h-5" />
                    </div>
                    <div>
                        <p class="text-[9px] font-bold uppercase tracking-wider text-amber-400/80 leading-none">Balance Disponible</p>
                        <p class="text-xl font-mono font-black text-amber-300 leading-tight">
                            {{ squad.fabcoins_balance }} <span class="text-xs font-normal">FC</span>
                        </p>
                    </div>
                </div>
            </div>
        </header>

        <!-- MAIN CONTAINER -->
        <main class="max-w-6xl mx-auto w-full p-4 lg:p-8 flex-1 space-y-6">

            <!-- FLASH ALERTS -->
            <div v-if="$page.props.flash?.success" class="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{{ $page.props.flash.success }}</span>
            </div>
            <div v-if="$page.props.errors && Object.keys($page.props.errors).length" class="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-bold space-y-1 animate-fade-in">
                <div v-for="(err, key) in $page.props.errors" :key="key" class="flex items-center gap-2">
                    <AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
                    <span>{{ err }}</span>
                </div>
            </div>

            <!-- TABS NAVIGATION -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
                <button
                    type="button"
                    @click="activeTab = 'store'"
                    :class="[
                        'px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2',
                        activeTab === 'store'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    ]"
                >
                    <ShoppingBag class="w-4 h-4" />
                    <span>Tienda de Recompensas</span>
                </button>

                <button
                    type="button"
                    @click="activeTab = 'history'"
                    :class="[
                        'px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2',
                        activeTab === 'history'
                            ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    ]"
                >
                    <History class="w-4 h-4" />
                    <span>Libro Contable (Historial)</span>
                    <span v-if="history.length" class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 font-mono">
                        {{ history.length }}
                    </span>
                </button>

                <button
                    type="button"
                    @click="activeTab = 'ranking'"
                    :class="[
                        'px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2',
                        activeTab === 'ranking'
                            ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-slate-950 shadow-md shadow-purple-500/20'
                            : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    ]"
                >
                    <Trophy class="w-4 h-4" />
                    <span>Ranking del Aula</span>
                </button>
            </div>

            <!-- TAB 1: TIENDA DE RECOMPENSAS -->
            <section v-if="activeTab === 'store'" class="space-y-6 animate-fade-in">
                <!-- Canjes pendientes banner -->
                <div v-if="pendingRedemptions.length" class="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2">
                    <div class="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Clock class="w-4 h-4 animate-pulse" />
                        <span>Canjes Pendientes de Aprobación por el Docente:</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <div
                            v-for="p in pendingRedemptions"
                            :key="p.id"
                            class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                        >
                            <div class="flex items-center gap-2">
                                <span class="text-base">{{ p.reward_icon }}</span>
                                <span class="font-bold text-white truncate max-w-[140px]">{{ p.reward_name?.es }}</span>
                            </div>
                            <span :class="['text-[10px] px-2 py-0.5 rounded-full border font-bold', p.status_badge.class]">
                                {{ p.status_badge.label }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Grid de Catálogo -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div
                        v-for="item in catalog"
                        :key="item.id"
                        class="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 shadow-xl transition flex flex-col justify-between group space-y-4"
                    >
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">{{ item.icon }}</span>
                                <span :class="['text-[10px] px-2.5 py-0.5 rounded-full border font-bold', getCategoryBadge(item.category).class]">
                                    {{ getCategoryBadge(item.category).label }}
                                </span>
                            </div>

                            <div>
                                <h3 class="font-black text-white text-base group-hover:text-amber-300 transition">
                                    {{ item.name?.es }}
                                </h3>
                                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                                    {{ item.description?.es }}
                                </p>
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                            <div>
                                <p class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Costo</p>
                                <p class="text-base font-mono font-black text-amber-300">
                                    {{ item.cost }} <span class="text-xs font-normal">FC</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                @click="openRedeemConfirm(item)"
                                :disabled="squad.fabcoins_balance < item.cost || !item.has_stock"
                                :class="[
                                    'px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md',
                                    squad.fabcoins_balance >= item.cost && item.has_stock
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                ]"
                            >
                                <Gift class="w-3.5 h-3.5" />
                                <span>{{ !item.has_stock ? 'Agotado' : squad.fabcoins_balance < item.cost ? 'FC Insuficientes' : 'Canjear' }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TAB 2: HISTORIAL / LIBRO CONTABLE -->
            <section v-else-if="activeTab === 'history'" class="space-y-4 animate-fade-in">
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-base font-black text-white flex items-center gap-2">
                                <History class="w-5 h-5 text-cyan-400" />
                                <span>Libro Contable de la Escuadra</span>
                            </h2>
                            <p class="text-xs text-slate-400">Auditoría completa de cada FabCoin ingresado o gastado.</p>
                        </div>
                    </div>

                    <div v-if="!history.length" class="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                        Aún no hay transacciones registradas.
                    </div>

                    <div v-else class="divide-y divide-slate-800/80">
                        <div
                            v-for="tx in history"
                            :key="tx.id"
                            class="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-850/50 px-2 rounded-xl transition"
                        >
                            <div class="flex items-center gap-3 min-w-0">
                                <div :class="[
                                    'w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0',
                                    tx.amount > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                                ]">
                                    <ArrowUpRight v-if="tx.amount > 0" class="w-4 h-4" />
                                    <ArrowDownLeft v-else class="w-4 h-4" />
                                </div>
                                <div class="min-w-0">
                                    <p class="font-bold text-white truncate">{{ tx.description }}</p>
                                    <p class="text-[10px] text-slate-500 font-mono">{{ tx.created_at }}</p>
                                </div>
                            </div>

                            <div class="text-right shrink-0">
                                <p :class="['font-mono font-black text-sm', tx.amount > 0 ? 'text-emerald-400' : 'text-red-400']">
                                    {{ tx.amount > 0 ? `+${tx.amount}` : tx.amount }} FC
                                </p>
                                <p class="text-[10px] font-mono text-slate-500">Saldo: {{ tx.balance_after }} FC</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TAB 3: RANKING DEL AULA -->
            <section v-else-if="activeTab === 'ranking'" class="space-y-4 animate-fade-in">
                <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                    <div>
                        <h2 class="text-base font-black text-white flex items-center gap-2">
                            <Trophy class="w-5 h-5 text-amber-400" />
                            <span>Tabla de Clasificación: {{ squad.classroom_name }}</span>
                        </h2>
                        <p class="text-xs text-slate-400">Escuadras ordenadas por balance acumulado de FabCoins y XP.</p>
                    </div>

                    <div class="space-y-2">
                        <div
                            v-for="item in ranking"
                            :key="item.id"
                            :class="[
                                'p-4 rounded-2xl border flex items-center justify-between transition',
                                item.id === squad.id
                                    ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/20'
                                    : 'bg-slate-950/60 border-slate-800'
                            ]"
                        >
                            <div class="flex items-center gap-3">
                                <div :class="[
                                    'w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0',
                                    item.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30' :
                                    item.rank === 2 ? 'bg-slate-300 text-slate-950' :
                                    item.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                                ]">
                                    {{ item.rank }}
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <p class="font-black text-white text-sm">{{ item.name }}</p>
                                        <span v-if="item.id === squad.id" class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                                            Tu Escuadra
                                        </span>
                                    </div>
                                    <p class="text-[11px] text-slate-400">{{ item.member_count }} Hacedores • {{ item.total_xp }} XP total</p>
                                </div>
                            </div>

                            <div class="text-right">
                                <p class="text-base font-mono font-black text-amber-300">{{ item.fabcoins_balance }} <span class="text-xs font-normal">FC</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- MODAL CONFIRMACIÓN DE CANJE -->
        <div
            v-if="selectedReward"
            class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
            <div class="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                <div class="text-center space-y-2">
                    <span class="text-4xl inline-block p-3 rounded-2xl bg-slate-950 border border-slate-800">{{ selectedReward.icon }}</span>
                    <h3 class="text-lg font-black text-white">¿Confirmar Canje?</h3>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        Estás a punto de canjear <strong class="text-white">{{ selectedReward.name?.es }}</strong>.
                    </p>
                </div>

                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-400">
                        <span>Costo:</span>
                        <span class="font-mono font-bold text-amber-400">-{{ selectedReward.cost }} FC</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>Saldo actual:</span>
                        <span class="font-mono font-bold text-white">{{ squad.fabcoins_balance }} FC</span>
                    </div>
                    <div class="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                        <span>Saldo restante:</span>
                        <span class="font-mono font-bold text-emerald-400">{{ squad.fabcoins_balance - selectedReward.cost }} FC</span>
                    </div>
                </div>

                <div class="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        @click="selectedReward = null"
                        class="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        @click="submitRedeem"
                        :disabled="isRedeeming"
                        class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                    >
                        <Check class="w-4 h-4" />
                        <span>{{ isRedeeming ? 'Canjeando...' : 'Confirmar Canje' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
