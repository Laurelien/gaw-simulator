# Rapports de combat bruts (ground truth serveur — N2)

Ce dossier contient les rapports de batailles **réelles du jeu**, utilisés pour reconstruire le
modèle de combat **serveur** (N2). Ils ne proviennent **pas** du moteur Lua : ce sont des
observations de terrain qui servent de référence de calibration.

## Pourquoi JSON

Les rapports seront relus par du code (rejouer la bataille, comparer les pertes et dégâts round
par round, chercher un facteur de réduction de flotte). JSON est donc le seul format pertinent ;
le Markdown servirait uniquement à la lecture humaine.

## Règles générales

- **Clé absente = 0.** On ne renseigne que les valeurs non nulles. Le `template.json` est
  volontairement complet sur `ships` (tout à 0) pour rappeler les 25 types ; `losses` et
  `survivors` sont volontairement vides (`{}`) : on n'y met que les types concernés.
- **Pertes = incrémentales.** `losses` d'un round = unités tuées **pendant ce round**, pas le
  total cumulé depuis le début.
- **Tous les champs numériques sont des entiers.**
- Un rapport est exploitable **uniquement si les entrées sont exactes** (composition de départ
  + technos des deux camps).

## Liste canonique des 25 types

```
small_cargo, large_cargo, light_fighter, heavy_fighter, cruiser, battleship,
bomber, dreadnought, destroyer, death_star, spy_probe, recovery_vessel,
colony_ship, rocket_launcher, light_laser, heavy_laser, gauss_cannon, ion_cannon,
plasma_turret, small_shield, large_shield, mining_vessel, super_freighter,
large_recovery_vessel, missile_chaser
```

L'attaquant ne peut pas envoyer de défenses (`rocket_launcher` → `large_shield`) ; laisser ces
clés à 0 côté attaquant. Le défenseur peut avoir des vaisseaux **et** des défenses.

## Technos — 4 composantes par stat

Chaque stat (`weapon`, `shield`, `armor`) combine **4 sources** :

| Composante | Champ | Bonus (en %) |
|---|---|---|
| Techno joueur | `*.tech.<stat>.player` | 0–200 (10 % par niveau) |
| Techno alliance | `*.tech.<stat>.alliance` | 0–70 (1 % par niveau) |
| Buff acheté | `*.tech.<stat>.buff` | 0 ou 20 |
| Skin de planète | `defender.planet_skin` | +30 ou +50 selon le skin (défenseur) |

### Skins de planète (défenseur uniquement)

| `planet_skin` | Asset | Bonus défenseur |
|---|---|---|
| `none` | — | aucun |
| `cube_world` | `planet_cube.png` | `+30 %` bouclier |
| `yummy_sushi` | `planet_sushi.png` | `+30 %` armure |
| `limitless_rage` | `planet_rage.png` | `+50 %` attaque |
| `technology_domination` | `planet_domination.png` | `+30 %` attaque |

