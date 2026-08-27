import type { Fleet, Techs } from '../types';

// Convertit les objets réactifs Vue (proxies) en objets simples, clonables par
// `postMessage` (structured clone) et sérialisables en JSON.
export function cloneFleet(fleet: Fleet): Fleet {
  return { ...fleet };
}

export function cloneTechs(techs: Techs): Techs {
  return {
    weapon: { ...techs.weapon },
    shield: { ...techs.shield },
    armor: { ...techs.armor },
  };
}
