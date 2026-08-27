// Génère le fichier de données canonique `src/engine/data/ships.json` depuis `ships.lua`.
//
// On n'extrait QUE les champs de combat nécessaires au moteur :
//   - name       (depuis le commentaire `-- <name>`)
//   - att        (attaque de base)
//   - shield     (bouclier de base, depuis `Shield`)
//   - hull       (coque de base, depuis `def`)
//   - rapidFire  (table `{ cible: factor }`, depuis `kz`)
//   - metal / crystal / gas (coûts en ressources, depuis `res_demand`)
//     (nécessaires au calcul des débris et du verdict — docs/specs/battle-verdict.md)
//
// Les autres champs non-combat (`burden`, `speed`, `flyxh`, `jztime`, `class`,
// `kz_count`) sont volontairement ignorés.
//
// Usage : `node scripts/generate-ships.mjs`

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "ships.lua");
const OUT_JSON = join(ROOT, "src", "engine", "data", "ships.json");
const OUT_JS = join(ROOT, "src", "engine", "data", "ships.js");

const source = readFileSync(SRC, "utf8");

// Liste canonique des noms (snake_case), dans l'ordre des index 0..24.
// Le commentaire de ships.lua contient une faute ("super frieghter") ; on normalise
// vers le nom canonique utilisé par les rapports et la spec.
const CANONICAL_NAMES = [
  "small_cargo",
  "large_cargo",
  "light_fighter",
  "heavy_fighter",
  "cruiser",
  "battleship",
  "bomber",
  "dreadnought",
  "destroyer",
  "death_star",
  "spy_probe",
  "recovery_vessel",
  "colony_ship",
  "rocket_launcher",
  "light_laser",
  "heavy_laser",
  "gauss_cannon",
  "ion_cannon",
  "plasma_turret",
  "small_shield",
  "large_shield",
  "mining_vessel",
  "super_freighter",
  "large_recovery_vessel",
  "missile_chaser",
];

// Retourne l'index de fin de la paire d'accolades équilibrée ouverte à `openIndex`.
function balancedBlockEnd(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("accolade non équilibrée");
}

// Extrait un entier pour un champ simple `key = value`.
function intField(block, key) {
  const m = block.match(new RegExp(`\\b${key}\\s*=\\s*(\\d+)`));
  return m ? Number(m[1]) : null;
}

// Parse la table `kz = { [i] = { [0] = target, [1] = factor }, ... }`.
// Retourne un objet `{ [target]: factor }`.
function parseRapidFire(block) {
  const kzMatch = block.match(/\bkz\s*=\s*\{/);
  if (!kzMatch) return {};

  const openIndex = kzMatch.index + kzMatch[0].length - 1; // index du `{`
  const kzText = block.slice(openIndex, balancedBlockEnd(block, openIndex));

  const rapidFire = {};
  const entryRe = /\[\s*0\s*\]\s*=\s*(\d+)\s*,\s*\[\s*1\s*\]\s*=\s*(\d+)/g;
  let m;
  while ((m = entryRe.exec(kzText)) !== null) {
    const target = Number(m[1]);
    const factor = Number(m[2]);
    rapidFire[target] = factor;
  }
  return rapidFire;
}

// Parse la table `res_demand = { [0] = metal, [1] = crystal, [2] = gas }`.
// Retourne `{ metal, crystal, gas }` (0 par défaut si une ressource est absente).
function parseResDemand(block) {
  const m = block.match(/\bres_demand\s*=\s*\{/);
  if (!m) return null;

  const openIndex = m.index + m[0].length - 1; // index du `{`
  const text = block.slice(openIndex, balancedBlockEnd(block, openIndex));

  const get = (idx) => {
    const e = text.match(new RegExp(`\\[\\s*${idx}\\s*\\]\\s*=\\s*(\\d+)`));
    return e ? Number(e[1]) : 0;
  };

  return { metal: get(0), crystal: get(1), gas: get(2) };
}

// Découpe `info = { ... }` en blocs par vaisseau, indexés par numéro.
const infoMatch = source.match(/\binfo\s*=\s*\{/);
if (!infoMatch) throw new Error("table info introuvable dans ships.lua");

const infoOpen = infoMatch.index + infoMatch[0].length - 1;
const infoText = source.slice(infoOpen, balancedBlockEnd(source, infoOpen));

const ships = [];
const shipRe = /\[\s*(\d+)\s*\]\s*=\s*\{\s*--\s*(.*?)\s*\n/g;
let shipMatch;
let lastIndex = 0;
const blocks = [];

// Récupère chaque bloc `[N] = { -- name ... }` (équilibré).
const openRe = /\[\s*(\d+)\s*\]\s*=\s*\{\s*--\s*(.*?)\s*\n/g;
let om;
while ((om = openRe.exec(infoText)) !== null) {
  const idx = Number(om[1]);
  const name = om[2].trim();
  const openBrace = infoText.indexOf("{", om.index + om[0].lastIndexOf("--")) ;
  // Repositionne sur le `{` de la table du vaisseau (celui qui suit le commentaire).
  const braceIdx = infoText.indexOf("{", om.index);
  const blockEnd = balancedBlockEnd(infoText, braceIdx);
  const block = infoText.slice(braceIdx, blockEnd);
  blocks.push({ idx, name, block });
}

for (const { idx, block } of blocks) {
  const name = CANONICAL_NAMES[idx];
  if (!name) throw new Error(`index de vaisseau inattendu : ${idx}`);
  const att = intField(block, "att");
  const shield = intField(block, "Shield");
  const hull = intField(block, "def");
  if (att === null || shield === null || hull === null) {
    throw new Error(`champs combat manquants pour ${name} (index ${idx})`);
  }

  const res = parseResDemand(block);
  if (!res) {
    throw new Error(`res_demand manquant pour ${name} (index ${idx})`);
  }

  // Convertit les clés numériques de rapidFire en noms canoniques.
  const rfRaw = parseRapidFire(block);
  const rapidFire = {};
  for (const [target, factor] of Object.entries(rfRaw)) {
    const targetName = CANONICAL_NAMES[Number(target)];
    if (!targetName) throw new Error(`cible de rapid fire inconnue : ${target}`);
    rapidFire[targetName] = factor;
  }

  ships.push({
    id: idx,
    name,
    att,
    shield,
    hull,
    rapidFire,
    metal: res.metal,
    crystal: res.crystal,
    gas: res.gas,
  });
}

if (ships.length !== 25) {
  throw new Error(`attendu 25 vaisseaux, trouvé ${ships.length}`);
}

const payload = {
  count: ships.length,
  names: CANONICAL_NAMES,
  ships,
};

const json = JSON.stringify(payload, null, 2) + "\n";
writeFileSync(OUT_JSON, json, "utf8");

// Module ESM équivalent : portable partout (Node, Vite/Vitest, Web Worker), sans
// dépendre des import-attributes JSON (encore hétérogènes selon les environnements).
writeFileSync(
  OUT_JS,
  "// Généré par scripts/generate-ships.mjs — NE PAS ÉDITER À LA MAIN.\n" +
    "export default " +
    json,
  "utf8",
);

console.log(`OK → ${OUT_JSON} et ${OUT_JS} (${ships.length} vaisseaux)`);
