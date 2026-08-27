<script setup lang="ts">
import { computed } from 'vue';
import { useBattleStore } from '../state/battle';
import { fleetTotal } from '../lib/fleet';
import {
  computeDebris,
  computeFleetValue,
  computeLossValue,
  computeVerdict,
  getAdvice,
} from '../engine/index.js';
import type { Advice, BattleResult, Debris, MonteCarloResult, Verdict, Winner } from '../types';
import VerdictBar from '../ui/VerdictBar.vue';

const battle = useBattleStore();

const WINNER_LABEL: Record<Winner, string> = {
  attacker: 'Attacker wins',
  defender: 'Defender wins',
  draw: 'égalité (6 rounds)',
};

const WINNER_ALERT: Record<Winner, string> = {
  attacker: 'alert-success',
  defender: 'alert-error',
  draw: 'alert-warning',
};

const fmtPct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const singleResult = computed<BattleResult | null>(() =>
  battle.mode === 'single' && battle.result ? (battle.result as BattleResult) : null,
);
const mcResult = computed<MonteCarloResult | null>(() =>
  battle.mode === 'monte-carlo' && battle.result ? (battle.result as MonteCarloResult) : null,
);

const initialAttacker = computed(() => fleetTotal(battle.fleetA));
const initialDefender = computed(() => fleetTotal(battle.fleetB));

// Issue single-run.
const winnerLabel = computed(() =>
  singleResult.value ? WINNER_LABEL[singleResult.value.winner] : '',
);
const winnerAlert = computed(() =>
  singleResult.value ? WINNER_ALERT[singleResult.value.winner] : 'alert-info',
);
const winnerSeed = computed(() => singleResult.value?.seed ?? 0);

// Issue Monte Carlo.
const winProb = computed(() =>
  mcResult.value
    ? mcResult.value.winProbability
    : { attacker: 0, defender: 0, draw: 0 },
);

function lossRate(initial: number, lost: number): string {
  if (initial <= 0) return '—';
  return fmtPct.format(lost / initial);
}

// Pertes single-run.
const singleAttackerLost = computed(() =>
  singleResult.value
    ? Math.max(0, initialAttacker.value - fleetTotal(singleResult.value.survivors.attacker))
    : 0,
);
const singleDefenderLost = computed(() =>
  singleResult.value
    ? Math.max(0, initialDefender.value - fleetTotal(singleResult.value.survivors.defender))
    : 0,
);
const singleAttackerPct = computed(() =>
  singleResult.value ? lossRate(initialAttacker.value, singleAttackerLost.value) : '—',
);
const singleDefenderPct = computed(() =>
  singleResult.value ? lossRate(initialDefender.value, singleDefenderLost.value) : '—',
);

// Pertes Monte Carlo (moyenne + intervalle 5–95).
const mcAttackerMeanPct = computed(() =>
  mcResult.value ? lossRate(initialAttacker.value, mcResult.value.totalLosses.attacker.mean) : '—',
);
const mcAttackerP5Pct = computed(() =>
  mcResult.value ? lossRate(initialAttacker.value, mcResult.value.totalLosses.attacker.p5) : '—',
);
const mcAttackerP95Pct = computed(() =>
  mcResult.value ? lossRate(initialAttacker.value, mcResult.value.totalLosses.attacker.p95) : '—',
);
const mcDefenderMeanPct = computed(() =>
  mcResult.value ? lossRate(initialDefender.value, mcResult.value.totalLosses.defender.mean) : '—',
);
const mcDefenderP5Pct = computed(() =>
  mcResult.value ? lossRate(initialDefender.value, mcResult.value.totalLosses.defender.p5) : '—',
);
const mcDefenderP95Pct = computed(() =>
  mcResult.value ? lossRate(initialDefender.value, mcResult.value.totalLosses.defender.p95) : '—',
);

const wasReduced = computed(() =>
  mcResult.value != null && mcResult.value.runs < battle.requestedRuns,
);

// --- Verdict de combat (débris + barre « vaut le coup », docs/specs/battle-verdict.md) ---
// Valeur de la flotte attaquante = Σ (effectif × coût total unitaire), proxy du score (spec §4).
const attackerFleetValue = computed(() => computeFleetValue(battle.fleetA));

// Single run : débris et verdict sur le `BattleResult` direct.
const singleDebris = computed<Debris | null>(() =>
  singleResult.value ? computeDebris(singleResult.value) : null,
);
const singleLossValue = computed(() =>
  singleResult.value ? computeLossValue(singleResult.value, battle.fleetA) : 0,
);
const singleLossRate = computed(() =>
  attackerFleetValue.value > 0 ? singleLossValue.value / attackerFleetValue.value : 0,
);
const singleVerdict = computed<Verdict | null>(() =>
  singleResult.value ? computeVerdict(singleResult.value.winner, singleLossRate.value) : null,
);

