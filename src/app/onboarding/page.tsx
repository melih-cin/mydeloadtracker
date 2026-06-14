import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { OnboardingForm } from "@/components/onboarding-form";

export const dynamic = "force-dynamic";

// The lifts we offer first — the ones we hold strength standards for (majors first).
const OFFERED = [
  "Barbell Back Squat",
  "Barbell Bench Press",
  "Conventional Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Front Squat",
  "Romanian Deadlift",
  "Incline Bench Press",
];

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase);
  const { data } = await supabase
    .from("exercises")
    .select("id, name, is_major")
    .in("name", OFFERED);

  const byName = new Map((data ?? []).map((e) => [e.name, e]));
  const exercises = OFFERED.map((n) => byName.get(n)).filter(
    (e): e is { id: string; name: string; is_major: boolean } => Boolean(e),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
          <Activity className="h-5 w-5" />
        </span>
        MyDeloadTracker
      </Link>

      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Let&apos;s set you up</h1>
        <p className="text-sm text-muted">
          ~60 seconds. We&apos;ll instantly rank your lifts and give you your first next-session
          target.
        </p>
      </div>

      <OnboardingForm
        exercises={exercises}
        // New users (no bodyweight set yet) default to lb to match the demo and the
        // US-heavy launch audience; returning users keep their saved unit.
        initialUnits={profile?.bodyweight != null ? profile.units : "lb"}
        initialBodyweight={profile?.bodyweight ?? null}
        initialSex={profile?.sex ?? null}
      />

      <Link href="/dashboard" className="mt-4 text-center text-sm text-muted hover:text-foreground">
        Skip for now
      </Link>
    </main>
  );
}
