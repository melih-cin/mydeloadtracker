// Apple Health webhook. An iOS Shortcut automation on the athlete's phone reads
// HealthKit each morning (HRV, resting HR) and POSTs it here with the per-user
// token generated in Settings. Because anything that syncs INTO Apple Health
// (Apple Watch, Whoop, Garmin, Fitbit) flows through HealthKit, this one
// endpoint covers all of them without any vendor API keys.
//
// The write goes through the ingest_health_metrics SECURITY DEFINER function
// (migration 0012), which validates the token and writes only that user's
// check-in for today.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Send a JSON body: {\"token\": \"...\", \"hrv\": 65, \"resting_hr\": 54}." },
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const hrv = num(body.hrv);
  const restingHr = num(body.resting_hr ?? body.restingHr ?? body.rhr);

  if (!token) {
    return NextResponse.json({ error: "Missing token. Generate one in Settings." }, { status: 400 });
  }
  if (hrv == null && restingHr == null) {
    return NextResponse.json(
      { error: "Nothing to save. Include hrv (ms) and/or resting_hr (bpm) as positive numbers." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("ingest_health_metrics", {
    p_token: token,
    p_hrv: hrv,
    p_resting_hr: restingHr,
  });

  if (error) {
    return NextResponse.json(
      { error: "Ingest failed. Is migration 0012 applied to the database?" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Unknown token. Regenerate it in Settings." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, saved: { hrv, resting_hr: restingHr } });
}
