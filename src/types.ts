export type Fleet = Record<string, number>;

// Résultat de l'import OCR d'un rapport d'espionnage (voir docs/specs/ocr-espionage.md).
export type EspionageData = { ships: Fleet };

export type Mods = {
  player: number;
  alliance: number;
  buff: number;
};

export type Techs = {
  weapon: Mods;
  shield: Mods;
  armor: Mods;
};

export type PlanetSkin =
  | 'none'
  | 'cube_world'
  | 'yummy_sushi'
  | 'limitless_rage'
  | 'technology_domination';

export type Side = 'attacker' | 'defender';
export type Winner = 'attacker' | 'defender' | 'draw';

// Verdict de combat (docs/specs/battle-verdict.md) : couleur de la barre « vaut le coup ».
export type Verdict = 'green' | 'yellow' | 'orange' | 'red';

// Débris potentiels (métal / cristal), en unités de ressources.
export type Debris = { metal: number; crystal: number };

// Conseil stratégique (docs/specs/strategic-advice.md).
export type AdviceType = 'counter' | 'buffer';
export type Advice = { type: AdviceType; message: string };

export type SideResult = {
  losses: Fleet;
  number_of_attack: number;
  current_damage: number;
  shield_absorption: number;
  wreck: number;
};

export type RoundResult = {
  round: number;
  attacker: SideResult;
  defender: SideResult;
};

export type BattleResult = {
  winner: Winner;
  rounds: RoundResult[];
  survivors: { attacker: Fleet; defender: Fleet };
  seed: number;
};

export type SavedFleet = {
  id: string;
  name: string;
  ships: Fleet;
  techs: Techs;
  planetSkin?: PlanetSkin;
};

export type ShipInfo = {
  index: number;
  name: string;
  order: number;
  att: number;
  shield: number;
  hull: number;
  rapidFire: Record<string, number>;
  image: string;
};

export type FleetEditorUpdate = {
  fleet?: Fleet;
  techs?: Techs;
  planetSkin?: PlanetSkin;
};

export type MonteCarloOptions = {
  runs: number;
  seed?: number;
};

export type StatDistribution = {
  mean: number;
  p5: number;
  p95: number;
};

export type MonteCarloResult = {
  winProbability: { attacker: number; defender: number; draw: number };
  totalLosses: { attacker: StatDistribution; defender: StatDistribution };
  lossesByType: {
    attacker: Record<string, StatDistribution>;
    defender: Record<string, StatDistribution>;
  };
  medianReport: BattleResult;
  runs: number;
  elapsedMs: number;
};
