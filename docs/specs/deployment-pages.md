# Spec — Déploiement Cloudflare Pages (`deployment-pages`)

## 1. Résumé

Déployer la SPA Vue 3 (Vite) sur **Cloudflare Pages** depuis le repo GitHub **privé**. L'app est
servie sur `https://<projet>.pages.dev/`, sans backend. Objectif : rendre le simulateur accessible aux
autres joueurs, tout en gardant le repo privé le temps de trancher la question des assets (réponse du
support en attente).

## 2. Contexte et contrainte

- **GitHub Pages gratuit = repo public.** Écarté pour l'instant : ça exposerait `assets/`,
  `battle_report.PNG` et `data/raw-battle-reports/` (contenu du jeu) avant la réponse du support.
- **Cloudflare Pages** déploie depuis un repo **privé**, est gratuit, et centralise avec le futur
  projet D1 d'Aurélien. C'est le choix retenu.

## 3. Configuration technique

| Élément | Valeur | Note |
|---|---|---|
| Build command | `npm run build` | → `vite build` |
| Output directory | `dist` | |
| `base` Vite | `/` (défaut) | Pas de changement nécessaire : le projet est servi à la racine du sous-domaine |
| Fallback SPA | `public/_redirects` → `/* /index.html 200` | Vite copie `public/` dans `dist/` ; Cloudflare lit `_redirects` à la racine du déploiement |
| Routeur | `createWebHistory()` (base `/`) | Pas de changement |
| Web Workers | `import … ?worker` | Vite émet des fichiers hashed à URL relative, OK en base `/` |

### Contrat de routage

- `/` → redirige `/setup`
- `/setup`, `/result`, `/report` → vues SPA
- `/:pathMatch(.*)*` → redirige `/setup`

Un refresh direct sur `/result` ou `/report` est absorbé par `_redirects` qui renvoie `index.html` ;
Vue Router reprend la route côté client.

## 4. Décision d'architecture (ADR court)

**Contexte.** Il faut héberger la SPA statique sans backend, en gardant le repo privé (assets en
attente de décision légale).

**Options considérées.**
1. **GitHub Pages** — gratuit mais impose un repo public sur le plan gratuit. Écarté pour l'instant.
2. **Netlify** — équivalent, gratuit, repo privé. Fonctionnel.
3. **Cloudflare Pages** — gratuit, repo privé, et centralise avec le futur projet D1. Retenu.

**Décision.** Cloudflare Pages, `base: "/"`, fallback SPA via `_redirects`.

**Conséquences.**
- Le repo reste **privé** → aucune exposition des assets tant que la décision légale n'est pas prise.
- On garde `createWebHistory()` (URLs propres), le fallback étant géré par Cloudflare.
- Bascule future vers GitHub Pages = changer `base` en `/gaw-simulator/` + `createWebHistory('/gaw-simulator/')`
  + remplacer `_redirects` par un fallback `404.html`.

## 5. Edge cases

- **Refresh / lien direct** sur `/result` ou `/report` → géré par `_redirects`.
- **Tesseract.js (OCR)** : `createWorker('eng')` charge le WASM et `eng.traineddata` **depuis un CDN à
  l'exécution** (≈ 10–20 Mo). L'OCR nécessite donc du réseau en prod. À **vérifier** au premier
  déploiement ; le bundling local (WASM + données de langue) est hors scope.
- **Web Workers** : vérifier en prod que `battle.worker`, `monteCarlo.worker` et `ocr.worker` se
  chargent (URLs relatives hashed par Vite).
- **`public/assets/`** : les images de vaisseaux/planètes du jeu sont expédiées dans le build. À retirer
  du build si le support refuse leur usage.

## 6. Hors scope (cette itération)

- PWA (manifest, service worker, offline).
- Partage par URL (encodage de l'état de la simulation).
- Domaine custom.
- Bundling local de Tesseract (WASM + `eng.traineddata`).
- Bascule vers GitHub Pages.

## 7. Mise en place

1. **Retirer les Lua du suivi git** (conservés en local, déjà ajoutés au `.gitignore`) :
   ```bash
   git rm --cached ships.lua zhanSimulation.lua
   git add .gitignore public/_redirects
   git commit -m "chore: untrack decompiled Lua sources, add Cloudflare Pages SPA fallback"
   git push
   ```
2. **Cloudflare dashboard** : Workers & Pages → Create → Pages → *Connect to Git* → sélectionner
   `Laurelien/gaw-simulator` → build command `npm run build`, output `dist` → *Save and Deploy*.
3. Vérifier : le build passe, `https://gaw-simulator.pages.dev/` répond, un refresh sur `/result` ne
   renvoie pas de 404, et l'OCR fonctionne (ou note le besoin de réseau CDN).

## 8. Ouvert

- **Assets** : en attente de la réponse du support (à retirer du build si refus).
- **`battle_report.PNG`** et **`data/raw-battle-reports/`** : contenu du jeu, à écarter ou déplacer
  hors du repo avant tout passage en public.
