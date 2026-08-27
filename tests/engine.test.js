import { describe, it, expect } from "vitest";
import {
  simulateBattle,
  stat,
  computeSideStats,
  COUNT,
  NAMES,
  NAME_TO_ID,
} from "../src/engine/index.js";

const tech270 = {
  weapon: { player: 200, alliance: 70, buff: 0 },
  shield: { player: 200, alliance: 70, buff: 0 },
  armor: { player: 200, alliance: 70, buff: 0 },
};

describe("Arrondi float32 (spec §9.1)", () => {
  const cases = [
    [200000, 165, 529999],
    [200000, 240, 680000],
    [200000, 270, 740000],
    [50000, 230, 164999],
    [50000, 270, 185000],
  ];

  it.each(cases)("%i × %i%% → %i", (base, pct, expected) => {
    expect(stat(base, pct)).toBe(expected);
  });
});

describe("Données canoniques", () => {
  it("expose 25 vaisseaux dans l'ordre canonique", () => {
    expect(COUNT).toBe(25);
    expect(NAMES[0]).toBe("small_cargo");
    expect(NAMES[24]).toBe("missile_chaser");
    expect(NAME_TO_ID["death_star"]).toBe(9);
  });

  it("calcule les stats d'un camp", () => {
    const stats = computeSideStats(tech270, "none");
    expect(stats.attack[9]).toBe(740000); // death star att 270 %
    expect(stats.shield[9]).toBe(185000); // death star shield 270 %
  });

  it("armure : la techno armor n'augmente PAS la coque (hull = def)", () => {
    const stats = computeSideStats(tech270, "none");
    // def death star = 900 000 ; armor 270 % (player 200 + alliance 70) est ignoré.
    expect(stats.hull[9]).toBe(900000);
  });
});

describe("Invariant shield_absorption 2025-09-26 round 3", () => {
  it("somme des boucliers des 335 unités détruites = 54 292 690", () => {
    // 293 death stars + 5 battleships + 30 destroyers + 7 missile chasers,
    // shield tech défenseur = 270 %.
    const sum =
      293 * stat(50000, 270) +
      5 * stat(200, 270) +
      30 * stat(500, 270) +
      7 * stat(1100, 270);
    expect(sum).toBe(54292690);
  });
});

describe("Moteur — comportement de base", () => {
  it("dégâts partiels de bouclier comptés dans shield_absorption (survivant)", () => {
    // 1 battleship (att 1000, 0 tech) vs 1 death star (shield 50 000) : survit.
    const zero = { weapon: {}, shield: {}, armor: {} };
    const r = simulateBattle(
      { battleship: 1 },
      { death_star: 1 },
      zero,
      zero,
      { seed: 7 },
    );
    const atk = r.rounds[0].attacker;
    expect(atk.number_of_attack).toBe(1);
    expect(atk.shield_absorption).toBe(1000); // absorption partielle, pas le bouclier complet
    expect(atk.current_damage).toBe(1000);
    expect(atk.wreck).toBe(0);
  });

  it("rapid fire : la chaîne continue après un tir perdu (pool figé, 1v1)", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    // death star vs battleship : tue en un tir, puis RF (1 - 1/30) continue sur l'épave.
    const r = simulateBattle(
      { death_star: 1 },
      { battleship: 1 },
      zero,
      zero,
      { seed: 3 },
    );
    const atk = r.rounds[0].attacker; // le death star est attaquant ici
    expect(atk.wreck).toBe(1); // une seule cible → un seul kill possible
    // current_damage = nombre de tirs × 200 000 (brut, tirs perdus inclus)
    expect(atk.current_damage).toBe(atk.number_of_attack * 200000);
    // RF 30 : la chaîne ne s'arrête pas au premier tir perdu.
    expect(atk.number_of_attack).toBeGreaterThan(1);
  });

  it("flotte vide d'un côté → victoire immédiate", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    expect(simulateBattle({}, { battleship: 1 }, zero, zero, { seed: 0 }).winner).toBe("defender");
    expect(simulateBattle({ battleship: 1 }, {}, zero, zero, { seed: 0 }).winner).toBe("attacker");
    expect(simulateBattle({}, {}, zero, zero, { seed: 0 }).winner).toBe("draw");
  });

  it("rapid fire : chaîne géométrique — le tir perdu ne termine pas la chaîne", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    // 1 cruiser vs 1 rocket launcher (RF 10, one-shot). Après le kill, le cruiser
    // continue de tirer sur l'épave : moyenne ~10 tirs (géométrique 1 - 1/10), pas ~1-2.
    let total = 0;
    const K = 200;
    for (let i = 0; i < K; i++) {
      const r = simulateBattle(
        { cruiser: 1 },
        { rocket_launcher: 1 },
        zero,
        zero,
        { seed: i + 1 },
      );
      total += r.rounds[0].attacker.number_of_attack;
    }
    const avg = total / K;
    expect(avg).toBeGreaterThan(5);
    expect(avg).toBeLessThan(15);
  });

  it("attaque = 0 (sonde) : tir compté mais 0 dégât", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    const r = simulateBattle(
      { spy_probe: 1 },
      { death_star: 1 },
      zero,
      zero,
      { seed: 1 },
    );
    const atk = r.rounds[0].attacker;
    expect(atk.number_of_attack).toBe(1);
    expect(atk.current_damage).toBe(0);
    expect(atk.shield_absorption).toBe(0);
  });

  it("même seed → même résultat (déterminisme)", () => {
    const a = simulateBattle(
      { cruiser: 100 },
      { death_star: 10 },
      tech270,
      tech270,
      { seed: 42 },
    );
    const b = simulateBattle(
      { cruiser: 100 },
      { death_star: 10 },
      tech270,
      tech270,
      { seed: 42 },
    );
    expect(a).toEqual(b);
  });
});

