export { simulateBattle } from "./simulateBattle.js";
export { stat, computeSideStats, SKIN_BONUS } from "./tech.js";
export { createRng } from "./rng.js";
export {
  COUNT,
  NAMES,
  NAME_TO_ID,
  BASE_ATT,
  BASE_SHIELD,
  BASE_HULL,
  COST_METAL,
  COST_CRYSTAL,
  COST_GAS,
  COST_TOTAL,
  SHIP_COSTS,
  COUNTERS,
} from "./ships.js";
export {
  computeDebris,
  computeLossValue,
  computeFleetValue,
  computeVerdict,
  DEBRIS_RATE,
  VERDICT_GREEN_MAX,
  VERDICT_YELLOW_MAX,
} from "./verdict.js";
export {
  getAdvice,
  TOP_DOMINANT_COUNT,
  EXPENSIVE_UNIT_COST,
} from "./advice.js";
export {
  simulateMonteCarlo,
  aggregateMonteCarlo,
  clampRuns,
  estimateTimePerRunMs,
  autoReduceRuns,
} from "./monteCarlo.js";
