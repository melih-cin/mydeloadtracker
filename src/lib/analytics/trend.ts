// Historical readiness for the hero pulse, computed honestly: the model is
// re-scored as of each weekly point using ONLY the data that existed by that
// date, so the trend never leaks future sets. One implementation, shared by
// Home, Insights, and the public demo.

import type { DailyCheckin, TrainingSet } from "@/lib/types";
import { computeReadiness, type ReadinessOptions } from "./readiness";
import { localDateKey } from "./dates";

export function buildReadinessTrend(
  sets: TrainingSet[],
  checkins: DailyCheckin[],
  now: Date,
  opts: ReadinessOptions,
  points: number = 8,
): number[] {
  const trend: number[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const asOf = new Date(now);
    asOf.setDate(asOf.getDate() - i * 7);
    const asOfIso = asOf.toISOString();
    const setsUpTo = sets.filter((s) => s.date <= asOfIso);
    if (setsUpTo.length === 0) continue;
    const checkinsUpTo = checkins.filter((c) => c.date <= localDateKey(asOf));
    trend.push(computeReadiness(setsUpTo, checkinsUpTo, asOf, opts).score);
  }
  if (trend.length === 0) trend.push(computeReadiness(sets, checkins, now, opts).score);
  return trend;
}
