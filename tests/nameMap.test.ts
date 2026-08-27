import { describe, expect, it } from 'vitest';
import { SHIP_NAMES } from '../src/data/ships';
import {
  SNAKE_TO_TITLE,
  TITLE_TO_SNAKE,
  normalizeShipName,
  resolveShipName,
} from '../src/ocr/nameMap';

describe('nameMap (Title Case ↔ snake_case)', () => {
  it('couvre exactement les 25 types canoniques', () => {
    const snakes = Object.values(TITLE_TO_SNAKE).sort();
    expect(snakes).toEqual([...SHIP_NAMES].sort());
    expect(snakes).toHaveLength(25);
  });

  it('est bijectif (round-trip Title Case → snake_case → Title Case)', () => {
    for (const [title, snake] of Object.entries(TITLE_TO_SNAKE)) {
      expect(SNAKE_TO_TITLE[snake]).toBe(title);
    }
  });
});

describe('resolveShipName', () => {
  it('résout le libellé exact (Title Case)', () => {
    expect(resolveShipName('Light Fighter')).toBe('light_fighter');
    expect(resolveShipName('Death Star')).toBe('death_star');
    expect(resolveShipName('Large Recovery Vessel')).toBe('large_recovery_vessel');
  });

  it('est insensible à la casse', () => {
    expect(resolveShipName('light fighter')).toBe('light_fighter');
    expect(resolveShipName('LIGHT FIGHTER')).toBe('light_fighter');
    expect(resolveShipName('cruiser')).toBe('cruiser');
  });

  it('gère les confusions OCR l/1 et 0/O', () => {
    expect(resolveShipName('1ight Fighter')).toBe('light_fighter');
    expect(resolveShipName('C0lony Ship')).toBe('colony_ship');
    expect(resolveShipName('Small Carg0')).toBe('small_cargo');
  });

  it('reconnaît les libellés réels du jeu (alias)', () => {
    expect(resolveShipName('Small Cargo Ship')).toBe('small_cargo');
    expect(resolveShipName('Large Cargo Ship')).toBe('large_cargo');
    expect(resolveShipName('Dreadnoughts')).toBe('dreadnought');
    expect(resolveShipName('dreadnoughts')).toBe('dreadnought');
  });

  it('renvoie null pour un nom inconnu', () => {
    expect(resolveShipName('Foo Bar')).toBeNull();
    expect(resolveShipName('Resources')).toBeNull();
  });
});

describe('normalizeShipName', () => {
  it('minuscule, collapse les espaces, confusions OCR', () => {
    expect(normalizeShipName('  Light   Fighter  ')).toBe('light fighter');
    expect(normalizeShipName('Heavy Fighter')).toBe('heavy fighter');
    expect(normalizeShipName('1ight Fighter')).toBe('light fighter');
  });
});
