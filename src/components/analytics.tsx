"use client";

import { useEffect } from "react";
import { capture, identifyUser, initPostHog, type TrackEvent } from "@/lib/track";

/** Initializes PostHog once, app-wide. No-op without a key. */
export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);
  return null;
}

/** Ties events to the signed-in user so we can measure per-person retention. */
export function IdentifyUser({ id, email }: { id: string; email?: string | null }) {
  useEffect(() => {
    identifyUser(id, email ? { email } : undefined);
  }, [id, email]);
  return null;
}

/** Fires a funnel event once when the page mounts. */
export function TrackOnMount({ event, props }: { event: TrackEvent; props?: Record<string, unknown> }) {
  useEffect(() => {
    capture(event, props);
    // props intentionally excluded from deps — fire exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
