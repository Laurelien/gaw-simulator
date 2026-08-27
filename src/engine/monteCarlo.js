// Agrégation Monte Carlo : exécute `simulateBattle` N fois (seeds dérivés d'un seed de base)
// et agrège les résultats en distribution (probabilité de victoire, pertes moyenne + intervalle
// 5–95, rapport médian). C'est le cœur pur (Node/Vitest) : la parallélisation par Web Workers est
// dans `src/worker/monteCarloPool.ts`.

import { simulateBattle } from "./simulateBattle.js";

const MAX_RUNS = 500;

/**
 * Bornes le nombre de runs à [1, 500].
 * @param {number} runs
 * @returns {number}
 */
export function clampRuns(runs) {
  const n = Math.floor(Number(runs));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_RUNS);
}

/**
 * Estimation du temps (ms) d'un run, calibrée sur ~7,1 M d'unités ≈ 12 s/run (Node mono-thread).
 * @param {number} totalUnits
 * @returns {number}
 */
export function estimateTimePerRunMs(totalUnits) {
  return (totalUnits / 7_100_000) * 12_000;
}

/**
 * Réduit `runs` pour viser `targetMs` de temps total, compte tenu de `concurrency` workers.
 * Modèle « par vagues » : chaque vague = `concurrency` runs en parallèle, coût ~ `tpr`.
 * @param {number} runs
 * @param {number} totalUnits
 * @param {number} concurrency
 * @param {number} [targetMs=10000]
 * @returns {number} nombre de runs borné à [1, 500]
 */
export function autoReduceRuns(runs, totalUnits, concurrency, targetMs = 10_000) {
  const bounded = clampRuns(runs);
  const tpr = estimateTimePerRunMs(totalUnits);
  if (tpr <= 0) return bounded;
  const maxWaves = Math.floor(targetMs / tpr);
  const maxRuns = Math.max(1, maxWaves * Math.max(1, concurrency));
  return Math.max(1, Math.min(bounded, maxRuns));
}

// Flotte initiale normalisée : seuls les effectifs entiers strictement positifs comptent.
function normalizeFleetCounts(fleet) {
  const out = {};
  for (const [name, value] of Object.entries(fleet ?? {})) {
    const count = Math.floor(Number(value));
    if (Number.isFinite(count) && count > 0) out[name] = count;
  }
  return out;
}

function sideTotalLosses(initial, survivors) {
  let total = 0;
  for (const [name, count] of Object.entries(initial)) {
    total += Math.max(0, count - (survivors[name] ?? 0));
  }
  return total;
}

// Percentile linéaire (p ∈ [0, 1]) sur un tableau déjà trié.
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

function distribution(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, v) => sum + v, 0) / (sorted.length || 1);
  return { mean, p5: percentile(sorted, 0.05), p95: percentile(sorted, 0.95) };
}

function now() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

/**
 * Agrège une liste de `BattleResult` en `MonteCarloResult`.
 *
 * - `winProbability` : fréquence de chaque vainqueur.
 * - `totalLosses` : distribution (mean / p5 / p95) des pertes totales par camp.
 * - `lossesByType` : idem, par type (types de la flotte initiale ; pertes 0 incluses).
 * - `medianReport` : le `BattleResult` du 50e percentile des pertes totales combinées
 *   (tie-break sur le seed pour la reproductibilité).
 *
 * @param {import('../types').BattleResult[]} results
 * @param {import('../types').Fleet} fleetA flotte initiale attaquante
 * @param {import('../types').Fleet} fleetB flotte initiale défenseuse
 * @param {number} [elapsedMs=0]
 * @returns {import('../types').MonteCarloResult}
 */
export function aggregateMonteCarlo(results, fleetA, fleetB, elapsedMs = 0) {
  const n = results.length;
  if (n === 0) throw new Error("aggregateMonteCarlo: au moins un run est requis");

  const winners = { attacker: 0, defender: 0, draw: 0 };

  const initA = normalizeFleetCounts(fleetA);
  const initB = normalizeFleetCounts(fleetB);

  const attackerLosses = new Array(n);
  const defenderLosses = new Array(n);

  const attackerByType = {};
  const defenderByType = {};
  for (const name of Object.keys(initA)) attackerByType[name] = new Array(n).fill(0);
  for (const name of Object.keys(initB)) defenderByType[name] = new Array(n).fill(0);

  const runsWithKey = new Array(n);

  for (let i = 0; i < n; i++) {
    const result = results[i];
    winners[result.winner]++;

    const aLoss = sideTotalLosses(initA, result.survivors.attacker);
    const dLoss = sideTotalLosses(initB, result.survivors.defender);
    attackerLosses[i] = aLoss;
    defenderLosses[i] = dLoss;

    for (const name of Object.keys(initA)) {
      attackerByType[name][i] = Math.max(0, initA[name] - (result.survivors.attacker[name] ?? 0));
    }
    for (const name of Object.keys(initB)) {
      defenderByType[name][i] = Math.max(0, initB[name] - (result.survivors.defender[name] ?? 0));
    }

    runsWithKey[i] = { result, key: aLoss + dLoss };
  }

  // 50e percentile des pertes totales combinées (index médian inférieur, tie-break seed).
  const medianReport = [...runsWithKey]
    .sort((a, b) => a.key - b.key || (a.result.seed ?? 0) - (b.result.seed ?? 0))[
    Math.floor((n - 1) / 2)
  ].result;

  const lossesByType = { attacker: {}, defender: {} };
  for (const [name, values] of Object.entries(attackerByType)) {
    lossesByType.attacker[name] = distribution(values);
  }
  for (const [name, values] of Object.entries(defenderByType)) {
    lossesByType.defender[name] = distribution(values);
  }

  return {
    winProbability: {
      attacker: winners.attacker / n,
      defender: winners.defender / n,
      draw: winners.draw / n,
    },
    totalLosses: {
      attacker: distribution(attackerLosses),
      defender: distribution(defenderLosses),
    },
    lossesByType,
    medianReport,
    runs: n,
    elapsedMs,
  };
}

/**
 * Exécute N simulations (`seed + i`) et les agrège.
 *
 * NB : la spec `monte-carlo.md` note le paramètre `techs` par raccourci ; on prend ici
 * `techA` / `techB` comme `simulateBattle` (le défenseur porte `planetSkin`).
 *
 * @param {import('../types').Fleet} fleetA
 * @param {import('../types').Fleet} fleetB
 * @param {import('../types').Techs} techA
 * @param {import('../types').Techs & { planetSkin?: import('../types').PlanetSkin }} techB
 * @param {import('../types').MonteCarloOptions} [options]
 * @returns {import('../types').MonteCarloResult}
 */
export function simulateMonteCarlo(fleetA, fleetB, techA, techB, options = {}) {
  const runs = clampRuns(options.runs);
  const seed = options.seed != null ? options.seed : 0;

  const t0 = now();
  const results = new Array(runs);
  for (let i = 0; i < runs; i++) {
    results[i] = simulateBattle(fleetA, fleetB, techA, techB, { seed: seed + i });
  }
  const elapsedMs = now() - t0;

  return aggregateMonteCarlo(results, fleetA, fleetB, elapsedMs);
}
