# Spec — Reconstruction du moteur de combat (`engine-reconstruction`)

- **Statut** : validée par Aurélien (agent `engine`)
- **Input de** : agent `engine`
- **Références** : `docs/specs/engine-truth-source.md`, `docs/specs/validation-strategy.md`, `data/raw-battle-reports/`

## 1. Résumé

Implémenter en JavaScript pur (exécuté dans un Web Worker) le moteur de combat **du serveur**,
reconstruit et validé à partir des rapports de bataille. Il simule un combat entre deux flottes
(jusqu'à des millions d'unités) et retourne un rapport round par round. **Le Lua décompilé n'est pas
la référence** (simulateur client abandonné) : on rédige nos propres règles.

## 2. Contrat d'interface

```ts
simulateBattle(
  fleetA: Fleet,       // attaquant
  fleetB: Fleet,       // défenseur
  techA: Techs,        // technos attaquant
  techB: Techs,        // technos défenseur (+ planetSkin)
  options?: { seed?: number }
): BattleResult
```

### Types

- `Fleet` : mapping des 25 types de vaisseaux → `count` (entier ≥ 0).
- `Techs` : `{ weapon: Mods, shield: Mods, armor: Mods }`, où `Mods = { player: number, alliance: number, buff: number }` (valeurs en **%**).
- `planetSkin` (défenseur) : `'none' | 'cube_world' | 'yummy_sushi' | 'limitless_rage' | 'technology_domination'`.
- `BattleResult` : voir §7.

## 3. Modèle de combat (reconstruit et validé)

### 3.1 Rounds

- Maximum **6 rounds**.
- À chaque round, **les deux camps tirent** (comportement simultané) : un vaisseau vivant au début du
  round tire, même s'il est détruit pendant ce round.

### 3.2 Ciblage (single-target, avec remise)

- Chaque tir cible **1 unité au hasard**, **uniformément**, **avec remise**, parmi les unités vivantes
  **au début du round**.
- Le pool de cibles est **figé au début du round**. Une unité détruite pendant le round reste dans le
  pool : un tir qui la retombe est **perdu** (0 dégât réel), mais compte quand même comme une
  **attaque** (dans `number_of_attack` et `current_damage`). C'est ce qui explique les
  « attaques > kills » (doublons).

### 3.3 Dégâts (single-target)

