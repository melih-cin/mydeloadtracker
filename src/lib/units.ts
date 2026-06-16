// Weight unit conversion. The database stores every weight in kilograms (the
// canonical unit); the athlete sees and types weights in their chosen unit.
// These two functions are the only boundary: convert on the way in (toKg) and
// on the way out (fromKg). Everything between the database and the screen works
// in the athlete's display unit, exactly as it always has.

import type { Units } from "@/lib/types";

/** Pounds in one kilogram. */
export const LB_PER_KG = 2.2046226218;
const KG_PER_LB = 1 / LB_PER_KG;

/**
 * Convert a value the athlete typed (in their unit) into canonical kilograms
 * for storage. Kept at full precision so nothing drifts; rounding is a display
 * concern only.
 */
export function toKg(value: number, units: Units): number {
  if (!Number.isFinite(value)) return value;
  return units === "lb" ? value * KG_PER_LB : value;
}

/**
 * Convert a stored kilogram value into the athlete's display unit, rounded to
 * two decimals to kill floating-point noise. A kilogram-native weight passes
 * through untouched; a pound-native weight round-trips back to the clean number
 * the athlete originally typed.
 */
export function fromKg(kg: number, units: Units): number {
  if (!Number.isFinite(kg)) return kg;
  const v = units === "lb" ? kg * LB_PER_KG : kg;
  return Math.round(v * 100) / 100;
}
