// Weekly training volume (sum of weight * reps) bucketed per muscle group.
// Shaped for a stacked bar chart: one row per week, one numeric key per
// muscle group.

import type { TrainingSet } from "@/lib/types";
import { recentWeekKeys, weekKey, weekLabel } from "./dates";
import { round1 } from "./epley";

export interface WeeklyVolumeRow {
  week: string;
  label: string;
  total: number;
  [muscleGroup: string]: number | string;
}

export interface VolumeReport {
  rows: WeeklyVolumeRow[];
  muscleGroups: string[];
}

export function buildVolumeReport(
  sets: TrainingSet[],
  weeks: number = 8,
  now: Date = new Date(),
): VolumeReport {
  const keys = recentWeekKeys(weeks, now);
  const groups = new Set<string>();
  // week -> muscleGroup -> volume
  const grid = new Map<string, Map<string, number>>();
  for (const k of keys) grid.set(k, new Map());

  for (const s of sets) {
    const k = weekKey(s.date);
    if (!grid.has(k)) continue;
    groups.add(s.muscleGroup);
    const row = grid.get(k)!;
    row.set(s.muscleGroup, (row.get(s.muscleGroup) ?? 0) + s.weight * s.reps);
  }

  const muscleGroups = [...groups].sort();
  const rows: WeeklyVolumeRow[] = keys.map((week) => {
    const row: WeeklyVolumeRow = { week, label: weekLabel(week), total: 0 };
    let total = 0;
    for (const mg of muscleGroups) {
      const v = round1(grid.get(week)?.get(mg) ?? 0);
      row[mg] = v;
      total += v;
    }
    row.total = round1(total);
    return row;
  });

  return { rows, muscleGroups };
}
