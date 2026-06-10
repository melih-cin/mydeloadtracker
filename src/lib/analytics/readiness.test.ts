import { describe, it, expect } from "vitest";
import { computeReadiness } from "@/lib/analytics/readiness";
import {
  buildSampleSets,
  buildSampleCheckins,
  SAMPLE_BODYWEIGHT,
  SAMPLE_SEX,
} from "@/lib/analytics/sample";
import type { TrainingSet } from "@/lib/types";

const now = new Date("2026-06-08T12:00:00");

/** Six consecutive hard squat weeks at a flat load — a time-under-load streak. */
function flatSquatWeeks(): TrainingSet[] {
  const sets: TrainingSet[] = [];
  for (let w = 5; w >= 0; w--) {
    const d = new Date(now);
    d.setDate(d.getDate() - w * 7);
    for (let s = 0; s < 5; s++) {
      sets.push({
        date: d.toISOString(),
        sessionId: `s-${w}`,
        exerciseId: "squat",
        exerciseName: "Barbell Back Squat",
        muscleGroup: "Quads",
        isMajor: true,
        reps: 5,
        weight: 160,
        rpe: 8,
      });
    }
  }
  return sets;
}

describe("readiness — experience-adjusted deload cadence", () => {
  it("an elite lifter accrues more time-under-load fatigue than an intermediate", () => {
    const sets = flatSquatWeeks();
    const inter = computeReadiness(sets, [], now); // no bodyweight -> intermediate default
    const elite = computeReadiness(sets, [], now, { bodyweight: 70, sex: "male" }); // 160@70 -> elite

    expect(inter.experienceLabel).toBeNull();
    expect(elite.experienceLabel).toBe("Elite");

    const tul = (r: typeof inter) => r.factors.find((f) => f.id === "time_under_load")!;
    expect(tul(elite).value).toBeGreaterThan(tul(inter).value);
    expect(elite.score).toBeLessThanOrEqual(inter.score);
  });
});

describe("readiness — objective recovery factors", () => {
  it("HRV depression and resting-HR elevation fire for the overreached sample", () => {
    const r = computeReadiness(
      buildSampleSets(now),
      buildSampleCheckins(now),
      now,
      { bodyweight: SAMPLE_BODYWEIGHT, sex: SAMPLE_SEX },
    );
    expect(r.score).toBeLessThan(55);
    expect(r.factors.find((f) => f.id === "hrv_depression")?.value).toBeGreaterThan(0.2);
    expect(r.factors.find((f) => f.id === "rhr_elevation")?.value).toBeGreaterThan(0.2);
  });

  it("contributes nothing when there is no recovery data", () => {
    const r = computeReadiness(buildSampleSets(now), [], now);
    expect(r.factors.find((f) => f.id === "hrv_depression")?.value).toBe(0);
    expect(r.factors.find((f) => f.id === "rhr_elevation")?.value).toBe(0);
  });
});
