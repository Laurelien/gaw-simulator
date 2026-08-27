<script setup lang="ts">
import { computed } from 'vue';
import type { Verdict } from '../types';

// Barre « le combat vaut-il le coup » (docs/specs/battle-verdict.md §3).
// Le verdict est calculé côté `ResultView` via `computeVerdict(outcome, lossRate)` ;
// ce composant n'est que la représentation visuelle (couleur + libellé).
const props = defineProps<{ verdict: Verdict }>();

const META: Record<Verdict, { label: string; bar: string; text: string }> = {
  green: { label: 'Worth it', bar: 'bg-success', text: 'text-success' },
  yellow: { label: 'Acceptable', bar: 'bg-warning', text: 'text-warning' },
  // Pas de token DaisyUI « orange » : on retombe sur la palette Tailwind.
  orange: { label: 'Costly', bar: 'bg-orange-500', text: 'text-orange-500' },
  red: { label: 'Not worth it', bar: 'bg-error', text: 'text-error' },
};

const meta = computed(() => META[props.verdict]);
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-sm font-semibold">Worth it?</span>
      <span class="text-sm font-semibold tabular-nums" :class="meta.text">{{ meta.label }}</span>
    </div>
    <div class="mt-2 h-3 w-full overflow-hidden rounded-full bg-base-300">
      <div class="h-full w-full rounded-full transition-colors" :class="meta.bar"></div>
    </div>
  </div>
</template>
