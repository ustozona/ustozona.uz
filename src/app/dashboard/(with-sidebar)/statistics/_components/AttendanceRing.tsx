"use client";

import { scoreBarColor } from "@/lib/score-colors";

const DEFAULT_SIZE = 38;

/** Kichik doiraviy davomat koʻrsatkichi (Tremor "KPI Cards" naqshiga
    ilhomlangan) — svetofor rangi `scoreBarColor`dan, markazda foiz.
    Statistika jadvallarida (Sinflar, Oʻquvchilar) umumiy ishlatiladi. */
export function AttendanceRing({
  pct,
  showLabel = true,
  showUnit = false,
  size = DEFAULT_SIZE,
}: {
  pct: number | null;
  /** `false` — markazdagi foiz sonini yashiradi (masalan yonida allaqachon
      xom son "19/92" koʻrinib turgan joyda, ikki xil birlik yonma-yon
      chalkashtirmasin deb). */
  showLabel?: boolean;
  /** `true` — markazdagi songa "%" belgisini qoʻshadi. */
  showUnit?: boolean;
  /** Halqa diametri (px), default 38 — jadval qatorlariga mos ixcham oʻlcham. */
  size?: number;
}) {
  if (pct === null) return <span className="text-xs text-muted-foreground/50">—</span>;
  const radius = size * (15 / DEFAULT_SIZE);
  const circumference = 2 * Math.PI * radius;
  const color = scoreBarColor(pct);
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3}
          style={{ stroke: `color-mix(in srgb, ${color} 16%, transparent)` }}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3} strokeLinecap="round"
          style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-foreground">
          {Math.round(pct)}
          {showUnit && "%"}
        </span>
      )}
    </div>
  );
}
