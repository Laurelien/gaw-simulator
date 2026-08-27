<script setup lang="ts">
import { computed } from 'vue';
import { useBattleStore } from '../state/battle';
import { extractReportResult } from '../lib/result';
import type { BattleResult } from '../types';
import BattleReport from '../ui/BattleReport.vue';

const battle = useBattleStore();

// Single run : le `BattleResult` direct. Monte Carlo : le rapport médian.
const reportResult = computed<BattleResult | null>(() =>
  battle.result ? extractReportResult(battle.result) : null,
);
</script>

<template>
  <div class="mx-auto max-w-md px-3 py-4 pb-12 lg:max-w-3xl">
    <header class="mb-4 flex items-center justify-between gap-2">
      <h1 class="text-xl font-bold">
        {{ battle.mode === 'monte-carlo' ? 'Median battle report' : 'Battle report' }}
      </h1>
      <div class="flex gap-1">
        <router-link to="/result" class="btn btn-sm btn-ghost">Result</router-link>
        <router-link to="/setup" class="btn btn-sm btn-ghost">Setup</router-link>
      </div>
    </header>

    <BattleReport :result="reportResult" />
  </div>
</template>
