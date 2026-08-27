import { simulateBattle } from '../engine/index.js';
import type { BattleResult, Fleet, PlanetSkin, Techs } from '../types';

// Worker Monte Carlo : exécute un « chunk » de `count` runs contigus (seeds `seedBase + i`).
// Un run par seed, conformément au moteur. L'agrégation (distribution, médiane) est faite
// côté thread principal dans `monteCarloPool.ts`.

export interface MonteCarloChunkRequest {
  fleetA: Fleet;
  fleetB: Fleet;
  techA: Techs;
  techB: Techs & { planetSkin?: PlanetSkin };
  seedBase: number;
  count: number;
}

export interface MonteCarloChunkResponse {
  results: BattleResult[];
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<MonteCarloChunkRequest>) => void) | null;
  postMessage: (message: MonteCarloChunkResponse) => void;
};

scope.onmessage = (event: MessageEvent<MonteCarloChunkRequest>) => {
  const { fleetA, fleetB, techA, techB, seedBase, count } = event.data;
  const results: BattleResult[] = new Array(count);
  for (let i = 0; i < count; i++) {
    results[i] = simulateBattle(fleetA, fleetB, techA, techB, { seed: seedBase + i });
  }
  scope.postMessage({ results });
};
