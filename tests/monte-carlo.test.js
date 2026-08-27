import { describe, it, expect } from "vitest";
import {
  simulateMonteCarlo,
  aggregateMonteCarlo,
  clampRuns,
  estimateTimePerRunMs,
  autoReduceRuns,
} from "../src/engine/index.js";

const zero = { weapon: {}, shield: {}, armor: {} };

describe("Monte Carlo — bornes & auto-réduction", () => {
  it("clampRuns borne le nombre de runs à [1, 500]", () => {
    expect(clampRuns(0)).toBe(1);
    expect(clampRuns(-5)).toBe(1);
    expect(clampRuns(NaN)).toBe(1);
    expect(clampRuns(1)).toBe(1);
    expect(clampRuns(100)).toBe(100);
    expect(clampRuns(500)).toBe(500);
    expect(clampRuns(1000)).toBe(500);
  });

  it("estimateTimePerRunMs est linéaire en unités", () => {
    expect(estimateTimePerRunMs(0)).toBe(0);
    expect(estimateTimePerRunMs(7_100_000)).toBeCloseTo(12000, 0);
  });

  it("autoReduceRuns ne réduit pas les petites flottes mais réduit les grosses", () => {
    expect(autoReduceRuns(100, 1_000, 8)).toBe(100); // petit → inchangé
    expect(autoReduceRuns(100, 1_000_000, 8)).toBe(40); // ~1.7 s/run → 5 vagues × 8
    expect(autoReduceRuns(100, 7_100_000, 8)).toBe(1); // ~12 s/run > cible → 1 seul run
    expect(autoReduceRuns(500, 1_000, 8)).toBe(500); // borne haute respectée
  });
});

describe("Monte Carlo — agrégation", () => {
  function makeResult(seed, cruiserSurvivors) {
    return {
      winner: "attacker",
      rounds: [],
      survivors: { attacker: { cruiser: cruiserSurvivors }, defender: {} },
      seed,
    };
  }

  it("sélectionne le run médian (50e percentile des pertes totales)", () => {
    const results = [
      makeResult(0, 90), // pertes combinées 10 + 100 = 110
      makeResult(1, 80), // 20 + 100 = 120 (médian)
      makeResult(2, 70), // 30 + 100 = 130
    ];
    const agg = aggregateMonteCarlo(
      results,
      { cruiser: 100 },
      { rocket_launcher: 100 },
    );
    expect(agg.medianReport.seed).toBe(1);
    expect(agg.medianReport.survivors.attacker.cruiser).toBe(80);
  });

  it("calcule winProbability, totalLosses et lossesByType", () => {
    const results = [
      makeResult(0, 90),
      makeResult(1, 80),
      makeResult(2, 70),
    ];
    const agg = aggregateMonteCarlo(
      results,
      { cruiser: 100 },
      { rocket_launcher: 100 },
    );

    // Un seul vainqueur possible ici (attacker) → probabilité 1.
    expect(agg.winProbability.attacker).toBe(1);
    expect(agg.winProbability.defender).toBe(0);
    expect(agg.winProbability.draw).toBe(0);

    // Pertes attaquant (cruiser) : [10, 20, 30].
    expect(agg.totalLosses.attacker.mean).toBe(20);
    expect(agg.totalLosses.attacker.p5).toBe(11);
    expect(agg.totalLosses.attacker.p95).toBe(29);

    // Pertes défenseur (rocket launcher) : [100, 100, 100].
    expect(agg.totalLosses.defender.mean).toBe(100);
    expect(agg.lossesByType.defender.rocket_launcher.mean).toBe(100);
  });
});

describe("Monte Carlo — simulateMonteCarlo", () => {
  it("agrège N runs en distribution cohérente", () => {
    const r = simulateMonteCarlo(
      { cruiser: 50 },
      { rocket_launcher: 50 },
      zero,
      zero,
      { runs: 10, seed: 0 },
    );

    expect(r.runs).toBe(10);
    const wp = r.winProbability;
    expect(wp.attacker + wp.defender + wp.draw).toBeCloseTo(1, 10);

    // Pertes moyennes bornées par l'effectif initial.
    expect(r.totalLosses.attacker.mean).toBeGreaterThanOrEqual(0);
    expect(r.totalLosses.attacker.mean).toBeLessThanOrEqual(50);

    // Rapport médian : un vrai BattleResult.
    expect(r.medianReport.winner).toMatch(/attacker|defender|draw/);
    expect(Array.isArray(r.medianReport.rounds)).toBe(true);
    expect(typeof r.elapsedMs).toBe("number");
  });

  it("est reproductible (même seed → mêmes agrégats, hors elapsedMs)", () => {
    const args = [{ cruiser: 100 }, { death_star: 1 }, zero, zero, { runs: 25, seed: 42 }];
    const a = simulateMonteCarlo(...args);
    const b = simulateMonteCarlo(...args);

    expect(a.winProbability).toEqual(b.winProbability);
    expect(a.totalLosses).toEqual(b.totalLosses);
    expect(a.lossesByType).toEqual(b.lossesByType);
    expect(a.medianReport).toEqual(b.medianReport);
    expect(a.runs).toBe(b.runs);
  });
});
