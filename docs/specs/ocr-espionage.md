# Spec — OCR rapport d'espionnage (`ocr-espionage`)

- **Statut** : validée par Aurélien
- **Input de** : agent `frontend-ui`
- **Références** : `docs/specs/frontend-app.md`, `docs/specs/simulation-flow.md`

## 1. Résumé

Permettre de **pré-remplir le côté défenseur** du simulateur à partir d'une capture d'écran d'un
rapport d'espionnage, via **OCR** (Tesseract.js, 100 % client). **v1 : uniquement les vaisseaux**
(pas les défenses ni les technos).

## 2. Format du rapport (observé)

Lignes de vaisseaux : `Nom Du Vaisseau: <nombre>`, sur une colonne.
- Nom en **Title Case** (majuscule à chaque début de mot).
- Deux-points `:` **collé** au dernier mot (pas d'espace avant).
- La colonne des nombres est **très espacée** à droite.
- Nombre **sans virgule ni espace** (ex. `999999`).

Exemples :

```text
Light Fighter: 999999
Heavy Fighter: 999999
Large Recovery Vessel: 12345
```

## 3. Contrat

```ts
ocrEspionageReport(image: File): Promise<EspionageData>

type EspionageData = { ships: Fleet }; // vaisseaux défenseur (25 clés)
```

## 4. Architecture

```text
src/ocr/
  ocr.worker.ts     # Web Worker Tesseract.js : image → texte brut
  parseReport.ts    # texte brut → EspionageData
  nameMap.ts        # libellés (Title Case) → noms canoniques (snake_case)
```

## 5. Parsing

1. Ligne à ligne, matcher : `/^(.+?):\s*(\d+)\s*$/` (nom jusqu'au `:`, espaces, puis nombre).
2. Nom → normaliser (trim, Title Case).
3. Mapping **Title Case → snake_case** (automatique : `snake_case` ↔ `Title Case`).
4. Nombre → `parseInt`.

Robustesse :

- Si une ligne finit par `:` **sans nombre** (colonne trop espacée → l'OCR met le nombre sur la ligne
  suivante), récupérer le nombre sur la ligne suivante.
- Mapping **tolérant** : insensible à la casse ; gérer les confusions OCR courantes (`l`/`1`, `0`/`O`).
- Lignes non reconnues → ignorées mais **signalées** dans l'écran de revue.

### Mapping des 25 noms (Title Case ↔ snake_case)

```text
Small Cargo ↔ small_cargo
Large Cargo ↔ large_cargo
Light Fighter ↔ light_fighter
Heavy Fighter ↔ heavy_fighter
Cruiser ↔ cruiser
Battleship ↔ battleship
Bomber ↔ bomber
Dreadnought ↔ dreadnought
Destroyer ↔ destroyer
Death Star ↔ death_star
Spy Probe ↔ spy_probe
Recovery Vessel ↔ recovery_vessel
Colony Ship ↔ colony_ship
Rocket Launcher ↔ rocket_launcher
Light Laser ↔ light_laser
Heavy Laser ↔ heavy_laser
Gauss Cannon ↔ gauss_cannon
Ion Cannon ↔ ion_cannon
Plasma Turret ↔ plasma_turret
Small Shield ↔ small_shield
Large Shield ↔ large_shield
Mining Vessel ↔ mining_vessel
Super Freighter ↔ super_freighter
Large Recovery Vessel ↔ large_recovery_vessel
Missile Chaser ↔ missile_chaser
```

## 6. Écran de revue (pop-up)

- Affiche les vaisseaux extraits (nom + nombre), **éditables**.
- L'utilisateur corrige les erreurs d'OCR avant d'appliquer.
- Boutons : « **Appliquer** » (pré-remplit le `FleetEditor` défenseur) / « **Annuler** ».

## 7. Edge cases

- Vaisseau absent du rapport → laissé à `0` (pas de ligne).
- Doublon (même vaisseau deux fois) → le dernier gagne, signalé.
- OCR échoue / image illisible → message d'erreur, pas de données.
- Nombre très grand → `parseInt` (pas de dépassement tant que < 2^53).

## 8. Hors scope (v1)

- Défenses et technos (ajoutées plus tard).
- Collage de texte (non disponible dans le jeu).
- Prétraitement d'image avancé (à itérer si l'OCR est trop peu fiable).

## 9. ADR court

- **Contexte** : la saisie manuelle des vaisseaux du défenseur est pénible (rapport d'espionnage long).
- **Décision** : OCR client (Tesseract.js) + parse + **écran de revue obligatoire** (l'OCR n'est pas fiable à 100 %).
- **Conséquences** : gain de temps de saisie ; la revue protège des erreurs d'OCR.
