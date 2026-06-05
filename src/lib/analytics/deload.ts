// Deload detection.
//
// A deload is recommended when 2 or more of the following signals are true:
//
//   (a) Volume OR estimated 1RM has not increased in 3+ consecutive weeks for
//       2+ major lifts.
//   (b) Average RPE for a given lift has risen by 1.5+ points without a
//       corresponding increase in working weight.
//   (c) Session frequency in the last 2 weeks has dropped versus the prior
//       4-week average.
//
// Each signal returns enough detail to explain *why* it fired, which is shown
// on the dashboard alert card and fed to the AI coach.

import type { TrainingSet } from "@/lib/types";
import { weeklyPointsForExercise, type WeeklyExercisePoint } from "./progress";
import { recentWeekKeys, weekKey } from "./dates";
import { round1 } from "./epley";

export type SignalId = "stalled_majors" | "rising_rpe" | "dropping_frequency";

export interface DeloadSignal {
  id: SignalId;
  label: string;
  triggered: boolean;
  detail: string;
}

export interface DeloadReport {
  recommended: boolean;
  triggeredCount: number;
  signals: DeloadSignal[];
  /** Human-readable reasons for every triggered signal. */
  reasons: string[];
}

const WINDOW_WEEKS = 6;
const STALL_WEEKS = 3;

/** Number of trailing weeks in which neither e1RM nor volume set a new high. */
function weeksSinceImprovement(points: WeeklyExercisePoint[]): number {
  const active = points.filter((p) => p.bestE1RM > 0 || p.volume > 0);
  if (active.length < 2) return 0;

  let lastImprovement = 0; // index of week 0 = baseline, no prior to beat
  let maxE1RM = active[0].bestE1RM;
  let maxVol = active[0].volume;

  for (let i = 1; i < active.length; i++) {
    const p = active[i];
    if (p.bestE1RM > maxE1RM || p.volume > maxVol) {
      lastImprovement = i;
    }
    maxE1RM = Math.max(maxE1RM, p.bestE1RM);
    maxVol = Math.max(maxVol, p.volume);
  }

  return active.length - 1 - lastImprovement;
}

/** Signal (a): 2+ major lifts stalled for 3+ consecutive weeks. */
function signalStalledMajors(sets: TrainingSet[], now: Date): DeloadSignal {
  const majors = new Map<string, { name: string; sets: TrainingSet[] }>();
  for (const s of sets) {
    if (!s.isMajor) continue;
    const entry = majors.get(s.exerciseId) ?? { name: s.exerciseName, sets: [] };
    entry.sets.push(s);
    majors.set(s.exerciseId, entry);
  }

  const stalled: string[] = [];
  for (const { name, sets: exSets } of majors.values()) {
    const points = weeklyPointsForExercise(exSets, WINDOW_WEEKS, now);
    if (weeksSinceImprovement(points) >= STALL_WEEKS) {
      stalled.push(name);
    }
  }

  const triggered = stalled.length >= 2;
  return {
    id: "stalled_majors",
    label: "Stalled major lifts",
    triggered,
    detail: triggered
      ? `${stalled.length} major lifts have not increased in volume or e1RM for ${STALL_WEEKS}+ weeks: ${stalled.join(", ")}.`
      : stalled.length === 1
        ? `Only ${stalled[0]} is stalled (need 2+ major lifts to trigger).`
        : "Major lifts are still progressing.",
  };
}

/** Signal (b): avg RPE up 1.5+ for a lift with no working-weight increase. */
function signalRisingRpe(sets: TrainingSet[], now: Date): DeloadSignal {
  const byExercise = new Map<string, { name: string; sets: TrainingSet[] }>();
  for (const s of sets) {
    const entry = byExercise.get(s.exerciseId) ?? { name: s.exerciseName, sets: [] };
    entry.sets.push(s);
    byExercise.set(s.exerciseId, entry);
  }

  const offenders: string[] = [];
  for (const { name, sets: exSets } of byExercise.values()) {
    const points = weeklyPointsForExercise(exSets, WINDOW_WEEKS, now).filter(
      (p) => p.sets > 0 && p.avgRpe != null,
    );
    if (points.length < 2) continue;

    const earliest = points[0];
    const latest = points[points.length - 1];
    const rpeDelta = (latest.avgRpe ?? 0) - (earliest.avgRpe ?? 0);
    const weightIncreased = latest.topSetWeight > earliest.topSetWeight;

    if (rpeDelta >= 1.5 && !weightIncreased) {
      offenders.push(
        `${name} (RPE +${round1(rpeDelta)} at ${latest.topSetWeight} vs ${earliest.topSetWeight})`,
      );
    }
  }

  const triggered = offenders.length > 0;
  return {
    id: "rising_rpe",
    label: "Rising effort, flat load",
    triggered,
    detail: triggered
      ? `Effort climbing without added weight: ${offenders.join("; ")}.`
      : "No lifts show rising RPE at a stable load.",
  };
}

/** Signal (c): session frequency dropped in the last 2 weeks. */
function signalDroppingFrequency(sets: TrainingSet[], now: Date): DeloadSignal {
  const keys = recentWeekKeys(WINDOW_WEEKS, now); // oldest -> newest
  const sessionsByWeek = new Map<string, Set<string>>();
  for (const k of keys) sessionsByWeek.set(k, new Set());
  for (const s of sets) {
    const k = weekKey(s.date);
    sessionsByWeek.get(k)?.add(s.sessionId);
  }

  const counts = keys.map((k) => sessionsByWeek.get(k)?.size ?? 0);
  const last2 = counts.slice(-2);
  const prior4 = counts.slice(0, WINDOW_WEEKS - 2);

  const last2Avg = last2.reduce((a, b) => a + b, 0) / last2.length;
  const prior4Avg = prior4.reduce((a, b) => a + b, 0) / prior4.length;

  // Require some prior baseline so a brand-new user isn't flagged.
  const triggered = prior4Avg > 0 && last2Avg < prior4Avg;
  return {
    id: "dropping_frequency",
    label: "Falling training frequency",
    triggered,
    detail: triggered
      ? `Last 2 weeks averaged ${round1(last2Avg)} sessions/wk vs ${round1(prior4Avg)} over the prior 4 weeks.`
      : `Frequency steady (${round1(last2Avg)} vs ${round1(prior4Avg)} sessions/wk).`,
  };
}

export function detectDeload(sets: TrainingSet[], now: Date = new Date()): DeloadReport {
  const signals: DeloadSignal[] = [
    signalStalledMajors(sets, now),
    signalRisingRpe(sets, now),
    signalDroppingFrequency(sets, now),
  ];

  const triggered = signals.filter((s) => s.triggered);
  return {
    recommended: triggered.length >= 2,
    triggeredCount: triggered.length,
    signals,
    reasons: triggered.map((s) => s.detail),
  };
}
