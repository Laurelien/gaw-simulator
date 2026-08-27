# Status — Verdict de combat (`battle-verdict`)

## État

Partie `engine` de `docs/specs/battle-verdict.md` implémentée (débris + verdict value-based),
**tests ✅** (16 tests dédiés). La partie `frontend-ui` (barre « vaut le coup » + affichage des débris
sur `/result`) est **implémentée** (single run + Monte Carlo sur le `medianReport`).

## Implémenté

- `src/engine/verdict.js` — calculs purs (aucun DOM), importables UI/worker/tests :
  - `computeDebris(result, shipData?)` : 30 % du métal / cristal des unités détruites (2 camps).
  - `computeFleetValue(fleet, shipData?)` : Σ (effectif × coût total unitaire).
  - `computeLossValue(result, fleetA, shipData?)` : valeur des pertes attaquant = `initial − survivants`.
  - `computeVerdict(outcome, lossRate)` : `'green' | 'yellow' | 'orange' | 'red'`.
  - Constantes ajustables : `DEBRIS_RATE`, `VERDICT_GREEN_MAX`, `VERDICT_YELLOW_MAX`.
- `src/engine/ships.js` — export des coûts `COST_METAL` / `COST_CRYSTAL` / `COST_GAS` /
  `COST_TOTAL` (Float64) + `SHIP_COSTS` (lookup nom → coût).
- `src/engine/index.js` / `index.d.ts` — ré-export des fonctions et types (`ShipCost`, `ShipData`).
- `src/types.ts` — types `Verdict` et `Debris`.
- `scripts/generate-ships.mjs` — extrait `res_demand` en `metal` / `crystal` / `gas` (régénéré).
- `tests/verdict.test.js` — 16 tests (coûts canoniques, débris, valeur, verdict, seuils).

## Décisions / divergences

1. **Valeur unitaire = coût total** (`métal + cristal + gaz`), proxy du score en attendant la
   dérivation empirique (spec §4). Un point d'entrée unique `computeFleetValue` évite de dupliquer
   cette logique dans l'UI ; `lossRate = computeLossValue / computeFleetValue`.

2. **`lossRate` est une fraction 0..1** (pas un pourcentage). Seuils : `< 0.10` → vert,
   `0.10–0.30` → jaune, `> 0.30` → orange (victoire). Égalité → jaune, défaite → rouge.

3. **Débris : on inclut vaisseaux ET défenses au sol** (les deux camps). Toutes les unités ont un
   `res_demand`, et comme dans OGame les défenses laissent des débris. Si Aurélien souhaite exclure
   les défenses, c'est un filtre trivial (voir commentaire dans `verdict.js`). **À confirmer.**

4. **`computeLossValue` déduit les pertes de `fleetA − survivors`** (et non de la somme des
   `rounds[].attacker.losses`) : robuste au fast-path « flotte vide » (`rounds: []`) et indépendant
   du découpage par round. Équivalent dans le cas nominal.

5. **`shipData` optionnel** : les fonctions utilisent les coûts canoniques du moteur (`SHIP_COSTS`)
   quand il est omis ; il est fourni pour la testabilité et la décoration éventuelle (score à venir).

## Fait (frontend-ui)

- `src/ui/VerdictBar.vue` — barre colorée selon `computeVerdict` (vert / jaune / orange / rouge)
  + libellé. Orange utilise la palette Tailwind (`orange-500`), DaisyUI n'ayant pas de token orange.
- `src/views/ResultView.vue` — remplace le placeholder débris par « Potential debris : X metal /
  Y crystal » + note « may vary (ships rebuilt) », et ajoute la barre « Worth it? » + la valeur des
  pertes attaquantes (resources + % de la valeur de flotte). Single run : `BattleResult` direct ;
  Monte Carlo : `medianReport`.
- Libellés en anglais (cohérence avec le reste de l'app) ; la spec les écrivait en français.

## Reste à faire

- Partage par URL : hors scope (feature dédiée).
