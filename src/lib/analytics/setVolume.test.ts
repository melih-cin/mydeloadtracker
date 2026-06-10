import { describe, it, expect } from "vitest";
import { buildSetVolume } from "@/lib/analytics/setVolume";
import type { TrainingSet } from "@/lib/types";

const now = new Date("2026-06-08T12:00:00");

function add(
  sets: TrainingSet[],
  week: number,
  ex: string,
  mg: string,
  n: number,
  rpe: number | null,
) {
  const d = new Date(now);
  d.setDate(d.getDate() - week * 7);
  for (let i = 0; i < n; i++) {
    sets.push({
      date: d.toISOString(),
      sessionId: `${ex}-${week}-${i}`,
      exerciseId: ex,
      exerciseName: ex,
      muscleGroup: mg,
      isMajor: false,
      reps: 10,
      weight: 50,
      rpe,
    });
  }
}

describe("set-volume (hard sets per muscle/week)", () => {
  it("averages over the window, excludes sub-RPE-7 warmups, and bands status", () => {
    const sets: TrainingSet[] = [];
    for (let w = 0; w < 4; w++) {
      add(sets, w, "Bench", "Chest", 4, 8); // 4/wk -> low
      add(sets, w, "Row", "Back", 12, 8); // 12/wk -> optimal
    }
    add(sets, 0, "Warmup", "Chest", 3, 5); // RPE 5 -> excluded

    const r = buildSetVolume(sets, 4, 8, now);
    const chest = r.muscles.find((m) => m.muscleGroup === "Chest")!;
    const back = r.muscles.find((m) => m.muscleGroup === "Back")!;

    expect(chest.setsPerWeek).toBe(4);
    expect(chest.status).toBe("low");
    expect(back.setsPerWeek).toBe(12);
    expect(back.status).toBe("optimal");
    expect(r.muscles[0].setsPerWeek).toBeGreaterThanOrEqual(
      r.muscles[r.muscles.length - 1].setsPerWeek,
    );
    expect(r.rows).toHaveLength(8);
  });
});
