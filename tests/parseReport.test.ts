import { describe, expect, it } from 'vitest';
import { parseReport } from '../src/ocr/parseReport';

describe('parseReport', () => {
  it('extrait les vaisseaux d\'un rapport type', () => {
    const result = parseReport(
      [
        'Light Fighter: 999999',
        'Heavy Fighter: 999999',
        'Large Recovery Vessel: 12345',
      ].join('\n'),
    );

    expect(result.ships).toEqual({
      light_fighter: 999999,
      heavy_fighter: 999999,
      large_recovery_vessel: 12345,
    });
    expect(result.unrecognizedLines).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });

  it('récupère le nombre sur la ligne suivante quand la ligne finit par ":"', () => {
    const result = parseReport('Light Fighter:\n999999\nHeavy Fighter: 50\n');

    expect(result.ships).toEqual({ light_fighter: 999999, heavy_fighter: 50 });
    expect(result.unrecognizedLines).toEqual([]);
  });

  it('est insensible à la casse et tolère les confusions OCR', () => {
    const result = parseReport('light fighter: 10\n1ight Fighter: 20\nC0lony Ship: 3\n');

    expect(result.ships).toEqual({ light_fighter: 20, colony_ship: 3 });
  });

  it('le doublon fait gagner le dernier et le signale', () => {
    const result = parseReport('Cruiser: 10\nCruiser: 20\n');

    expect(result.ships).toEqual({ cruiser: 20 });
    expect(result.duplicates).toEqual(['Cruiser']);
  });

  it('importe les défenses au sol avec les vaisseaux', () => {
    const result = parseReport('Light Fighter: 10\nRocket Launcher: 5000\nLarge Shield: 1\n');

    expect(result.ships).toEqual({
      light_fighter: 10,
      rocket_launcher: 5000,
      large_shield: 1,
    });
    expect(result.unrecognizedLines).toEqual([]);
  });

  it('collecte les lignes non reconnues sans les importer', () => {
    const result = parseReport('Resources: 123\nLight Fighter: 5\nSome Unknown Thing: 9\n');

    expect(result.ships).toEqual({ light_fighter: 5 });
    expect(result.unrecognizedLines).toEqual(['Resources: 123', 'Some Unknown Thing: 9']);
  });

  it('ignore une ligne nombre orpheline et la signale', () => {
    const result = parseReport('999999\n');

    expect(result.ships).toEqual({});
    expect(result.unrecognizedLines).toEqual(['999999']);
  });

  it('laisse à 0 les vaisseaux absents (clé absente)', () => {
    const result = parseReport('Cruiser: 10\n');

    expect(result.ships.cruiser).toBe(10);
    expect('light_fighter' in result.ships).toBe(false);
  });

  it('reconnaît les libellés réels du jeu (alias)', () => {
    const result = parseReport(
      'Small Cargo Ship: 100\nLarge Cargo Ship: 200\nDreadnoughts: 30\n',
    );

    expect(result.ships).toEqual({
      small_cargo: 100,
      large_cargo: 200,
      dreadnought: 30,
    });
    expect(result.unrecognizedLines).toEqual([]);
  });
});
