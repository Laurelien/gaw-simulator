import { aggregateMonteCarlo, autoReduceRuns } from '../engine/index.js';
import type {
  BattleResult,
  Fleet,
  MonteCarloOptions,
  MonteCarloResult,
  PlanetSkin,
  Techs,
} from '../types';
import MonteCarloWorker from './monteCarlo.worker?worker';

// Jusqu'à `navigator.hardwareConcurrency` workers (plafonné à 8), défaut 4 hors navigateur.
const CONCURRENCY =
  typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
    ? Math.max(1, Math.min(navigator.hardwareConcurrency, 8))
    : 4;

function fleetTotal(fleet: Fleet): number {
  let total = 0;
  for (const value of Object.values(fleet ?? {})) {
    const n = Math.floor(Number(value));
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return total;
}

function now(): number {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

interface Chunk {
  start: number;
  count: number;
}

function buildChunks(runs: number): Chunk[] {
  const workerCount = Math.min(CONCURRENCY, runs);
  const chunkSize = Math.ceil(runs / workerCount);
  const chunks: Chunk[] = [];
  for (let w = 0; w < workerCount; w++) {
    const start = w * chunkSize;
    const count = Math.min(chunkSize, runs - start);
    if (count > 0) chunks.push({ start, count });
  }
  return chunks;
}

function runChunk(
  worker: Worker,
  fleetA: Fleet,
  fleetB: Fleet,
  techA: Techs,
  techB: Techs & { planetSkin?: PlanetSkin },
  seedBase: number,
  chunk: Chunk,
): Promise<BattleResult[]> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ results: BattleResult[] }>) => {
      resolve(event.data.results);
    };
    worker.onerror = () => {
      reject(new Error('Monte Carlo worker error'));
    };
    worker.postMessage({
      fleetA,
      fleetB,
      techA,
      techB,
      seedBase: seedBase + chunk.start,
      count: chunk.count,
    });
  });
}

/**
 * Monte Carlo parallélisé sur un pool de Web Workers.
 *
 * Auto-réduit `runs` selon la taille des flottes (estimation temps/run) pour rester ≤ 10 s,
 * distribue les runs par chunks contigus (seeds `seed + i`) et agrège via `aggregateMonteCarlo`.
 */
export async function runMonteCarloPooled(
  fleetA: Fleet,
  fleetB: Fleet,
  techA: Techs,
  techB: Techs & { planetSkin?: PlanetSkin },
  options: MonteCarloOptions,
  onProgress?: (completed: number, total: number) => void,
): Promise<MonteCarloResult> {
  const totalUnits = fleetTotal(fleetA) + fleetTotal(fleetB);
  const runs = autoReduceRuns(options.runs, totalUnits, CONCURRENCY);
  const seed = options.seed != null ? options.seed : 0;

  const chunks = buildChunks(runs);
  const results = new Array<BattleResult>(runs);
  const workers = chunks.map(() => new MonteCarloWorker());

  const t0 = now();
  let completed = 0;
  try {
    await Promise.all(
      chunks.map((chunk, idx) =>
        runChunk(workers[idx], fleetA, fleetB, techA, techB, seed, chunk).then((chunkResults) => {
          for (let i = 0; i < chunkResults.length; i++) {
            results[chunk.start + i] = chunkResults[i];
          }
          completed += chunkResults.length;
          onProgress?.(completed, runs);
        }),
      ),
    );
  } finally {
    for (const worker of workers) worker.terminate();
  }
  const elapsedMs = now() - t0;

  return aggregateMonteCarlo(results, fleetA, fleetB, elapsedMs);
}
