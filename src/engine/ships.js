// Données canoniques des vaisseaux (champs combat + coûts), chargées depuis le JSON
// généré par `scripts/generate-ships.mjs` à partir de `ships.lua`.
//
// Expose des typed arrays pour un accès O(1) dans la boucle chaude :
//   - BASE_ATT / BASE_SHIELD / BASE_HULL : stats de base par type (index 0..24)
//   - COST_METAL / COST_CRYSTAL / COST_GAS / COST_TOTAL : coûts en ressources par type
//   - RF_THRESHOLD : seuil de rapid fire `1 - 1/factor` (0 = pas de rapid fire),
//     indexé par `shooterType * 25 + targetType`.

import shipData from "./data/ships.js";

export const COUNT = shipData.count; // 25
export const NAMES = Object.freeze([...shipData.names]);

const NAME_TO_ID = Object.create(null);
for (let i = 0; i < NAMES.length; i++) {
  NAME_TO_ID[NAMES[i]] = i;
}
export { NAME_TO_ID };

export const BASE_ATT = new Float32Array(COUNT);
export const BASE_SHIELD = new Float32Array(COUNT);
export const BASE_HULL = new Float32Array(COUNT);
export const RF_THRESHOLD = new Float32Array(COUNT * COUNT);

// Coûts en ressources (métal / cristal / gaz), depuis `res_demand` dans ships.lua.
// Utilisés par le verdict de combat (débris + barre « vaut le coup »).
// Float64 : les valeurs sont grandes (jusqu'à 5 M) et peuvent être sommées sur des
// millions d'unités (la float32 perdrait en précision).
export const COST_METAL = new Float64Array(COUNT);
export const COST_CRYSTAL = new Float64Array(COUNT);
export const COST_GAS = new Float64Array(COUNT);
export const COST_TOTAL = new Float64Array(COUNT); // métal + cristal + gaz

// Lookup `nom → { metal, crystal, gas }`, utilisé par les fonctions de verdict
// (computeDebris / computeLossValue / computeFleetValue) quand `shipData` est omis.
export const SHIP_COSTS = Object.freeze(
  Object.fromEntries(
    shipData.ships.map((ship) => [
      ship.name,
      Object.freeze({ metal: ship.metal, crystal: ship.crystal, gas: ship.gas }),
    ]),
  ),
);

// Index inverse du rapid fire : pour chaque cible, les tireurs ayant du rapid fire contre
// elle, triés par facteur décroissant (puis nom). Utilisé par le conseil stratégique
// (docs/specs/strategic-advice.md) pour répondre « le défenseur a beaucoup de X → amène Y ».
export const COUNTERS = buildCounters(shipData.ships);

function buildCounters(ships) {
  const byTarget = Object.create(null);
  for (const ship of ships) {
    for (const [targetName, factor] of Object.entries(ship.rapidFire)) {
      if (!byTarget[targetName]) byTarget[targetName] = [];
      byTarget[targetName].push({ name: ship.name, factor });
    }
  }
  for (const list of Object.values(byTarget)) {
    list.sort((a, b) => b.factor - a.factor || a.name.localeCompare(b.name));
  }
  return Object.freeze(byTarget);
}

// Multi-shot : nombre de missiles tirés « en même temps » (une salve contre N cibles).
// N'est PAS dans ships.lua : c'est un comportement décrit dans le texte in-game
// (« Missile Chaser ... fires at 3 targets at same time »). Défaut : 1 tir par round.
export const MULTI_SHOT = new Uint8Array(COUNT);
MULTI_SHOT.fill(1);
MULTI_SHOT[NAME_TO_ID.missile_chaser] = 3;

for (const ship of shipData.ships) {
  const id = ship.id;
  BASE_ATT[id] = ship.att;
  BASE_SHIELD[id] = ship.shield;
  BASE_HULL[id] = ship.hull;

  COST_METAL[id] = ship.metal;
  COST_CRYSTAL[id] = ship.crystal;
  COST_GAS[id] = ship.gas;
  COST_TOTAL[id] = ship.metal + ship.crystal + ship.gas;

  for (const [targetName, factor] of Object.entries(ship.rapidFire)) {
    const targetId = NAME_TO_ID[targetName];
    RF_THRESHOLD[id * COUNT + targetId] = 1 - 1 / factor;
  }
}
