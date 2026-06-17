// Visual identity for an exercise: a color keyed to its muscle group and an
// icon keyed to its equipment, so every exercise gets a consistent, colorful
// badge in the same style as the rest of the app (no per-exercise photos).

import { Activity, Cable, Dumbbell, type LucideIcon } from "lucide-react";
import type { BadgeColor } from "@/components/icon-badge";

const MUSCLE_COLOR: Record<string, BadgeColor> = {
  Chest: "rose",
  Back: "blue",
  Quads: "indigo",
  Hamstrings: "violet",
  Glutes: "rose",
  Shoulders: "amber",
  Biceps: "cyan",
  Triceps: "teal",
  Calves: "green",
  Core: "orange",
  Abs: "orange",
  Forearms: "lime",
  Traps: "blue",
  Adductors: "teal",
  Abductors: "teal",
};

export function exerciseColor(muscleGroup: string | null | undefined): BadgeColor {
  return MUSCLE_COLOR[muscleGroup ?? ""] ?? "blue";
}

export function exerciseIcon(equipment: string | null | undefined): LucideIcon {
  const e = (equipment ?? "").toLowerCase();
  if (e.includes("bodyweight")) return Activity;
  if (e.includes("cable")) return Cable;
  return Dumbbell;
}
