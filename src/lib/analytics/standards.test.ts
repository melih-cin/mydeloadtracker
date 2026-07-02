import { describe, it, expect } from "vitest";
import {
  classifyLift,
  overallStrength,
  cadenceFor,
  isStandardLift,
  liftMetric,
} from "@/lib/analytics/standards";

// Reference: strength-standards.json, Squat male @ 200 lb bodyweight =
//   [Beginner 186, Novice 248, Intermediate 323, Advanced 408, Elite 499]
describe("strength standards (strengthlevel.com tables)", () => {
  it("bands a squat against the file's male table", () => {
    expect(classifyLift("Squat", { e1rm: 100 }, 200, "male", "lb")?.level.id).toBe("beginner"); // < 186
    expect(classifyLift("Squat", { e1rm: 250 }, 200, "male", "lb")?.level.id).toBe("novice"); // 248..323
    expect(classifyLift("Squat", { e1rm: 400 }, 200, "male", "lb")?.level.id).toBe("intermediate"); // 323..408
    const elite = classifyLift("Squat", { e1rm: 520 }, 200, "male", "lb");
    expect(elite?.level.id).toBe("elite"); // >= 499
    expect(elite?.nextLevel).toBeNull();
    expect(elite?.nextLevelValue).toBeNull();
  });

  it("bands bodyweight lifts by single-set reps, not pounds", () => {
    // Pull Ups male @ 210 lb: [null, 6, 12, 21, 29] — reps, with a null Beginner tier.
    expect(liftMetric("Pull Ups")).toBe("reps");
    expect(liftMetric("Squat")).toBe("weight");

    const novice = classifyLift("Pull Ups", { reps: 8 }, 210, "male", "lb");
    expect(novice?.metric).toBe("reps");
    expect(novice?.level.id).toBe("novice"); // 6..12
    expect(novice?.nextLevelValue).toBe(12); // next level expressed in reps

    expect(classifyLift("Pull Ups", { reps: 25 }, 210, "male", "lb")?.level.id).toBe("advanced");
    // e1RM alone must NOT classify a reps lift (that was the bug).
    expect(classifyLift("Pull Ups", { e1rm: 300 }, 210, "male", "lb")).toBeNull();
  });

  it("treats null tiers (site shows <1 rep) as a zero-entry bar, never NaN", () => {
    // One Arm Push Ups male: Beginner AND Novice are null.
    const s = classifyLift("One Arm Push Ups", { reps: 2 }, 210, "male", "lb");
    expect(s).not.toBeNull();
    expect(Number.isFinite(s!.progressToNext)).toBe(true);
    expect(s!.level.rank).toBeGreaterThanOrEqual(1); // cleared the two zero tiers
  });

  it("resolves the old library names through the alias map", () => {
    expect(isStandardLift("Barbell Back Squat")).toBe(true); // alias -> Squat
    expect(classifyLift("Barbell Back Squat", { e1rm: 400 }, 200, "male", "lb")?.lift).toBe("Squat");
    expect(isStandardLift("Bicycle Crunch")).toBe(false);
  });

  it("converts kilogram inputs to pounds before lookup", () => {
    const lb = classifyLift("Bench Press", { e1rm: 226 }, 200, "male", "lb")?.level.id;
    const kg = classifyLift(
      "Bench Press",
      { e1rm: 226 / 2.2046226218 },
      200 / 2.2046226218,
      "male",
      "kg",
    )?.level.id;
    expect(kg).toBe(lb);
  });

  it("returns null without a valid bodyweight, performance, or known lift", () => {
    expect(classifyLift("Squat", { e1rm: 100 }, 0, "male", "lb")).toBeNull();
    expect(classifyLift("Squat", { e1rm: 0 }, 200, "male", "lb")).toBeNull();
    expect(classifyLift("Not A Real Lift", { e1rm: 100 }, 200, "male", "lb")).toBeNull();
  });

  it("overall strength blends weight and reps lifts", () => {
    const perfs = new Map([
      ["Squat", { e1rm: 400, reps: 5 }], // intermediate by weight
      ["Pull Ups", { e1rm: 0, reps: 8 }], // novice by reps
    ]);
    expect(overallStrength(perfs, null, "male", "lb")).toBeNull();
    const o = overallStrength(perfs, 210, "male", "lb");
    expect(o?.perLift.length).toBe(2);
    expect(o?.level).toBeTruthy();
  });

  it("deload cadence shortens as experience rises; defaults to intermediate", () => {
    expect(cadenceFor("beginner").lowWeeks).toBeGreaterThan(cadenceFor("intermediate").lowWeeks);
    expect(cadenceFor("intermediate").lowWeeks).toBeGreaterThan(cadenceFor("elite").lowWeeks);
    expect(cadenceFor(null).lowWeeks).toBe(cadenceFor("intermediate").lowWeeks);
  });
});
