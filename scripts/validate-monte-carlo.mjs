// Validation Monte Carlo du moteur contre les rapports serveur (ground truth).
//
// Pour chaque rapport : on rejoue K fois la bataille (seeds variés) et on vérifie que la valeur
// rapportée est un tirage plausible de la distribution (percentiles), conformément à
// docs/specs/validation-strategy.md.
//
// Usage :
//   node scripts/validate-monte-carlo.mjs [--runs N] [--reports 2025-11-27,2026-01-28]
//
// `--runs` est le nombre de runs pour les *petites* batailles ; il est automatiquement réduit
// pour les grosses (le coût d'un run croît avec la taille des flottes).

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { simulateBattle } from "../src/engine/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS_DIR = join(ROOT, "data", "raw-battle-reports");

const args = process.argv.slice(2);
const argIndex = (name) => args.indexOf(name);

const baseRuns = argIndex("--runs") >= 0 ? Number(args[argIndex("--runs") + 1]) : 200;
const reportsFilter = argIndex("--reports") >= 0 ? args[argIndex("--reports") + 1].split(",") : null;

function pct(sorted, p) {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    min: sorted[0],
    p1: pct(sorted, 0.01),
    p50: pct(sorted, 0.5),
    p99: pct(sorted, 0.99),
    max: sorted[sorted.length - 1],
  };
}

function reportToInput(report) {
  return {
    fleetA: report.attacker.ships,
    fleetB: report.defender.ships,
    techA: {
      weapon: report.attacker.tech.weapon,
      shield: report.attacker.tech.shield,
      armor: report.attacker.tech.armor,
    },
    techB: {
      weapon: report.defender.tech.weapon,
      shield: report.defender.tech.shield,
      armor: report.defender.tech.armor,
      planetSkin: report.defender.planet_skin || "none",
    },
  };
}

function fleetSize(fleet) {
  return Object.values(fleet).reduce((a, b) => a + (Number(b) || 0), 0);
}

function inEnvelope(reported, summary) {
  return reported >= summary.p1 && reported <= summary.p99;
}

const reports = readdirSync(REPORTS_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ file: f, data: JSON.parse(readFileSync(join(REPORTS_DIR, f), "utf8")) }))
  .filter((r) => !reportsFilter || reportsFilter.includes(r.data.date))
  .sort((a, b) => a.data.date.localeCompare(b.data.date));

for (const { file, data } of reports) {
  const { fleetA, fleetB, techA, techB } = reportToInput(data);
  const totalUnits = fleetSize(fleetA) + fleetSize(fleetB);

  // Réduit K pour les grosses batailles (coût ~ linéaire en nombre d'unités).
  const K = totalUnits > 5_000_000 ? Math.max(5, Math.floor(baseRuns / 40))
    : totalUnits > 1_000_000 ? Math.max(10, Math.floor(baseRuns / 10))
    : baseRuns;

  const winners = { attacker: 0, defender: 0, draw: 0 };
  const rounds = [];

  console.log(`\n=== ${file} (${data.date}) — ${totalUnits} unités — ${K} runs ===`);

  for (let i = 0; i < K; i++) {
    const result = simulateBattle(fleetA, fleetB, techA, techB, { seed: i + 1 });
    winners[result.winner]++;

    for (let r = 0; r < result.rounds.length; r++) {
      rounds[r] = rounds[r] || { attacker: {}, defender: {} };
      for (const side of ["attacker", "defender"]) {
        const src = result.rounds[r][side];
        const acc = rounds[r][side];
        for (const key of ["number_of_attack", "current_damage", "shield_absorption", "wreck"]) {
          (acc[key] = acc[key] || []).push(src[key]);
        }
      }
    }
  }

  console.log("winner:", winners, "| rapport:", data.outcome.winner);

  for (let r = 0; r < (data.outcome.rounds || []).length; r++) {
    const rep = data.outcome.rounds[r];
    if (!rounds[r]) {
      console.log(`  round ${r + 1}: (aucune simulation n'atteint ce round)`);
      continue;
    }
    console.log(`  round ${r + 1}:`);
    for (const side of ["attacker", "defender"]) {
      const repSide = rep[side];
      const sim = rounds[r][side];
      for (const key of ["number_of_attack", "current_damage", "shield_absorption", "wreck"]) {
        const s = summarize(sim[key]);
        const ok = inEnvelope(repSide[key], s) ? "OK " : "FLAG";
        console.log(
          `    ${side}.${key}: rapport=${repSide[key]}  [P1=${s.p1}, P50=${s.p50}, P99=${s.p99}] ${ok}`,
        );
      }
    }
  }
}
