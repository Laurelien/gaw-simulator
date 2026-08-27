# Spec — Verdict de combat (`battle-verdict`)

- **Statut** : validée par Aurélien
- **Input de** : agent `engine` (calculs) + `frontend-ui` (UI)
- **Références** : `docs/specs/simulation-flow.md`, `docs/specs/monte-carlo.md`

## 1. Résumé

Sur `/result`, afficher les **débris** (métal + cristal) et une **barre « le combat vaut-il le coup »**
(vert → rouge), basée sur l'issue + la **valeur** des pertes.

## 2. Débris

- `debris_metal = 30 % × (coût métal des vaisseaux détruits)`.
- `debris_crystal = 30 % × (coût cristal des vaisseaux détruits)`.
- Taux théorique ~30 % (« un tiers », comme OGame) ; **observé ~21 %** à cause des vaisseaux reconstruits.
- Affichage : « **débris potentiels** : `X` métal / `Y` cristal », avec la note « peut varier (vaisseaux reconstruits) ».

## 3. Barre « vaut le coup »

- Basée sur l'**issue** + la **valeur des pertes** de l'attaquant (pas le nombre).
- `lossRate = valeur_perdue / valeur_flotte` (attaquant).
- Couleurs :
  - **Victoire** + `lossRate` faible → **vert** ;
  - **Victoire** + `lossRate` modéré → **jaune** ;
  - **Victoire** + `lossRate` élevé → **orange/rouge** ;
  - **Égalité** → **jaune** ;
  - **Défaite** → **rouge**.
- Seuils **ajustables** (ex. <10 %, 10–30 %, >30 %).

## 4. Valeur (score)

- La « valeur » d'un vaisseau = son **score** (à dériver empiriquement : construire 1 de chaque, mesurer le delta de score).
- En attendant, **proxy = coût total en ressources** (`métal + cristal + gaz`).

## 5. Hors scope

- Récupération réelle des débris (recovery vessels).
- Seuils fins de la barre (à ajuster).

## 6. ADR court

- **Contexte** : `/result` doit aider à décider « j'attaque ou pas ».
- **Décision** : débris 30 % (potentiel), barre **value-based** (score, proxy ressources en attendant).
- **Conséquences** : le verdict reflète la valeur, pas juste le nombre de vaisseaux.
