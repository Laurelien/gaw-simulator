import type { PlanetSkin, Techs } from '../types';

export type TechStat = 'weapon' | 'shield' | 'armor';

// Bonus de skin (défenseur uniquement), en %. Doit rester aligné sur `SKIN_BONUS`
// du moteur (`src/engine/tech.js`).
export const SKIN_BONUS: Record<PlanetSkin, Record<TechStat, number>> = {
  none: { weapon: 0, shield: 0, armor: 0 },
  cube_world: { weapon: 0, shield: 30, armor: 0 },
  yummy_sushi: { weapon: 0, shield: 0, armor: 30 },
  limitless_rage: { weapon: 50, shield: 0, armor: 0 },
  technology_domination: { weapon: 30, shield: 0, armor: 0 },
};

// % combiné d'une stat = player + alliance + buff + bonus de skin.
export function combinedTechPercent(
  techs: Techs,
  planetSkin: PlanetSkin,
  stat: TechStat,
): number {
  const mods = techs[stat];
  return mods.player + mods.alliance + mods.buff + SKIN_BONUS[planetSkin][stat];
}
