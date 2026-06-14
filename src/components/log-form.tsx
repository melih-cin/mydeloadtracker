"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Search, Trash2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/track";
import { estimate1RM } from "@/lib/analytics/epley";
import { RestTimer } from "@/components/rest-timer";
import type { Exercise, Units } from "@/lib/types";

interface SetEntry {
  reps: string;
  weight: string;
  rpe: string;
}

interface ExerciseEntry {
  key: string;
  exerciseId: string;
  sets: SetEntry[];
}

function emptySet(): SetEntry {
  return { reps: "", weight: "", rpe: "" };
}

export interface InitialEntry {
  exerciseId: string;
  sets: { reps: number; weight: number; rpe: number | null }[];
}

export function LogForm({
  exercises,
  units,
  sessionId,
  initialDate,
  initialNotes,
  initialEntries,
}: {
  exercises: Exercise[];
  units: Units;
  sessionId?: string;
  initialDate?: string;
  initialNotes?: string;
  initialEntries?: InitialEntry[];
}) {
  const router = useRouter();
  const isEdit = Boolean(sessionId);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [date, setDate] = useState(initialDate ?? today);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [entries, setEntries] = useState<ExerciseEntry[]>(() =>
    (initialEntries ?? []).map((e, i) => ({
      key: `${e.exerciseId}-init-${i}`,
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => ({
        reps: String(s.reps),
        weight: String(s.weight),
        rpe: s.rpe == null ? "" : String(s.rpe),
      })),
    })),
  );
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [prs, setPrs] = useState<string[]>([]);

  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  // Filter the library by the search query (name / muscle / equipment).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscle_group.toLowerCase().includes(q) ||
        (ex.equipment ?? "").toLowerCase().includes(q),
    );
  }, [exercises, query]);

  // Group the filtered results by muscle, tracking each item's flat index so the
  // keyboard highlight maps cleanly across group headers.
  const groups = useMemo(() => {
    const g: { muscle: string; items: { ex: Exercise; flatIndex: number }[] }[] = [];
    filtered.forEach((ex, i) => {
      const last = g[g.length - 1];
      if (!last || last.muscle !== ex.muscle_group) g.push({ muscle: ex.muscle_group, items: [] });
      g[g.length - 1].items.push({ ex, flatIndex: i });
    });
    return g;
  }, [filtered]);

  function addExerciseById(id: string) {
    setEntries((prev) => [
      ...prev,
      { key: `${id}-${Date.now()}`, exerciseId: id, sets: [emptySet()] },
    ]);
  }

  function removeExercise(key: string) {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  }

  function addSet(key: string) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.key !== key) return e;
        const last = e.sets[e.sets.length - 1] ?? emptySet();
        // Pre-fill from the previous set to speed up entry.
        return { ...e, sets: [...e.sets, { ...last }] };
      }),
    );
  }

  function removeSet(key: string, idx: number) {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e,
      ),
    );
  }

  function updateSet(key: string, idx: number, field: keyof SetEntry, value: string) {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key
          ? {
              ...e,
              sets: e.sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
            }
          : e,
      ),
    );
  }

  async function save() {
    setError(null);

    const rows = entries.flatMap((entry) =>
      entry.sets
        .filter((s) => s.reps !== "" && s.weight !== "")
        .map((s, i) => ({
          exercise_id: entry.exerciseId,
          set_number: i + 1,
          reps: Number(s.reps),
          weight: Number(s.weight),
          rpe: s.rpe === "" ? null : Number(s.rpe),
        })),
    );

    if (rows.length === 0) {
      setError("Add at least one set with reps and weight.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not signed in.");

      const performedAt = new Date(`${date}T12:00:00`).toISOString();
      let targetSessionId = sessionId;

      if (isEdit && sessionId) {
        // Update the session, then replace all its sets.
        const { error: uErr } = await supabase
          .from("workout_sessions")
          .update({ performed_at: performedAt, notes: notes || null })
          .eq("id", sessionId);
        if (uErr) throw new Error(uErr.message);

        const { error: delErr } = await supabase
          .from("workout_sets")
          .delete()
          .eq("session_id", sessionId);
        if (delErr) throw new Error(delErr.message);
      } else {
        const { data: session, error: sErr } = await supabase
          .from("workout_sessions")
          .insert({ user_id: user.id, performed_at: performedAt, notes: notes || null })
          .select("id")
          .single();
        if (sErr || !session) throw new Error(sErr?.message ?? "Could not create session.");
        targetSessionId = session.id;
      }

      const { error: setErr } = await supabase
        .from("workout_sets")
        .insert(rows.map((r) => ({ ...r, session_id: targetSessionId, user_id: user.id })));
      if (setErr) throw new Error(setErr.message);

      // PR detection (new sessions only): did a lift beat the athlete's prior best e1RM?
      let prNames: string[] = [];
      if (!isEdit) {
        const newBest = new Map<string, number>();
        for (const r of rows) {
          const e = estimate1RM(r.weight, r.reps);
          if (e > (newBest.get(r.exercise_id) ?? 0)) newBest.set(r.exercise_id, e);
        }
        const { data: prior } = await supabase
          .from("workout_sets")
          .select("exercise_id, reps, weight")
          .eq("user_id", user.id)
          .in("exercise_id", [...newBest.keys()])
          .neq("session_id", targetSessionId);
        const priorBest = new Map<string, number>();
        for (const p of prior ?? []) {
          const e = estimate1RM(Number(p.weight), p.reps);
          if (e > (priorBest.get(p.exercise_id) ?? 0)) priorBest.set(p.exercise_id, e);
        }
        for (const [exId, best] of newBest) {
          const prev = priorBest.get(exId);
          if (prev != null && best > prev + 0.01) prNames.push(exerciseById.get(exId)?.name ?? "a lift");
        }
        setPrs(prNames);
      }

      capture("workout_logged", {
        sets: rows.length,
        exercises: entries.length,
        edit: isEdit,
        prs: prNames.length,
      });
      setSaved(true);
      setTimeout(() => router.push(isEdit ? "/history" : "/dashboard"), prNames.length ? 2000 : 700);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <RestTimer />

      <div className="card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Session date</label>
            <input
              type="date"
              className="input"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Felt strong, bumped squat…"
            />
          </div>
        </div>
      </div>

      {entries.map((entry) => {
        const ex = exerciseById.get(entry.exerciseId);
        return (
          <div key={entry.key} className="card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{ex?.name}</h3>
                <p className="text-xs text-muted">
                  {ex?.muscle_group}
                  {ex?.equipment && ` · ${ex.equipment}`}
                  {ex?.is_major && " · major lift"}
                </p>
              </div>
              <button
                onClick={() => removeExercise(entry.key)}
                className="text-muted hover:text-danger"
                aria-label="Remove exercise"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2 text-xs uppercase tracking-wide text-muted">
                <span>Set</span>
                <span>Reps</span>
                <span>Weight ({units})</span>
                <span>RPE</span>
                <span />
              </div>
              {entry.sets.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2"
                >
                  <span className="text-sm tabular-nums text-muted">{i + 1}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input"
                    placeholder="5"
                    value={s.reps}
                    onChange={(e) => updateSet(entry.key, i, "reps", e.target.value)}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    className="input"
                    placeholder="100"
                    value={s.weight}
                    onChange={(e) => updateSet(entry.key, i, "weight", e.target.value)}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="1"
                    max="10"
                    className="input"
                    placeholder="8"
                    value={s.rpe}
                    onChange={(e) => updateSet(entry.key, i, "rpe", e.target.value)}
                  />
                  <button
                    onClick={() => removeSet(entry.key, i)}
                    className="grid h-8 w-8 place-items-center text-muted hover:text-danger"
                    aria-label="Remove set"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => addSet(entry.key)} className="btn-ghost mt-3 text-sm">
              <Plus className="h-4 w-4" /> Add set
            </button>
          </div>
        );
      })}

      <div className="card">
        <label className="label">Add an exercise</label>
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              placeholder={`Search ${exercises.length} exercises by name, muscle, or equipment…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
                setPickerOpen(true);
              }}
              onFocus={() => setPickerOpen(true)}
              onBlur={() => setTimeout(() => setPickerOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setPickerOpen(true);
                  setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const ex = filtered[highlight];
                  if (ex) {
                    addExerciseById(ex.id);
                    setQuery("");
                    setHighlight(0);
                  }
                } else if (e.key === "Escape") {
                  setPickerOpen(false);
                }
              }}
            />
          </div>

          {pickerOpen && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface shadow-lg scroll-thin">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted">No exercises match “{query}”.</p>
              ) : (
                groups.map((group) => (
                  <div key={group.muscle}>
                    <div className="sticky top-0 bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {group.muscle}
                    </div>
                    {group.items.map(({ ex, flatIndex }) => (
                      <button
                        key={ex.id}
                        type="button"
                        // onMouseDown (not onClick) so the input doesn't blur and
                        // close the panel before the add registers — lets you add
                        // several exercises from one search.
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addExerciseById(ex.id);
                          setQuery("");
                          setHighlight(0);
                        }}
                        onMouseEnter={() => setHighlight(flatIndex)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          flatIndex === highlight ? "bg-surface-hover" : ""
                        }`}
                      >
                        <span>
                          {ex.is_major && <span className="text-brand">★ </span>}
                          {ex.name}
                        </span>
                        {ex.equipment && (
                          <span className="flex-shrink-0 text-xs text-muted">{ex.equipment}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          {entries.length === 0
            ? "Search and click an exercise to start building your session."
            : "Add another exercise, or save below."}
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {saved &&
          (prs.length > 0 ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-warning">
              <Trophy className="h-4 w-4" /> New PR: {prs.join(", ")}! 🎉
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <Check className="h-4 w-4" /> Saved!
            </span>
          ))}
        <button
          onClick={save}
          disabled={saving || saved || entries.length === 0}
          className="btn-brand px-6 py-2.5"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Save workout"}
        </button>
      </div>
    </div>
  );
}
