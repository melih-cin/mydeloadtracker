-- 0012 - Apple Health ingestion via iOS Shortcut webhook.
--
-- An iOS Shortcut automation (running on the athlete's phone each morning)
-- reads HealthKit and POSTs HRV + resting HR to /api/wearables/apple with a
-- per-user secret token. That request arrives unauthenticated, so RLS would
-- block the write; this SECURITY DEFINER function is the narrow, safe door:
-- it validates the token against wearable_connections and writes only that
-- user's check-in for today. Idempotent; safe to paste more than once.

create or replace function public.ingest_health_metrics(
  p_token       text,
  p_hrv         numeric default null,
  p_resting_hr  numeric default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if p_token is null or length(p_token) < 20 then
    return false;
  end if;

  select user_id into v_user
    from public.wearable_connections
    where provider = 'apple_health' and access_token = p_token;
  if v_user is null then
    return false;
  end if;

  insert into public.daily_checkins (user_id, date, hrv, resting_hr)
    values (v_user, current_date, p_hrv, p_resting_hr)
  on conflict (user_id, date) do update set
    hrv        = coalesce(excluded.hrv, daily_checkins.hrv),
    resting_hr = coalesce(excluded.resting_hr, daily_checkins.resting_hr);

  -- Surface "last synced" in the settings UI.
  update public.wearable_connections
    set updated_at = now()
    where provider = 'apple_health' and user_id = v_user;

  return true;
end
$$;

revoke all on function public.ingest_health_metrics(text, numeric, numeric) from public;
grant execute on function public.ingest_health_metrics(text, numeric, numeric) to anon, authenticated;
