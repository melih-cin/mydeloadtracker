import { describe, it, expect } from "vitest";
import { toKg, fromKg } from "./units";

describe("unit conversion", () => {
  it("leaves kilograms untouched in both directions", () => {
    expect(toKg(100, "kg")).toBe(100);
    expect(fromKg(102.5, "kg")).toBe(102.5);
  });

  it("converts pounds to kilograms for storage", () => {
    expect(toKg(225, "lb")).toBeCloseTo(102.058, 2);
    expect(toKg(45, "lb")).toBeCloseTo(20.412, 2);
  });

  it("round-trips a pound-native weight back to the exact number typed", () => {
    for (const lb of [45, 95, 135, 185, 225, 315, 12.5, 227.5]) {
      expect(fromKg(toKg(lb, "lb"), "lb")).toBe(lb);
    }
  });

  it("shows a kilogram-native weight converted into pounds", () => {
    expect(fromKg(100, "lb")).toBeCloseTo(220.46, 1);
    expect(fromKg(20, "lb")).toBeCloseTo(44.09, 1);
  });

  it("passes non-finite values through unchanged", () => {
    expect(Number.isNaN(toKg(NaN, "lb"))).toBe(true);
    expect(Number.isNaN(fromKg(NaN, "kg"))).toBe(true);
  });
});
