// Estimated 1-rep-max using the Brzycki formula. This is the formula used by
// strengthlevel.com, the source of our strength standards, so our estimated
// 1RMs line up with their standards tables.
//
//   e1RM = weight × 36 / (37 − reps)
//
// A single rep returns the weight itself. Reps are clamped to [1, 36] so the
// near-singularity at 37 reps can never divide by zero or explode; nobody logs
// a strength set anywhere near that, so realistic inputs use the raw formula.

export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  const r = Math.min(36, reps);
  return (weight * 36) / (37 - r);
}

/** Round to one decimal for display. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
