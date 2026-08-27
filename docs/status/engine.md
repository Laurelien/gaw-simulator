# Status — Moteur de combat (`engine`)

## État

Implémentation de `simulateBattle` terminée dans `src/engine/`, avec données canoniques générées
depuis `ships.lua` (`src/engine/data/ships.json` + `ships.js`), et une suite Vitest verte
(`tests/engine.test.js`, 15 tests).

## Ce qui est implémenté et validé

- **single-target, avec remise** : chaque tir cible 1 unité uniforme du pool figé au début du round.
- **rapid fire** : dé relancé après **chaque tir** (kill OU perdu), probabilité `1 − 1/factor` sur le type de la cible visée ; la chaîne est géométrique.
- **technos additives** : `stat = floor(base × (1 + fround(pct / 100)))`.
- **régénération des boucliers** chaque round, coque persistante, 6 rounds max, pas d'explosion.
- **typed arrays** (`Uint8Array` / `Float32Array` / `Int32Array`) + arithmétique float32.
- **RNG seedable** (mulberry32), même seed → même résultat.

## Corrections apportées à la spec (§9.1, §7)

### 1. Formule d'arrondi float32 (spec §9.1) — corrigée

L'hypothèse de la spec `Math.floor(Math.fround(base * Math.fround(1 + pct/100)))` est **fausse** :
elle produit `530000` pour `200000 × 165%` (attendu `529999`) et `165000` pour `50000 × 230%`
(attendu `164999`).

La formule correcte, validée sur les 5 points observés, est :

```js
stat = Math.floor(base * (1 + Math.fround(pct / 100)))
```

C'est le **ratio `pct / 100`** qui est arrondi en float32 (et non `1 + pct/100`), puis multiplié
par la base en double précision. Détail :

| cas | base | pct | `fround(pct/100)` | résultat | attendu |
|---|---|---|---|---|---|
| death star `att` | 200 000 | 165 % | 1.649999976… | **529 999** | 529 999 |
| death star `att` | 200 000 | 240 % | 2.400000095… | 680 000 | 680 000 |
| death star `att` | 200 000 | 270 % | 2.700000048… | 740 000 | 740 000 |
| death star `shield` | 50 000 | 230 % | 2.299999952… | **164 999** | 164 999 |
| death star `shield` | 50 000 | 270 % | 2.700000048… | 185 000 | 185 000 |

### 2. `shield_absorption` (spec §7) — précision

La spec dit « somme des boucliers des unités **détruites** ». En réalité, c'est la **somme totale
de bouclier absorbé** ce round = `Σ min(attack, bouclier_restant)` sur tous les tirs. Les deux
coïncident quand il n'y a aucun survivant, mais divergent quand des survivants absorbent du
bouclier :

- `2025-11-27` round 1 attaquant : `10 394 818` = 56 death stars (185 000 × 56 = 10 360 000, qui
  **survivent** au round 1) + 120 défenses (34 818). La définition « détruites seulement » donnerait
  34 818, ce qui est faux.

## Hypothèses / divergences à confirmer (à signaler à Aurélien)

### A. Armure (coque) : bonus d'alliance **non appliqué** (à confirmer)

Le rapport `2025-11-27` impose `hull(death star) ≤ 2 904 000`. Or :

- `def = 900 000` × `(1 + 270/100)` = **3 330 000** ⇒ **incompatible**.
- `def = 900 000` × `(1 + 200/100)` = **2 700 000** ⇒ **compatible**.

Le défenseur a `armor = player 200 + alliance 70 + buff 0`. Seule l'interprétation « l'armure
n'inclut **pas** le bonus d'alliance » reproduit le rapport. C'est cohérent avec le client Lua
(`mDef = def × (1 + niveau_armure × 0.1)`, qui ne connaît pas l'alliance). Implémenté ainsi, mais
**à confirmer** sur un rapport avec alliance d'armure non nulle (et avec buff d'armure, et avec
skin `yummy_sushi`).

Les bonus de skin sont conservés pour l'armure (spec §4), bien que non validables sur les rapports
disponibles (tous `planet_skin = "none"`).

> Voir §E pour le test ciblé `2026-08-18`.

### B. `number_of_attack` / `current_damage` de l'attaquant (divergence résiduelle)

Le moteur (modèle « tous les vivants tirent au moins une fois + rapid fire ») reproduit exactement :

- les stats du **défenseur** (`number_of_attack`, `current_damage`, `shield_absorption`, `wreck`),
- `shield_absorption` et `wreck` de l'attaquant,
- les 5 cas d'arrondi float32.

Il **diverge** sur le nombre d'attaques / dégâts bruts de l'**attaquant** :

- `2025-11-27` round 1 : moteur ≈ 35 000 tirs / 96,2 M ; rapport 34 783 tirs / 97,7 M (le rapport
  a *moins* de tirs mais *plus* de dégâts ⇒ composition davantage « battleship »).
- `2025-11-27` round 2 : moteur 33 985 tirs ; rapport 29 108 (= battleships + dreadnoughts, les
  **cruisers** ne tirent pas).

Piste : un ordre de tir + un « arrêt de round quand la cible est anéantie » (les cruisers tirent en
dernier et ne tirent pas si les death stars sont déjà mortes). Non tranché : **à confirmer** avec un
rapport ciblé (flotte attaquante mixte, défenseur à coque unique, round où le défenseur est anéanti).

