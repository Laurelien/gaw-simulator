# ADR — Source de vérité du moteur de combat (rapports serveur vs Lua)

- **Statut** : proposé (à confirmer par Aurélien)
- **Date** : 2026-08-16 (révisé après 3 rapports)

## Contexte

- `zhanSimulation.lua` (décompilé) est un **simulateur client abandonné** : il utilise une
  approximation multi-kill + « explosion 70 % » pour être rapide sur téléphone, et diverge du serveur.
- Objectif : prédire le résultat **réel en jeu** (serveur = N2).
- 4 rapports analysés, dont des cas « death stars isolées » et un gros combat ~7 M d'unités.

## Décisions

1. **Les rapports bruts (serveur) sont la SEULE source de vérité du comportement.**
2. **On n'utilise plus le Lua pour le moteur** : on rédige nos propres règles reconstruites depuis
   les rapports. Le Lua ne sert plus que pour les **données** (`ships.lua` : `att`/`Shield`/`def`/`kz`).
3. **Aucune réduction de flotte** : simulation per-unit à l'échelle réelle.
4. **Modèle serveur reconstruit depuis les rapports :**
   - **single-target** : chaque tir cible 1 unité au hasard, **avec remise** ; dégâts = attaque vs HP restante (bouclier puis coque) ; si attaque ≥ HP restante → détruite (overkill perdu) ; sinon → dégâts partiels (l'unité survit) ; unité déjà détruite → tir perdu ;
   - **rapid fire par kill** (probabilité `1 - 1/factor`) ;
   - **ciblage aléatoire uniforme** ;
   - **régénération des boucliers** à chaque round ;
   - **pas d'explosion** : le « seuil 70 % » du Lua est une approximation client abandonnée ;
   - **technos additives** à 4 composantes.
5. **La validation se fait par Monte Carlo contre les rapports** (le test fengari ne sert qu'à documenter les divergences du Lua).

## Faits confirmés (4 rapports)

- Technos additives : `multiplicateur = 1 + (player + alliance + buff + skin) / 100`.
- `current_damage` = somme des attaques **brutes** (overkill inclus).
- `shield_absorption` = somme des boucliers des unités détruites.
- **Régénération des boucliers** confirmée : l'absorption cumulée dépasse le bouclier total de la flotte (re-absorption des survivants).
- `wreck` = nombre d'unités **ennemies** détruites.
- **Armor tech sans effet** : `hull = def` de base (ni la techno joueur ni l'alliance ne boostent la coque).
- Débris = `metal` + `crystal` uniquement ; buff = uniquement `+20 %`.

## Conséquences

- Le port JS implémente le **modèle serveur reconstruit**, pas le Lua.
- Le Lua sert de **checklist** de mécaniques à vérifier une par une (seuil d'explosion 70 %, régénération des boucliers, détermination du vainqueur).
- Défi principal = **performance navigateur** (Web Worker + typed arrays + RNG seedable).

## Ouvert

- **Skin `yummy_sushi` (+30 % armure)** : à confirmer (l'armor tech étant sans effet, le skin s'applique-t-il ?).
- **Arrondi float32** : le serveur calcule en simple précision (hypothèse forte sur 5 points observés). À confirmer par l'agent `engine`.