describe("Moteur — multi-shot & pertes", () => {
  it("multi-shot : 1 missile chaser tire 3 missiles contre 3 cibles", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    const r = simulateBattle(
      { missile_chaser: 1 },
      { rocket_launcher: 3 },
      zero,
      zero,
      { seed: 1 },
    );
    const atk = r.rounds[0].attacker;
    expect(atk.number_of_attack).toBe(3); // 3 cibles vivantes → 3 missiles
    expect(atk.current_damage).toBe(3 * 1900);
  });

  it("multi-shot : 1 missile chaser tire 1 seul missile contre 1 cible", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    const r = simulateBattle(
      { missile_chaser: 1 },
      { death_star: 1 },
      zero,
      zero,
      { seed: 1 },
    );
    const atk = r.rounds[0].attacker;
    expect(atk.number_of_attack).toBe(1); // 1 cible → 1 missile
    expect(atk.current_damage).toBe(1900);
  });

  it("pertes : l'effectif attaquant décroît correctement entre les rounds", () => {
    const zero = { weapon: {}, shield: {}, armor: {} };
    // 3 missile chasers vs 1 death star : la death star tue 1 chaser par round.
    const r = simulateBattle(
      { missile_chaser: 3 },
      { death_star: 1 },
      zero,
      zero,
      { seed: 1 },
    );
    expect(r.rounds[0].attacker.number_of_attack).toBe(3);
    expect(r.rounds[1].attacker.number_of_attack).toBe(2);
    expect(r.rounds[2].attacker.number_of_attack).toBe(1);
  });
});

describe("Moteur — 2025-11-27 (structure)", () => {
  it("56 death stars seules produisent un nombre d'attaques plausible (rapid fire)", () => {
    // Le défenseur a 56 death stars ; on vérifie qu'une flotte seule de death stars
    // produit une chaîne de rapid fire du bon ordre de grandeur face à 33 985 cibles.
    const fleet = {
      cruiser: 5000,
      battleship: 10000,
      dreadnought: 20000,
    };
    const r = simulateBattle(fleet, { death_star: 56 }, tech270, tech270, { seed: 12345 });
    const defR1 = r.rounds[0].defender;
    // 56 death stars tirent au moins 56 fois et bien plus grâce au rapid fire.
    expect(defR1.number_of_attack).toBeGreaterThan(56);
    // current_damage = number_of_attack × 740 000 (death star att 270 %).
    expect(defR1.current_damage).toBe(defR1.number_of_attack * 740000);
  });
});
