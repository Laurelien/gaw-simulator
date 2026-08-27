import type { BattleResult, Fleet, SideResult } from '../types';

export type SideEntry = { name: string; before: number; lost: number };

export type RoundView = {
  round: number;
  attacker: SideEntry[];
  defender: SideEntry[];
  details: { attacker: SideResult; defender: SideResult };
};

function addFleets(a: Fleet, b: Fleet): Fleet {
  const out: Fleet = { ...a };
  for (const [name, count] of Object.entries(b)) {
    out[name] = (out[name] ?? 0) + count;
  }
  return out;
}

function sideEntries(before: Fleet, lost: Fleet): SideEntry[] {
  return Object.keys(before)
    .map((name) => ({ name, before: before[name] ?? 0, lost: lost[name] ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Reconstruit, pour chaque round, l'effectif présent au début du round de chaque camp.
// Le `BattleResult` ne fournit que les pertes par round et les survivants finaux :
//   effectif début de round = survivants + pertes cumulées de ce round jusqu'à la fin.
export function buildRoundViews(result: BattleResult): RoundView[] {
  return result.rounds.map((round, i) => {
    let lossesA: Fleet = {};
    let lossesB: Fleet = {};
    for (let j = i; j < result.rounds.length; j++) {
      lossesA = addFleets(lossesA, result.rounds[j].attacker.losses);
      lossesB = addFleets(lossesB, result.rounds[j].defender.losses);
    }

    return {
      round: round.round,
      attacker: sideEntries(addFleets(result.survivors.attacker, lossesA), round.attacker.losses),
      defender: sideEntries(addFleets(result.survivors.defender, lossesB), round.defender.losses),
      details: { attacker: round.attacker, defender: round.defender },
    };
  });
}
