// Week bucketing helpers. Weeks start on Monday and are keyed by the local
// date (YYYY-MM-DD) of that Monday, so sets are grouped into training weeks.
//
// NOTE: keys are formatted from LOCAL date components (not toISOString), so a
// local Monday 00:00 never gets shifted to the previous UTC day for athletes
// east of UTC. All bucketing stays internally consistent in one timezone.

/** Format a Date as a local YYYY-MM-DD string (no UTC shift). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local YYYY-MM-DD for today (matches how check-ins are keyed). */
export function todayKey(now: Date = new Date()): string {
  return localDateKey(now);
}

/** Returns the Monday (00:00 local) of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/** Stable week key, e.g. "2026-05-25". */
export function weekKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return localDateKey(startOfWeek(d));
}

/** Number of whole weeks between two week-start dates (b - a). */
export function weeksBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Returns an ordered list of week keys for the last `count` weeks ending with
 * the week containing `now` (oldest first).
 */
export function recentWeekKeys(count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  const thisMonday = startOfWeek(now);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() - i * 7);
    keys.push(localDateKey(d));
  }
  return keys;
}

/** Short human label for a week key, e.g. "May 25". */
export function weekLabel(key: string): string {
  return new Date(key + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
