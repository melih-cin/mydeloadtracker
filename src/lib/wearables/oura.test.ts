import { describe, it, expect } from "vitest";
import { mapOuraToRecovery, scoreToSleepQuality } from "@/lib/wearables/oura";

describe("oura mapping", () => {
  it("maps sleep score to 1-5", () => {
    expect(scoreToSleepQuality(90)).toBe(5);
    expect(scoreToSleepQuality(82)).toBe(4);
    expect(scoreToSleepQuality(45)).toBe(2);
    expect(scoreToSleepQuality(30)).toBe(1);
    expect(scoreToSleepQuality(null)).toBeNull();
  });

  it("prefers the main sleep period and rounds HRV/RHR", () => {
    const out = mapOuraToRecovery(
      [
        { day: "2026-06-01", type: "long_sleep", average_hrv: 65, lowest_heart_rate: 52 },
        { day: "2026-06-01", type: "late_nap", average_hrv: 40, lowest_heart_rate: 70 },
        { day: "2026-06-02", type: "long_sleep", average_hrv: 48.4, lowest_heart_rate: 60 },
      ],
      [
        { day: "2026-06-01", score: 82 },
        { day: "2026-06-02", score: 45 },
      ],
    ).sort((a, b) => a.date.localeCompare(b.date));

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ hrv: 65, resting_hr: 52, sleep_quality: 4 });
    expect(out[1]).toMatchObject({ hrv: 48, resting_hr: 60, sleep_quality: 2 });
  });

  it("drops days with no usable signal", () => {
    expect(mapOuraToRecovery([], [])).toHaveLength(0);
  });
});
