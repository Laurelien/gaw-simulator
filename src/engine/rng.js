// PRNG seedable, uniforme sur [0,1). mulberry32 : rapide et suffisant pour le moteur.
// Même seed → même séquence. On ne cherche PAS à reproduire le seed du serveur.

/**
 * @param {number} seed entier 32 bits
 * @returns {() => number} fonction sans argument retournant un float dans [0, 1)
 */
export function createRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
