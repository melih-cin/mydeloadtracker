-- 0010 — Canonical kilogram storage.
--
-- The app now stores every weight in kilograms and converts to the athlete's
-- chosen unit (kg or lb) for display. Existing rows were stored in whatever unit
-- the athlete had selected, so this migration converts the pound-based ones to
-- kilograms exactly once.
--
-- It is guarded by a bookkeeping table, so pasting it more than once is safe:
-- the conversion runs only on the first apply.

create table if not exists public._migrations (
  name       text primary key,
  applied_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from public._migrations where name = '0010_canonical_kg') then

    -- Pound users: convert logged set weights to kilograms.
    update public.workout_sets ws
    set weight = round((ws.weight / 2.2046226218)::numeric, 4)
    from public.profiles p
    where ws.user_id = p.id
      and p.units = 'lb';

    -- Pound users: convert stored bodyweight to kilograms.
    update public.profiles
    set bodyweight = round((bodyweight / 2.2046226218)::numeric, 4)
    where units = 'lb'
      and bodyweight is not null;

    insert into public._migrations (name) values ('0010_canonical_kg');
  end if;
end $$;
