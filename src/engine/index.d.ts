import type {
  Advice,
  BattleResult,
  Debris,
  Fleet,
  MonteCarloOptions,
  MonteCarloResult,
  PlanetSkin,
  Techs,
  Verdict,
  Winner,
} from '../types';

export function simulateBattle(
  fleetA: Fleet,
  fleetB: Fleet,
  techA: Techs,
  techB: Techs & { planetSkin?: PlanetSkin },
  options?: { seed?: number },
): BattleResult;

export function simulateMonteCarlo(
  fleetA: Fleet,
  fleetB: Fleet,
  techA: Techs,
  techB: Techs & { planetSkin?: PlanetSkin },
  options?: MonteCarloOptions,
): MonteCarloResult;

export function aggregateMonteCarlo(
  results: BattleResult[],
  fleetA: Fleet,
  fleetB: Fleet,
  elapsedMs?: number,
): MonteCarloResult;

export function clampRuns(runs: number): number;
export function estimateTimePerRunMs(totalUnits: number): number;
export function autoReduceRuns(
  runs: number,
  totalUnits: number,
  concurrency: number,
  targetMs?: number,
): number;

// Coût unitaire en ressources d'un vaisseau.
export type ShipCost = { metal: number; crystal: number; gas: number };

// Données de coûts acceptées par les fonctions de verdict.
// Soit la forme canonique (`{ ships: [{ name, metal, crystal, gas }] }`),
// soit un objet indexé par nom (`{ [name]: ShipCost }`).
export type ShipData =
  | { ships: Array<{ name: string; metal?: number; crystal?: number; gas?: number }> }
  | Record<string, ShipCost>;

export function computeDebris(result: BattleResult, shipData?: ShipData): Debris;
export function computeLossValue(result: BattleResult, fleetA: Fleet, shipData?: ShipData): number;
export function computeFleetValue(fleet: Fleet, shipData?: ShipData): number;
export function computeVerdict(outcome: Winner, lossRate: number): Verdict;

export const DEBRIS_RATE: number;
export const VERDICT_GREEN_MAX: number;
export const VERDICT_YELLOW_MAX: number;

export function getAdvice(fleetA: Fleet, fleetB: Fleet): Advice[];
export const TOP_DOMINANT_COUNT: number;
export const EXPENSIVE_UNIT_COST: number;

export { stat, computeSideStats, SKIN_BONUS } from './tech.js';
export { createRng } from './rng.js';
export {
  COUNT,
  NAMES,
  NAME_TO_ID,
  BASE_ATT,
  BASE_SHIELD,
  BASE_HULL,
  COST_METAL,
  COST_CRYSTAL,
  COST_GAS,
  COST_TOTAL,
  SHIP_COSTS,
  COUNTERS,
} from './ships.js';
