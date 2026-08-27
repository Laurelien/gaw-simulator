import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  BattleResult,
  Fleet,
  Mods,
  MonteCarloResult,
  PlanetSkin,
  Side,
  Techs,
} from '../types';
import { isFleetEmpty } from '../lib/fleet';
import { cloneFleet, cloneTechs } from '../lib/clone';
import { stripGroundDefense } from '../data/ships';
import { runMonteCarloPooled } from '../worker/monteCarloPool';
import { runSingleBattle } from '../worker/runBattle';

export type BattleStatus = 'idle' | 'loading' | 'done' | 'error';
export type SimulationMode = 'single' | 'monte-carlo';

// Ensemble des paramètres de simulation, persisté tel quel (avec `mode` et `result`).
export type SimulationSetup = {
  fleetA: Fleet;
  fleetB: Fleet;
  techA: Techs;
  techB: Techs;
  planetSkin: PlanetSkin;
  seed: number;
  runs: number;
};

const STORAGE_KEY = 'gaw.battleState';

const PLANET_SKINS: PlanetSkin[] = [
  'none',
  'cube_world',
  'yummy_sushi',
  'limitless_rage',
  'technology_domination',
];

function emptyTechs(): Techs {
  return {
    weapon: { player: 0, alliance: 0, buff: 0 },
    shield: { player: 0, alliance: 0, buff: 0 },
    armor: { player: 0, alliance: 0, buff: 0 },
  };
}

function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

function clampRuns(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(500, Math.max(1, Math.floor(value)));
}

function emptySetup(): SimulationSetup {
  return {
    fleetA: {},
    fleetB: {},
    techA: emptyTechs(),
    techB: emptyTechs(),
    planetSkin: 'none',
    seed: randomSeed(),
    runs: 100,
  };
}

function sanitizeFleet(value: unknown): Fleet {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Fleet = {};
  for (const [name, count] of Object.entries(value as Record<string, unknown>)) {
    const n = Math.floor(Number(count));
    if (Number.isFinite(n) && n > 0) out[name] = n;
  }
  return out;
}

function sanitizeMods(value: unknown, fallback: Mods): Mods {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const source = value as Partial<Record<keyof Mods, unknown>>;
  return {
    player: typeof source.player === 'number' ? source.player : fallback.player,
    alliance: typeof source.alliance === 'number' ? source.alliance : fallback.alliance,
    buff: typeof source.buff === 'number' ? source.buff : fallback.buff,
  };
}

function sanitizeTechs(value: unknown): Techs {
  const base = emptyTechs();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  const source = value as Partial<Record<keyof Techs, unknown>>;
  return {
    weapon: sanitizeMods(source.weapon, base.weapon),
    shield: sanitizeMods(source.shield, base.shield),
    armor: sanitizeMods(source.armor, base.armor),
  };
}

function sanitizePlanetSkin(value: unknown): PlanetSkin {
  return PLANET_SKINS.includes(value as PlanetSkin) ? (value as PlanetSkin) : 'none';
}

function sanitizeSetup(value: unknown): SimulationSetup {
  const base = emptySetup();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  const source = value as Partial<SimulationSetup>;
  return {
    fleetA: sanitizeFleet(source.fleetA),
    fleetB: sanitizeFleet(source.fleetB),
    techA: sanitizeTechs(source.techA),
    techB: sanitizeTechs(source.techB),
    planetSkin: sanitizePlanetSkin(source.planetSkin),
    seed:
      typeof source.seed === 'number' && Number.isFinite(source.seed)
        ? source.seed
        : base.seed,
    runs: typeof source.runs === 'number' ? clampRuns(source.runs) : base.runs,
  };
}

function sanitizeResult(value: unknown): BattleResult | MonteCarloResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as BattleResult | MonteCarloResult;
}

type PersistedState = { setup?: unknown; mode?: unknown; result?: unknown };

function readPersisted(): PersistedState {
  try {
    if (typeof sessionStorage === 'undefined') return {};
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as PersistedState;
  } catch {
    return {};
  }
}