// Monte Carlo : débris et verdict sur le rapport médian (spec battle-verdict §Partie 2).
const mcDebris = computed<Debris | null>(() =>
  mcResult.value ? computeDebris(mcResult.value.medianReport) : null,
);
const mcLossValue = computed(() =>
  mcResult.value ? computeLossValue(mcResult.value.medianReport, battle.fleetA) : 0,
);
const mcLossRate = computed(() =>
  attackerFleetValue.value > 0 ? mcLossValue.value / attackerFleetValue.value : 0,
);
const mcVerdict = computed<Verdict | null>(() =>
  mcResult.value ? computeVerdict(mcResult.value.medianReport.winner, mcLossRate.value) : null,
);

// Accès unifiés pour le template (une seule source selon le mode).
const debris = computed<Debris | null>(() => singleDebris.value ?? mcDebris.value);
const lossValue = computed(() => (singleResult.value ? singleLossValue.value : mcLossValue.value));
const lossRateFraction = computed(() =>
  singleResult.value ? singleLossRate.value : mcLossRate.value,
);
const verdict = computed<Verdict | null>(() => singleVerdict.value ?? mcVerdict.value);

// --- Conseil stratégique (docs/specs/strategic-advice.md) ---
// Basé sur les flottes (pas sur le résultat) : counters rapid fire + tampon light_fighter.
const advice = computed<Advice[]>(() => getAdvice(battle.fleetA, battle.fleetB));
</script>

