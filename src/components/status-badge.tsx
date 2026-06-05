import { ArrowDownRight, ArrowUpRight, Minus, HelpCircle } from "lucide-react";
import type { ProgressStatus } from "@/lib/types";

const STYLES: Record<
  ProgressStatus,
  { label: string; cls: string; Icon: typeof ArrowUpRight }
> = {
  progressing: {
    label: "Progressing",
    cls: "bg-success/15 text-success",
    Icon: ArrowUpRight,
  },
  plateauing: {
    label: "Plateauing",
    cls: "bg-warning/15 text-warning",
    Icon: Minus,
  },
  regressing: {
    label: "Regressing",
    cls: "bg-danger/15 text-danger",
    Icon: ArrowDownRight,
  },
  insufficient: {
    label: "Not enough data",
    cls: "bg-surface-hover text-muted",
    Icon: HelpCircle,
  },
};

export function StatusBadge({
  status,
  changePct,
}: {
  status: ProgressStatus;
  changePct?: number;
}) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
    >
      <s.Icon className="h-3.5 w-3.5" />
      {s.label}
      {changePct != null && status !== "insufficient" && (
        <span className="opacity-80">
          {changePct > 0 ? "+" : ""}
          {changePct}%
        </span>
      )}
    </span>
  );
}
