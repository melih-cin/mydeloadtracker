import Link from "next/link";
import { CalendarDays, Dumbbell, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionsWithSets } from "@/lib/data";
import { round1 } from "@/lib/analytics/epley";
import { DeleteSessionButton } from "@/components/delete-session-button";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = createClient();
  const [sessions, profile] = await Promise.all([
    getSessionsWithSets(supabase, 60),
    getProfile(supabase),
  ]);
  const units = profile?.units ?? "kg";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workout history</h1>
          <p className="text-sm text-muted">Review, edit, or delete past sessions.</p>
        </div>
        <Link href="/log" className="btn-brand max-sm:hidden">
          <Dumbbell className="h-4 w-4" />
          Log workout
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center text-sm text-muted">
          No sessions yet.{" "}
          <Link href="/log" className="text-brand hover:underline">
            Log your first workout
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const volume = s.sets.reduce((a, x) => a + x.weight * x.reps, 0);
            // Group sets by exercise for a compact summary.
            const byEx = new Map<string, { name: string; count: number; top: number }>();
            for (const x of s.sets) {
              const e = byEx.get(x.exerciseId) ?? { name: x.exerciseName, count: 0, top: 0 };
              e.count += 1;
              e.top = Math.max(e.top, x.weight);
              byEx.set(x.exerciseId, e);
            }
            const exercises = [...byEx.values()];
            const dateLabel = new Date(s.performed_at).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={s.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="h-4 w-4 text-brand" />
                      {dateLabel}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                      {exercises.map((e) => (
                        <span key={e.name}>
                          <span className="text-foreground">{e.name}</span> · {e.count} set
                          {e.count > 1 ? "s" : ""} · top {round1(e.top)}
                          {units}
                        </span>
                      ))}
                    </div>
                    {s.notes && <p className="mt-2 text-xs text-muted">“{s.notes}”</p>}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {Math.round(volume).toLocaleString()}{" "}
                      <span className="text-xs font-normal text-muted">{units} vol</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/history/${s.id}`}
                        className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <DeleteSessionButton sessionId={s.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
