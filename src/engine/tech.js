// Calcul des stats de combat d'un camp (technos additives + skin du défenseur).
//
// Le serveur calcule en simple précision. La formule validée sur les 5 points observés
// (spec §9.1) n'est PAS `Math.fround(base * Math.fround(1 + pct/100))` mais :
//
//     stat = floor(base * (1 + fround(pct / 100)))
//
// C'est le ratio `pct / 100` qui est arrondi en float32, puis multiplié par la base en
// double précision. Voir `docs/status/engine.md` pour le détail.

import { BASE_ATT, BASE_SHIELD, BASE_HULL, COUNT } from "./ships.js";

// Bonus de skin (défenseur uniquement), en %.
export const SKIN_BONUS = Object.freeze({
  none: { weapon: 0, shield: 0, armor: 0 },
  cube_world: { weapon: 0, shield: 30, armor: 0 },
  yummy_sushi: { weapon: 0, shield: 0, armor: 30 },
  limitless_rage: { weapon: 50, shield: 0, armor: 0 },
  technology_domination: { weapon: 30, shield: 0, armor: 0 },
});

/**
 * Multiplicateur flottant simple précision, puis stat entière arrondie par défaut.
 * @param {number} base stat de base (att / Shield / def)
 * @param {number} pct pourcentage total
 * @returns {number} entier
 */
export function stat(base, pct) {
  return Math.floor(base * (1 + Math.fround(pct / 100)));
}

function modsSum(mods) {
  if (!mods) return 0;
  return (mods.player || 0) + (mods.alliance || 0) + (mods.buff || 0);
}

// L'armure (coque) NE suit PAS la règle additive de l'arme et du bouclier.
//
// Les rapports 2026-08-18 (armor 182 %) et 2026-08-19 (armor 212 %, test déterministe
// 1 death star seule vs 100 missile chasers) montrent que la techno « armure »
// (player + alliance + buff) n'a AUCUN effet sur la coque : la death star (def 900 000)
// meurt avec ≤ 1 093 972 de dégâts de coque, soit un multiplicateur ≤ 1.2155 au lieu de
// 3.12 attendu (armor 212 %).
//
// On garde donc `hull = def` ; seul le bonus de skin est conservé (non validable : tous les
// rapports disponibles sont `planet_skin = "none"`). Voir docs/status/engine.md §E.
function armorSum(mods) {
  return 0;
}

/**
 * @param {{weapon?: object, shield?: object, armor?: object}} techs
 * @param {string} [planetSkin='none']
 * @returns {{attack: Float32Array, shield: Float32Array, hull: Float32Array}}
 */
export function computeSideStats(techs, planetSkin = "none") {
  const skin = SKIN_BONUS[planetSkin] || SKIN_BONUS.none;

  const weaponPct = modsSum(techs?.weapon) + skin.weapon;
  const shieldPct = modsSum(techs?.shield) + skin.shield;
  const armorPct = armorSum(techs?.armor) + skin.armor;

  const attack = new Float32Array(COUNT);
  const shield = new Float32Array(COUNT);
  const hull = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    attack[i] = stat(BASE_ATT[i], weaponPct);
    shield[i] = stat(BASE_SHIELD[i], shieldPct);
    hull[i] = stat(BASE_HULL[i], armorPct);
  }

  return { attack, shield, hull };
}
