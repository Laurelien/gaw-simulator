# Spec — Simulations Monte Carlo (`monte-carlo`)

- **Statut** : validée par Aurélien
- **Input de** : agent `engine` (agrégation `simulateMonteCarlo`) + agent `frontend-ui` (UI)
- **Références** : `docs/specs/engine-reconstruction.md`, `docs/specs/frontend-app.md`

## 1. Résumé

Lancer `simulateBattle` **N fois** (seeds différents), agréger en une **distribution** (probabilité de
victoire, pertes moyennes + intervalle), et fournir un **rapport médian** pour le détail round/round.
Cible : **≤ 10 s**, via parallélisation sur plusieurs Web Workers et réduction de N si besoin.

## 2. Contrat

```ts
type MonteCarloOptions = { runs: number; seed?: number };

type StatDistribution = { mean: number; p5: number; p95: number };

type MonteCarloResult = {
  winProbability: { attacker: number; defender: number; draw: number }; // 0..1
  totalLosses: { attacker: StatDistribution; defender: StatDistribution };
  lossesByType: { attacker: Record<string, StatDistribution>; defender: Record<string, StatDistribution> };
  medianReport: BattleResult; // run représentatif (détail round/round)
  runs: number;
  elapsedMs: number;
};

simulateMonteCarlo(fleetA, fleetB, techs, options): MonteCarloResult
```

## 3. Agrégation

- `winProbability` : compte des vainqueurs sur les N runs.
- `totalLosses` : moyenne + percentiles **5 / 95** des pertes totales (par camp).
- `lossesByType` : idem par type (pour le détail).
- `medianReport` : le `BattleResult` complet du run **médian** (50e percentile des pertes totales),
  garantissant un détail « dans l'intervalle » et réaliste (un vrai run, pas une moyenne fractionnaire).

## 4. Worker & performance

- **Pool de Web Workers** (jusqu'à `navigator.hardwareConcurrency`, ~8).
- Les N seeds dérivent d'un seed de base (ex. `seed + i`), pour reproductibilité.
- **Auto-réduction de N** si les flottes sont grosses (estimation du temps/run), pour rester **≤ 10 s**.
  N borné : `[1, 500]`. Sélecteur : `25 / 50 / 100 / 250 / 500` (défaut **100**).

## 5. UI

- Sélecteur du nombre de runs + bouton Simuler (Monte Carlo).
- **Barre de progression** (la simulation peut être longue).
- Affichage :
  1. **probabilité de victoire** (attaquant / défenseur / égalité) ;
  2. **pertes attendues** : moyenne + intervalle (5–95) ;
  3. **rapport médian** : détail round/round (comme le rapport serveur).

## 6. Edge cases

- `N = 1` → équivaut à un run unique (pas de distribution).
- Draws fréquents → probabilité de draw affichée.
- Gros combats → N auto-réduit ; l'UI indique « échantillon réduit (N = X) ».
- Seed de base fourni → résultats reproductibles.

## 7. Hors scope

- Distribution complète par type × round (on montre le rapport médian + les agrégats).
- Optimisations avancées (GPU, WASM) : plus tard si besoin.

## 8. ADR court

- **Contexte** : un run unique ne suffit pas pour décider « j'attaque ou pas ».
- **Décision** : Monte Carlo (N défaut 100), agrégats moyenne + intervalle 5–95, **rapport médian** pour
  le détail, ≤ 10 s via parallélisation + auto-réduction de N.
- **Conséquences** : distribution de probabilité utile à la décision ; le détail reste un run réel
  (médian), pas une moyenne.
