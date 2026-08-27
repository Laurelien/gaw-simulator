// Moteur de combat serveur reconstruit (single-target, rapid fire par kill, technos
// additives, régénération des boucliers, 6 rounds, pas d'explosion).
//
// Exécutable dans un Web Worker : aucun DOM, pur calcul sur typed arrays.

import { COUNT, NAMES, RF_THRESHOLD, MULTI_SHOT } from "./ships.js";
import { computeSideStats } from "./tech.js";
import { buildFleet, normalizeFleet, regenerateAndCompact, aliveCountsByType } from "./fleet.js";
import { createRng } from "./rng.js";

const MAX_ROUNDS = 6;

/**
 * @param {object|Array<number>} fleetA attaquant
 * @param {object|Array<number>} fleetB défenseur
 * @param {object} techA technos attaquant
 * @param {object} techB technos défenseur (peut contenir `planetSkin`)
 * @param {{seed?: number}} [options]
 * @returns {object} BattleResult
 */
export function simulateBattle(fleetA, fleetB, techA, techB, options = {}) {
  const seed = options.seed != null ? options.seed : 0;
  const rng = createRng(seed);

  const countsA = normalizeFleet(fleetA);
  const countsB = normalizeFleet(fleetB);

  const totalA = sumCounts(countsA);
  const totalB = sumCounts(countsB);

  const emptyA = toFleet(countsA);
  const emptyB = toFleet(countsB);

  // Flotte vide d'un côté → victoire immédiate de l'autre (spec §10).
  if (totalA === 0 && totalB === 0) {
    return { winner: "draw", rounds: [], survivors: { attacker: {}, defender: {} }, seed };
  }
  if (totalA === 0) {
    return { winner: "defender", rounds: [], survivors: { attacker: {}, defender: emptyB }, seed };
  }
  if (totalB === 0) {
    return { winner: "attacker", rounds: [], survivors: { attacker: emptyA, defender: {} }, seed };
  }

  const statsA = computeSideStats(techA, "none");
  const statsB = computeSideStats(techB, techB?.planetSkin ?? "none");

  const fa = buildFleet(countsA, statsA);
  const fb = buildFleet(countsB, statsB);

  const rounds = [];
  let winner = null;

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // Régénération des boucliers + figer le pool de cibles (vivants en début de round).
    regenerateAndCompact(fa, statsA);
    regenerateAndCompact(fb, statsB);

    fa.roundLosses.fill(0);
    fb.roundLosses.fill(0);

    // Les deux camps tirent. Ordre indépendant (chaque camp cible le pool figé adverse).
    const atkStats = processSide(fa, fb, statsA, rng);
    const defStats = processSide(fb, fa, statsB, rng);

    rounds.push({
      round,
      attacker: {
        losses: toFleet(fa.roundLosses),
        number_of_attack: atkStats.number_of_attack,
        current_damage: atkStats.current_damage,
        shield_absorption: atkStats.shield_absorption,
        wreck: atkStats.wreck,
      },
      defender: {
        losses: toFleet(fb.roundLosses),
        number_of_attack: defStats.number_of_attack,
        current_damage: defStats.current_damage,
        shield_absorption: defStats.shield_absorption,
        wreck: defStats.wreck,
      },
    });

    const defAlive = fb.aliveCount - atkStats.wreck; // unités défenseur survivantes
    const atkAlive = fa.aliveCount - defStats.wreck; // unités attaquant survivantes

    if (defAlive === 0) {
      winner = "attacker";
      break;
    }
    if (atkAlive === 0) {
      winner = "defender";
      break;
    }
  }

  if (winner === null) winner = "draw";

  const survivors = {
    attacker: toFleet(aliveCountsByType(fa)),
    defender: toFleet(aliveCountsByType(fb)),
  };

  return { winner, rounds, survivors, seed };
}

/**
 * Résout tous les tirs du camp `shooter` contre `target` pour un round.
 * Mutations : `target.hull` / `target.shield` / `target.roundLosses`.
 */
function processSide(shooter, target, shooterStats, rng) {
  const atk = shooterStats.attack;
  const sType = shooter.type;
  const tType = target.type;
  const tShield = target.shield;
  const tHull = target.hull;
  const tAlive = target.aliveCount;
  const losses = target.roundLosses;

  const shooters = shooter.aliveCount;

  let number_of_attack = 0;
  let current_damage = 0;
  let shield_absorption = 0;
  let wreck = 0;

  for (let s = 0; s < shooters; s++) {
    const shooterType = sType[s];
    const attack = atk[shooterType];
    const rfRow = shooterType * COUNT;

    // Un vaisseau vivant au début du round tire au moins une fois. Le missile chaser tire
    // une salve de `multiShot` missiles (ciblés indépendamment), bornée par le nombre de
    // cibles vivantes au début du round.
    const multiShot = MULTI_SHOT[shooterType];
    const shots = multiShot < tAlive ? multiShot : tAlive;

    for (let m = 0; m < shots; m++) {
      while (true) {
        const targetSlot = (rng() * tAlive) | 0;
        const targetType = tType[targetSlot];

        number_of_attack++;
        current_damage += attack;

        // Absorption du bouclier (0 si bouclier déjà à 0).
        const shieldVal = tShield[targetSlot];
        const absorbed = attack < shieldVal ? attack : shieldVal;
        shield_absorption += absorbed;
        tShield[targetSlot] = shieldVal - absorbed;

        const remaining = attack - absorbed;

        if (remaining > 0) {
          const hullVal = tHull[targetSlot];
          if (hullVal > 0) {
            if (remaining >= hullVal) {
              // Unité détruite (overkill perdu).
              tHull[targetSlot] = 0;
              losses[targetType]++;
              wreck++;
            } else {
              // Dégâts partiels : l'unité survit.
              tHull[targetSlot] = hullVal - remaining;
            }
          }
          // Sinon : tir perdu (unité déjà morte).
        }

        // Rapid fire : le dé est relancé après CHAQUE tir (kill OU perdu), sur le type
        // de la cible visée. Un tir perdu ne met donc PAS fin à la chaîne.
        const threshold = RF_THRESHOLD[rfRow + targetType];
        if (threshold <= 0 || rng() >= threshold) {
          break;
        }
      }
    }
  }

  return { number_of_attack, current_damage, shield_absorption, wreck };
}

function sumCounts(counts) {
  let s = 0;
  for (let i = 0; i < COUNT; i++) s += counts[i];
  return s;
}

/**
 * Convertit un tableau d'effectifs par type en objet `{ name: count }` (clés nulles omises).
 * @param {Uint32Array|Int32Array} counts
 */
function toFleet(counts) {
  const out = {};
  for (let i = 0; i < COUNT; i++) {
    if (counts[i] > 0) out[NAMES[i]] = counts[i];
  }
  return out;
}
