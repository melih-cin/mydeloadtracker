"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, HeartPulse, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IconBadge } from "@/components/icon-badge";

/**
 * Apple Health sync via an iOS Shortcut automation. The athlete generates a
 * secret link token here, builds a two-minute Shortcut on their phone, and
 * their HRV + resting HR arrive every morning. Works for Apple Watch and for
 * anything that syncs into Apple Health (Whoop, Garmin, Fitbit), with no
 * vendor APIs involved.
 */
export function AppleHealthCard({
  connected,
  lastSync,
}: {
  connected: boolean;
  lastSync: string | null;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function loadOrCreateToken(regenerate: boolean) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      if (!regenerate && connected) {
        const { data } = await supabase
          .from("wearable_connections")
          .select("access_token")
          .eq("provider", "apple_health")
          .maybeSingle();
        if (data?.access_token) {
          setToken(data.access_token);
          setOpen(true);
          return;
        }
      }

      const fresh = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
      const { error: upErr } = await supabase
        .from("wearable_connections")
        .upsert(
          { user_id: user.id, provider: "apple_health", access_token: fresh },
          { onConflict: "user_id,provider" },
        );
      if (upErr) throw new Error(upErr.message);
      setToken(fresh);
      setOpen(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up the link.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable; the text is visible to copy by hand */
    }
  }

  const url = typeof window !== "undefined" ? `${window.location.origin}/api/wearables/apple` : "/api/wearables/apple";
  const bodyTemplate = token
    ? `{"token":"${token}","hrv":HRV_MS,"resting_hr":BPM}`
    : "";

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <IconBadge icon={HeartPulse} color="red" size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Apple Health</h2>
          <p className="truncate text-xs text-muted">
            {connected
              ? `Connected${lastSync ? `, last sync ${new Date(lastSync).toLocaleDateString()}` : ""}`
              : "Apple Watch, Whoop, Garmin, or Fitbit via a morning iOS Shortcut"}
          </p>
        </div>
        <button
          onClick={() => (open ? setOpen(false) : loadOrCreateToken(false))}
          className="btn-ghost flex-shrink-0"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {connected ? "Details" : "Set up"}
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {open && token && (
        <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm">
          <div>
            <span className="micro">1 · Webhook URL</span>
            <button
              onClick={() => copy(url, "url")}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl bg-background/70 px-3 py-2 text-left font-mono text-xs"
            >
              <span className="truncate">{url}</span>
              {copied === "url" ? <Check className="h-4 w-4 flex-shrink-0 text-success" /> : <Copy className="h-4 w-4 flex-shrink-0 text-muted" />}
            </button>
          </div>

          <div>
            <span className="micro">2 · Request body (JSON)</span>
            <button
              onClick={() => copy(bodyTemplate, "body")}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl bg-background/70 px-3 py-2 text-left font-mono text-[11px]"
            >
              <span className="truncate">{bodyTemplate}</span>
              {copied === "body" ? <Check className="h-4 w-4 flex-shrink-0 text-success" /> : <Copy className="h-4 w-4 flex-shrink-0 text-muted" />}
            </button>
            <p className="mt-1 text-[11px] text-muted">
              Replace HRV_MS and BPM with the Health values inside the Shortcut.
            </p>
          </div>

          <div>
            <span className="micro">3 · Build the Shortcut (once, ~2 min)</span>
            <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted">
              <li>Shortcuts app, Automation tab, New, Time of Day (pick a morning time), Run Immediately.</li>
              <li>Add action <span className="text-foreground">Find Health Samples</span>: type Heart Rate Variability, latest sample.</li>
              <li>Add a second one: type Resting Heart Rate, latest sample.</li>
              <li>Add <span className="text-foreground">Get Contents of URL</span>: the URL above, Method POST, Request Body JSON, and paste the body with the two Health variables.</li>
            </ol>
            <p className="mt-2 text-[11px] text-muted">
              Whoop, Garmin, and Fitbit work too as long as they sync into Apple Health.
            </p>
          </div>

          <button onClick={() => loadOrCreateToken(true)} disabled={busy} className="btn-ghost text-xs">
            Regenerate token (invalidates the old link)
          </button>
        </div>
      )}
    </div>
  );
}
