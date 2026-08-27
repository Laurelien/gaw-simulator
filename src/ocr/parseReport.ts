import type { EspionageData, Fleet } from '../types';
import { resolveShipName } from './nameMap';

// Résultat enrichi du parsing : le contrat `EspionageData` (flotte : vaisseaux + défenses)
// + les métadonnées nécessaires à l'écran de revue (lignes non reconnues, doublons).
export type EspionageReport = EspionageData & {
  unrecognizedLines: string[];
  duplicates: string[];
};

// Ligne complète « Nom: nombre » (nom jusqu'au `:`, espaces, nombre sans séparateur).
const FULL_LINE = /^(.+?):\s*(\d+)\s*$/;
// Ligne qui se termine par `:` sans nombre (colonne trop espacée → nombre à la ligne suivante).
const NAME_ONLY_LINE = /^(.+?):\s*$/;
// Ligne ne contenant qu'un nombre (rattachée au nom en attente).
const NUMBER_ONLY_LINE = /^\s*(\d+)\s*$/;

/**
 * Parse le texte brut (sortie OCR) d'un rapport d'espionnage en flotte défenseur.
 *
 * - matche ligne à ligne `/^(.+?):\s*(\d+)\s*$/` ;
 * - nom → Title Case → snake_case (mapping tolérant, cf. nameMap.ts) ;
 * - nombre → `parseInt` ;
 * - une ligne terminant par `:` sans nombre récupère le nombre de la ligne suivante ;
 * - lignes non reconnues → ignorées mais collectées (`unrecognizedLines`) ;
 * - doublons → le dernier gagne, signalé dans `duplicates` ;
 * - vaisseaux et défenses au sol importés (technos hors scope).
 */
export function parseReport(text: string): EspionageReport {
  const lines = text.split(/\r?\n/);
  const ships: Fleet = {};
  const unrecognizedLines: string[] = [];
  const duplicates: string[] = [];

  // Nom lu sur une ligne « X: » sans nombre, en attente du nombre de la ligne suivante.
  let pending: { name: string; line: string } | null = null;

  function applyShip(name: string, count: number, sourceLine: string): void {
    const canonical = resolveShipName(name);
    if (!canonical) {
      unrecognizedLines.push(sourceLine);
      return;
    }
    if (canonical in ships) duplicates.push(name);
    ships[canonical] = count;
  }

  function flushPending(): void {
    if (pending) {
      unrecognizedLines.push(pending.line);
      pending = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPending();
      continue;
    }

    const full = line.match(FULL_LINE);
    if (full) {
      flushPending();
      applyShip(full[1], parseInt(full[2], 10), line);
      continue;
    }

    const nameOnly = line.match(NAME_ONLY_LINE);
    if (nameOnly) {
      flushPending();
      pending = { name: nameOnly[1], line };
      continue;
    }

    const numberOnly = line.match(NUMBER_ONLY_LINE);
    if (numberOnly && pending) {
      applyShip(pending.name, parseInt(numberOnly[1], 10), pending.line);
      pending = null;
      continue;
    }

    flushPending();
    unrecognizedLines.push(line);
  }

  flushPending();

  return { ships, unrecognizedLines, duplicates };
}
