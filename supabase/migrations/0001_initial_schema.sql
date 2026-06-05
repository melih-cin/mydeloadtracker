-- MyDeloadTracker — initial schema
-- Tables: profiles, exercises, workout_sessions, workout_sets
-- All user data is protected with Row Level Security.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  -- preferred weight unit; estimated 1RM math is unit-agnostic
  units       text not null default 'kg' check (units in ('kg', 'lb')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- exercises: library of movements. Rows with user_id = null are global
-- defaults available to everyone; users may also add their own.
-- `is_major` marks the big compound lifts the deload algorithm watches.
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users (id) on delete cascade,
  name             text not null,
  muscle_group     text not null,
  movement_pattern text,
  is_major         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists exercises_user_id_idx on public.exercises (user_id);

-- ---------------------------------------------------------------------------
-- workout_sessions: a single training session
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  performed_at     timestamptz not null default now(),
  notes            text,
  duration_minutes integer,
  created_at       timestamptz not null default now()
);

create index if not exists workout_sessions_user_id_idx
  on public.workout_sessions (user_id, performed_at desc);

-- ---------------------------------------------------------------------------
-- workout_sets: individual sets logged within a session
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sets (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  user_id     uuid not null references auth.users (id) on delete cascade,
  set_number  integer not null default 1,
  reps        integer not null check (reps >= 0),
  weight      numeric(7, 2) not null check (weight >= 0),
  rpe         numeric(3, 1) check (rpe is null or (rpe >= 1 and rpe <= 10)),
  created_at  timestamptz not null default now()
);

create index if not exists workout_sets_session_idx on public.workout_sets (session_id);
create index if not exists workout_sets_user_exercise_idx
  on public.workout_sets (user_id, exercise_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.exercises        enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets     enable row level security;

-- profiles: a user sees and edits only their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- exercises: global rows (user_id is null) are readable by everyone;
-- a user manages their own custom rows
create policy "exercises_select" on public.exercises
  for select using (user_id is null or auth.uid() = user_id);
create policy "exercises_insert_own" on public.exercises
  for insert with check (auth.uid() = user_id);
create policy "exercises_update_own" on public.exercises
  for update using (auth.uid() = user_id);
create policy "exercises_delete_own" on public.exercises
  for delete using (auth.uid() = user_id);

-- workout_sessions: owner-only access
create policy "sessions_select_own" on public.workout_sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.workout_sessions
  for update using (auth.uid() = user_id);
create policy "sessions_delete_own" on public.workout_sessions
  for delete using (auth.uid() = user_id);

-- workout_sets: owner-only access
create policy "sets_select_own" on public.workout_sets
  for select using (auth.uid() = user_id);
create policy "sets_insert_own" on public.workout_sets
  for insert with check (auth.uid() = user_id);
create policy "sets_update_own" on public.workout_sets
  for update using (auth.uid() = user_id);
create policy "sets_delete_own" on public.workout_sets
  for delete using (auth.uid() = user_id);
