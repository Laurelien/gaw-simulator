# Contexte du projet — Reconstruction du simulateur de bataille (moteur serveur)

Ce fichier est la source de vérité commune à tous les agents. Chaque agent doit le lire avant de commencer une session. Il évite de dupliquer le même contexte dans 5 prompts différents et de les laisser diverger avec le temps.

## Objectif du projet
Reconstruire le moteur de combat d'un jeu mobile 4X (inspiré d'OGame) à partir de rapports de bataille réels, et l'exposer dans une application web autonome en JavaScript, packagée avec Vue.js.

## Stack technique
- Frontend : Vue.js 3 — Composition API par défaut
- Styling : Tailwind CSS + DaisyUI
- Moteur de simulation : JavaScript pur, exécuté dans un Web Worker (simulations Monte Carlo — ne doit jamais bloquer le thread principal)
- Build : Vite
- Tests : Vitest
- Gestion d'état : Pinia si besoin d'un store global
- Moteur en JavaScript pur, arithmétique **float32** (`Math.fround`) pour reproduire l'arrondi du serveur

## Origine du moteur
Le moteur de combat du **serveur** a été reconstruit à partir de rapports de bataille réels (`data/raw-battle-reports/`). Le Lua décompilé (`zhanSimulation.lua`) est un **simulateur client abandonné** (approximation multi-kill + explosion 70 %) : il n'est **pas** la référence du comportement. Il ne sert plus que pour les **données** (`ships.lua`). La vérité est le comportement observé du serveur, documenté dans `docs/specs/engine-truth-source.md` et `docs/specs/engine-reconstruction.md`.

## Glossaire du domaine
### Les différents vaisseaux et unités de défense
Tous les vaisseaux (civils et de combats) sont indiqués dans le fichier `ships.lua`, ainsi que les unités de défenses au sol. A savoir que l'attaquant ne peut envoyer que des vaisseaux (civils et/ou de combat) mais aucune defénse. Le défenseur lui, peut avoir des vaisseaux et des défenses au sol.

### Les technologies utilisées
Il existe 3 technologies différentes qui infuent sur un combat :
- **weapon tech** : bonus sur les dégâts
- **shield tech** : bonus sur les boucliers
- **armor tech** : bonus sur la résistance aux dégâts

## Conventions générales
- Langue du code : anglais pour les noms de variables/fonctions ; commentaires en français si besoin de clarté
- Commits : voir la section "Git & contrôle de version" ci-dessous

## Artefacts produits par les agents (le "bus de communication" entre eux)
| Fichier | Produit par | Consommé par |
|---|---|---|
| `docs/specs/<feature>.md` | Architecte | Engine, Frontend/UI |
| `src/engine/` (moteur) | Engine | Test, Frontend/UI |
| `docs/status/divergences-<module>.md` | Test | Engine |
| `docs/status/<feature>.md` | Tous (mise à jour d'étape) | Tous |

Entrées non produites par les agents : `data/raw-battle-reports/*.json` (rapports d'Aurélien) et `ships.lua` (données), consommés par Engine et Test.

## Git & contrôle de version

### Deux couches distinctes
- **Git natif de Zed** (panneau Git, staging, diffs, historique, branches, worktrees) : reste sous contrôle manuel d'Aurélien, en dehors de tout MCP.
- **Serveur MCP `mcp-server-git`** (officiel, `modelcontextprotocol/servers`) : donne aux agents la capacité d'exécuter eux-mêmes des actions git locales dans le cadre de leur Definition of Done, sans qu'Aurélien ait à basculer manuellement dans le panneau à chaque étape.

Configuration Zed (`settings.json`, clé `context_servers` — vérifier la syntaxe exacte dans la doc Zed au moment de l'installation) :
```json
"context_servers": {
  "git": {
    "command": "uvx",
    "args": ["mcp-server-git", "--repository", "/chemin/vers/le/repo"],
    "enabled": true
  }
}
```

### Ce qui est délégué aux agents vs ce qui reste manuel
- **Délégué (local, réversible)** : `status`, `diff`, `add`, `commit`, `log`, création de branche locale.
- **Manuel, via le panneau Git natif** : `push`, `force-push`, `rebase`, `reset --hard`, merge de branches. Ce sont les actions qui touchent l'historique partagé ou qui peuvent effacer du travail — aucun agent n'y a accès.

### Convention de commit par agent
Un commit par palier de Definition of Done atteint, préfixé par le rôle de l'agent qui l'a produit. Le `git log` devient ainsi la trace d'audit lisible de tout le pipeline, et permet un `git bisect` propre si un bug apparaît plus tard.
- `spec(feature): ...` — Architecte
- `engine(module): ...` — Engine
- `test(module): ...` — Testeur
- `refactor(module): ...` — Refactor
- `feat(ui): ...` — Frontend/UI

### Stratégie de branches
Une branche `feature/<slug>` par feature, sur laquelle tourne tout le pipeline (Architecte → Engine → Testeur → Refactor → Frontend/UI). Merge sur `main` uniquement une fois tous les paliers verts — `main` reste ainsi toujours dans un état connu et testé. Pour paralléliser plusieurs modules du moteur, utiliser l'isolation par worktree de Zed avec des branches `engine/<module>` dédiées.

### Garde-fou technique
Un hook `pre-commit` (script shell) bloque tout commit touchant au dossier du moteur si la suite de tests n'est pas au vert. Ça matérialise en dur la règle "Refactor ne démarre qu'une fois les tests verts", plutôt que de compter uniquement sur la discipline des agents.

## Règle transversale à tous les agents
Si un agent a un doute sur un comportement du moteur qu'il ne peut pas vérifier avec les fichiers à disposition, il s'arrête et le signale explicitement plutôt que de deviner. Une réponse "probablement correcte" livrée en silence coûte plus cher à déboguer qu'un blocage honnête.
