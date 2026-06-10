-- In-app feedback: every early-user complaint is YC application material.
-- Authenticated users insert; reading is via the Supabase dashboard (service role).
-- Idempotent + guarded so it's safe to paste more than once.

create table if not exists public.feedback (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users (id) on delete set null,
  message    text not null,
  path       text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (auth.uid() = user_id);
