# Bar scanner flow: state inventory

Every state the flow can be in, from tapping Scan to a logged set. Written for
the filmable-demo pass. "Now" is the behavior before that pass; fixes landed in
the commits that follow this document.

Entry points: the Scan button in the Log header (all viewports) and the scan
tile inside Log. Route: /scan. Endpoint: POST /api/scan (auth required, forced
tool, 30s server cap).

| # | State | Trigger | Now | Target |
|---|-------|---------|-----|--------|
| 1 | Idle (choose) | Land on /scan | Two cards: photo, record | Same, plus camera-use sentence before any prompt |
| 2 | Permission pending | Tap Record a rep | Nothing changes while the browser prompt is up | Pending card naming why the camera is needed |
| 3 | Permission denied | User denies | Bare red text line | Recovery card: how to re-enable, manual-log fallback |
| 4 | Live preview | Permission granted | Video + Record button | Same, plus framing hint (bar and plates, side angle) |
| 5 | Countdown | Tap Record a set | 3-2-1 overlay | Same |
| 6 | Recording | Countdown ends | Red pill, elapsed seconds, 90s cap, bounded 16-frame buffer | Same |
| 7 | Uploading | Stop and analyze | Indistinguishable from processing; one spinner | Real upload progress (XHR), then processing |
| 8 | Processing | Upload done | "Reading the bar" spinner, no timeout, no retry | Named stages, 25s timeout, retry without re-capture |
| 9 | Result, confident | detected true, high conf | Form-like card, small inputs | Money screen: large readouts, tap to correct, one primary action |
| 10 | Result, low confidence | conf medium/low | Small colored caption only | Fields marked for review, confirm-style primary button |
| 11 | No bar detected | detected false | Model note in a card | Friendly message, one concrete retry suggestion, retry button |
| 12 | API error | 4xx/5xx | Bare red text (server copy is clean) | Error card with retry |
| 13 | Timeout | Slow model/network | Spinner forever | Timeout card at 25s with retry |
| 14 | Offline | No network | Raw "Failed to fetch" | Friendly offline copy, retry |
| 15 | Photo unreadable | Bad file | Friendly text | Same, in card |
| 16 | Too few frames | <2 frames captured | Friendly text | Same, in card |
| 17 | Logging | Tap Log this set | Button spinner | Same |
| 18 | Logged | Insert OK | Text with exclamation point, auto-redirect 1.2s | Context card: set N today, e1RM vs best or PR; stay on screen |
| 19 | Log error | Not signed in, DB error | Bare red text | Same copy, in the card |

Data notes:
- Weight semantics: total bar weight (matches weight-semantics.ts for barbell).
- Stored shape identical to manual logging: canonical kg via toKg, reps int,
  rpe null. Covered by scan-mapping tests.
- Sessions: scans now append to today's existing "Scanned" session instead of
  creating one session per set.
- Failure reasons are tracked to PostHog as scan_failed with a reason field.
