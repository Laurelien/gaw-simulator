import { describe, it, expect } from "vitest";
import {
  computeDebris,
  computeLossValue,
  computeFleetValue,
  computeVerdict,
  DEBRIS_RATE,
  VERDICT_GREEN_MAX,
  VERDICT_YELLOW_MAX,
  COST_METAL,
  COST_CRYSTAL,
  COST_GAS,
  COST_TOTAL,
  NAME_TO_ID,
} from "../src/engine/index.js";

// Coûts canoniques (ships.lua) utilisés comme attentes :
//   cruiser      : métal 20 000, cristal 7 000, gaz 2 000 → total 29 000
//   death_star   : métal 5 000 000, cristal 4 000 000, gaz 1 000 000 → total 10 000 000
//   spy_probe    : métal 0, cristal 1 000, gaz 0 → total 1 000
//   rocket_launcher : métal 2 000, cristal 0, gaz 0 → total 2 000

function lossRound(attackerLosses, defenderLosses) {
  return {
    round: 1,
    attacker: { losses: attackerLosses },
    defender: { losses: defenderLosses },
  };
}

describe("Données — coûts res_demand", () => {
  it("expose les coûts canoniques par type", () => {
    expect(COST_METAL[NAME_TO_ID.death_star]).toBe(5_000_000);
    expect(COST_CRYSTAL[NAME_TO_ID.death_star]).toBe(4_000_000);
    expect(COST_GAS[NAME_TO_ID.death_star]).toBe(1_000_000);
    expect(COST_TOTAL[NAME_TO_ID.death_star]).toBe(10_000_000);

    expect(COST_METAL[NAME_TO_ID.cruiser]).toBe(20_000);
    expect(COST_CRYSTAL[NAME_TO_ID.cruiser]).toBe(7_000);
    expect(COST_GAS[NAME_TO_ID.cruiser]).toBe(2_000);
    expect(COST_TOTAL[NAME_TO_ID.cruiser]).toBe(29_000);
  });
});

describe("computeDebris", () => {
  it("calcule 30 % du métal/cristal des vaisseaux détruits (deux camps)", () => {
    const result = {
      winner: "attacker",
      rounds: [lossRound({ cruiser: 10 }, { death_star: 1 })],
      survivors: { attacker: {}, defender: {} },
      seed: 0,
    };

    const debris = computeDebris(result);

    // métal : (10 × 20 000 + 5 000 000) × 30 % = 5 200 000 × 0,3 = 1 560 000
    expect(debris.metal).toBe(1_560_000);
    // cristal : (10 × 7 000 + 4 000 000) × 30 % = 4 070 000 × 0,3 = 1 221 000
    expect(debris.crystal).toBe(1_221_000);
  });

  it("agrège les pertes sur tous les rounds", () => {
    const result = {
      winner: "defender",
      rounds: [
        lossRound({ cruiser: 1 }, {}),
        lossRound({ cruiser: 2 }, { spy_probe: 3 }),
      ],
      survivors: { attacker: {}, defender: {} },
      seed: 0,
    };

    const debris = computeDebris(result);
    // métal : (3 × 20 000 + 3 × 0) × 0,3 = 60 000 × 0,3 = 18 000
    expect(debris.metal).toBe(18_000);
    // cristal : (3 × 7 000 + 3 × 1 000) × 0,3 = 24 000 × 0,3 = 7 200
    expect(debris.crystal).toBe(7_200);
  });

  it("retourne des débris nuls pour un résultat sans rounds", () => {
    expect(computeDebris({ winner: "draw", rounds: [], survivors: {}, seed: 0 })).toEqual({
      metal: 0,
      crystal: 0,
    });
  });

  it("accepte un shipData personnalisé", () => {
    const shipData = {
      ships: [{ name: "cruiser", metal: 100, crystal: 50, gas: 0 }],
    };
    const result = {
      winner: "attacker",
      rounds: [lossRound({ cruiser: 2 }, {})],
      survivors: { attacker: {}, defender: {} },
      seed: 0,
    };

    const debris = computeDebris(result, shipData);
    expect(debris.metal).toBe(2 * 100 * DEBRIS_RATE);
    expect(debris.crystal).toBe(2 * 50 * DEBRIS_RATE);
  });
});

describe("computeFleetValue", () => {
  it("somme le coût total (métal + cristal + gaz) des unités", () => {
    expect(computeFleetValue({ cruiser: 2, death_star: 1 })).toBe(2 * 29_000 + 10_000_000);
  });

  it("ignore les effectifs non valides", () => {
    expect(computeFleetValue({ cruiser: -3, death_star: 1.9 })).toBe(1 * 10_000_000);
  });

  it("utilise les données canoniques par défaut (shipData omis)", () => {
    expect(computeFleetValue({ cruiser: 1 })).toBe(29_000);
  });
});

describe("computeLossValue", () => {
  it("valeur des pertes attaquant = (initial − survivants) × coût total", () => {
    const result = {
      winner: "attacker",
      rounds: [],
      survivors: { attacker: { cruiser: 4, death_star: 1 }, defender: {} },
      seed: 0,
    };
    const fleetA = { cruiser: 10, death_star: 1 };

    // pertes : 6 cruisers × 29 000 = 174 000 (death star intacte)
    expect(computeLossValue(result, fleetA)).toBe(174_000);
  });

  it("compte comme perdu un type entièrement détruit (absent des survivants)", () => {
    const result = {
      winner: "defender",
      rounds: [],
      survivors: { attacker: { death_star: 1 }, defender: {} },
      seed: 0,
    };
    const fleetA = { cruiser: 5, death_star: 1 };

    expect(computeLossValue(result, fleetA)).toBe(5 * 29_000);
  });

  it("retourne 0 quand l'attaquant ne perd rien", () => {
    const result = {
      winner: "attacker",
      rounds: [],
      survivors: { attacker: { cruiser: 3 }, defender: {} },
      seed: 0,
    };
    expect(computeLossValue(result, { cruiser: 3 })).toBe(0);
  });
});

describe("computeVerdict", () => {
  it("victoire : vert sous le seuil bas", () => {
    expect(computeVerdict("attacker", 0.05)).toBe("green");
    expect(computeVerdict("attacker", 0)).toBe("green");
  });

  it("victoire : jaune dans la plage 10–30 %", () => {
    expect(computeVerdict("attacker", VERDICT_GREEN_MAX)).toBe("yellow"); // borne 10 %
    expect(computeVerdict("attacker", 0.2)).toBe("yellow");
    expect(computeVerdict("attacker", VERDICT_YELLOW_MAX)).toBe("yellow"); // borne 30 %
  });

  it("victoire : orange au-delà de 30 %", () => {
    expect(computeVerdict("attacker", 0.3001)).toBe("orange");
    expect(computeVerdict("attacker", 0.5)).toBe("orange");
  });

  it("égalité : jaune, défaite : rouge (quel que soit lossRate)", () => {
    expect(computeVerdict("draw", 0.05)).toBe("yellow");
    expect(computeVerdict("draw", 0.9)).toBe("yellow");
    expect(computeVerdict("defender", 0.05)).toBe("red");
    expect(computeVerdict("defender", 0.9)).toBe("red");
  });

  it("taux de perte invalide → traité comme 0 (vert en victoire)", () => {
    expect(computeVerdict("attacker", NaN)).toBe("green");
    expect(computeVerdict("attacker", -0.5)).toBe("green");
  });
});
