import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarCheck,
  Dumbbell,
  LineChart,
  ScanLine,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCheckins, getProfile, getTrainingSets } from "@/lib/data";
import { todayKey, localDateKey } from "@/lib/analytics/dates";
import { detectDeload } from "@/lib/analytics/deload";
import { computeReadiness } from "@/lib/analytics/readiness";
import { buildSetVolume } from "@/lib/analytics/setVolume";
import { buildRecords } from "@/lib/analytics/records";
import { buildProgressReport } from "@/lib/analytics/progress";
import { buildNextSessions } from "@/lib/analytics/progression";
import { isStandardLift } from "@/lib/analytics/standards";
import { buildTodaysCall, buildActivity } from "@/lib/ui";
import { TodaysCall } from "@/components/todays-call";
import { ActivityStrip } from "@/components/activity-strip";
import { DeloadAlert } from "@/components/deload-alert";
import { ReadinessGauge } from "@/components/readiness-gauge";
import { VolumeChart } from "@/components/volume-chart";
import { SetVolumePanel } from "@/components/set-volume";
import { StrengthStandards } from "@/components/strength-standards";
import { NextSessionCard } from "@/components/next-session";
import { RecordsTable } from "@/components/records-table";
import { CheckinCard } from "@/components/checkin-card";
import { SeedButton } from "@/components/seed-button";
import { IconBadge, type BadgeColor } from "@/components/icon-badge";
import { TrackOnMount } from "@/components/analytics";

