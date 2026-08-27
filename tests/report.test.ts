import { describe, expect, it } from 'vitest';
import type { BattleResult, Fleet, SideResult } from '../src/types';
import { buildRoundViews } from '../src/lib/report';

function side(losses: Fleet): SideResult {
  return {
    losses,
    number_of_attack: 0,
    current_damage: 0,
    shield_absorption: 0,
    wreck: 0,
  };
}

// Attaquant : 100 cruisers → 80 survivants (perd 10 par round).
// Défenseur : 100 rocket launchers → 0 survivant (perd 40 puis 60).
const result: BattleResult = {
  winner: 'attacker',
  seed: 1,
  survivors: { attacker: { cruiser: 80 }, defender: {} },
  rounds: [
    {
      round: 1,
      attacker: side({ cruiser: 10 }),
      defender: side({ rocket_launcher: 40 }),
    },
    {
      round: 2,
      attacker: side({ cruiser: 10 }),
      defender: side({ rocket_launcher: 60 }),
    },
  ],
};

describe('buildRoundViews', () => {
  it('reconstitue l\'effectif au début de chaque round et les pertes du round', () => {
    const views = buildRoundViews(result);

    expect(views[0].attacker).toEqual([{ name: 'cruiser', before: 100, lost: 10 }]);
    expect(views[0].defender).toEqual([{ name: 'rocket_launcher', before: 100, lost: 40 }]);

    expect(views[1].attacker).toEqual([{ name: 'cruiser', before: 90, lost: 10 }]);
    expect(views[1].defender).toEqual([{ name: 'rocket_launcher', before: 60, lost: 60 }]);
  });

  it('conserve les détails secondaires (damage, attacks…) par round', () => {
    const views = buildRoundViews(result);
    expect(views[0].details.attacker).toEqual(side({ cruiser: 10 }));
    expect(views[1].details.defender).toEqual(side({ rocket_launcher: 60 }));
  });
});
