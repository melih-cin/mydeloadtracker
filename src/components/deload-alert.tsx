import Link from "next/link";
import { CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import type { DeloadReport } from "@/lib/analytics/deload";

export function DeloadAlert({ report }: { report: DeloadReport }) {
  if (report.recommended) {
    return (
      <div className="card border-warning/40 bg-warning/10">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-warning/20 text-warning">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-warning">Deload recommended</h2>
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                {report.triggeredCount}/3 signals
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Multiple fatigue signals are firing. Consider a lighter week to recover before
              pushing again.
            </p>
            <ul className="mt-3 space-y-1.5">
              {report.reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Link href="/coach" className="btn-brand mt-4">
              Ask the coach how to deload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-success/30 bg-success/5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-success/15 text-success">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-success">No deload needed</h2>
          <p className="text-sm text-muted">
            {report.triggeredCount}/3 fatigue signals active — keep progressing.
          </p>
        </div>
      </div>
    </div>
  );
}
