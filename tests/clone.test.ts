import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { cloneFleet, cloneTechs } from '../src/lib/clone';

describe('clone helpers (postMessage-safe)', () => {
  it('cloneFleet produit un objet simple clonable par structured clone', () => {
    const fleet = reactive({ cruiser: 10 });
    const plain = cloneFleet(fleet);
    expect(plain).toEqual({ cruiser: 10 });
    expect(structuredClone(plain)).toEqual({ cruiser: 10 });
  });

  it('cloneTechs désimbrique les mods réactifs (plus de proxy imbriqué)', () => {
    const techs = reactive({
      weapon: { player: 100, alliance: 0, buff: 0 },
      shield: { player: 0, alliance: 0, buff: 20 },
      armor: { player: 0, alliance: 0, buff: 0 },
    });
    const plain = cloneTechs(techs);
    expect(structuredClone(plain)).toEqual({
      weapon: { player: 100, alliance: 0, buff: 0 },
      shield: { player: 0, alliance: 0, buff: 20 },
      armor: { player: 0, alliance: 0, buff: 0 },
    });
    // Les sous-objets sont de nouveaux objets simples (pas les proxies d'origine).
    expect(plain.weapon).not.toBe(techs.weapon);
    expect(plain.shield).not.toBe(techs.shield);
    expect(plain.armor).not.toBe(techs.armor);
  });
});
