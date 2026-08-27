import { describe, expect, it } from 'vitest';
import type { Techs } from '../src/types';
import { combinedTechPercent } from '../src/lib/tech';

const techs: Techs = {
  weapon: { player: 200, alliance: 70, buff: 0 },
  shield: { player: 0, alliance: 0, buff: 0 },
  armor: { player: 0, alliance: 0, buff: 0 },
};

describe('combinedTechPercent', () => {
  it('additionne player + alliance + buff + skin (sans skin)', () => {
    expect(combinedTechPercent(techs, 'none', 'weapon')).toBe(270);
  });

  it('applique le bonus de skin du défenseur', () => {
    expect(combinedTechPercent(techs, 'limitless_rage', 'weapon')).toBe(320); // 270 + 50
    expect(combinedTechPercent(techs, 'cube_world', 'shield')).toBe(30); // 0 + 30
    expect(combinedTechPercent(techs, 'yummy_sushi', 'armor')).toBe(30); // 0 + 30
  });

  it('aucun bonus de skin si "none"', () => {
    expect(combinedTechPercent(techs, 'none', 'shield')).toBe(0);
  });
});
