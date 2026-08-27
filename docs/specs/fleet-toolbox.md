# Spec — Boîte à outils de flotte (`fleet-toolbox`)

- **Statut** : validée par Aurélien
- **Input de** : agent `frontend-ui`
- **Références** : `docs/specs/frontend-app.md`, `docs/specs/simulator-input-ux.md`, `docs/specs/ocr-espionage.md`

## 1. Résumé

Regrouper les outils de saisie de flotte : remplacer `Fleet Library` par une **boîte à outils**
(save / load / import), ajouter **Copy fleet** (copier d'un côté à l'autre) et **Fill to max**
(remplir un type au max).

## 2. Boîte à outils (remplace `Fleet Library`)

- Un bouton/menu « **toolbox** » par éditeur de flotte (attaquant + défenseur).
- Actions : **Save fleet**, **Load fleet** (liste des flottes sauvegardées), **Import screenshot**
  (défenseur uniquement).
- `fleetStore` (localStorage, clé `gaw.savedFleets`) inchangé.

## 3. Copy fleet

- Bouton à côté de `Clear` : « **Copy from attacker** » (sur l'éditeur défenseur) /
  « **Copy from defender** » (sur l'éditeur attaquant).
- Copie les **vaisseaux + technos** de l'autre côté dans ce côté.
- Le **skin** n'est pas copié (défenseur uniquement, laissé tel quel).

## 4. Fill to max

- Bouton « **max** » dans la rangée des steppers, **après `+1000`** :
  `-1000 -100 -10 -1 | +1 +10 +100 +1000 | max`.
- Remplit le type au max autorisé :
  - vaisseaux : **999 999** ;
  - défenses : **99 999** ;
  - `small_shield` / `large_shield` : **1**.

## 5. Edge cases

- Copy fleet depuis un côté vide → copie des zéros.
- Copy fleet écrase la flotte courante (pas de confirmation, comme `Clear`).
- Fill to max sur un dôme (`small_shield` / `large_shield`) → `1`.

## 6. Hors scope

- Fleet summary (total + coût), tech presets, recent fleets.
- Partage / export JSON.

## 7. ADR court

- **Contexte** : la saisie de flotte est répétitive ; on veut des outils rapides et groupés.
- **Décision** : toolbox (save/load/import) + copy + fill to max.
- **Conséquences** : saisie plus rapide ; la toolbox remplace le panneau `Fleet Library`.