<template>
  <div class="mx-auto max-w-md px-3 py-4 pb-12 lg:max-w-3xl">
    <header class="mb-4 flex items-center justify-between gap-2">
      <h1 class="text-2xl font-bold">Result</h1>
      <router-link to="/setup" class="btn btn-sm btn-ghost">Back to setup</router-link>
    </header>

    <!-- Progression -->
    <div v-if="battle.status === 'loading'" class="rounded-box bg-base-200 p-8 text-center">
      <p class="font-semibold">
        {{ battle.mode === 'monte-carlo' ? 'Running Monte Carlo…' : 'Simulating…' }}
      </p>

      <template v-if="battle.mode === 'monte-carlo'">
        <progress
          class="progress progress-primary mt-4 w-full"
          :value="battle.progressPercent"
          max="100"
        ></progress>
        <p class="mt-2 text-xs text-base-content/60">
          {{ battle.progress?.completed ?? 0 }} /
          {{ battle.progress?.total ?? battle.requestedRuns }} runs
        </p>
      </template>
      <span v-else class="loading loading-spinner loading-lg mt-4"></span>
    </div>

    <!-- Erreur -->
    <div v-else-if="battle.status === 'error'" class="rounded-box bg-base-200 p-8 text-center">
      <p class="font-semibold text-error">Simulation failed.</p>
      <router-link to="/setup" class="btn btn-sm btn-ghost mt-3">Back to setup</router-link>
    </div>

    <!-- Résultat -->
    <div v-else-if="battle.result" class="space-y-3">
      <!-- Issue -->
      <div v-if="singleResult" class="alert justify-center" :class="winnerAlert">
        <div class="text-center">
          <h2 class="text-xl font-bold">{{ winnerLabel }}</h2>
          <p class="mt-1 text-xs opacity-70">seed {{ winnerSeed }}</p>
        </div>
      </div>

      <div v-else-if="mcResult" class="rounded-box bg-base-200 p-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Win probability</h3>
          <p class="text-xs text-base-content/60">
            {{ fmtInt.format(mcResult.runs) }} runs ·
            {{ (mcResult.elapsedMs / 1000).toFixed(1) }} s
            <span v-if="wasReduced" class="badge badge-warning badge-sm ml-1">
              auto-reduced (N = {{ mcResult.runs }})
            </span>
          </p>
        </div>
        <div class="mt-2 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-success/15 p-2">
            <p class="text-xs font-medium text-success">Attacker</p>
            <p class="text-lg font-bold tabular-nums">{{ fmtPct.format(winProb.attacker) }}</p>
          </div>
          <div class="rounded-lg bg-error/15 p-2">
            <p class="text-xs font-medium text-error">Defender</p>
            <p class="text-lg font-bold tabular-nums">{{ fmtPct.format(winProb.defender) }}</p>
          </div>
          <div class="rounded-lg bg-warning/15 p-2">
            <p class="text-xs font-medium text-warning">Draw</p>
            <p class="text-lg font-bold tabular-nums">{{ fmtPct.format(winProb.draw) }}</p>
          </div>
        </div>
      </div>

      <!-- Taux de perte -->
      <div v-if="singleResult" class="rounded-box bg-base-200 p-3">
        <h3 class="font-semibold">Loss rate</h3>
        <div class="mt-2 grid grid-cols-2 gap-3 text-center">
          <div class="rounded-lg bg-primary/10 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide">Attacker</p>
            <p class="text-2xl font-bold tabular-nums">{{ singleAttackerPct }}</p>
            <p class="mt-1 text-xs text-base-content/60">
              {{ singleAttackerLost.toLocaleString() }} lost
            </p>
          </div>
          <div class="rounded-lg bg-base-300/40 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide">Defender</p>
            <p class="text-2xl font-bold tabular-nums">{{ singleDefenderPct }}</p>
            <p class="mt-1 text-xs text-base-content/60">
              {{ singleDefenderLost.toLocaleString() }} lost
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="mcResult" class="rounded-box bg-base-200 p-3">
        <h3 class="font-semibold">Expected loss rate</h3>
        <div class="mt-2 grid grid-cols-2 gap-3 text-center">
          <div class="rounded-lg bg-primary/10 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide">Attacker</p>
            <p class="text-2xl font-bold tabular-nums">{{ mcAttackerMeanPct }}</p>
            <p class="mt-1 text-xs tabular-nums text-base-content/60">
              {{ mcAttackerP5Pct }} – {{ mcAttackerP95Pct }}
            </p>
          </div>
          <div class="rounded-lg bg-base-300/40 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide">Defender</p>
            <p class="text-2xl font-bold tabular-nums">{{ mcDefenderMeanPct }}</p>
            <p class="mt-1 text-xs tabular-nums text-base-content/60">
              {{ mcDefenderP5Pct }} – {{ mcDefenderP95Pct }}
            </p>
          </div>
        </div>
      </div>

      <!-- Verdict « vaut le coup » (issue + valeur des pertes) -->
      <div v-if="verdict" class="rounded-box bg-base-200 p-3">
        <VerdictBar :verdict="verdict" />
        <p class="mt-2 text-xs text-base-content/60">
          <template v-if="mcResult">Median report — </template>
          attacker lost {{ fmtInt.format(lossValue) }} resources
          ({{ fmtPct.format(lossRateFraction) }} of fleet value)
        </p>
      </div>

      <!-- Débris potentiels -->
      <div v-if="debris" class="rounded-box bg-base-200 p-3">
        <h3 class="font-semibold">Potential debris</h3>
        <p class="mt-1 text-sm tabular-nums">
          {{ fmtInt.format(debris.metal) }} metal / {{ fmtInt.format(debris.crystal) }} crystal
        </p>
        <p class="mt-1 text-xs text-base-content/60">may vary (ships rebuilt)</p>
      </div>

      <!-- Conseil stratégique -->
      <div v-if="advice.length" class="rounded-box bg-base-200 p-3">
        <h3 class="font-semibold">Strategic advice</h3>
        <ul class="mt-2 space-y-2">
          <li v-for="(item, i) in advice" :key="i" class="flex items-start gap-2">
            <span
              class="badge badge-sm mt-0.5 shrink-0"
              :class="item.type === 'counter' ? 'badge-info' : 'badge-warning'"
            >
              {{ item.type === 'counter' ? 'Counter' : 'Buffer' }}
            </span>
            <span class="text-sm text-base-content/80">{{ item.message }}</span>
          </li>
        </ul>
      </div>

      <!-- Partage (hors scope) -->
      <div class="rounded-box bg-base-200 p-3 text-center">
        <h3 class="font-semibold">Share</h3>
        <p class="mt-1 text-sm text-base-content/50">Coming soon</p>
      </div>

      <!-- CTAs -->
      <div class="flex gap-2">
        <router-link to="/report" class="btn btn-primary flex-1">View full report</router-link>
        <router-link to="/setup" class="btn btn-ghost flex-1">Back to setup</router-link>
      </div>
    </div>

    <!-- Aucun résultat (ne devrait pas arriver grâce à la garde) -->
    <div v-else class="rounded-box bg-base-200 p-8 text-center">
      <p class="text-base-content/50">No result yet.</p>
      <router-link to="/setup" class="btn btn-sm btn-primary mt-3">Go to setup</router-link>
    </div>
  </div>
</template>
