import { simulateBattle } from '../engine/index.js';
import type { BattleResult, Fleet, PlanetSkin, Techs } from '../types';

export interface BattleRequest {
  fleetA: Fleet;
  fleetB: Fleet;
  techA: Techs;
  techB: Techs & { planetSkin?: PlanetSkin };
  seed: number;
}

export interface BattleResponse {
  result: BattleResult;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<BattleRequest>) => void) | null;
  postMessage: (message: BattleResponse) => void;
};

scope.onmessage = (event: MessageEvent<BattleRequest>) => {
  const { fleetA, fleetB, techA, techB, seed } = event.data;
  const result = simulateBattle(fleetA, fleetB, techA, techB, { seed });
  scope.postMessage({ result });
};
