import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Fleet, PlanetSkin, SavedFleet, Techs } from '../types';

const STORAGE_KEY = 'gaw.savedFleets';

function readStorage(): SavedFleet[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFleet[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(fleets: SavedFleet[]) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fleets));
  } catch {
    // Ignore les erreurs de quota / navigation privée.
  }
}

function makeId(): string {
  return `fleet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useFleetStore = defineStore('fleets', () => {
  const fleets = ref<SavedFleet[]>(readStorage());

  function saveFleet(name: string, ships: Fleet, techs: Techs, planetSkin?: PlanetSkin) {
    const cleanName = name.trim();
    if (!cleanName) return;
    const id = makeId();
    fleets.value = [{ id, name: cleanName, ships, techs, planetSkin }, ...fleets.value];
    writeStorage(fleets.value);
  }

  function loadFleet(id: string): SavedFleet | undefined {
    return fleets.value.find((fleet) => fleet.id === id);
  }

  function deleteFleet(id: string) {
    fleets.value = fleets.value.filter((fleet) => fleet.id !== id);
    writeStorage(fleets.value);
  }

  return { fleets, saveFleet, loadFleet, deleteFleet };
});
