<script setup lang="ts">
import { computed } from 'vue';
import type { BattleResult, Fleet, Winner } from '../types';
import { buildRoundViews } from '../lib/report';
import { shipLabel as label } from '../data/ships';

const props = defineProps<{ result: BattleResult | null }>();

const WINNER_LABEL: Record<Winner, string> = {
  attacker: 'Attacker wins',
  defender: 'Defender wins',
  draw: 'égalité (6 rounds)',
};

// Vert = victoire (attaquant), rouge = défaite, jaune = égalité.
const WINNER_ALERT: Record<Winner, string> = {
  attacker: 'alert-success',
  defender: 'alert-error',
  draw: 'alert-warning',
};

const fmt = new Intl.NumberFormat('en-US');

function n(value: number): string {
  return fmt.format(value);
}

function sumLosses(fleet: Fleet): number {
  let total = 0;
  for (const value of Object.values(fleet)) {
    const count = Math.floor(Number(value));
    if (Number.isFinite(count) && count > 0) total += count;
  }
  return total;
}

const roundViews = computed(() => (props.result ? buildRoundViews(props.result) : []));

function fleetEntries(fleet: Fleet): [string, number][] {
  return Object.entries(fleet)
    .filter(([, count]) => count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));
}

const totals = computed(() => {
  const result = props.result;
  if (!result) return { attacker: 0, defender: 0 };
  let attacker = 0;
  let defender = 0;
  for (const round of result.rounds) {
    attacker += sumLosses(round.attacker.losses);
    defender += sumLosses(round.defender.losses);
  }
  return { attacker, defender };
});
</script>

<template>
  <div>
    <div v-if="!result" class="rounded-box bg-base-200 p-8 text-center text-base-content/50">
      Run a simulation to see the battle report.
    </div>

    <div v-else class="space-y-3">
      <div class="alert justify-center" :class="WINNER_ALERT[result.winner]">
        <div class="text-center">
          <h2 class="text-xl font-bold">{{ WINNER_LABEL[result.winner] }}</h2>
          <p class="mt-1 text-xs opacity-70">seed {{ result.seed }}</p>
        </div>
      </div>

      <div v-for="view in roundViews" :key="view.round" class="rounded-box bg-base-200 p-3">
        <h3 class="font-semibold">Round {{ view.round }}</h3>

        <div class="mt-2 grid grid-cols-2 gap-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">Attacker</p>
            <div v-if="view.attacker.length === 0" class="text-xs text-base-content/50">—</div>
            <div v-for="entry in view.attacker" :key="entry.name" class="mt-1">
              <div class="text-sm">
                {{ label(entry.name) }}
                <span class="tabular-nums text-base-content/80">{{ n(entry.before) }}</span>
              </div>
              <div v-if="entry.lost > 0" class="text-sm font-semibold tabular-nums text-error">
                -{{ n(entry.lost) }}
              </div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">Defender</p>
            <div v-if="view.defender.length === 0" class="text-xs text-base-content/50">—</div>
            <div v-for="entry in view.defender" :key="entry.name" class="mt-1">
              <div class="text-sm">
                {{ label(entry.name) }}
                <span class="tabular-nums text-base-content/80">{{ n(entry.before) }}</span>
              </div>
              <div v-if="entry.lost > 0" class="text-sm font-semibold tabular-nums text-error">
                -{{ n(entry.lost) }}
              </div>
            </div>
          </div>
        </div>

        <details class="collapse collapse-arrow mt-2 bg-base-300/50">
          <summary class="collapse-title text-sm font-medium">Details</summary>
          <div class="collapse-content">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="font-semibold">Attacker</p>
                <ul class="mt-1 space-y-0.5 text-xs text-base-content/80">
                  <li>attacks: {{ n(view.details.attacker.number_of_attack) }}</li>
                  <li>damage: {{ n(view.details.attacker.current_damage) }}</li>
                  <li>shield absorbed: {{ n(view.details.attacker.shield_absorption) }}</li>
                  <li>wrecks: {{ n(view.details.attacker.wreck) }}</li>
                </ul>
              </div>
              <div>
                <p class="font-semibold">Defender</p>
                <ul class="mt-1 space-y-0.5 text-xs text-base-content/80">
                  <li>attacks: {{ n(view.details.defender.number_of_attack) }}</li>
                  <li>damage: {{ n(view.details.defender.current_damage) }}</li>
                  <li>shield absorbed: {{ n(view.details.defender.shield_absorption) }}</li>
                  <li>wrecks: {{ n(view.details.defender.wreck) }}</li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>

      <div class="rounded-box bg-base-200 p-3">
        <h3 class="font-semibold">Final result</h3>
        <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="font-semibold">Attacker</p>
            <p class="text-xs text-base-content/70">survivors: {{ n(sumLosses(result.survivors.attacker)) }}</p>
            <p class="text-xs text-base-content/70">lost: {{ n(totals.attacker) }}</p>
            <ul class="mt-1 space-y-0.5 text-xs text-base-content/80">
              <li v-for="[name, count] in fleetEntries(result.survivors.attacker)" :key="name">
                {{ label(name) }}: {{ n(count) }}
              </li>
            </ul>
          </div>
          <div>
            <p class="font-semibold">Defender</p>
            <p class="text-xs text-base-content/70">survivors: {{ n(sumLosses(result.survivors.defender)) }}</p>
            <p class="text-xs text-base-content/70">lost: {{ n(totals.defender) }}</p>
            <ul class="mt-1 space-y-0.5 text-xs text-base-content/80">
              <li v-for="[name, count] in fleetEntries(result.survivors.defender)" :key="name">
                {{ label(name) }}: {{ n(count) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
