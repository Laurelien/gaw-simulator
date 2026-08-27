# Spec — Conseil stratégique (`strategic-advice`)

- **Statut** : validée par Aurélien
- **Input de** : agent `engine` (logique) + `frontend-ui` (UI)
- **Références** : `docs/specs/simulation-flow.md`, `docs/specs/engine-reconstruction.md` (table `kz`)

## 1. Résumé

Sur `/result` (ou `/report`), afficher un **conseil stratégique minimal**, calculé à partir de la table
de **rapid fire** (`kz`) : « le défenseur a beaucoup de `X` → amène des `Y` ».

## 2. Règles — counter (v1)

1. Repérer les types **dominants** du défenseur (top N par count).
2. Pour chaque type dominant, chercher les vaisseaux **attaquants** ayant du **rapid fire** contre lui
   (dans `kz`).
3. Générer : « The defender has many `X`. Consider `Y` (rapid fire `Z` vs `X`). »

## 3. Règles — tampon (bonus)

- Si les vaisseaux **chers** de l'attaquant subissent de lourdes pertes, suggérer des **unités légères**
  (light fighters) pour diluer le ciblage aléatoire.

## 4. Contrat

```ts
getAdvice(fleetA: Fleet, fleetB: Fleet): Advice[]

type Advice = { type: 'counter' | 'buffer'; message: string };
```

- `fleetA` : flotte attaquante, `fleetB` : flotte défenseuse.
- Données d'entrée : table `kz` (rapid fire) des vaisseaux (déjà dans `ships.json`).

## 5. Hors scope

- Analyse fine (nombres exacts à ajouter), ML, conseils contextuels avancés.

## 6. ADR court

- **Contexte** : un conseil simple aide les joueurs à ajuster leur flotte sans analyse manuelle.
- **Décision** : **counter** basé sur le rapid fire (v1), **tampon** en bonus.
- **Conséquences** : conseil facile à calculer, déterministe, sans modèle complexe.
