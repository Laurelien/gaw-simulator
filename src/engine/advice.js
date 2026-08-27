// Conseil stratégique minimal : « le défenseur a beaucoup de X → amène des Y ».
// Référence : docs/specs/strategic-advice.md.
//
// Fonctions pures (aucun DOM), importables côté UI comme côté worker/tests.
// Basé sur la table de rapid fire (`kz`) pour le counter, et sur la composition de la
// flotte attaquante pour le tampon.

import { COUNTERS, SHIP_COSTS } from "./ships.js";

// Nombre de types dominants du défenseur analysés (top N par effectif).
export const TOP_DOMINANT_COUNT = 3;

// Coût unitaire (métal + cristal + gaz) au-delà duquel un vaisseau est considéré « cher »,
// pour la règle « tampon » (spec §3). Ajustable.
export const EXPENSIVE_UNIT_COST = 60_000;

// Effectif valide : entier strictement positif, 0 sinon (même convention que `normalizeFleet`).
function toCount(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Nom d'affichage en « Title Case » (ex. `light_fighter` → `Light Fighter`).
// Même convention que `shipLabel` côté UI (le message est prêt à être affiché).
function label(name) {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function unitTotal(name) {
  const c = SHIP_COSTS[name];
  return c ? c.metal + c.crystal + c.gas : 0;
}

/**
 * Conseil stratégique (v1) : counters basés sur le rapid fire + tampon light_fighter.
 *
 * @param {import('../types').Fleet} fleetA flotte attaquante
 * @param {import('../types').Fleet} fleetB flotte défenseuse
 * @returns {Array<{ type: 'counter' | 'buffer', message: string }>}
 */
export function getAdvice(fleetA, fleetB) {
  const advice = [];

  // 1. Types dominants du défenseur (top N par effectif).
  const dominant = Object.entries(fleetB ?? {})
    .map(([name, count]) => ({ name, count: toCount(count) }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP_DOMINANT_COUNT);

  // 2. Pour chaque type dominant, les vaisseaux attaquants ayant du rapid fire contre lui.
  for (const { name: target } of dominant) {
    for (const counter of COUNTERS[target] ?? []) {
      advice.push({
        type: "counter",
        message: `The defender has many ${label(target)}. Consider ${label(
          counter.name,
        )} (rapid fire ${counter.factor} vs ${label(target)}).`,
      });
    }
  }

  // 3. Tampon (bonus) : vaisseaux chers sans light_fighter pour diluer le ciblage aléatoire.
  // NB : la spec conditionne le tampon à « de lourdes pertes » (issue du résultat), mais
  // `getAdvice` ne reçoit pas le `BattleResult`. On approxime donc le risque par la
  // composition de la flotte : vaisseaux chers présents ET aucun light_fighter.
  const hasExpensive = Object.entries(fleetA ?? {}).some(
    ([name, count]) => toCount(count) > 0 && unitTotal(name) >= EXPENSIVE_UNIT_COST,
  );
  if (hasExpensive && toCount(fleetA?.light_fighter) === 0) {
    advice.push({
      type: "buffer",
      message:
        "Your fleet has expensive ships but no Light Fighter. Consider adding Light Fighter to dilute the defender's random targeting.",
    });
  }

  return advice;
}
