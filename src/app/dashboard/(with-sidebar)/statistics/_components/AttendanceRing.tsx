"use client";

import { scoreBarColor } from "@/lib/score-colors";

const RING_SIZE = 38;
const RING_RADIUS = 15;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Kichik doiraviy davomat koʻrsatkichi (Tremor "KPI Cards" naqshiga
    ilhomlangan) — svetofor rangi `scoreBarColor`dan, markazda foiz.
    Statistika jadvallarida (Sinflar, Oʻquvchilar) umumiy ishlatiladi. */
export function AttendanceRing({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground/50">—</span>;
  const color = scoreBarColor(pct);
  const offset = RING_CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="absolute inset-0 size-full -rotate-90">
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" strokeWidth={3}
          style={{ stroke: `color-mix(in srgb, ${color} 16%, transparent)` }}
        />
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" strokeWidth={3} strokeLinecap="round"
          style={{ stroke: color, strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: offset }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-foreground">
        {Math.round(pct)}
      </span>
    </div>
  );
}
