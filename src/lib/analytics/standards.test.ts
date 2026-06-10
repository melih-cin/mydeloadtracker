import { describe, it, expect } from "vitest";
import { classifyLift, overallStrength, cadenceFor } from "@/lib/analytics/standards";

describe("strength standards", () => {
  it("bands a 140kg squat e1RM at 90kg bodyweight as intermediate", () => {
    const s = classifyLift("Barbell Back Squat", 140, 90, "male");
    expect(s?.level.id).toBe("intermediate");
    expect(s?.nextLevel?.id).toBe("advanced");
    expect(s?.progressToNext).toBeGreaterThanOrEqual(0);
    expect(s?.progressToNext).toBeLessThanOrEqual(1);
  });

  it("bands a sub-novice squat as beginner and a 2.6x squat as elite", () => {
    expect(classifyLift("Barbell Back Squat", 60, 90, "male")?.level.id).toBe("beginner");
    const elite = classifyLift("Barbell Back Squat", 240, 90, "male");
    expect(elite?.level.id).toBe("elite");
    expect(elite?.nextLevel).toBeNull();
    expect(elite?.nextLevelE1RM).toBeNull();
  });

  it("returns null without a valid bodyweight or e1RM", () => {
    expect(classifyLift("Barbell Bench Press", 100, 0, "male")).toBeNull();
    expect(classifyLift("Barbell Bench Press", 0, 90, "male")).toBeNull();
  });

  it("overall strength needs bodyweight, sex, and at least one standard lift", () => {
    const e1rms = new Map([["Barbell Back Squat", 140]]);
    expect(overallStrength(e1rms, null, "male")).toBeNull();
    expect(overallStrength(new Map([["Lateral Raise", 20]]), 90, "male")).toBeNull();
    expect(overallStrength(e1rms, 90, "male")?.level).toBeTruthy();
  });

  it("deload cadence shortens as experience rises; defaults to intermediate", () => {
    expect(cadenceFor("beginner").lowWeeks).toBeGreaterThan(cadenceFor("intermediate").lowWeeks);
    expect(cadenceFor("intermediate").lowWeeks).toBeGreaterThan(cadenceFor("elite").lowWeeks);
    expect(cadenceFor(null).lowWeeks).toBe(cadenceFor("intermediate").lowWeeks);
  });
});
