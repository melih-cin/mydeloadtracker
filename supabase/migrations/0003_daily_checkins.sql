-- Daily subjective wellness check-ins. These are the highest-value labels to
-- start collecting for a future ML readiness model (sleep, soreness, motivation,
-- energy correlate strongly with under-recovery / overreaching).
--
-- Scale is 1-5 for every metric. For sleep/motivation/energy, higher = better.
-- For soreness, higher = worse. One row per user per day (upserted).

create table if not exists public.daily_checkins (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null default current_date,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  soreness      smallint check (soreness between 1 and 5),
  motivation    smallint check (motivation between 1 and 5),
  energy        smallint check (energy between 1 and 5),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, date desc);

drop trigger if exists daily_checkins_set_updated_at on public.daily_checkins;
create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();

alter table public.daily_checkins enable row level security;

-- drop-if-exists guards make this migration safe to re-run (idempotent).
drop policy if exists "checkins_select_own" on public.daily_checkins;
drop policy if exists "checkins_insert_own" on public.daily_checkins;
drop policy if exists "checkins_update_own" on public.daily_checkins;
drop policy if exists "checkins_delete_own" on public.daily_checkins;

create policy "checkins_select_own" on public.daily_checkins
  for select using (auth.uid() = user_id);
create policy "checkins_insert_own" on public.daily_checkins
  for insert with check (auth.uid() = user_id);
create policy "checkins_update_own" on public.daily_checkins
  for update using (auth.uid() = user_id);
create policy "checkins_delete_own" on public.daily_checkins
  for delete using (auth.uid() = user_id);
