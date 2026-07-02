// What "weight" means for a given exercise, driven by its equipment. This
// matters for correctness, not just clarity: strengthlevel.com's dumbbell
// standards are for ONE dumbbell, and its barbell standards are the total bar
// weight, so an athlete logging the combined weight of two dumbbells would be
// misclassified by 2x. The convention is stated right on the input.

export interface WeightSemantics {
  /** Short label shown next to the exercise, e.g. "one dumbbell". */
  label: string;
  /** Full sentence shown as the input hint. */
  hint: string;
  /** True for bodyweight movements, where zero added weight is a valid set. */
  allowZero: boolean;
}

const BY_EQUIPMENT: Record<string, WeightSemantics> = {
  barbell: {
    label: "total bar weight",
    hint: "Enter the total weight, bar included.",
    allowZero: false,
  },
  dumbbell: {
    label: "one dumbbell",
    hint: "Enter the weight of a single dumbbell, even for two-dumbbell moves.",
    allowZero: false,
  },
  kettlebell: {
    label: "one kettlebell",
    hint: "Enter the weight of a single kettlebell.",
    allowZero: false,
  },
  machine: {
    label: "machine weight",
    hint: "Enter the weight set on the machine or stack.",
    allowZero: false,
  },
  cable: {
    label: "stack weight",
    hint: "Enter the weight set on the cable stack.",
    allowZero: false,
  },
  bodyweight: {
    label: "added weight",
    hint: "Enter added weight only. Leave 0 for just bodyweight.",
    allowZero: true,
  },
};

const DEFAULT: WeightSemantics = {
  label: "total weight",
  hint: "Enter the total weight moved.",
  allowZero: false,
};

export function weightSemantics(equipment: string | null | undefined): WeightSemantics {
  return BY_EQUIPMENT[(equipment ?? "").toLowerCase()] ?? DEFAULT;
}
