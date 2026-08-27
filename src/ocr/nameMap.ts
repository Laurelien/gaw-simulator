// Mapping libellé « Title Case » (rapport d'espionnage) → nom canonique « snake_case ».
//
// Couvre les 25 types du jeu (vaisseaux + défenses au sol), alignés sur `ships.json`.

export const TITLE_TO_SNAKE: Record<string, string> = {
  'Small Cargo': 'small_cargo',
  'Large Cargo': 'large_cargo',
  'Light Fighter': 'light_fighter',
  'Heavy Fighter': 'heavy_fighter',
  Cruiser: 'cruiser',
  Battleship: 'battleship',
  Bomber: 'bomber',
  Dreadnought: 'dreadnought',
  Destroyer: 'destroyer',
  'Death Star': 'death_star',
  'Spy Probe': 'spy_probe',
  'Recovery Vessel': 'recovery_vessel',
  'Colony Ship': 'colony_ship',
  'Rocket Launcher': 'rocket_launcher',
  'Light Laser': 'light_laser',
  'Heavy Laser': 'heavy_laser',
  'Gauss Cannon': 'gauss_cannon',
  'Ion Cannon': 'ion_cannon',
  'Plasma Turret': 'plasma_turret',
  'Small Shield': 'small_shield',
  'Large Shield': 'large_shield',
  'Mining Vessel': 'mining_vessel',
  'Super Freighter': 'super_freighter',
  'Large Recovery Vessel': 'large_recovery_vessel',
  'Missile Chaser': 'missile_chaser',
};

export const SNAKE_TO_TITLE: Record<string, string> = Object.fromEntries(
  Object.entries(TITLE_TO_SNAKE).map(([title, snake]) => [snake, title]),
);

// Libellés alternatifs observés dans le jeu (le rapport d'espionnage réel diffère de la
// spec §5 sur 3 vaisseaux : « Ship » suffixé pour les cargos, et le pluriel « Dreadnoughts »).
export const LABEL_ALIASES: Record<string, string> = {
  'Small Cargo Ship': 'small_cargo',
  'Large Cargo Ship': 'large_cargo',
  Dreadnoughts: 'dreadnought',
};

// Normalisation tolérante pour absorber les confusions OCR courantes.
// - insensible à la casse ;
// - `1` → `l` et `0` → `o` (aucun nom de vaisseau ne contient de chiffre).
export function normalizeShipName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/0/g, 'o')
    .replace(/1/g, 'l');
}

const LABEL_TO_SNAKE: Record<string, string> = Object.fromEntries(
  [...Object.entries(TITLE_TO_SNAKE), ...Object.entries(LABEL_ALIASES)].map(([title, snake]) => [
    normalizeShipName(title),
    snake,
  ]),
);

// Résout un libellé OCR (peu importe casse/espaces/confusions) vers son nom canonique,
// ou `null` s'il ne correspond à aucun des 25 types.
export function resolveShipName(raw: string): string | null {
  return LABEL_TO_SNAKE[normalizeShipName(raw)] ?? null;
}
