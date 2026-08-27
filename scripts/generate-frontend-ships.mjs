// Génère `src/data/ships.json` (données vaisseaux côté UI) depuis le JSON moteur
// canonique `src/engine/data/ships.json`, en ajoutant le champ `image` (nom de fichier
// dans `assets/ships/`).
//
// Usage : `node scripts/generate-frontend-ships.mjs`

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src', 'engine', 'data', 'ships.json');
const OUT = join(ROOT, 'src', 'data', 'ships.json');

const src = JSON.parse(readFileSync(SRC, 'utf8'));

// Unités de défense au sol : affichées après les vaisseaux (l'`id` reste inchangé).
const GROUND_DEFENSE = new Set([
  'rocket_launcher',
  'light_laser',
  'heavy_laser',
  'gauss_cannon',
  'ion_cannon',
  'plasma_turret',
  'small_shield',
  'large_shield',
]);

const ordered = [
  ...src.ships.filter((ship) => !GROUND_DEFENSE.has(ship.name)),
  ...src.ships.filter((ship) => GROUND_DEFENSE.has(ship.name)),
];

const ships = ordered.map((ship, order) => ({
  index: ship.id,
  name: ship.name,
  order,
  att: ship.att,
  shield: ship.shield,
  hull: ship.hull,
  rapidFire: ship.rapidFire,
  // Tous les vaisseaux ont une image `.png`, sauf `mining_vessel` qui est en `.jpg`.
  image: `${ship.name}.${ship.name === 'mining_vessel' ? 'jpg' : 'png'}`,
}));

const payload = { count: ships.length, ships };

writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`OK → ${OUT} (${ships.length} vaisseaux)`);
