// Movement glyphs: minimal figures that read as the exercise at 18-20px on a
// colored tile. Design rules that keep them legible at that size: at most ~5
// strokes, stroke width 2.3, FILLED heads (outlined circles vanish when tiny),
// and one unmistakable cue per movement (bar overhead = press, bar at the top
// edge = pull-up, bench line = bench, and so on).

import type { ComponentType } from "react";

type GlyphProps = { className?: string };

function G({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const Head = ({ cx, cy }: { cx: number; cy: number }) => (
  <circle cx={cx} cy={cy} r={1.8} fill="currentColor" stroke="none" />
);

// Figure in a deep squat under a high bar.
export const SquatGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <Head cx={12} cy={3.4} />
    <path d="M4.5 7h15" />
    <path d="M12 7v5" />
    <path d="M12 12l-4.5 2.5V19" />
    <path d="M12 12l4.5 2.5V19" />
  </G>
);

// Bent-over figure gripping a bar near the floor (deadlift / hinge).
export const HingeGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <Head cx={5.6} cy={5.2} />
    <path d="M6.5 6.5L14 11" />
    <path d="M14 11v8.5" />
    <path d="M9 8v8" />
    <path d="M4.5 16h9" />
  </G>
);

// Lying on a bench, arms pressing a bar straight up.
export const BenchGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <path d="M6.5 8.5h11" />
    <path d="M12 8.5V14" />
    <Head cx={5.2} cy={13} />
    <path d="M3 16h18" />
    <path d="M6.5 16v3.5M17.5 16v3.5" />
  </G>
);

// Standing figure with a bar locked out overhead.
export const PressGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <path d="M4.5 4h15" />
    <path d="M8.5 4v5M15.5 4v5" />
    <Head cx={12} cy={8.2} />
    <path d="M12 10.5V15" />
    <path d="M12 15l-3 4.5M12 15l3 4.5" />
  </G>
);

// Bent figure rowing a bar up to the torso.
export const RowGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <Head cx={5} cy={6.4} />
    <path d="M6.2 7.6l8.3.9" />
    <path d="M14.5 8.5l1.8 4-1 7" />
    <path d="M9.5 8.2v5.3" />
    <path d="M5 13.5h9" />
  </G>
);

// Hanging from a top bar, knees tucked (pull-up / pulldown).
export const PullupGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <path d="M4 4h16" />
    <path d="M9 4l2.4 3.6M15 4l-2.4 3.6" />
    <Head cx={12} cy={9.4} />
    <path d="M12 11.6v4" />
    <path d="M12 15.6l-2.4 3M12 15.6l2.4 3" />
  </G>
);

// A diagonal dumbbell (arm isolation: curls, extensions, raises).
export const ArmGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <path d="M8.5 15.5l7-7" />
    <path d="M4.5 12.5l7 7" />
    <path d="M12.5 4.5l7 7" />
  </G>
);

// Plank hold: rigid body line on a forearm, ground below.
export const CoreGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <Head cx={4.6} cy={9} />
    <path d="M6.2 10.2l11.8 2.6" />
    <path d="M8 10.6v5.4" />
    <path d="M4 16.5h16" />
  </G>
);

// A classic horizontal dumbbell, the catch-all.
export const DumbbellGlyph = ({ className }: GlyphProps) => (
  <G className={className}>
    <path d="M4.5 9.5v5M8 7.5v9M16 7.5v9M19.5 9.5v5" />
    <path d="M8 12h8" />
  </G>
);

export type Glyph = ComponentType<GlyphProps>;
