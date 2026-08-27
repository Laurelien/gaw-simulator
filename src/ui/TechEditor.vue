<script setup lang="ts">
import type { Mods, PlanetSkin, Techs } from '../types';
import { combinedTechPercent, type TechStat } from '../lib/tech';

const props = defineProps<{ techs: Techs; planetSkin: PlanetSkin }>();
const emit = defineEmits<{ update: [techs: Techs] }>();

type ModKey = keyof Mods;

const STATS: { key: TechStat; label: string }[] = [
  { key: 'weapon', label: 'Weapon' },
  { key: 'shield', label: 'Shield' },
  { key: 'armor', label: 'Armor' },
];

function combinedPercent(stat: TechStat): number {
  return combinedTechPercent(props.techs, props.planetSkin, stat);
}

function setMod(stat: TechStat, mod: ModKey, value: number) {
  const next: Techs = {
    weapon: { ...props.techs.weapon },
    shield: { ...props.techs.shield },
    armor: { ...props.techs.armor },
  };
  next[stat][mod] = value;
  emit('update', next);
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="stat in STATS" :key="stat.key" class="rounded-box bg-base-200 p-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold capitalize">{{ stat.label }}</h3>
        <div class="flex items-center gap-2">
          <span class="badge badge-primary badge-sm tabular-nums">
            +{{ combinedPercent(stat.key) }}%
          </span>
          <span v-if="stat.key === 'armor'" class="badge badge-ghost badge-sm">no combat effect</span>
        </div>
      </div>

      <div class="mt-2 space-y-1">
        <label class="flex items-center gap-2 text-sm">
          <span class="w-20 shrink-0 text-base-content/70">Player</span>
          <input
            type="range"
            min="0"
            max="200"
            step="10"
            class="range range-primary range-xs"
            :value="props.techs[stat.key].player"
            @input="setMod(stat.key, 'player', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="w-10 shrink-0 text-right tabular-nums">{{ props.techs[stat.key].player }}</span>
        </label>

        <label class="flex items-center gap-2 text-sm">
          <span class="w-20 shrink-0 text-base-content/70">Alliance</span>
          <input
            type="range"
            min="0"
            max="70"
            step="1"
            class="range range-primary range-xs"
            :value="props.techs[stat.key].alliance"
            @input="setMod(stat.key, 'alliance', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="w-10 shrink-0 text-right tabular-nums">{{ props.techs[stat.key].alliance }}</span>
        </label>

        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <span class="w-20 shrink-0 text-base-content/70">Buff</span>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            :checked="props.techs[stat.key].buff === 20"
            @change="setMod(stat.key, 'buff', ($event.target as HTMLInputElement).checked ? 20 : 0)"
          />
          <span class="w-10 shrink-0 text-right tabular-nums">{{ props.techs[stat.key].buff }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
