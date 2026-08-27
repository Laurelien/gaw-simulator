import { describe, expect, it } from 'vitest';
import { fleetTotal, isFleetEmpty } from '../src/lib/fleet';

describe('fleet helpers', () => {
  it('somme les effectifs', () => {
    expect(fleetTotal({ cruiser: 10, battleship: 5 })).toBe(15);
  });

  it('ignore les valeurs invalides ou nulles', () => {
    expect(fleetTotal({ cruiser: -3, battleship: 0 })).toBe(0);
  });

  it('détecte une flotte vide', () => {
    expect(isFleetEmpty({})).toBe(true);
    expect(isFleetEmpty({ cruiser: 0 })).toBe(true);
    expect(isFleetEmpty({ cruiser: 1 })).toBe(false);
  });
});
