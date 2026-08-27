# Spec — Saisie & layout (`simulator-input-ux`)

- **Statut** : validée par Aurélien
- **Input de** : agent `frontend-ui`

## 1. Résumé

Améliorations de la saisie et du layout : mode **desktop** (flottes côte à côte), **steppers rapides**
(+10/+100/+1000), **limites** sur les unités terrestres, affichage du **% final des technos**.

## 2. Mode desktop

- Au-dessus d'un breakpoint (ex. Tailwind `lg:`), les deux `FleetEditor` s'affichent **côte à côte**
  (attaquant à gauche, défenseur à droite).
- En dessous du breakpoint, on conserve les onglets **Attacker / Defender** (mobile-first actuel).

## 3. Steppers

- Chaque type a : `-1000 / -100 / -10 / -1 / +1 / +10 / +100 / +1000` + champ de saisie direct.
- Les boutons sont bornés par les limites (§4) et par **0** (jamais négatif).

## 4. Limites (défenseur uniquement)

- Unités terrestres : max **99 999** — `rocket_launcher`, `light_laser`, `heavy_laser`, `gauss_cannon`,
  `ion_cannon`, `plasma_turret`.
- **`small_shield`** et **`large_shield`** : max **1**.
- Vaisseaux : **pas de limite** (jusqu'à des millions).

## 5. % final des technos

- Afficher, pour chaque stat, le **% combiné** : `+ (player + alliance + buff + skin) %`.
- Ex. weapon player 200 + alliance 70 = **+270 %**.
- Armor : afficher le % mais avec le hint « **no combat effect** ».

## 6. Edge cases

- Dépassement d'une limite → clamp (stepper bloqué au max).
- `small_shield` / `large_shield` : le stepper +1 passe directement de 0 à 1 (pas de +10/+100/+1000).

## 7. Hors scope

- Monte Carlo (spec dédiée), validation serveur, import/export de flottes.

## 8. ADR court

- **Contexte** : la MVP est sortie ; on veut une saisie plus rapide et conforme aux règles du jeu.
- **Décision** : limites = règles du jeu (défenses 99 999, dômes 1) ; steppers rapides ; % combiné affiché.
- **Conséquences** : saisie plus fidèle et plus rapide ; le % affiché aide à recouper avec le jeu.