> **Combinaison : additive (confirmé).** Le multiplicateur final d'une stat est :
> `1 + (player + alliance + buff + skin) / 100`.
> Exemple : weapon player 170 % + alliance 16 % ⇒ 186 % ⇒ multiplicateur `2,86`.
> (L'additivité du buff et du skin dans la même somme reste à confirmer sur un rapport avec skin.)

## Description des champs

| Champ | Type | Règle |
|---|---|---|
| `schema_version` | int | `2` (technos à 4 composantes + stats par round). |
| `report_id` | string | Identifiant libre unique (ex. `2026-08-15-hit-s1-planet-x`). |
| `game_version` | string | Version du jeu si visible. |
| `server` | string | Serveur (ex. `s1`). |
| `date` | string | Date du combat, format `YYYY-MM-DD`. |
| `notes` | string | Contexte : événement temporaire, officier/commander actif, etc. Mentionner « aucun » si rien. |
| `*.tech_known` | bool | `true` si les 4 composantes de ce camp sont certaines. |
| `*.tech.<stat>.player` | int | Bonus techno joueur en % (0–200). |
| `*.tech.<stat>.alliance` | int | Bonus techno alliance en % (0–70). |
| `*.tech.<stat>.buff` | int | Bonus buff acheté en % (0 ou 20). |
| `defender.planet_skin` | string | Skin de la planète défenseuse, voir table ci-dessus. |
| `*.ships` | map | Composition **au départ** du combat. |
| `outcome.winner` | string | `attacker`, `defender` ou `draw`. |
| `outcome.rounds` | array | Un objet par round **joué** (max 6). |
| `rounds[].round` | int | Numéro du round, à partir de 1. |
| `rounds[].<side>.losses` | map | Pertes incrémentales de ce camp pendant ce round. |
| `rounds[].<side>.number_of_attack` | int | Nombre d'attaques effectuées par ce camp ce round. |
| `rounds[].<side>.current_damage` | int | Dégâts infligés par ce camp ce round (voir question ouverte : bruts ou effectifs ?). |
| `rounds[].<side>.shield_absorption` | int | Dégâts absorbés par les boucliers ce round. |
| `rounds[].<side>.wreck` | int | Nombre de vaisseaux **ennemis** détruits ce round (= somme des `losses` adverses). Redondant mais utile en recoupement. |
| `outcome.survivors` | map | Survivants finaux, en recoupement (peut être omis : on le déduit de `ships - somme(pertes)`). |
| `outcome.debris` | map | Débris totaux (clés `metal`, `crystal` uniquement ; pas de 3e ressource, le gaz de construction se dissipe). **Fiabilité faible** : les vaisseaux reconstruits ne forment pas de débris. |

## Invariants de contrôle (vérifiés avant utilisation)

Pour chaque camp et chaque type :

```
ships[type] − somme(rounds[].losses[type]) == survivors[type]
```

Et cohérence du vainqueur :

- `winner == "attacker"` ⇒ défenseur totalement détruit.
- `winner == "defender"` ⇒ attaquant totalement détruit.
- `winner == "draw"` ⇒ les deux camps ont encore des survivants (6 rounds atteints sans destruction).

## Comment remplir

1. Copier `template.json` et le renommer `YYYY-MM-DD-<description>.json`.
2. Remplir les technos (4 composantes × 3 stats × 2 camps), la composition de départ, puis les
   pertes et stats round par round.
3. Dupliquer le bloc `round` dans `outcome.rounds` pour chaque round joué (max 6).
4. Remplir `outcome.survivors` si disponible (sinon le laisser `{}`, on le déduira).

Exemple minimal (clés absentes = 0) :

```json
{
  "schema_version": 2,
  "report_id": "exemple-illustratif",
  "attacker": {
    "tech_known": true,
    "tech": {
      "weapon": { "player": 15, "alliance": 30, "buff": 0 },
      "shield": { "player": 12, "alliance": 20, "buff": 0 },
      "armor":  { "player": 14, "alliance": 25, "buff": 20 }
    },
    "ships": { "light_fighter": 1000000, "cruiser": 50000 }
  },
  "defender": {
    "tech_known": true,
    "planet_skin": "cube_world",
    "tech": {
      "weapon": { "player": 13, "alliance": 28, "buff": 0 },
      "shield": { "player": 15, "alliance": 35, "buff": 0 },
      "armor":  { "player": 12, "alliance": 30, "buff": 0 }
    },
    "ships": { "rocket_launcher": 200000, "light_laser": 100000 }
  },
  "outcome": {
    "winner": "attacker",
    "rounds": [
      {
        "round": 1,
        "attacker": {
          "losses": { "light_fighter": 1200 },
          "number_of_attack": 1050000,
          "current_damage": 58000000,
          "shield_absorption": 4200000,
          "wreck": 0
        },
        "defender": {
          "losses": { "light_laser": 80000 },
          "number_of_attack": 300000,
          "current_damage": 2400000,
          "shield_absorption": 0,
          "wreck": 0
        }
      },
      {
        "round": 2,
        "attacker": {
          "losses": { "light_fighter": 400 },
          "number_of_attack": 998400,
          "current_damage": 53000000,
          "shield_absorption": 3800000,
          "wreck": 0
        },
        "defender": {
          "losses": { "light_laser": 20000 },
          "number_of_attack": 20000,
          "current_damage": 160000,
          "shield_absorption": 0,
          "wreck": 0
        }
      }
    ],
    "survivors": {
      "attacker": { "light_fighter": 998400, "cruiser": 50000 },
      "defender": { "rocket_launcher": 200000 }
    },
    "debris": { "metal": 0, "crystal": 0 }
  }
}
```

> ⚠️ L'exemple ci-dessus est **fictif** (valeurs inventées pour montrer la forme). Ne pas le
> traiter comme une donnée de calibration.

## Faits confirmés (premier rapport)

- `wreck` = nombre de vaisseaux **ennemis** détruits ce round (égale la somme des `losses` adverses).
- Débris = `metal` + `crystal` uniquement (le gaz de construction se dissipe, non recyclable).
- Buff acheté = uniquement `+20 %` (valeur `0` ou `20`).

## Questions ouvertes

- `current_damage` : dégâts **bruts** (avant absorption du bouclier) ou **effectifs** (après) ?
  Non déterminé pour l'instant — sera tranché lors du fit contre le moteur porté.
