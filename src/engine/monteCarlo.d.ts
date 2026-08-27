import type {
  BattleResult,
  Fleet,
  MonteCarloOptions,
  MonteCarloResult,
  PlanetSkin,
  Techs,
} from '../types';

export function clampRuns(runs: number): number;
export function estimateTimePerRunMs(totalUnits: number): number;
export function autoReduceRuns(
  runs: number,
  totalUnits: number,
  concurrency: number,
  targetMs?: number,
): number;

export function aggregateMonteCarlo(
  results: BattleResult[],
  fleetA: Fleet,
  fleetB: Fleet,
  elapsedMs?: number,
): MonteCarloResult;

export function simulateMonteCarlo(
  fleetA: Fleet,
  fleetB: Fleet,
  techA: Techs,
  techB: Techs & { planetSkin?: PlanetSkin },
  options?: MonteCarloOptions,
): MonteCarloResult;
