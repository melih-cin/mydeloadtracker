// Personal records per exercise: heaviest single, best estimated 1RM, and the
// set that produced that estimate.

import type { TrainingSet } from "@/lib/types";
import { estimate1RM, round1 } from "./epley";

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  isMajor: boolean;
  maxWeight: number;
  bestE1RM: number;
  bestE1RMWeight: number;
  bestE1RMReps: number;
  achievedAt: string; // ISO date of the best-e1RM set
}

export function buildRecords(sets: TrainingSet[]): PersonalRecord[] {
  const byExercise = new Map<string, TrainingSet[]>();
  for (const s of sets) {
    const arr = byExercise.get(s.exerciseId) ?? [];
    arr.push(s);
    byExercise.set(s.exerciseId, arr);
  }

  const records: PersonalRecord[] = [];
  for (const [exerciseId, exSets] of byExercise) {
    let maxWeight = 0;
    let bestE1RM = 0;
    let bestSet: TrainingSet | null = null;

    for (const s of exSets) {
      maxWeight = Math.max(maxWeight, s.weight);
      const e = estimate1RM(s.weight, s.reps);
      if (e > bestE1RM) {
        bestE1RM = e;
        bestSet = s;
      }
    }

    const meta = exSets[0];
    records.push({
      exerciseId,
      exerciseName: meta.exerciseName,
      muscleGroup: meta.muscleGroup,
      isMajor: meta.isMajor,
      maxWeight: round1(maxWeight),
      bestE1RM: round1(bestE1RM),
      bestE1RMWeight: bestSet?.weight ?? 0,
      bestE1RMReps: bestSet?.reps ?? 0,
      achievedAt: bestSet?.date ?? meta.date,
    });
  }

  records.sort((a, b) => {
    if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
    return b.bestE1RM - a.bestE1RM;
  });

  return records;
}
