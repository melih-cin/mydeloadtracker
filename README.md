# MyDeloadTracker

An AI fitness coaching web app focused on **progressive overload tracking** and
**deload recommendations**. Log your training, see estimated-1RM trends per lift,
get a data-driven deload alert when fatigue stacks up, and chat with an AI coach
that reasons from your actual numbers.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Supabase** (Postgres + Auth), and the **Anthropic Claude API**.

## Features

- **Workout logging** — exercises with sets, reps, weight, and RPE (1–10); each session timestamped.
- **Progressive overload tracking** — per-exercise status (progressing / plateauing / regressing) over the last 4 weeks, normalized across rep ranges via estimated 1RM (Epley: `weight × (1 + reps/30)`).
- **Deload detection** — flags a deload when 2+ of these fire:
  - (a) volume or e1RM hasn't increased in 3+ consecutive weeks for 2+ major lifts,
  - (b) average RPE for a lift rose 1.5+ points with no working-weight increase,
  - (c) session frequency dropped in the last 2 weeks vs the prior 4-week average.
- **Training readiness score (0–100)** — a research-graded fatigue model (`readiness.ts`) layered on top of the binary trigger, combining e1RM regression, stalls, RPE creep, subjective wellness, frequency, acute:chronic workload ratio, and time-under-load via a noisy-OR. Each factor is tap-to-explain. See `docs/DELOAD_SCIENCE.md`.
- **Strength standards** — each main lift is banded **Beginner → Elite** from its bodyweight-relative estimated 1RM (per sex), in the spirit of [StrengthLevel](https://strengthlevel.com), with a progress bar to the next band. Your overall level **right-sizes deload cadence**: novices get a long runway between deloads, advanced/elite lifters a short one (`standards.ts`).
- **Daily check-ins** — log sleep, soreness, motivation, and energy (1–5); these feed the readiness score and the coach, and are the first labels for a future ML model.
- **AI coach** — chat panel with your last 8 weeks of training + readiness + strength level + check-ins serialized into the system prompt (cached), so it cites real lifts, weeks, and numbers and matches advice to your experience level.
- **Two volume views** — *volume load* (tonnage, Σ weight × reps) for total work, **and weekly hard sets per muscle group** graded against the research-backed ~10–20 set hypertrophy range (`setVolume.ts`). Sets count as "hard" unless logged below RPE 7, toward the exercise's primary muscle.
- **Dashboard** — both volume views, a personal-records table, the readiness gauge, a check-in card, and a prominent deload alert card explaining exactly why.
- **Exercise library** — 200+ movements across 14 muscle groups (barbell, dumbbell, machine, cable, bodyweight, Olympic, strongman, carries) with a **searchable, keyboard-navigable picker** in the logger.
- **Workout history** — review past sessions, edit them, or delete them.
- **Settings** — name and kg/lb unit preference; bodyweight + sex (set on the Progress page) power the strength standards.

## Project layout

```
supabase/migrations/    SQL schema + seed (run these against your DB, in order)
src/lib/analytics/      epley, progress, deload, readiness, standards, volume, setVolume, records, context (pure logic)
src/lib/supabase/       browser + server + middleware clients (@supabase/ssr)
src/lib/data.ts         fetch + map training data into the analytics shape
src/app/                App Router pages (landing, login, dashboard, log, progress, coach)
src/app/api/coach/      streaming Anthropic endpoint
src/app/api/seed/       inserts 8 weeks of demo data for the signed-in user
src/components/         UI: nav, charts, deload alert, log form, chat, etc.
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** and apply the schema. Either paste the files in
   `supabase/migrations/` into the Supabase SQL editor (in order), or use the CLI:

   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```

   In **Authentication → Providers → Email**, disabling "Confirm email" makes
   local sign-up instant (optional).

3. **Configure environment** — copy the example and fill in your keys:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ANTHROPIC_API_KEY=...
   ANTHROPIC_MODEL=claude-sonnet-4-6   # optional
   ```

4. **Run it**

   ```bash
   npm run dev
   ```

   Sign up, then click **"Load 8 weeks of demo data"** on the dashboard to see the
   deload algorithm, charts, and AI coach in action immediately.

## How the deload alert is wired

`src/lib/analytics/deload.ts` is the single source of truth. It runs the three
signal checks over a 6-week window and returns `{ recommended, signals, reasons }`.
The dashboard renders that into the alert card, and `context.ts` folds the same
report into the coach's system prompt so the AI's advice matches the UI.
