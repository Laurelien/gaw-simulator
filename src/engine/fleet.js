// Représentation d'une flotte en typed arrays, pour des millions d'unités.
//
// Les unités sont stockées en ordre "type-major" (toutes celles du type 0, puis type 1,
// etc.). À chaque début de round on compacte les unités vivantes (coque > 0) vers l'avant :
// les slots [0, aliveCount) sont alors exactement les unités vivantes au début du round.
// Le pool de cibles est ensuite figé pour tout le round (aliveCount ne change pas pendant
// le round, même quand des unités meurent).

import { COUNT, NAME_TO_ID } from "./ships.js";

/**
 * Normalise une flotte (objet `{ name: count }` ou tableau de 25 entiers) en Uint32Array.
 * @param {object|Array<number>} fleet
 * @returns {Uint32Array}
 */
export function normalizeFleet(fleet) {
  const counts = new Uint32Array(COUNT);
  if (fleet == null) return counts;

  if (Array.isArray(fleet) || ArrayBuffer.isView(fleet)) {
    for (let i = 0; i < Math.min(fleet.length, COUNT); i++) {
      counts[i] = toCount(fleet[i]);
    }
    return counts;
  }

  for (const [key, value] of Object.entries(fleet)) {
    const id = NAME_TO_ID[key];
    if (id !== undefined) counts[id] = toCount(value);
  }
  return counts;
}

function toCount(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Construit l'état interne d'une flotte.
 * @param {Uint32Array} counts effectif par type
 * @param {{attack: Float32Array, shield: Float32Array, hull: Float32Array}} stats stats du camp
 */
export function buildFleet(counts, stats) {
  let total = 0;
  for (let i = 0; i < COUNT; i++) total += counts[i];

  const type = new Uint8Array(total);
  const hull = new Float32Array(total);
  const shield = new Float32Array(total);
  const roundLosses = new Int32Array(COUNT);

  let slot = 0;
  for (let t = 0; t < COUNT; t++) {
    const c = counts[t];
    const fullHull = stats.hull[t];
    const fullShield = stats.shield[t];
    for (let k = 0; k < c; k++) {
      type[slot] = t;
      hull[slot] = fullHull;
      shield[slot] = fullShield;
      slot++;
    }
  }

  return { total, aliveCount: total, type, hull, shield, roundLosses };
}

/**
 * Régénère les boucliers des unités vivantes et les compacte vers l'avant.
 * Met à jour `fleet.aliveCount`.
 * @param {object} fleet
 * @param {{shield: Float32Array}} stats
 */
export function regenerateAndCompact(fleet, stats) {
  const { type, hull, shield } = fleet;
  const fullShield = stats.shield;
  const alive = fleet.aliveCount;
  let w = 0;

  // Itère sur les unités vivantes en début de round (slots [0, alive)) et non sur `total` :
  // les slots [alive, total) sont « périmés » après les compactions précédentes et peuvent
  // contenir des valeurs de coque obsolètes qui seraient sinon réintroduites comme vivantes.
  for (let r = 0; r < alive; r++) {
    if (hull[r] > 0) {
      const t = type[r];
      if (w !== r) {
        type[w] = t;
        hull[w] = hull[r];
      }
      shield[w] = fullShield[t];
      w++;
    }
  }

  fleet.aliveCount = w;
}

/**
 * Compte les unités vivantes par type (pour `survivors`).
 * @param {object} fleet
 * @returns {Uint32Array}
 */
export function aliveCountsByType(fleet) {
  const counts = new Uint32Array(COUNT);
  const { type, hull, aliveCount } = fleet;
  for (let s = 0; s < aliveCount; s++) {
    if (hull[s] > 0) counts[type[s]]++;
  }
  return counts;
}
