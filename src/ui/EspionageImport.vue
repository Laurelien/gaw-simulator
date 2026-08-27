<script setup lang="ts">
import { ref } from 'vue';
import type { Fleet } from '../types';
import { ocrEspionageReport } from '../ocr';
import type { EspionageReport } from '../ocr';
import EspionageReview from './EspionageReview.vue';

const emit = defineEmits<{ apply: [fleet: Fleet] }>();

// `showTrigger === false` masque le bouton « Import from screenshot » pour permettre à
// la toolbox de déclencher l'import elle-même via `pick()` (exposé ci-dessous).
withDefaults(defineProps<{ showTrigger?: boolean }>(), { showTrigger: true });

// Expose la sélection de fichier à l'extérieur (utilisé par la toolbox du défenseur).
defineExpose({ pick });

const status = ref<'idle' | 'loading' | 'error'>('idle');
const report = ref<EspionageReport | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

function pick(): void {
  fileInput.value?.click();
}

async function onFile(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  // Réinitialise l'input pour permettre de re-sélectionner le même fichier.
  target.value = '';
  if (!file) return;

  status.value = 'loading';
  report.value = null;

  try {
    report.value = await ocrEspionageReport(file);
    status.value = 'idle';
  } catch (err) {
    status.value = 'error';
    // Détail technique loggé, message clair affiché à l'utilisateur.
    console.error('OCR import failed', err);
  }
}

function apply(fleet: Fleet): void {
  report.value = null;
  emit('apply', fleet);
}

function cancel(): void {
  report.value = null;
}
</script>

<template>
  <div class="space-y-2">
    <button
      v-if="showTrigger"
      class="btn btn-outline btn-sm w-full"
      :disabled="status === 'loading'"
      @click="pick"
    >
      Import from screenshot
    </button>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFile"
    />

    <p v-if="showTrigger" class="text-xs text-base-content/50">
      Ships &amp; defenses are imported — techs are skipped.
    </p>

    <p v-if="status === 'error'" class="text-sm text-error">
      Could not read the screenshot. Try another image.
    </p>

    <!-- Indicateur de chargement OCR : visible aussi depuis la toolbox (bouton masqué). -->
    <div
      v-if="status === 'loading'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-base-100/70"
    >
      <div class="flex items-center gap-3 rounded-box bg-base-200 px-5 py-4 shadow-lg">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <span class="text-sm font-medium">Reading screenshot…</span>
      </div>
    </div>

    <EspionageReview v-if="report" :report="report" @apply="apply" @cancel="cancel" />
  </div>
</template>
