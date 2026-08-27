import type { BattleResult, Fleet, PlanetSkin, Techs } from '../types';
import BattleWorker from './battle.worker?worker';

// Lance UNE simulation dans un Web Worker dédié et résout le `BattleResult`.
export function runSingleBattle(
  fleetA: Fleet,
  fleetB: Fleet,
  techA: Techs,
  techB: Techs & { planetSkin?: PlanetSkin },
  seed: number,
): Promise<BattleResult> {
  return new Promise((resolve, reject) => {
    const worker = new BattleWorker();
    worker.onmessage = (event: MessageEvent<{ result: BattleResult }>) => {
      worker.terminate();
      resolve(event.data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Battle worker error'));
    };
    worker.postMessage({ fleetA, fleetB, techA, techB, seed });
  });
}
