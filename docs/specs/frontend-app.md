# Spec — Application front (VueJS)

- **Statut** : validée par Aurélien
- **Input de** : agent `frontend-ui`
- **Références** : `docs/specs/engine-reconstruction.md`, `docs/specs/engine-truth-source.md`, `PROJECT_CONTEXT.md`

## 1. Résumé

Application web **mobile-first** (Vue 3 + Vite + Tailwind/DaisyUI + Pinia) qui permet de saisir deux
flottes + technos, de lancer **une** simulation de combat (dans un Web Worker) et d'afficher un
rapport **round par round**, comme le rapport du jeu : pertes par type à chaque round, puis issue
finale + pertes totales. Sauvegarde locale des flottes.

## 2. Stack et structure

- Vue 3 (Composition API), Vite, Tailwind + DaisyUI, Pinia, Vitest.
- Moteur exécuté dans un **Web Worker** (non bloquant).

```
src/
  engine/       # simulateBattle (agent engine)
  data/         # ships.json
  worker/       # battle.worker.ts
  state/        # Pinia : battle.ts, fleets.ts
  ui/           # composants Vue
  App.vue
  main.ts
```

## 3. Données et types partagés

### `ships.json` (canonique, généré depuis `ships.lua`)

```json
{
  "small_cargo": { "index": 0, "att": 5, "shield": 10, "def": 400, "rapidFire": { "10": 5 }, "image": "small_cargo.png" }
}
```

- 25 entrées, clés **snake_case** (alignées sur `assets/ships/*.png`).
- `rapidFire` : map `{ cibleIndex: factor }` — usage interne moteur, non affiché.
- `image` : nom du fichier dans `assets/ships/`.

### Types (partagés moteur ↔ UI)

```ts
type Fleet = Record<string, number>; // 25 clés → count

type Mods = { player: number; alliance: number; buff: number };
type Techs = { weapon: Mods; shield: Mods; armor: Mods };
type PlanetSkin = 'none' | 'cube_world' | 'yummy_sushi' | 'limitless_rage' | 'technology_domination';

type BattleResult = {
  winner: 'attacker' | 'defender' | 'draw';
  rounds: RoundResult[];
  survivors: { attacker: Fleet; defender: Fleet };
  seed: number;
};

type RoundResult = {
  round: number;
  attacker: SideResult;
  defender: SideResult;
};

type SideResult = {
  losses: Fleet;
  number_of_attack: number;
  current_damage: number;
  shield_absorption: number;
  wreck: number;
};
```

## 4. Contrat worker ↔ UI

- Le worker reçoit `{ fleetA, fleetB, techA, techB, seed }` et répond `BattleResult`.
- Le worker importe `simulateBattle` depuis `src/engine/`.
- **Un seul run** par simulation (v1).

```ts
// request
postMessage({ fleetA, fleetB, techA, techB, seed });
// response
postMessage({ result: BattleResult });
```

## 5. État (Pinia)

### `battleStore`

- state : `fleetA`, `fleetB`, `techA`, `techB`, `planetSkin`, `result: BattleResult | null`, `status: 'idle' | 'loading' | 'done' | 'error'`, `seed`.
- actions : `simulate()` (poste au worker), `setFleet(side, fleet)`, `setTechs(side, techs)`, `setSkin(skin)`.

### `fleetStore` (persistance `localStorage`)

- `SavedFleet = { id: string; name: string; ships: Fleet; techs: Techs; planetSkin?: PlanetSkin }`.
- state : `fleets: SavedFleet[]`.
- actions : `saveFleet(name)`, `loadFleet(id)`, `deleteFleet(id)`.
- clé `localStorage` : `gaw.savedFleets`.

## 6. Composants

- **`FleetEditor.vue`** — éditeur d'un côté (attaquant/défenseur) : steppers pour les 25 types (avec
  image), éditeur de technos, sélecteur de skin (défenseur uniquement).
  Props : `side`, `fleet`, `techs`, `planetSkin`. Emit : `update`.
- **`TechEditor.vue`** — sous-composant : 3 stats × 3 mods.
  Ranges : `player` 0–200 (pas de 10), `alliance` 0–70, `buff` 0 | 20 (toggle).
  Hint sur l'armor : « armor tech : no combat effect ».
- **`BattleReport.vue`** — le rapport :
  1. **vainqueur** en tête ;
  2. **par round** : tableau des pertes par type (attaquant vs défenseur, types non nuls uniquement) ;
  3. **récap final** : survivants / pertes totales par camp.
  `current_damage`, `shield_absorption`, `wreck`, `number_of_attack` en détail secondaire (repliable).
- **`FleetLibrary.vue`** — sauvegarder / charger / supprimer des flottes.

Layout mobile-first : onglets **Attacker / Defender** en haut, bouton **Simulate**, rapport en dessous.

## 7. Edge cases

- Flotte vide des deux côtés → bouton Simulate désactivé.
- Résultat `draw` → afficher « égalité (6 rounds) » clairement.
- Simulate pendant un run en cours → désactiver le bouton.
- Seed non fourni → générer un seed côté UI, l'afficher (reproductible).
- Types à `count = 0` → masqués dans le rapport (pertes nulles non listées).

## 8. Hors scope (v1)

- Monte Carlo / distribution de probabilité.
- PWA, partage par URL, i18n, débris, visuels de planètes.
- Import/export de flottes (le format `SavedFleet` le permettra plus tard).

## 9. ADR court

- **Contexte** : le moteur est prêt (single run) ; on veut une UI minimale pour saisir et lire un combat.
- **Décision** : **single run** en v1 (pas de Monte Carlo) ; persistance **localStorage** ; **mobile-first**, anglais.
- **Conséquences** : le rapport affiche UNE issue (pas de probabilité) ; persistance locale simple ; le Monte Carlo s'ajoutera ensuite sans changer la structure.
