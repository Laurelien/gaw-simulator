import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Techs } from '../src/types';
import { useFleetStore } from '../src/state/fleets';

function makeStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

const techs: Techs = {
  weapon: { player: 0, alliance: 0, buff: 0 },
  shield: { player: 0, alliance: 0, buff: 0 },
  armor: { player: 0, alliance: 0, buff: 0 },
};

describe('fleetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('localStorage', makeStorage());
  });

  it('sauvegarde et charge une flotte', () => {
    const store = useFleetStore();
    store.saveFleet('My fleet', { cruiser: 10 }, techs);
    expect(store.fleets).toHaveLength(1);
    expect(store.fleets[0].name).toBe('My fleet');
    expect(store.loadFleet(store.fleets[0].id)?.ships.cruiser).toBe(10);
  });

  it('persiste vers localStorage et recharge', () => {
    const store = useFleetStore();
    store.saveFleet('Fleet A', { battleship: 3 }, techs);

    setActivePinia(createPinia());
    const reloaded = useFleetStore();
    expect(reloaded.fleets).toHaveLength(1);
    expect(reloaded.fleets[0].name).toBe('Fleet A');
  });

  it('supprime une flotte', () => {
    const store = useFleetStore();
    store.saveFleet('Fleet A', { battleship: 1 }, techs);
    const id = store.fleets[0].id;
    store.deleteFleet(id);
    expect(store.fleets).toHaveLength(0);
  });
});
