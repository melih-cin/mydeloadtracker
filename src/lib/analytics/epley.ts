// Estimated 1-rep-max using the Epley formula. This normalizes performance
// across different rep ranges so we can compare a heavy triple against a
// lighter set of ten on the same scale.
//
//   e1RM = weight * (1 + reps / 30)
//
// A single rep returns the weight itself.

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Round to one decimal for display. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
