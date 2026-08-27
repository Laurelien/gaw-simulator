# Status — Conseil stratégique (`strategic-advice`)

## État

Partie `engine` de `docs/specs/strategic-advice.md` implémentée (counter + tampon),
**tests ✅** (8 tests dédiés). La partie `frontend-ui` (affichage des conseils sur `/result`)
est **implémentée**.

## Implémenté

- `src/engine/advice.js` — logique pure (aucun DOM) :
  - `getAdvice(fleetA, fleetB)` : `Advice[]`.
  - **counter** : top N types dominants du défenseur (par effectif) → vaisseaux attaquants
    ayant du rapid fire contre chacun → un conseil par couple (cible, compteur).
  - **tampon** : vaisseaux chers sans `light_fighter` → suggestion d'ajouter du chaff.
  - Constantes ajustables : `TOP_DOMINANT_COUNT` (3), `EXPENSIVE_UNIT_COST` (60 000).
- `src/engine/ships.js` — index inverse `COUNTERS` (`cible → [{ name, factor }]` trié par
  facteur décroissant), construit depuis `rapidFire` (`kz`).
- `src/engine/index.js` / `index.d.ts` — ré-exports + type `Advice`.
- `src/types.ts` — types `AdviceType`, `Advice`.
- `tests/advice.test.js` — 8 tests (compteurs, top N, tampon, constantes).

## Décisions / divergences

1. **Un conseil par couple (cible, compteur)** : pour un type dominant ayant plusieurs
   compteurs, on émet plusieurs conseils `counter` (triés par facteur décroissant), plutôt
   qu'un seul « meilleur » compteur. Simple, déterministe, et laisse le joueur choisir.

2. **Règle tampon approximée (à confirmer)** : la spec conditionne le tampon à « de lourdes
   pertes » (issue du résultat), mais `getAdvice(fleetA, fleetB)` ne reçoit **pas** le
   `BattleResult`. On approxime donc le risque par la composition de la flotte :
   « vaisseaux chers présents (coût total ≥ `EXPENSIVE_UNIT_COST`) ET aucun `light_fighter` ».
   Si Aurélien veut un tampon **basé sur le résultat réel**, il faudra ajouter un paramètre
   (ex. `getAdvice(fleetA, fleetB, result?)`) — signalé, pas deviné.

3. **Noms en « Title Case »** dans les messages (ex. `Light Fighter`), cohérents avec
   `shipLabel` côté UI ; le message est prêt à être affiché tel quel.

4. **Vaisseaux « chers »** : seuil unitaire `EXPENSIVE_UNIT_COST = 60 000` (métal + cristal +
   gaz), capturant les vaisseaux capitaux (battleship, bomber, dreadnought, destroyer,
   missile_chaser, death_star). Ajustable.

## Fait (frontend-ui)

- `src/views/ResultView.vue` — affiche `getAdvice(battle.fleetA, battle.fleetB)` dans une carte
  « Strategic advice » : liste de messages, avec un badge distinct par type (`Counter` →
  `badge-info`, `Buffer` → `badge-warning`). Masquée si aucun conseil.

## Reste à faire

- Rien (feature complète de bout en bout).