const EXPLORE: { href: string; label: string; sub: string; icon: typeof Brain; color: BadgeColor }[] = [
  { href: "/log", label: "Log a workout", sub: "Sets, reps, RPE", icon: Dumbbell, color: "blue" },
  { href: "/scan", label: "Scan the bar", sub: "Read the weight", icon: ScanLine, color: "violet" },
  { href: "/coach", label: "Ask the coach", sub: "Your real numbers", icon: Brain, color: "indigo" },
  { href: "/progress", label: "See progress", sub: "Trends and PRs", icon: LineChart, color: "green" },
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const profile = await getProfile(supabase);
  const units = profile?.units ?? "kg";
  const [sets, checkins] = await Promise.all([
    getTrainingSets(supabase, units, 8),
    getCheckins(supabase, 30),
  ]);
  const todayStr = todayKey();
  const todayCheckin = checkins.find((c) => c.date === todayStr) ?? null;

  if (sets.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="panel max-w-md text-center">
          <div className="mx-auto mb-4 w-fit">
            <IconBadge icon={Dumbbell} color="blue" size="lg" />
          </div>
          <h1 className="text-xl font-semibold">Let&apos;s get your first reading</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Tell us your main lifts and your numbers. In about a minute you&apos;ll have a strength
            rank, a readiness score, and your first next-session target.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href="/onboarding" className="btn-brand w-full sm:w-auto sm:px-8">
              Set up in 60 seconds
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted">
              <SeedButton />
              <span aria-hidden>·</span>
              <Link href="/log" className="underline-offset-2 hover:text-foreground hover:underline">
                or log a workout manually
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const opts = { bodyweight: profile?.bodyweight ?? null, sex: profile?.sex ?? null };
  const deload = detectDeload(sets);
  const readiness = computeReadiness(sets, checkins, new Date(), opts);
  const call = buildTodaysCall(readiness, deload);

  // Honest readiness trend for the pulse: re-score the model as-of each of the
  // last 8 weekly points, feeding it ONLY the data that existed by that date so
  // it never leaks future sets. Uses the existing pure function, unchanged.
  const now = new Date();
  const readinessTrend: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const asOf = new Date(now);
    asOf.setDate(asOf.getDate() - i * 7);
    const asOfIso = asOf.toISOString();
    const sUpTo = sets.filter((s) => s.date <= asOfIso);
    if (sUpTo.length === 0) continue;
    const cUpTo = checkins.filter((c) => c.date <= localDateKey(asOf));
    readinessTrend.push(computeReadiness(sUpTo, cUpTo, asOf, opts).score);
  }
  if (readinessTrend.length === 0) readinessTrend.push(readiness.score);

  const trainedKeys = new Set(sets.map((s) => localDateKey(new Date(s.date))));
  const activity = buildActivity(trainedKeys, now);

  const setVolume = buildSetVolume(sets, 4, 8);
  const records = buildRecords(sets);
  const progress = buildProgressReport(sets, 4);
  const nextSessions = buildNextSessions(sets, { units, deload: deload.recommended });
  const standardLifts = records
    .filter((r) => isStandardLift(r.exerciseName))
    .map((r) => ({ name: r.exerciseName, e1rm: r.bestE1RM }));

  const sessions = new Set(sets.map((s) => s.sessionId)).size;
  const progressing = progress.filter((p) => p.status === "progressing").length;
  const stalls = progress.filter(
    (p) => p.status === "plateauing" || p.status === "regressing",
  ).length;

  const stats: { label: string; value: string; icon: typeof Trophy; color: BadgeColor }[] = [
    { label: "Sessions, 8 wk", value: String(sessions), icon: CalendarCheck, color: "blue" },
    { label: "Lifts progressing", value: String(progressing), icon: TrendingUp, color: "green" },
    { label: "Stalled lifts", value: String(stalls), icon: TrendingDown, color: "amber" },
    { label: "Personal records", value: String(records.length), icon: Trophy, color: "rose" },
  ];

  const primary = call.state === "back-off"
    ? { href: "/coach", label: "Plan my deload week" }
    : { href: "/log", label: "Log today's session" };

  return (
    <div className="space-y-5">
      <TrackOnMount event="next_session_viewed" />
      {deload.recommended && <TrackOnMount event="deload_alert_shown" />}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {profile?.full_name ? `${profile.full_name.split(" ")[0]}, here` : "Here"} is your read for today.
        </p>
        <div className="flex gap-2 max-sm:hidden">
          <Link href="/scan" className="btn-ghost">
            <ScanLine className="h-4 w-4" />
            Scan the bar
          </Link>
          <Link href="/log" className="btn-accent">
            <Dumbbell className="h-4 w-4" />
            Log workout
          </Link>
        </div>
      </div>

      <TodaysCall
        score={readiness.score}
        verdict={call.verdict}
        headline={call.headline}
        detail={call.detail}
        tone={call.tone}
        trend={readinessTrend}
        primaryHref={primary.href}
        primaryLabel={primary.label}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <DeloadAlert report={deload} />
        <ReadinessGauge report={readiness} />
      </div>

      <ActivityStrip activity={activity} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center justify-between gap-2">
              <span className="micro">{s.label}</span>
              <IconBadge icon={s.icon} color={s.color} size="sm" />
            </div>
            <div className="readout mt-3 text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 px-1 font-semibold">Explore</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {EXPLORE.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="card group transition-colors hover:bg-surface-hover"
            >
              <IconBadge icon={e.icon} color={e.color} size="lg" />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-semibold">{e.label}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <p className="text-xs text-muted">{e.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="card">
        <div className="mb-1 flex items-center gap-2.5">
          <IconBadge icon={TrendingUp} color="blue" size="sm" />
          <h2 className="font-semibold">Your next session</h2>
          <span className="micro ml-auto">auto-progression</span>
        </div>
        <p className="mb-4 text-xs text-muted">
          Targets from your last numbers and RPE. {deload.recommended ? "Deload week, so everything backs off." : "Earn load when it feels easy, hold and chase reps when it feels hard."}
        </p>
        <NextSessionCard sessions={nextSessions} units={units} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="mb-1 flex items-center gap-2.5">
            <IconBadge icon={LineChart} color="cyan" size="sm" />
            <h2 className="font-semibold">Weekly sets by muscle group</h2>
            <span className="micro ml-auto">last 8 weeks</span>
          </div>
          <p className="mb-4 text-xs text-muted">
            Hard sets, the fair way to compare muscles. 10 back sets count like 10 biceps sets in
            stimulus, even though back moves far heavier loads.
          </p>
          <VolumeChart report={setVolume} unit="sets" />
        </div>

        <div className="lg:col-span-2">
          <CheckinCard today={todayCheckin} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="mb-1 flex items-center gap-2.5">
            <IconBadge icon={Target} color="green" size="sm" />
            <h2 className="font-semibold">Muscles vs the growth target</h2>
            <span className="micro ml-auto">avg, last 4 weeks</span>
          </div>
          <p className="mb-4 text-xs text-muted">
            Research favors about 10 to 20 hard sets per muscle each week. The shaded band marks that
            range, so you can see at a glance which muscles are under or over trained.
          </p>
          <SetVolumePanel report={setVolume} />
        </div>

        <div className="lg:col-span-2">
          <StrengthStandards
            lifts={standardLifts}
            units={units}
            initialBodyweight={profile?.bodyweight ?? null}
            initialSex={profile?.sex ?? null}
          />
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2.5">
          <IconBadge icon={Trophy} color="rose" size="sm" />
          <h2 className="font-semibold">Personal records</h2>
          <Link href="/progress" className="ml-auto text-xs font-medium text-brand hover:underline">
            View progress
          </Link>
        </div>
        <RecordsTable records={records} units={units} />
      </div>
    </div>
  );
}
