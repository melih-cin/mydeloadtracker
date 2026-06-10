import { ArrowUpRight, Minus, RotateCcw, TrendingDown } from "lucide-react";
import type { NextSession, ProgressionAction } from "@/lib/analytics/progression";
import type { Units } from "@/lib/types";

const ACTION: Record<
  ProgressionAction,
  { label: string; text: string; bg: string; icon: typeof ArrowUpRight }
> = {
  progress: { label: "Progress", text: "text-success", bg: "bg-success/15", icon: ArrowUpRight },
  hold: { label: "Hold", text: "text-brand", bg: "bg-brand/15", icon: Minus },
  back_off: { label: "Back off", text: "text-warning", bg: "bg-warning/15", icon: RotateCcw },
  deload: { label: "Deload", text: "text-danger", bg: "bg-danger/15", icon: TrendingDown },
};

export function NextSessionCard({
  sessions,
  units,
  limit = 8,
}: {
  sessions: NextSession[];
  units: Units;
  limit?: number;
}) {
  const shown = sessions.slice(0, limit);
  if (shown.length === 0) {
    return <p className="text-sm text-muted">Log a session and your next-session targets appear here.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {shown.map((s) => {
        const a = ACTION[s.action];
        return (
          <li key={s.exerciseId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{s.exerciseName}</span>
                {s.isMajor && (
                  <span className="rounded bg-brand/15 px-1 py-0.5 text-[10px] font-medium text-brand">
                    MAJOR
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                last {s.last.weight}
                {units}×{s.last.reps}
                {s.last.rpe != null && ` @${s.last.rpe}`} · {s.note}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                {s.target.weight}
                {units} × {s.target.reps}
                <span className="font-normal text-muted"> × {s.target.sets}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${a.bg} ${a.text}`}
              >
                <a.icon className="h-3 w-3" />
                {a.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
