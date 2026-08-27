import raw from './ships.json';
import type { Fleet, ShipInfo, Side } from '../types';

const data = raw as unknown as { ships: ShipInfo[] };

export const SHIPS: ShipInfo[] = [...data.ships].sort((a, b) => a.order - b.order);
export const SHIP_NAMES: string[] = SHIPS.map((ship) => ship.name);
export const SHIP_BY_NAME: Record<string, ShipInfo> = Object.fromEntries(
  SHIPS.map((ship) => [ship.name, ship]),
);

// Nom d'affichage en « Title Case » (ex. `death_star` → `Death Star`).
export function shipLabel(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Unités de défense au sol : réservées au défenseur, jamais envoyées par l'attaquant.
export const GROUND_DEFENSE_NAMES = new Set<string>([
  'rocket_launcher',
  'light_laser',
  'heavy_laser',
  'gauss_cannon',
  'ion_cannon',
  'plasma_turret',
  'small_shield',
  'large_shield',
]);

// Catégories d'affichage : vaisseaux civils vs militaires vs défenses au sol.
export type ShipCategory = 'civil' | 'military' | 'defense';

export const CIVIL_NAMES = new Set<string>([
  'small_cargo',
  'large_cargo',
  'spy_probe',
  'recovery_vessel',
  'colony_ship',
  'mining_vessel',
  'super_freighter',
  'large_recovery_vessel',
]);

export const MILITARY_NAMES = new Set<string>([
  'light_fighter',
  'heavy_fighter',
  'cruiser',
  'battleship',
  'bomber',
  'dreadnought',
  'destroyer',
  'death_star',
  'missile_chaser',
]);

export function shipCategory(name: string): ShipCategory {
  if (GROUND_DEFENSE_NAMES.has(name)) return 'defense';
  if (MILITARY_NAMES.has(name)) return 'military';
  return 'civil';
}

// Limites de saisie (défenseur uniquement) : défenses max 99 999, dômes max 1,
// vaisseaux sans limite (jusqu'à des millions).
export function maxUnits(name: string): number {
  if (name === 'small_shield' || name === 'large_shield') return 1;
  if (GROUND_DEFENSE_NAMES.has(name)) return 99999;
  return Number.POSITIVE_INFINITY;
}

// Valeur de remplissage du bouton « max » (stepper) : plafond pratique de 999 999 pour
// les vaisseaux, règle du jeu pour les défenses (99 999) et les dômes (1).
export function maxFillUnits(name: string): number {
  if (name === 'small_shield' || name === 'large_shield') return 1;
  if (GROUND_DEFENSE_NAMES.has(name)) return 99999;
  return 999999;
}

export function shipsForSide(side: Side): ShipInfo[] {
  if (side === 'attacker') {
    return SHIPS.filter((ship) => !GROUND_DEFENSE_NAMES.has(ship.name));
  }
  return SHIPS;
}

// Purge les unités de défense au sol d'une flotte (règle : l'attaquant n'en a jamais).
// Ne conserve que les effectifs entiers strictement positifs.
export function stripGroundDefense(fleet: Fleet): Fleet {
  const out: Fleet = {};
  for (const [name, value] of Object.entries(fleet)) {
    if (GROUND_DEFENSE_NAMES.has(name)) continue;
    const count = Math.floor(Number(value));
    if (Number.isFinite(count) && count > 0) out[name] = count;
  }
  return out;
}
