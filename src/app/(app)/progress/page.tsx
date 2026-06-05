import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTrainingSets } from "@/lib/data";
import { buildProgressReport } from "@/lib/analytics/progress";
import { buildRecords } from "@/lib/analytics/records";
import { isStandardLift } from "@/lib/analytics/standards";
import { StatusBadge } from "@/components/status-badge";
import { ExerciseTrend } from "@/components/exercise-trend";
import { StrengthStandards } from "@/components/strength-standards";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = createClient();
  const [sets, profile] = await Promise.all([getTrainingSets(supabase, 8), getProfile(supabase)]);
  const units = profile?.units ?? "kg";

  // Trend chart over 8 weeks; status classified over the last 4 weeks (spec).
  const trends = buildProgressReport(sets, 8);
  const status4 = new Map(
    buildProgressReport(sets, 4).map((p) => [p.exerciseId, p]),
  );

  // Best all-time e1RM for the standard barbell lifts, for the strength card.
  const standardLifts = buildRecords(sets)
    .filter((r) => isStandardLift(r.exerciseName))
    .map((r) => ({ name: r.exerciseName, e1rm: r.bestE1RM }));

  if (sets.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="card max-w-md text-center">
          <Dumbbell className="mx-auto mb-3 h-8 w-8 text-brand" />
          <h1 className="text-xl font-semibold">Nothing to chart yet</h1>
          <p className="mt-2 text-sm text-muted">
            Log a few sessions and your estimated-1RM trends will appear here.
          </p>
          <Link href="/log" className="btn-brand mt-5">
            Log a workout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Progressive overload</h1>
        <p className="text-sm text-muted">
          Estimated 1RM (Epley) per lift over 8 weeks. Status reflects the last 4 weeks.
        </p>
      </div>

      <StrengthStandards
        lifts={standardLifts}
        units={units}
        initialBodyweight={profile?.bodyweight ?? null}
        initialSex={profile?.sex ?? null}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {trends.map((t) => {
          const s = status4.get(t.exerciseId);
          const status = s?.status ?? t.status;
          const changePct = s?.e1rmChangePct ?? t.e1rmChangePct;
          return (
            <div key={t.exerciseId} className="card">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {t.exerciseName}
                    {t.isMajor && (
                      <span className="ml-2 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                        MAJOR
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted">{t.muscleGroup}</p>
                </div>
                <StatusBadge status={status} changePct={changePct} />
              </div>

              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums">{t.currentE1RM}</span>
                <span className="text-sm text-muted">{units} est. 1RM</span>
              </div>

              <ExerciseTrend weeks={t.weeks} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
