import type { BattleResult, MonteCarloResult } from '../types';

// Discrimine un résultat Monte Carlo (qui embarque un `medianReport`) d'un
// `BattleResult` single-run.
export function isMonteCarloResult(
  result: BattleResult | MonteCarloResult,
): result is MonteCarloResult {
  return 'medianReport' in result;
}

// Extrait le `BattleResult` à afficher en détail round/round :
// - single run : le résultat lui-même ;
// - Monte Carlo : le rapport médian.
export function extractReportResult(result: BattleResult | MonteCarloResult): BattleResult {
  return isMonteCarloResult(result) ? result.medianReport : result;
}
