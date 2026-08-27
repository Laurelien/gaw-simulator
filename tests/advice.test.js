import { describe, it, expect } from "vitest";
import {
  getAdvice,
  TOP_DOMINANT_COUNT,
  EXPENSIVE_UNIT_COST,
} from "../src/engine/index.js";

// Références rapid fire (src/engine/data/ships.json) :
//   vs light_fighter : cruiser 6, death_star 200, missile_chaser 10
//   vs rocket_launcher : battleship 2, bomber 20, cruiser 10, death_star 200
//   vs cruiser : death_star 33, dreadnought 4, missile_chaser 4

describe("getAdvice — counter (v1)", () => {
  it("suggère les compteurs rapid fire, triés par facteur décroissant", () => {
    const advice = getAdvice({}, { light_fighter: 100 });

    expect(advice.map((a) => a.type)).toEqual(["counter", "counter", "counter"]);
    expect(advice.map((a) => a.message)).toEqual([
      "The defender has many Light Fighter. Consider Death Star (rapid fire 200 vs Light Fighter).",
      "The defender has many Light Fighter. Consider Missile Chaser (rapid fire 10 vs Light Fighter).",
      "The defender has many Light Fighter. Consider Cruiser (rapid fire 6 vs Light Fighter).",
    ]);
  });

  it("analyse seulement le top N types dominants du défenseur", () => {
    const fleetB = {
      rocket_launcher: 100, // dominant 1
      cruiser: 80, // dominant 2
      light_fighter: 60, // dominant 3
      battleship: 40, // hors top 3 → ignoré comme cible
    };
    const advice = getAdvice({}, fleetB);

    // battleship n'apparaît jamais comme cible d'un conseil.
    expect(advice.some((a) => a.message.includes("defender has many Battleship"))).toBe(false);
    // Les 3 dominants sont bien traités.
    expect(advice.some((a) => a.message.includes("defender has many Rocket Launcher"))).toBe(true);
    expect(advice.some((a) => a.message.includes("defender has many Cruiser"))).toBe(true);
    expect(advice.some((a) => a.message.includes("defender has many Light Fighter"))).toBe(true);
  });

  it("ne produit aucun counter pour une défense vide", () => {
    const advice = getAdvice({ death_star: 1 }, {});
    expect(advice.filter((a) => a.type === "counter")).toHaveLength(0);
  });
});

describe("getAdvice — tampon (bonus)", () => {
  it("suggère des light_fighter quand l'attaquant a des vaisseaux chers sans chaff", () => {
    const advice = getAdvice({ death_star: 1 }, { rocket_launcher: 100 });

    const buffer = advice.filter((a) => a.type === "buffer");
    expect(buffer).toHaveLength(1);
    expect(buffer[0].message).toContain("Light Fighter");
    expect(buffer[0].message).toContain("dilute");
  });

  it("ne suggère pas de tampon si l'attaquant a déjà des light_fighter", () => {
    const advice = getAdvice({ death_star: 1, light_fighter: 50 }, { rocket_launcher: 100 });
    expect(advice.some((a) => a.type === "buffer")).toBe(false);
  });

  it("ne suggère pas de tampon sans vaisseaux chers", () => {
    // cruiser : coût total 29 000 < EXPENSIVE_UNIT_COST (60 000).
    const advice = getAdvice({ cruiser: 100 }, { rocket_launcher: 100 });
    expect(advice.some((a) => a.type === "buffer")).toBe(false);
    // mais les counters restent produits.
    expect(advice.some((a) => a.type === "counter")).toBe(true);
  });

  it("retourne un tableau vide pour deux flottes vides", () => {
    expect(getAdvice({}, {})).toEqual([]);
  });
});

describe("getAdvice — constantes", () => {
  it("expose des constantes ajustables", () => {
    expect(TOP_DOMINANT_COUNT).toBe(3);
    expect(EXPENSIVE_UNIT_COST).toBe(60_000);
  });
});
