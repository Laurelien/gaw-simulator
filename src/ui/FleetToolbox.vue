<script setup lang="ts">
import { ref } from 'vue';
import type { Fleet, PlanetSkin, Side, Techs } from '../types';
import { cloneFleet, cloneTechs } from '../lib/clone';
import { useBattleStore } from '../state/battle';
import { useFleetStore } from '../state/fleets';

const props = defineProps<{ side: Side }>();
const emit = defineEmits<{ import: [] }>();

const battle = useBattleStore();
const fleets = useFleetStore();

const saveOpen = ref(false);
const loadOpen = ref(false);
const name = ref('');

function currentFleet(): Fleet {
  return props.side === 'attacker' ? battle.fleetA : battle.fleetB;
}

function currentTechs(): Techs {
  return props.side === 'attacker' ? battle.techA : battle.techB;
}

function currentSkin(): PlanetSkin {
  return props.side === 'defender' ? battle.planetSkin : 'none';
}

// Ferme le menu (dropdown basé sur le focus) avant d'ouvrir une modale / de déclencher
// l'import, sinon le menu resterait ouvert derrière.
function closeMenu(): void {
  (document.activeElement as HTMLElement | null)?.blur();
}

function openSave(): void {
  closeMenu();
  name.value = '';
  saveOpen.value = true;
}

function openLoad(): void {
  closeMenu();
  loadOpen.value = true;
}

function triggerImport(): void {
  closeMenu();
  emit('import');
}

function save(): void {
  if (!name.value.trim()) return;
  fleets.saveFleet(
    name.value,
    cloneFleet(currentFleet()),
    cloneTechs(currentTechs()),
    props.side === 'defender' ? currentSkin() : undefined,
  );
  name.value = '';
  saveOpen.value = false;
}

function load(id: string): void {
  const saved = fleets.loadFleet(id);
  if (!saved) return;
  battle.setFleet(props.side, cloneFleet(saved.ships));
  battle.setTechs(props.side, cloneTechs(saved.techs));
  if (props.side === 'defender') battle.setSkin(saved.planetSkin ?? 'none');
  loadOpen.value = false;
}

function removeFleet(id: string, fleetName: string): void {
  if (window.confirm(`Delete "${fleetName}"?`)) {
    fleets.deleteFleet(id);
  }
}
</script>

<template>
  <div>
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-xs">
        Toolbox
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <ul
        tabindex="0"
        class="dropdown-content menu z-20 mt-1 w-56 rounded-box bg-base-100 p-2 shadow"
      >
        <li><button @click="openSave">Save fleet</button></li>
        <li><button @click="openLoad">Load fleet</button></li>
        <li v-if="side === 'defender'"><button @click="triggerImport">Import screenshot</button></li>
      </ul>
    </div>

    <!-- Save fleet (boîte de nom) -->
    <div class="modal" :class="{ 'modal-open': saveOpen }">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Save fleet</h3>
        <p class="text-sm text-base-content/60">Save the current {{ side }} fleet.</p>
        <input
          v-model="name"
          class="input input-bordered input-sm mt-3 w-full"
          placeholder="Fleet name"
          @keyup.enter="save"
        />
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="saveOpen = false">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="!name.trim()" @click="save">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Load fleet (liste des flottes sauvegardées) -->
    <div class="modal" :class="{ 'modal-open': loadOpen }">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Load fleet</h3>
        <p v-if="fleets.fleets.length === 0" class="py-2 text-sm text-base-content/50">
          No saved fleets yet.
        </p>
        <ul v-else class="mt-2 max-h-80 space-y-1 overflow-y-auto">
          <li
            v-for="fleet in fleets.fleets"
            :key="fleet.id"
            class="flex items-center gap-2 rounded-lg bg-base-200/60 px-2 py-1"
          >
            <span class="min-w-0 flex-1 truncate text-sm">{{ fleet.name }}</span>
            <button class="btn btn-ghost btn-xs" @click="load(fleet.id)">Load</button>
            <button class="btn btn-ghost btn-xs text-error" @click="removeFleet(fleet.id, fleet.name)">
              Delete
            </button>
          </li>
        </ul>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="loadOpen = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
