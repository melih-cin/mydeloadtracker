// Per-exercise progressive-overload analysis over a rolling window of weeks.
//
// For each training week we take the BEST estimated 1RM achieved (the top set,
// normalized via Epley) plus total volume (sum of weight * reps). Comparing the
// trend of best e1RM across the window tells us whether the lifter is
// progressing, plateauing, or regressing.

import type { ProgressStatus, TrainingSet } from "@/lib/types";
import { estimate1RM, round1 } from "./epley";
import { recentWeekKeys, weekKey } from "./dates";

export interface WeeklyExercisePoint {
  week: string; // week key (Monday)
  bestE1RM: number;
  volume: number;
  topSetWeight: number;
  topSetReps: number;
  avgRpe: number | null;
  sets: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  isMajor: boolean;
  status: ProgressStatus;
  /** Percent change in best e1RM from the first to the last active week. */
  e1rmChangePct: number;
  currentE1RM: number;
  weeks: WeeklyExercisePoint[];
}

/** Bucket one exercise's sets into per-week aggregates. */
export function weeklyPointsForExercise(
  sets: TrainingSet[],
  weeks: number = 4,
  now: Date = new Date(),
): WeeklyExercisePoint[] {
  const keys = recentWeekKeys(weeks, now);
  const byWeek = new Map<string, TrainingSet[]>();
  for (const s of sets) {
    const k = weekKey(s.date);
    if (!keys.includes(k)) continue;
    const arr = byWeek.get(k) ?? [];
    arr.push(s);
    byWeek.set(k, arr);
  }

  return keys.map((week) => {
    const weekSets = byWeek.get(week) ?? [];
    let bestE1RM = 0;
    let topSetWeight = 0;
    let topSetReps = 0;
    let volume = 0;
    let rpeSum = 0;
    let rpeCount = 0;

    for (const s of weekSets) {
      const e = estimate1RM(s.weight, s.reps);
      if (e > bestE1RM) {
        bestE1RM = e;
        topSetWeight = s.weight;
        topSetReps = s.reps;
      }
      volume += s.weight * s.reps;
      if (s.rpe != null) {
        rpeSum += s.rpe;
        rpeCount += 1;
      }
    }

    return {
      week,
      bestE1RM: round1(bestE1RM),
      volume: round1(volume),
      topSetWeight,
      topSetReps,
      avgRpe: rpeCount ? round1(rpeSum / rpeCount) : null,
      sets: weekSets.length,
    };
  });
}

/**
 * Classify the trend of an exercise over the window. We compare the best e1RM
 * of the earliest active week against the most recent active week. A change of
 * more than +2% is progressing, less than -2% is regressing, otherwise the
 * lift is plateauing. Fewer than two active weeks => insufficient data.
 */
export function classifyProgress(points: WeeklyExercisePoint[]): {
  status: ProgressStatus;
  changePct: number;
} {
  const active = points.filter((p) => p.bestE1RM > 0);
  if (active.length < 2) return { status: "insufficient", changePct: 0 };

  const first = active[0].bestE1RM;
  const last = active[active.length - 1].bestE1RM;
  if (first <= 0) return { status: "insufficient", changePct: 0 };

  const changePct = round1(((last - first) / first) * 100);
  let status: ProgressStatus;
  if (changePct > 2) status = "progressing";
  else if (changePct < -2) status = "regressing";
  else status = "plateauing";

  return { status, changePct };
}

/** Full progress report for every exercise present in `sets`. */
export function buildProgressReport(
  sets: TrainingSet[],
  weeks: number = 4,
  now: Date = new Date(),
): ExerciseProgress[] {
  const byExercise = new Map<string, TrainingSet[]>();
  for (const s of sets) {
    const arr = byExercise.get(s.exerciseId) ?? [];
    arr.push(s);
    byExercise.set(s.exerciseId, arr);
  }

  const reports: ExerciseProgress[] = [];
  for (const [exerciseId, exSets] of byExercise) {
    const points = weeklyPointsForExercise(exSets, weeks, now);
    const { status, changePct } = classifyProgress(points);
    const meta = exSets[0];
    const lastActive = [...points].reverse().find((p) => p.bestE1RM > 0);

    reports.push({
      exerciseId,
      exerciseName: meta.exerciseName,
      muscleGroup: meta.muscleGroup,
      isMajor: meta.isMajor,
      status,
      e1rmChangePct: changePct,
      currentE1RM: lastActive?.bestE1RM ?? 0,
      weeks: points,
    });
  }

  // Major lifts first, then by largest absolute change.
  reports.sort((a, b) => {
    if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
    return Math.abs(b.e1rmChangePct) - Math.abs(a.e1rmChangePct);
  });

  return reports;
}