- Un tir inflige `attack` dégâts à l'unité ciblée : d'abord le **bouclier**, puis la **coque**.
- Si `attack ≥ HP restante` (bouclier + coque) → l'unité est **détruite** (l'overkill est perdu).
- Sinon → **dégâts partiels** (l'unité survit avec HP réduite).

### 3.4 Rapid fire

- Après avoir **détruit** une unité, si le type de la cible figure dans la table `rapidFire` du tireur,
  on relance le dé avec probabilité `1 − 1/factor` → le vaisseau **retire** contre une nouvelle cible.
- Pas de rapid fire contre un type absent de la table (la chaîne s'arrête).
- Un tir « perdu » (sur une unité déjà morte) ne déclenche **pas** de rapid fire (pas de kill).

### 3.5 Boucliers

- Les boucliers **se régénèrent à chaque round** (remis à leur valeur pleine).
- La coque **ne se régénère pas** (elle persiste entre rounds).

### 3.6 Vainqueur

- Défenseur entièrement détruit → **attaquant gagne**.
- Attaquant entièrement détruit → **défenseur gagne**.
- Sinon, après 6 rounds → **égalité** (`draw`).

### 3.7 Pas d'explosion

- Le « seuil d'explosion 70 % » du Lua est une **approximation client abandonnée** → **non implémenté**.

## 4. Technos (additives)

- Multiplicateur d'une stat = `1 + (player + alliance + buff + skin) / 100`.
- `player` : 0–200 (10 % par niveau). `alliance` : 0–70. `buff` : 0 ou 20.
- `skin` (défenseur uniquement) :

| `planetSkin` | bonus |
|---|---|
| `cube_world` | +30 % bouclier |
| `yummy_sushi` | +30 % armure |
| `limitless_rage` | +50 % attaque |
| `technology_domination` | +30 % attaque |

- Calculs : `attack = floor(att × mult_weapon)`, `shield = floor(Shield × mult_shield)`, `hull = def` — **l'armor tech ne donne aucun buff** (ni joueur ni alliance). Reste à confirmer si le skin `yummy_sushi` applique son +30 % armure.

## 5. Données (ships)

- 25 types, indexés 0–24. Générer un fichier canonique (JSON) depuis `ships.lua` avec les champs
  **combat** uniquement : `att`, `shield`, `def` (coque), `rapidFire` (table `{ cible: factor }`), `name`.
- Les champs non-combat (`burden`, `speed`, coûts…) sont **hors moteur** (features futures).

## 6. RNG

- PRNG **seedable** (même seed → même résultat), uniforme sur [0,1).
- N'importe quel PRNG rapide (ex. mulberry32 / xoshiro). On **ne cherche pas** à reproduire le seed du serveur.

## 7. `BattleResult` (instrumentation)

```ts
{
  winner: 'attacker' | 'defender' | 'draw',
  rounds: [{
    round: number,
    attacker: { losses: Fleet, number_of_attack: number, current_damage: number, shield_absorption: number, wreck: number },
    defender: { losses: Fleet, number_of_attack: number, current_damage: number, shield_absorption: number, wreck: number }
  }],
  survivors: { attacker: Fleet, defender: Fleet },
  seed: number
}
```

- `current_damage` = somme des **attaques brutes** de tous les tirs (overkill **et** tirs perdus inclus).
- `shield_absorption` = somme des boucliers des unités **détruites**.
- `wreck` = nombre d'unités **ennemies** détruites (= somme des `losses` adverses).
- `number_of_attack` = nombre total de tirs (y compris les tirs perdus).

## 8. Performance

- **Typed arrays** (`Uint32Array` / `Float32Array`) pour des millions d'unités.
- **Arithmétique en float32** (`Math.fround`) pour coller au serveur (voir §9.1).
- Exécution en **Web Worker** (Monte Carlo non bloquant).
- Cible : un run « gros combat » (~7 M d'unités) en quelques secondes.

## 9. Points à valider / confirmer

### 9.1 Arrondi float32 (à reproduire)

Le serveur semble calculer en **simple précision**. Cas observés à reproduire exactement :

| valeur | base | techno | attendu |
|---|---|---|---|
| death star `att` | 200 000 | 165 % | `529 999` |
| death star `att` | 200 000 | 240 % | `680 000` |
| death star `att` | 200 000 | 270 % | `740 000` |
| death star `shield` | 50 000 | 230 % | `164 999` |
| death star `shield` | 50 000 | 270 % | `185 000` |

Hypothèse : `Math.floor(Math.fround(base * Math.fround(1 + pct / 100)))`. À confirmer sur ces 5 points.

### 9.2 Note : anomalie `2026-01-28` résolue

- L'anomalie « 45 cruisers/74 kills » venait d'une erreur de saisie (cruisers `8000` au lieu de
  `80000`). Corrigé : la répartition des kills est conforme au ciblage uniforme (z < 1 σ sur tous les types).

### 9.3 Cas de validation rapide

- `2025-11-27` round 2 : 56 death stars → **922 attaques, 910 kills** (12 doublons), `current_damage = 922 × 740 000`.
- `2025-09-26` round 3 : `shield_absorption = 54 292 690` (exact, somme des boucliers des 335 unités détruites).

## 10. Edge cases

- **Flotte vide** d'un côté → victoire immédiate de l'autre.
- **Égalité parfaite** (6 rounds sans destruction) → `draw`.
- **Attaque = 0** (sonde) → 0 dégât, mais le tir compte quand même.
- **Overkill** : un tir qui tue une unité « gaspille » le surplus.
- **Bouclier régénéré, coque non** : un vaisseau peut survivre plusieurs rounds en coque seule.
- **Tir perdu** (sur unité déjà morte) : compte en attaque, pas en kill, pas de rapid fire.

## 11. Hors scope

- Débris (métal/cristal) : fiabilité faible (vaisseaux reconstruits), feature future.
- UI, sauvegarde de flottes, partage par URL, i18n.
- Orchestration Monte Carlo côté app : le moteur produit **un run** par `seed`.