export const useBattleStore = defineStore('battle', () => {
  // Rechargement synchrone AVANT toute navigation : les gardes peuvent lire `result`.
  const persisted = readPersisted();

  const setup = ref<SimulationSetup>(sanitizeSetup(persisted.setup));
  const mode = ref<SimulationMode>(persisted.mode === 'monte-carlo' ? 'monte-carlo' : 'single');
  const result = ref<BattleResult | MonteCarloResult | null>(sanitizeResult(persisted.result));
  const status = ref<BattleStatus>('idle');
  const requestedRuns = ref<number>(setup.value.runs);
  const progress = ref<{ completed: number; total: number } | null>(null);

  // Identifiant de run : incrémenté à chaque changement de paramètre pour ignorer
  // le résultat d'un run devenu obsolète.
  let runId = 0;

  // Accès ergonomiques aux champs de `setup` (compatibles avec les composants existants).
  const fleetA = computed(() => setup.value.fleetA);
  const fleetB = computed(() => setup.value.fleetB);
  const techA = computed(() => setup.value.techA);
  const techB = computed(() => setup.value.techB);
  const planetSkin = computed(() => setup.value.planetSkin);
  const seed = computed(() => setup.value.seed);
  const runs = computed(() => setup.value.runs);

  const canSimulate = computed(
    () =>
      status.value !== 'loading' &&
      (!isFleetEmpty(setup.value.fleetA) || !isFleetEmpty(setup.value.fleetB)),
  );

  const progressPercent = computed(() => {
    if (!progress.value || progress.value.total <= 0) return 0;
    return Math.round((progress.value.completed / progress.value.total) * 100);
  });

  function persist() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ setup: setup.value, mode: mode.value, result: result.value }),
      );
    } catch {
      // sessionStorage indisponible (navigation privée, quota…) : on ignore.
    }
  }

  // Toute édition invalide le résultat précédent (et un éventuel run en cours).
  function invalidateRun() {
    runId++;
    status.value = 'idle';
    progress.value = null;
    result.value = null;
    persist();
  }

  function setFleet(side: Side, fleet: Fleet) {
    // L'attaquant ne peut jamais contenir d'unités de défense au sol.
    if (side === 'attacker') setup.value.fleetA = stripGroundDefense(fleet);
    else setup.value.fleetB = { ...fleet };
    invalidateRun();
  }

  function setTechs(side: Side, techs: Techs) {
    if (side === 'attacker') setup.value.techA = cloneTechs(techs);
    else setup.value.techB = cloneTechs(techs);
    invalidateRun();
  }

  function setSkin(skin: PlanetSkin) {
    setup.value.planetSkin = skin;
    invalidateRun();
  }

  function rerollSeed() {
    setup.value.seed = randomSeed();
    invalidateRun();
  }

  function setRuns(value: number) {
    setup.value.runs = clampRuns(value);
    invalidateRun();
  }

  function setMode(value: SimulationMode) {
    if (mode.value === value) return;
    mode.value = value;
    invalidateRun();
  }

  async function simulate() {
    if (status.value === 'loading') return;

    const id = ++runId;
    requestedRuns.value = mode.value === 'monte-carlo' ? setup.value.runs : 1;
    result.value = null;
    status.value = 'loading';
    progress.value = { completed: 0, total: requestedRuns.value };
    persist();

    const techBWithSkin: Techs & { planetSkin?: PlanetSkin } = {
      ...cloneTechs(setup.value.techB),
      planetSkin: setup.value.planetSkin,
    };

    try {
      if (mode.value === 'single') {
        const battle = await runSingleBattle(
          cloneFleet(setup.value.fleetA),
          cloneFleet(setup.value.fleetB),
          cloneTechs(setup.value.techA),
          techBWithSkin,
          setup.value.seed,
        );
        if (id !== runId) return;
        result.value = battle;
      } else {
        const mc = await runMonteCarloPooled(
          cloneFleet(setup.value.fleetA),
          cloneFleet(setup.value.fleetB),
          cloneTechs(setup.value.techA),
          techBWithSkin,
          { runs: setup.value.runs, seed: setup.value.seed },
          (completed, total) => {
            if (id === runId) progress.value = { completed, total };
          },
        );
        if (id !== runId) return;
        result.value = mc;
      }
      status.value = 'done';
      persist();
    } catch {
      if (id === runId) {
        status.value = 'error';
        persist();
      }
    } finally {
      if (id === runId) progress.value = null;
    }
  }

  return {
    setup,
    mode,
    result,
    status,
    requestedRuns,
    progress,
    progressPercent,
    canSimulate,
    fleetA,
    fleetB,
    techA,
    techB,
    planetSkin,
    seed,
    runs,
    setFleet,
    setTechs,
    setSkin,
    rerollSeed,
    setRuns,
    setMode,
    simulate,
  };
});
