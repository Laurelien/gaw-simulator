<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Fleet, FleetEditorUpdate, PlanetSkin, Side, Techs } from '../types';
import {
  maxFillUnits,
  maxUnits,
  shipCategory,
  shipLabel,
  shipsForSide,
  type ShipCategory,
} from '../data/ships';
import { cloneFleet, cloneTechs } from '../lib/clone';
import TechEditor from './TechEditor.vue';
import EspionageImport from './EspionageImport.vue';
import FleetToolbox from './FleetToolbox.vue';

const props = defineProps<{
  side: Side;
  fleet: Fleet;
  techs: Techs;
  planetSkin: PlanetSkin;
  otherFleet: Fleet;
  otherTechs: Techs;
}>();

const emit = defineEmits<{ update: [payload: FleetEditorUpdate] }>();

// Bordure + halo « néon » selon la catégorie du vaisseau.
const CATEGORY_STYLE: Record<ShipCategory, string> = {
  civil: 'border-sky-400/70 shadow-[0_0_10px_rgba(56,189,248,0.4)]',
  military: 'border-rose-400/70 shadow-[0_0_10px_rgba(251,113,133,0.4)]',
  defense: 'border-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.4)]',
};

const SKINS: { value: PlanetSkin; image: string; name: string; stat: string }[] = [
  { value: 'cube_world', image: 'planet_cube.png', name: 'Cube World', stat: '+30% shield' },
  { value: 'yummy_sushi', image: 'planet_sushi.png', name: 'Yummy Sushi', stat: '+30% armor' },
  { value: 'limitless_rage', image: 'planet_rage.png', name: 'Limitless Rage', stat: '+50% attack' },
  {
    value: 'technology_domination',
    image: 'planet_domination.png',
    name: 'Technology Domination',
    stat: '+30% attack',
  },
];

function count(name: string): number {
  return props.fleet[name] ?? 0;
}

function maxFor(name: string): number {
  return maxUnits(name);
}

function setCount(name: string, value: number) {
  const raw = Math.floor(Number(value));
  if (!Number.isFinite(raw)) return;
  const n = Math.min(maxFor(name), Math.max(0, raw));
  const next = { ...props.fleet };
  if (n <= 0) delete next[name];
  else next[name] = n;
  emit('update', { fleet: next });
}

function adjust(name: string, delta: number) {
  setCount(name, count(name) + delta);
}

// Dômes (max 1) : pas de grands pas ±10/±100/±1000.
function showLargeSteps(name: string): boolean {
  return maxFor(name) > 1;
}

function decrementSteps(name: string): number[] {
  return showLargeSteps(name) ? [-1000, -100, -10, -1] : [-1];
}

function incrementSteps(name: string): number[] {
  return showLargeSteps(name) ? [1, 10, 100, 1000] : [1];
}

function stepLabel(delta: number): string {
  if (delta === -1) return '-';
  if (delta === 1) return '+';
  return delta > 0 ? `+${delta}` : String(delta);
}

function onTechs(techs: Techs) {
  emit('update', { techs });
}

function onSkin(skin: PlanetSkin) {
  emit('update', { planetSkin: skin });
}

function clearFleet() {
  emit('update', { fleet: {} });
}

// Remplit le type au plafond « max » (999 999 / 99 999 / 1).
function fillMax(name: string) {
  setCount(name, maxFillUnits(name));
}

// Copie vaisseaux + technos du côté opposé. Le skin n'est pas copié.
function copyFromOther() {
  emit('update', {
    fleet: cloneFleet(props.otherFleet),
    techs: cloneTechs(props.otherTechs),
  });
}

// Déclenche l'import OCR depuis la toolbox (le bouton d'import est masqué).
const importRef = ref<{ pick: () => void } | null>(null);
function triggerImport() {
  importRef.value?.pick();
}

// Import OCR (défenseur uniquement) : remplace la flotte par les vaisseaux validés en revue.
function onImportApply(fleet: Fleet) {
  emit('update', { fleet });
}

const total = computed(() =>
  Object.values(props.fleet).reduce((sum, value) => sum + value, 0),
);

// L'attaquant ne peut pas envoyer d'unités de défense au sol.
const visibleShips = computed(() => shipsForSide(props.side));

// Le bonus de skin ne s'applique qu'au défenseur.
const effectiveSkin = computed<PlanetSkin>(() =>
  props.side === 'defender' ? props.planetSkin : 'none',
);
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-bold capitalize">{{ side }}</h2>
        <p class="text-sm text-base-content/60">{{ total.toLocaleString() }} units</p>
      </div>
      <div class="flex items-center gap-1">
        <FleetToolbox :side="side" @import="triggerImport" />
        <button class="btn btn-ghost btn-xs" @click="copyFromOther">
          Copy from {{ side === 'attacker' ? 'defender' : 'attacker' }}
        </button>
        <button class="btn btn-ghost btn-xs" @click="clearFleet">Clear</button>
      </div>
    </div>

    <EspionageImport
      v-if="side === 'defender'"
      ref="importRef"
      :show-trigger="false"
      @apply="onImportApply"
    />

    <TechEditor :techs="techs" :planet-skin="effectiveSkin" @update="onTechs" />

    <div class="space-y-1.5">
      <div
        v-for="ship in visibleShips"
        :key="ship.name"
        class="rounded-lg bg-base-200/60 px-3 py-2"
      >
        <div class="flex items-center gap-3">
          <img
            :src="`/assets/ships/${ship.image}`"
            :alt="ship.name"
            class="h-12 w-12 shrink-0 rounded border-2 object-contain"
            :class="CATEGORY_STYLE[shipCategory(ship.name)]"
            loading="lazy"
          />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ shipLabel(ship.name) }}</span>
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-center gap-1">
          <button
            v-for="delta in decrementSteps(ship.name)"
            :key="delta"
            class="btn btn-xs"
            @click="adjust(ship.name, delta)"
          >
            {{ stepLabel(delta) }}
          </button>
          <input
            type="number"
            min="0"
            :max="Number.isFinite(maxFor(ship.name)) ? maxFor(ship.name) : undefined"
            step="1"
            class="input input-bordered input-xs w-24 text-center"
            :value="count(ship.name)"
            @change="setCount(ship.name, Number(($event.target as HTMLInputElement).value))"
          />
          <button
            v-for="delta in incrementSteps(ship.name)"
            :key="delta"
            class="btn btn-xs"
            @click="adjust(ship.name, delta)"
          >
            {{ stepLabel(delta) }}
          </button>
          <button class="btn btn-xs" @click="fillMax(ship.name)">max</button>
        </div>
      </div>
    </div>

    <div v-if="side === 'defender'">
      <div class="flex items-center justify-between">
        <span class="label-text">Planet skin</span>
        <button
          type="button"
          class="btn btn-xs"
          :class="planetSkin === 'none' ? 'btn-primary' : 'btn-ghost'"
          @click="onSkin('none')"
        >
          None
        </button>
      </div>

      <div class="mt-2 grid grid-cols-4 gap-2">
        <button
          v-for="skin in SKINS"
          :key="skin.value"
          type="button"
          class="flex cursor-pointer flex-col items-center rounded-lg border-2 p-1.5 transition"
          :class="
            planetSkin === skin.value
              ? 'border-primary bg-primary/10'
              : 'border-transparent hover:border-base-300'
          "
          :title="skin.name"
          @click="onSkin(skin.value)"
        >
          <img
            :src="`/assets/planets/${skin.image}`"
            :alt="skin.name"
            class="h-12 w-12 object-contain"
          />
          <span class="mt-1 text-center text-xs font-medium leading-tight">{{ skin.stat }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
