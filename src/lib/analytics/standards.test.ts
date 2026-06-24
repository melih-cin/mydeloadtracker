import { describe, it, expect } from "vitest";
import { classifyLift, overallStrength, cadenceFor, isStandardLift } from "@/lib/analytics/standards";

// Reference: strength-standards.json, Squat male @ 200 lb bodyweight =
//   [Beginner 186, Novice 248, Intermediate 323, Advanced 408, Elite 499]
describe("strength standards (strengthlevel.com tables)", () => {
  it("bands a squat against the file's male table", () => {
    expect(classifyLift("Squat", 100, 200, "male", "lb")?.level.id).toBe("beginner"); // < 186
    expect(classifyLift("Squat", 250, 200, "male", "lb")?.level.id).toBe("novice"); // 248..323
    expect(classifyLift("Squat", 400, 200, "male", "lb")?.level.id).toBe("intermediate"); // 323..408
    const elite = classifyLift("Squat", 520, 200, "male", "lb");
    expect(elite?.level.id).toBe("elite"); // >= 499
    expect(elite?.nextLevel).toBeNull();
    expect(elite?.nextLevelE1RM).toBeNull();
  });

  it("resolves the old library names through the alias map", () => {
    expect(isStandardLift("Barbell Back Squat")).toBe(true); // alias -> Squat
    expect(classifyLift("Barbell Back Squat", 400, 200, "male", "lb")?.lift).toBe("Squat");
    expect(isStandardLift("Bicycle Crunch")).toBe(false);
  });

  it("converts kilogram inputs to pounds before lookup", () => {
    const lb = classifyLift("Bench Press", 226, 200, "male", "lb")?.level.id;
    const kg = classifyLift("Bench Press", 226 / 2.2046226218, 200 / 2.2046226218, "male", "kg")?.level.id;
    expect(kg).toBe(lb);
  });

  it("returns null without a valid bodyweight, e1RM, or known lift", () => {
    expect(classifyLift("Squat", 100, 0, "male", "lb")).toBeNull();
    expect(classifyLift("Squat", 0, 200, "male", "lb")).toBeNull();
    expect(classifyLift("Not A Real Lift", 100, 200, "male", "lb")).toBeNull();
  });

  it("overall strength needs bodyweight, sex, and a standard lift", () => {
    const e1rms = new Map([["Squat", 400]]);
    expect(overallStrength(e1rms, null, "male", "lb")).toBeNull();
    expect(overallStrength(new Map([["Bicycle Crunch", 50]]), 200, "male", "lb")).toBeNull();
    expect(overallStrength(e1rms, 200, "male", "lb")?.level).toBeTruthy();
  });

  it("deload cadence shortens as experience rises; defaults to intermediate", () => {
    expect(cadenceFor("beginner").lowWeeks).toBeGreaterThan(cadenceFor("intermediate").lowWeeks);
    expect(cadenceFor("intermediate").lowWeeks).toBeGreaterThan(cadenceFor("elite").lowWeeks);
    expect(cadenceFor(null).lowWeeks).toBe(cadenceFor("intermediate").lowWeeks);
  });
});
