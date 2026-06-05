import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Brain, LineChart, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: Activity,
    title: "Log every set",
    body: "Capture exercise, sets, reps, weight, and RPE in seconds. Each session is timestamped.",
  },
  {
    icon: LineChart,
    title: "Progressive overload",
    body: "Estimated 1RM (Epley) normalizes every rep range so you see real progress, plateaus, and regressions.",
  },
  {
    icon: TriangleAlert,
    title: "Deload detection",
    body: "A 3-signal algorithm flags exactly when — and why — it's time to back off and recover.",
  },
  {
    icon: Brain,
    title: "AI coach",
    body: "Chat with a coach that knows your last 8 weeks of numbers and proactively surfaces weak points.",
  },
];

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
            <Activity className="h-5 w-5" />
          </span>
          MyDeloadTracker
        </div>
        <Link href="/login" className="btn-ghost">
          Sign in
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Train hard. Recover smart.
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-6xl">
          Know exactly when to{" "}
          <span className="text-brand">push</span> and when to{" "}
          <span className="text-warning">deload</span>.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-muted">
          MyDeloadTracker turns your logged sets into estimated-1RM trends, catches stalls
          before they cost you gains, and gives you an AI coach that reasons from your real
          numbers.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login" className="btn-brand px-6 py-2.5">
            Get started — it&apos;s free
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-2.5">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <f.icon className="mb-3 h-6 w-6 text-brand" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
