<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { Fleet } from '../types';
import type { EspionageReport } from '../ocr/parseReport';
import { shipLabel } from '../data/ships';

const props = defineProps<{ report: EspionageReport }>();
const emit = defineEmits<{ apply: [fleet: Fleet]; cancel: [] }>();

interface Entry {
  name: string;
  label: string;
  count: number;
}

// Copie éditable des vaisseaux extraits : l'utilisateur corrige les erreurs d'OCR
// (effectifs) avant d'appliquer.
const entries = reactive<Entry[]>([]);

function init(): void {
  entries.splice(0, entries.length);
  for (const [name, count] of Object.entries(props.report.ships)) {
    entries.push({ name, label: shipLabel(name), count: Number(count) || 0 });
  }
}

watch(() => props.report, init, { immediate: true });

function apply(): void {
  const fleet: Fleet = {};
  for (const entry of entries) {
    const n = Math.floor(Number(entry.count));
    if (Number.isFinite(n) && n > 0) fleet[entry.name] = n;
  }
  emit('apply', fleet);
}
</script>

<template>
  <div class="modal modal-open" @click.self="emit('cancel')">
    <div class="modal-box max-w-2xl">
      <h3 class="text-lg font-bold">Review imported units</h3>
      <p class="mt-1 text-xs text-info">
        OCR works with English reports only (for now).
      </p>
      <p class="text-sm text-base-content/60">
        Check and correct the extracted counts before applying them to the defender.
      </p>

      <div class="mt-4 max-h-96 space-y-1 overflow-y-auto">
        <div
          v-for="entry in entries"
          :key="entry.name"
          class="flex items-center justify-between gap-3 rounded-lg bg-base-200/60 px-3 py-1.5"
        >
          <span class="min-w-0 flex-1 text-sm font-medium">{{ entry.label }}</span>
          <input
            v-model.number="entry.count"
            type="number"
            min="0"
            step="1"
            class="input input-bordered input-xs w-32 text-right tabular-nums"
          />
        </div>
        <p v-if="entries.length === 0" class="py-2 text-sm text-base-content/50">
          No units found.
        </p>
      </div>

      <!-- Lignes non reconnues : repliées par défaut, sous les vaisseaux. -->
      <details
        v-if="report.unrecognizedLines.length"
        class="collapse collapse-arrow mt-3 rounded-lg bg-base-200/60"
      >
        <summary class="collapse-title text-sm font-medium">
          {{ report.unrecognizedLines.length }} unrecognized line(s)
        </summary>
        <div class="collapse-content text-sm text-base-content/70">
          <ul class="list-inside list-disc">
            <li v-for="(line, i) in report.unrecognizedLines" :key="i">{{ line }}</li>
          </ul>
        </div>
      </details>

      <div
        v-if="report.duplicates.length"
        class="mt-3 rounded-lg bg-info/10 p-2 text-sm text-info"
      >
        <p class="font-semibold">Duplicates (last value kept):</p>
        <ul class="mt-1 list-inside list-disc">
          <li v-for="(name, i) in report.duplicates" :key="i">{{ name }}</li>
        </ul>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost btn-sm" @click="emit('cancel')">Cancel</button>
        <button class="btn btn-primary btn-sm" :disabled="entries.length === 0" @click="apply">
          Apply
        </button>
      </div>
    </div>
  </div>
</template>
