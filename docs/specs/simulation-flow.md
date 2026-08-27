# Spec — Flux de simulation (`simulation-flow`)

- **Statut** : validée par Aurélien
- **Input de** : agent `frontend-ui`
- **Références** : `docs/specs/frontend-app.md`, `docs/specs/monte-carlo.md`, `docs/specs/simulator-input-ux.md`

## 1. Résumé

Réorganiser l'app en **3 vues (routes)** : `/setup` (saisie + simuler), `/result` (issue + taux de
perte + résumés), `/report` (détail round/round). La simulation et son résultat vivent dans **Pinia**,
persistés en **sessionStorage** pour survivre au refresh.

## 2. Routes (Vue Router)

| Route | Contenu |
|---|---|
| `/setup` | éditeurs de flottes/technos, library, sélecteur single / Monte-Carlo, bouton Simuler |
| `/result` | issue (ou probabilité), taux de perte, débris (placeholder), partage (placeholder), CTAs |
| `/report` | rapport détaillé round/round |

## 3. État (Pinia + sessionStorage)

- `battleStore` : `setup` (`fleetA`, `fleetB`, `techs`), `mode` (`'single' | 'monte-carlo'`), `result`
  (`BattleResult | MonteCarloResult`), `status` (`'idle' | 'loading' | 'done' | 'error'`).
- Persistance **sessionStorage** (clé `gaw.battleState`) : `setup`, `mode`, `result`.
- `fleetStore` (localStorage) inchangé.

## 4. Navigation

- Bouton **Simuler** : démarre la sim dans le store (`status = 'loading'`), puis `router.push('/result')`.
- `/result` : « **View full report** » → `/report` ; « **Back to setup** » → `/setup`.
- `/report` : retour vers `/result` et `/setup`.
- **Gardes** : `/result` et `/report` redirigent vers `/setup` si `result == null` (refresh ou lien direct).

## 5. Page `/result` (résumé)

1. **Issue** : vainqueur (`attacker` / `defender` / `draw`) en single run, ou **probabilité de victoire** en Monte Carlo.
2. **Taux de perte** : `% perdu = (initial − survivants) / initial`, par camp (l'attaquant mis en avant).
   - Single run : valeur exacte.
   - Monte Carlo : moyenne + intervalle (5–95).
   - But : permettre à l'utilisateur de juger si « le combat vaut le coup ».
3. **Débris** : placeholder (« à venir ») — le calcul n'est pas encore défini.
4. **Partage** : placeholder (« à venir ») — encodage d'état dans l'URL, plus tard.
5. CTAs : « View full report », « Back to setup ».

## 6. Page `/report`

- Rapport round/round (réutiliser `BattleReport.vue`) : vainqueur, pertes par type et par round, récap final.
- Single run : le `BattleResult` direct.
- Monte Carlo : le `medianReport`.

## 7. Edge cases

- Refresh sur `/result` ou `/report` → rechargé depuis **sessionStorage** (pas de perte).
- Pas de résultat → garde → redirection `/setup`.
- Monte Carlo long → `/result` affiche la **progression** (`status = 'loading'`) avant l'issue.
- `draw` → affiché clairement sur `/result`.

## 8. Hors scope

- Calcul des débris (feature dédiée).
- Partage par URL (feature dédiée).
- Taux de perte pondéré par la **valeur** (ressources) — plus tard.

## 9. ADR court

- **Contexte** : la MVP mono-page est devenue dense ; on veut un flux en étapes, mobile-first.
- **Décision** : 3 routes, état dans Pinia persisté en **sessionStorage**, gardes de navigation.
- **Conséquences** : UX plus claire (setup → issue → détail) ; refresh résilient ; prêt pour le partage et les débris plus tard.
