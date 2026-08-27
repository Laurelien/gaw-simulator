import type { Fleet } from '../types';

export function fleetTotal(fleet: Fleet): number {
  let total = 0;
  for (const value of Object.values(fleet)) {
    const n = Math.floor(Number(value));
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return total;
}

export function isFleetEmpty(fleet: Fleet): boolean {
  return fleetTotal(fleet) === 0;
}
