// Verdict de combat : débris + barre « le combat vaut-il le coup ».
// Référence : docs/specs/battle-verdict.md.
//
// Fonctions pures (aucun DOM), importables côté UI comme côté worker/tests.
// La « valeur » d'une unité est, en attendant le score, son coût total en ressources
// (métal + cristal + gaz) — spec §4.

import { SHIP_COSTS } from "./ships.js";

// Taux de débris : ~30 % (« un tiers », comme OGame). Observé ~21 % en pratique à cause
// des vaisseaux reconstruits — on affiche donc un potentiel théorique (spec §2).
export const DEBRIS_RATE = 0.3;

// Seuils de la barre « vaut le coup » (ajustables, spec §3) : `lossRate` est une fraction
// de la valeur de la flotte attaquante perdue (0..1).
export const VERDICT_GREEN_MAX = 0.1; // victoire + < 10 % de pertes → vert
export const VERDICT_YELLOW_MAX = 0.3; // victoire + 10–30 % → jaune ; > 30 % → orange

/**
 * Construit un lookup `nom → { metal, crystal, gas }` à partir de `shipData`.
 *
 * Accepte :
 *   - la forme canonique des données (`{ ships: [{ name, metal, crystal, gas }] }`) ;
 *   - un objet déjà indexé par nom (`{ [name]: { metal, crystal, gas } }`) ;
 *   - `null` / `undefined` → données canoniques du moteur (`SHIP_COSTS`).
 */
function costLookup(shipData) {
  if (shipData == null) return SHIP_COSTS;
  if (Array.isArray(shipData?.ships)) {
    const out = {};
    for (const ship of shipData.ships) {
      if (ship && ship.name != null) {
        out[ship.name] = {
          metal: Number(ship.metal) || 0,
          crystal: Number(ship.crystal) || 0,
          gas: Number(ship.gas) || 0,
        };
      }
    }
    return out;
  }
  return shipData;
}

function unitMetal(costs, name) {
  const c = costs[name];
  return c ? Number(c.metal) || 0 : 0;
}

function unitCrystal(costs, name) {
  const c = costs[name];
  return c ? Number(c.crystal) || 0 : 0;
}

function unitTotal(costs, name) {
  const c = costs[name];
  return c ? (Number(c.metal) || 0) + (Number(c.crystal) || 0) + (Number(c.gas) || 0) : 0;
}

// Effectif valide : entier strictement positif, 0 sinon (même convention que
// `normalizeFleet` / `fleetTotal`).
function toCount(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Débris potentiels : 30 % du coût métal / cristal des unités détruites (les deux camps).
 *
 * Les unités détruites sont déduites des pertes par round (`result.rounds[].*.losses`),
 * ce qui fonctionne sans la flotte initiale. On inclut vaisseaux **et** défenses au sol :
 * elles ont toutes un `res_demand` et, comme dans OGame, les défenses laissent des débris
 * (décision à confirmer si Aurélien souhaite les exclure — filtre trivial).
 * La note « peut varier (vaisseaux reconstruits) » relève de l'UI (spec §2).
 *
 * @param {import('../types').BattleResult} result
 * @param {object} [shipData] données de coûts (voir `costLookup`).
 * @returns {{ metal: number, crystal: number }}
 */
export function computeDebris(result, shipData) {
  const costs = costLookup(shipData);
  let metal = 0;
  let crystal = 0;

  for (const round of result?.rounds ?? []) {
    for (const [name, count] of Object.entries(round.attacker?.losses ?? {})) {
      const n = toCount(count);
      metal += n * unitMetal(costs, name);
      crystal += n * unitCrystal(costs, name);
    }
    for (const [name, count] of Object.entries(round.defender?.losses ?? {})) {
      const n = toCount(count);
      metal += n * unitMetal(costs, name);
      crystal += n * unitCrystal(costs, name);
    }
  }

  return { metal: metal * DEBRIS_RATE, crystal: crystal * DEBRIS_RATE };
}

/**
 * Valeur totale d'une flotte = Σ (effectif × coût total unitaire).
 * Proxy « score » en attendant la dérivation empirique (spec §4).
 *
 * @param {import('../types').Fleet} fleet
 * @param {object} [shipData]
 * @returns {number}
 */
export function computeFleetValue(fleet, shipData) {
  const costs = costLookup(shipData);
  let total = 0;
  for (const [name, count] of Object.entries(fleet ?? {})) {
    total += toCount(count) * unitTotal(costs, name);
  }
  return total;
}

/**
 * Valeur des pertes de l'attaquant = Σ (pertes × coût total unitaire).
 *
 * Les pertes sont `flotte initiale − survivants`, par type (l'attaquant mis en avant,
 * spec §3). Équivalent à la somme des `result.rounds[].attacker.losses` mais n'exige pas
 * que `rounds` soit renseigné (fast-path flotte vide).
 *
 * @param {import('../types').BattleResult} result
 * @param {import('../types').Fleet} fleetA flotte initiale attaquante
 * @param {object} [shipData]
 * @returns {number}
 */
export function computeLossValue(result, fleetA, shipData) {
  const costs = costLookup(shipData);
  const survivors = result?.survivors?.attacker ?? {};
  let value = 0;

  for (const [name, count] of Object.entries(fleetA ?? {})) {
    const initial = toCount(count);
    const alive = toCount(survivors[name]);
    const lost = Math.max(0, initial - alive);
    value += lost * unitTotal(costs, name);
  }

  return value;
}

/**
 * Couleur de la barre « le combat vaut-il le coup » (spec §3).
 *
 * `outcome` = `BattleResult.winner` vu de l'attaquant :
 *   - `attacker` → victoire, nuancée par `lossRate` ;
 *   - `draw`     → jaune ;
 *   - `defender` → défaite → rouge.
 *
 * @param {import('../types').Winner} outcome
 * @param {number} lossRate fraction (0..1) de la valeur de flotte perdue
 * @returns {'green' | 'yellow' | 'orange' | 'red'}
 */
export function computeVerdict(outcome, lossRate) {
  if (outcome === "defender") return "red"; // défaite
  if (outcome === "draw") return "yellow"; // égalité

  // `attacker` (victoire) : vert / jaune / orange selon le taux de perte.
  const rate = Math.max(0, Number(lossRate) || 0);
  if (rate < VERDICT_GREEN_MAX) return "green";
  if (rate <= VERDICT_YELLOW_MAX) return "yellow";
  return "orange";
}