### C. Rapid fire : résolu par le rapport `2026-08-17`

Le rapport ciblé `2026-08-17` (1000 cruisers vs 5000 rocket launchers) a tranché : le re-tir de
rapid fire **ne s'arrête pas** sur un tir perdu. La chaîne est géométrique `1/(1 − p)` et le dé est
relancé après **chaque tir** (kill **ou** tir perdu), sur le type de la cible visée.

- Avant : moteur ≈ 3062 tirs / 2288 kills au round 1 (chaîne écourtée par les tirs perdus).
- Rapport : 9693 tirs / 4312 kills (chaîne ≈ 10 = géométrique `1 − 1/10`).
- Après correction : moteur ≈ 9999 tirs / 4322 kills au round 1, 10001 / 678 au round 2 — dans
  l'enveloppe Monte Carlo du rapport. ✅

C'est cohérent avec les « 12 doublons » de `2025-11-27` : ce sont simplement des tirs tombant sur
des unités déjà mortes, **sans** pour autant casser la chaîne.

> Note : le round 1 de `2026-08-17` contient une **erreur de saisie** : `current_damage = 1 435 640`
> au lieu de `14 345 640` (= 9693 × 1480). Le round 2 est correct (`14 094 040` = 9523 × 1480).

### D. `number_of_attack` / `current_damage` de l'attaquant — anomalie résiduelle (à confirmer)

Reste une divergence sur `2025-11-27` round 1 : le rapport indique **34 783 tirs** pour 35 000
vaisseaux (moins que « tous les vivants tirent au moins une fois »), ce que le moteur ne peut pas
reproduire (il produit ≈ 36 600 tirs avec le rapid fire). Comme pour `2026-08-17`, une erreur de
saisie est plausible mais non confirmée. À vérifier avec Aurélien.

### E. Armure (coque) — la techno « armure » ne s'applique PAS (résolu)

Deux rapports convergent :

**`2026-08-18`** (130 `missile_chaser` vs 1 `death_star` + 31 `rocket_launcher`, armor 140+42, death
star pleine) — rounds 2-3 (seule cible) :

- round 2 : `na=129`, coque = **764 370** ; round 3 : `na=128`, coque = **757 340**.
- total coque (r2+r3) = **1 521 710**, death star meurt au round 3.

**`2026-08-19`** (test déterministe : 100 `missile_chaser` vs 1 `death_star` seule, armor 170+42) :

- round 1 : `100 × 7030 − 152 499` = **550 501** de coque ; round 2 : `99 × 7030 − 152 499` = **543 471**.
- total coque = **1 093 972**, death star meurt au round 2.

`def = 900 000` ⇒ multiplicateur d'armure réel **≤ 1 093 972 / 900 000 = 1,2155** (soit ≤ 21,55 %),
alors que la techno annoncée est 212 % (attendu ×3.12). **La techno « armure » (player + alliance +
buff) n'a donc aucun effet sur la coque.** `hull = def`, seul le skin est conservé (non validé).

> **Confirmé par Aurélien (stats in-game)** : le jeu affiche `Defence: 900,000 +200%` (base + bonus
> de techno armure). `def` = 900 000 est bien la coque, et le `+200%` (player) est **affiché mais non
> appliqué** en combat → **bug serveur** : la techno armure n'apporte rien à la coque. L'attaque et le
> bouclier, eux, sont bien multipliés (validés). Le bug est probablement **général** (pas spécifique à
> la death star), mais n'est observable clairement que sur la death star (coque énorme).

### F. Multi-shot du `missile_chaser` — confirmé par la description in-game

Le « ×3 » du round 1 de `2026-08-18` (`na=390` = 130 × 3) n'est PAS un rapid fire : c'est le
**multi-shot** (« multi-missile launcher, it fires at 3 targets at same time »). Le `kz` de
`ships.lua` est **correct** (rapid fire uniquement light/heavy fighter, cruiser, battleship, bomber,
dreadnought) et ne doit pas être modifié.

Implémenté : le missile chaser tire `min(3, cibles vivantes)` missiles par round (1 seul missile s'il
n'y a qu'une cible), cohérent avec les rounds 2-3 (`na` = nombre de chasers vivants).

### G. Bug corrigé : compaction des flottes (`regenerateAndCompact`)

`regenerateAndCompact` itérait sur `total` au lieu de l'`aliveCount` précédent : les slots « périmés »
au-delà de `aliveCount` (coque obsolète) pouvaient être réintroduits comme vivants, faussant
`number_of_attack` dès qu'un camp subissait des pertes sur plusieurs rounds. Corrigé (itère sur
`alive`), test ajouté.

## Performance

- Bataille `2025-11-27` (~35 k unités) : instantané.
- Bataille `2025-09-26` (~7,1 M unités, 6 rounds) : ~12 s/run en Node. Acceptable mais au-dessus de
  la cible « quelques secondes » ; optimisable (RNG inline, ciblage entier).

## Validation

- `npm test` : 19 tests verts (arrondi float32, invariant `shield_absorption`, rapid fire, tir perdu,
  flotte vide, attaque 0, déterminisme, chaîne géométrique, multi-shot, décroissance des pertes,
  armure ignorée sur la coque).
- `npm run validate:montecarlo -- --runs N` : Monte Carlo vs rapports (percentiles), à exécuter par
  l'agent `test`.
