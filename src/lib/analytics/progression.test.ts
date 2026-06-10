import { describe, it, expect } from "vitest";
import { buildNextSessions } from "@/lib/analytics/progression";
import type { TrainingSet } from "@/lib/types";

const now = new Date("2026-06-08T12:00:00").toISOString();

function lift(name: string, weight: number, reps: number, rpe: number | null, sets = 3): TrainingSet[] {
  return Array.from({ length: sets }, (_, i) => ({
    date: now,
    sessionId: `${name}-sess`,
    exerciseId: name,
    exerciseName: name,
    muscleGroup: "Quads",
    isMajor: true,
    reps,
    weight,
    rpe,
  }));
}

describe("auto-progression", () => {
  it("adds load when the last set was easy (RPE <= 7.5)", () => {
    const [n] = buildNextSessions(lift("Barbell Back Squat", 100, 5, 7), { units: "kg" });
    expect(n.action).toBe("progress");
    expect(n.target.weight).toBe(105); // big lift -> +5kg
  });

  it("holds weight and chases a rep at RPE ~8", () => {
    const [n] = buildNextSessions(lift("Barbell Bench Press", 80, 5, 8), { units: "kg" });
    expect(n.action).toBe("hold");
    expect(n.target.weight).toBe(80);
    expect(n.target.reps).toBe(6);
  });

  it("backs off at near-maximal RPE", () => {
    const [n] = buildNextSessions(lift("Overhead Press", 50, 5, 9.5), { units: "kg" });
    expect(n.action).toBe("back_off");
    expect(n.target.weight).toBe(50);
  });

  it("prescribes a deload for every lift when recommended", () => {
    const [n] = buildNextSessions(lift("Barbell Back Squat", 100, 5, 7), { units: "kg", deload: true });
    expect(n.action).toBe("deload");
    expect(n.target.weight).toBe(85); // ~15% off, rounded to plate
    expect(n.target.sets).toBeLessThan(3);
  });

  it("uses larger jumps in lb and smaller for isolation lifts", () => {
    const [squat] = buildNextSessions(lift("Barbell Back Squat", 225, 5, 7), { units: "lb" });
    expect(squat.target.weight).toBe(235); // +10 lb big lift
    const curl = buildNextSessions(
      lift("Barbell Curl", 60, 10, 7).map((s) => ({ ...s, exerciseName: "Barbell Curl", exerciseId: "Barbell Curl" })),
      { units: "lb" },
    )[0];
    expect(curl.target.weight).toBe(65); // +5 lb isolation
  });
});
