import Link from "next/link";
import { ArrowRight, Dumbbell, History, LineChart, Target, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getTrainingSets } from "@/lib/data";
import { buildProgressReport } from "@/lib/analytics/progress";
import { buildRecords } from "@/lib/analytics/records";
import { buildSetVolume } from "@/lib/analytics/setVolume";
import { isStandardLift } from "@/lib/analytics/standards";
import { StatusBadge } from "@/components/status-badge";
import { ExerciseTrend } from "@/components/exercise-trend";
import { StrengthStandards } from "@/components/strength-standards";
import { VolumeChart } from "@/components/volume-chart";
import { SetVolumePanel } from "@/components/set-volume";
import { RecordsTable } from "@/components/records-table";
import { IconBadge } from "@/components/icon-badge";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = createClient();
  const profile = await getProfile(supabase);
  const units = profile?.units ?? "kg";
  const sets = await getTrainingSets(supabase, units, 8);

  if (sets.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-4 w-fit">
            <IconBadge icon={LineChart} color="green" size="lg" />
          </div>
          <h1 className="text-xl font-semibold">Nothing to chart yet</h1>
          <p className="mt-2 text-sm text-muted">
            Log a few sessions and your strength trends will appear here.
          </p>
          <Link href="/log" className="btn-brand mt-5 w-full sm:w-auto sm:px-6">
            Log a workout
          </Link>
        </div>
      </div>
    );
  }

  const trends = buildProgressReport(sets, 8);
  const status4 = new Map(buildProgressReport(sets, 4).map((p) => [p.exerciseId, p]));
  const setVolume = buildSetVolume(sets, 4, 8);
  const records = buildRecords(sets);
  const standardLifts = records
    .filter((r) => isStandardLift(r.exerciseName))
    .map((r) => ({ name: r.exerciseName, e1rm: r.bestE1RM }));
  const sessionCount = new Set(sets.map((s) => s.sessionId)).size;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Progress</h1>

      {/* History lives here, opens its own page. */}
      <Link
        href="/history"
        className="card group flex items-center gap-3 transition-colors hover:bg-surface-hover"
      >
        <IconBadge icon={History} color="violet" size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Workout history</p>
          <p className="truncate text-xs text-muted">{sessionCount} sessions, review or edit any of them</p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-faint transition-colors group-hover:text-foreground" />
      </Link>

      <StrengthStandards
        lifts={standardLifts}
        units={units}
        initialBodyweight={profile?.bodyweight ?? null}
        initialSex={profile?.sex ?? null}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="mb-1 flex items-center gap-2.5">
            <IconBadge icon={LineChart} color="cyan" size="sm" />
            <h2 className="font-semibold">Weekly sets by muscle group</h2>
            <span className="micro ml-auto">last 8 weeks</span>
          </div>
          <p className="mb-4 text-xs text-muted">
            Hard sets, the fair way to compare muscles. The honest measure of training stimulus.
          </p>
          <VolumeChart report={setVolume} unit="sets" />
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-1 flex items-center gap-2.5">
            <IconBadge icon={Target} color="green" size="sm" />
            <h2 className="font-semibold">Vs the growth target</h2>
          </div>
          <p className="mb-4 text-xs text-muted">
            About 10 to 20 hard sets per muscle each week is the range research favors.
          </p>
          <SetVolumePanel report={setVolume} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <IconBadge icon={Dumbbell} color="indigo" size="sm" />
          <h2 className="font-semibold">Estimated 1RM by lift</h2>
          <span className="micro ml-auto">8 weeks</span>
        </div>
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
                  <span className="readout text-2xl font-semibold">{t.currentE1RM}</span>
                  <span className="text-sm text-muted">{units} est. 1RM</span>
                </div>

                <ExerciseTrend weeks={t.weeks} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2.5">
          <IconBadge icon={Trophy} color="rose" size="sm" />
          <h2 className="font-semibold">Personal records</h2>
        </div>
        <RecordsTable records={records} units={units} />
      </div>
    </div>
  );
}
