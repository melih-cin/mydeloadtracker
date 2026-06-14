"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, ScanLine, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/track";
import type { Exercise, Units } from "@/lib/types";

interface Reading {
  detected: boolean;
  exercise?: string;
  equipment?: string;
  total_weight_kg?: number | null;
  per_side_plates_kg?: number[];
  reps?: number | null;
  confidence: "high" | "medium" | "low";
  note: string;
}

const LB = 2.20462;
const round5 = (n: number) => Math.round(n / 5) * 5;

/** Downscale + JPEG-compress a captured photo so the upload is small + fast. */
function fileToDataUrl(file: File, maxDim = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

const CONF: Record<string, string> = {
  high: "text-success",
  medium: "text-warning",
  low: "text-danger",
};

export function BarScanner({ exercises, units }: { exercises: Exercise[]; units: Units }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);

  // editable log fields, pre-filled from the reading
  const [exerciseId, setExerciseId] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("5");
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  function matchExercise(name: string | undefined): string {
    if (!name) return "";
    const n = name.toLowerCase();
    const exact = exercises.find((e) => e.name.toLowerCase() === n);
    if (exact) return exact.id;
    const partial = exercises.find((e) => e.name.toLowerCase().includes(n) || n.includes(e.name.toLowerCase()));
    return partial?.id ?? "";
  }

  async function onPhoto(file: File) {
    setError(null);
    setReading(null);
    setLogged(false);
    let dataUrl: string;
    try {
      dataUrl = await fileToDataUrl(file);
    } catch {
      setError("Couldn't read that photo. Try again.");
      return;
    }
    setPreview(dataUrl);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Scan failed.");
      const r = json.reading as Reading;
      setReading(r);
      capture("bar_scanned", { detected: r.detected, confidence: r.confidence, equipment: r.equipment });
      if (r.detected) {
        setExerciseId(matchExercise(r.exercise));
        const kg = r.total_weight_kg ?? 0;
        setWeight(kg > 0 ? String(units === "lb" ? round5(kg * LB) : kg) : "");
        setReps(r.reps && r.reps > 0 ? String(r.reps) : "5");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function logSet() {
    if (!exerciseId || !(Number(weight) > 0) || !(Number(reps) > 0)) {
      setError("Pick the exercise and enter weight × reps.");
      return;
    }
    setLogging(true);
    setError(null);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You're not signed in.");
      const { data: session, error: sErr } = await supabase
        .from("workout_sessions")
        .insert({ user_id: user.id, performed_at: new Date().toISOString(), notes: "Scanned" })
        .select("id")
        .single();
      if (sErr || !session) throw new Error(sErr?.message ?? "Could not log.");
      const { error: setErr } = await supabase.from("workout_sets").insert({
        session_id: session.id,
        exercise_id: exerciseId,
        user_id: user.id,
        set_number: 1,
        reps: Number(reps),
        weight: Number(weight),
        rpe: null,
      });
      if (setErr) throw new Error(setErr.message);
      capture("workout_logged", { sets: 1, exercises: 1, edit: false, source: "scan" });
      setLogged(true);
      setTimeout(() => router.push("/dashboard"), 1200);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log.");
      setLogging(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(f);
          e.target.value = "";
        }}
      />

      {/* Capture button / preview */}
      <button
        onClick={() => fileRef.current?.click()}
        className="card flex w-full flex-col items-center gap-2 border-dashed py-10 text-center transition-colors hover:bg-surface-hover"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your setup" className="max-h-56 rounded-xl object-contain" />
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand">
              <Camera className="h-6 w-6" />
            </span>
            <span className="font-medium">Point your camera at the loaded bar</span>
            <span className="text-xs text-muted">Tap to take a photo — we&apos;ll read the weight</span>
          </>
        )}
      </button>
      {preview && (
        <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full">
          <Camera className="h-4 w-4" /> Retake
        </button>
      )}

      {analyzing && (
        <div className="card flex items-center gap-3 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <span className="flex items-center gap-1.5">
            <ScanLine className="h-4 w-4 text-brand" /> Reading the plates…
          </span>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {reading && !analyzing && (
        <div className="card space-y-4">
          {reading.detected ? (
            <>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <div>
                  <p className="font-medium">{reading.note}</p>
                  <p className={`text-xs ${CONF[reading.confidence]}`}>
                    {reading.confidence} confidence — check it before logging
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <div>
                  <label className="label">Exercise</label>
                  <select className="input" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                    <option value="">Pick exercise…</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Weight ({units})</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input w-24"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Reps</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input w-20"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                  />
                </div>
              </div>

              {logged ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <Check className="h-4 w-4" /> Logged! Taking you to your dashboard…
                </p>
              ) : (
                <button onClick={logSet} disabled={logging} className="btn-brand w-full">
                  {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Log this set
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              {reading.note || "Couldn't spot a loaded bar — try a clearer shot of the plates."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
