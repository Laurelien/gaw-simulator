import { describe, expect, it } from 'vitest';
import {
  CIVIL_NAMES,
  GROUND_DEFENSE_NAMES,
  MILITARY_NAMES,
  SHIPS,
  maxFillUnits,
  maxUnits,
  shipCategory,
  shipLabel,
  shipsForSide,
  stripGroundDefense,
} from '../src/data/ships';

describe('shipsForSide', () => {
  it('l\'attaquant n\'a aucune unité de défense au sol', () => {
    const attacker = shipsForSide('attacker');
    expect(attacker).toHaveLength(SHIPS.length - GROUND_DEFENSE_NAMES.size);
    for (const ship of attacker) {
      expect(GROUND_DEFENSE_NAMES.has(ship.name)).toBe(false);
    }
  });

  it('le défenseur conserve les 25 types', () => {
    expect(shipsForSide('defender')).toHaveLength(25);
  });

  it('les défenses au sol sont exactement les 8 types attendus', () => {
    expect([...GROUND_DEFENSE_NAMES].sort()).toEqual([
      'gauss_cannon',
      'heavy_laser',
      'ion_cannon',
      'large_shield',
      'light_laser',
      'plasma_turret',
      'rocket_launcher',
      'small_shield',
    ]);
  });
});

describe('ordre d\'affichage (order)', () => {
  it('est séquentiel de 0 à 24', () => {
    expect(SHIPS.map((ship) => ship.order)).toEqual([...Array(25).keys()]);
  });

  it('place les défenses après tous les vaisseaux', () => {
    const firstDefense = SHIPS.findIndex((ship) => GROUND_DEFENSE_NAMES.has(ship.name));
    expect(firstDefense).toBe(17);
    expect(SHIPS.slice(0, firstDefense).every((ship) => !GROUND_DEFENSE_NAMES.has(ship.name))).toBe(true);
    expect(SHIPS.slice(firstDefense).every((ship) => GROUND_DEFENSE_NAMES.has(ship.name))).toBe(true);
  });
});

describe('shipLabel', () => {
  it('met chaque mot en majuscule (title case)', () => {
    expect(shipLabel('small_cargo')).toBe('Small Cargo');
    expect(shipLabel('death_star')).toBe('Death Star');
    expect(shipLabel('large_recovery_vessel')).toBe('Large Recovery Vessel');
    expect(shipLabel('super_freighter')).toBe('Super Freighter');
  });
});

describe('shipCategory', () => {
  it('classe les vaisseaux civils, militaires et les défenses', () => {
    expect(shipCategory('small_cargo')).toBe('civil');
    expect(shipCategory('spy_probe')).toBe('civil');
    expect(shipCategory('mining_vessel')).toBe('civil');
    expect(shipCategory('light_fighter')).toBe('military');
    expect(shipCategory('death_star')).toBe('military');
    expect(shipCategory('missile_chaser')).toBe('military');
    expect(shipCategory('rocket_launcher')).toBe('defense');
    expect(shipCategory('large_shield')).toBe('defense');
  });

  it('partitionne les 25 types en 3 catégories disjointes', () => {
    const all = new Set([...CIVIL_NAMES, ...MILITARY_NAMES, ...GROUND_DEFENSE_NAMES]);
    expect(all.size).toBe(25);
    expect(CIVIL_NAMES.size + MILITARY_NAMES.size + GROUND_DEFENSE_NAMES.size).toBe(25);
  });
});

describe('maxUnits', () => {
  it('limite les défenses à 99 999', () => {
    expect(maxUnits('rocket_launcher')).toBe(99999);
    expect(maxUnits('plasma_turret')).toBe(99999);
  });

  it('limite les dômes à 1', () => {
    expect(maxUnits('small_shield')).toBe(1);
    expect(maxUnits('large_shield')).toBe(1);
  });

  it('ne limite pas les vaisseaux', () => {
    expect(maxUnits('cruiser')).toBe(Number.POSITIVE_INFINITY);
    expect(maxUnits('death_star')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('maxFillUnits', () => {
  it('remplit les vaisseaux à 999 999', () => {
    expect(maxFillUnits('cruiser')).toBe(999999);
    expect(maxFillUnits('death_star')).toBe(999999);
    expect(maxFillUnits('light_fighter')).toBe(999999);
  });

  it('remplit les défenses à 99 999', () => {
    expect(maxFillUnits('rocket_launcher')).toBe(99999);
    expect(maxFillUnits('plasma_turret')).toBe(99999);
  });

  it('remplit les dômes à 1', () => {
    expect(maxFillUnits('small_shield')).toBe(1);
    expect(maxFillUnits('large_shield')).toBe(1);
  });
});

describe('stripGroundDefense', () => {
  it('retire les défenses au sol et garde les vaisseaux', () => {
    const out = stripGroundDefense({
      cruiser: 10,
      rocket_launcher: 5,
      small_shield: 2,
      battleship: 1,
      ion_cannon: 0,
    });
    expect(out).toEqual({ cruiser: 10, battleship: 1 });
  });

  it('ignore les effectifs non positifs', () => {
    expect(stripGroundDefense({ cruiser: 0, battleship: -3, light_laser: 1 })).toEqual({});
  });
});
