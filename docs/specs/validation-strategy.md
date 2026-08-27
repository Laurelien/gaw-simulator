# Spec — Stratégie de validation du modèle (vs rapports serveur)

## Principe

Le moteur est **stochastique**. Un rapport serveur = un tirage unique. La validation est donc
**statistique** (Monte Carlo), pas une égalité exacte.

## Cible unique : les rapports serveur

- Les rapports bruts sont la source de vérité. Pas de test différentiel fengari comme critère de
  validation (le Lua diverge du serveur).
- Fengari peut servir à **documenter** les divergences du Lua, pas à valider le port.

## Méthode (pour chaque rapport)

1. Rejouer K fois le modèle (Monte Carlo, seeds variés) → distribution.
2. Vérifier que la valeur rapportée est un **tirage plausible** de cette distribution (percentiles).

## Observables et usage

| Observable | Variance | Usage |
|---|---|---|
| `current_damage` | faible | **fit** (formule de dégâts) |
| `shield_absorption` | faible | **fit** (mécanique des boucliers) |
| `number_of_attack` | faible | **fit** (rapid fire, échelle réelle) |
| pertes par type / round | forte | **cohérence large** (enveloppe) |
| survivants | forte | cohérence large |
| vainqueur | binaire | mode de la distribution |

## Seuils (dérivés de la distribution, pas arbitraires)

- **Agrégats** : valeur rapportée dans `[P1, P99]` (ou moyenne ± 3σ) ⇒ OK ; sinon flag.
- **Pertes par type** : valeur dans `[P1, P99]` ⇒ OK ; sinon flag.

## Règle d'or

**Un rapport seul falsifie, ne confirme pas.** Un hors-enveloppe = divergence à investiguer (bug de
modèle ou erreur de saisie). La confiance s'accumule avec plusieurs rapports.

## Contraintes de calcul

- Validation **hors navigateur** (Node/CI) : K = 100–500 runs même sur des millions d'unités.
- La contrainte des 10 s ne s'applique qu'à l'usage final.
