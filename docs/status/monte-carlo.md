# Status — Monte Carlo (`engine` + `frontend-ui`)

## État

Partie `engine` de `docs/specs/monte-carlo.md` implémentée (agrégation + worker pool), **tests ✅**.
La partie UI est désormais **faite** par l'agent `frontend-ui` : sélecteur de runs, barre de
progression, affichage probabilité / pertes / rapport médian, indication « échantillon réduit ».

## Implémenté

- `src/engine/monteCarlo.js` — cœur pur (Node/Vitest) :
  - `simulateMonteCarlo(fleetA, fleetB, techA, techB, options)` : N runs (`seed + i`) agrégés.
  - `aggregateMonteCarlo(results, fleetA, fleetB, elapsedMs)` : agrégation réutilisable.
  - `clampRuns`, `estimateTimePerRunMs`, `autoReduceRuns` : bornes + auto-réduction.
- `src/worker/monteCarlo.worker.ts` — worker qui exécute un **chunk** de runs contigus.
- `src/worker/monteCarloPool.ts` — `runMonteCarloPooled(...)` : pool de Web Workers (jusqu'à
  `navigator.hardwareConcurrency`, plafonné à 8), distribution par chunks, agrégation finale.
- `src/types.ts` — types `StatDistribution`, `MonteCarloOptions`, `MonteCarloResult`.
- `tests/monte-carlo.test.js` — 7 tests (bornes, auto-réduction, médiane, distributions, déterminisme).

### UI (frontend-ui)

- `src/state/battle.ts` — mode `'single' | 'monte-carlo'` + action `simulate()` qui branche
  `runMonteCarloPooled` (avec `onProgress`), et persistance du résultat en `sessionStorage`.
- `src/worker/runBattle.ts` — wrapper single run (`battle.worker`) distinct du Monte Carlo.
- `src/views/SetupView.vue` — sélecteur de mode + sélecteur de runs `25/50/100/250/500` (défaut 100).
- `src/views/ResultView.vue` — barre de progression pendant `loading`, probabilité de victoire,
  pertes moyennes + intervalle 5–95, badge « auto-reduced (N = X) ».
- `src/views/ReportView.vue` — affiche le `medianReport` via `BattleReport` (mode Monte Carlo).

## Décisions / divergences

1. **Signature** : la spec note `simulateMonteCarlo(fleetA, fleetB, techs, options)` avec `techs` en
   raccourci. L'implémentation prend `techA, techB` (comme `simulateBattle`), car les technos diffèrent
   entre attaquant et défenseur (et `techB` porte `planetSkin`).

2. **`medianReport`** : le run au **50e percentile des pertes totales combinées** (attaquant +
   défenseur), trié avec **tie-break sur le seed** pour la reproductibilité. Index médian inférieur
   `floor((N−1)/2)`.

3. **`lossesByType`** : pertes par type = `effectif initial − survivants`, par type de la flotte
   initiale (pertes 0 incluses dans la distribution). `totalLosses` = somme de ces pertes.

4. **Auto-réduction** : modèle « par vagues » (une vague = `concurrency` runs en parallèle, coût ≈
   `tpr`). `maxRuns = floor(targetMs / tpr) × concurrency`, borné `[1, 500]`.
   - Calibration `tpr ≈ (totalUnits / 7,1 M) × 12 s` (mesuré : 7,1 M unités ≈ 12 s/run mono-thread).
   - Ex. 1 k unités → inchangé ; 1 M → 40 runs ; 7,1 M → 1 run (un run dépasse déjà 10 s).

5. **Worker pool** : browser-only (`?worker` Vite). Chaque chunk = `ceil(N / workers)` seeds contigus
   (`seedBase + i`), résultats réassemblés dans l'ordre puis agrégés. Workers terminés dans tous les cas.

## Reste à faire (hors scope Monte Carlo)

- Débris et partage par URL : placeholders « Coming soon » sur `/result` (features dédiées).
- Distribution complète par type × round : hors scope (on montre le rapport médian + les agrégats).
