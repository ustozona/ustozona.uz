"use client";

import { scoreBarColor } from "@/lib/score-colors";
import { ProgressRing } from "@/components/ui/progress-ring";

const DEFAULT_SIZE = 38;

/** Kichik doiraviy davomat koʻrsatkichi (Tremor "KPI Cards" naqshiga
    ilhomlangan) — svetofor rangi `scoreBarColor`dan, markazda foiz.
    Statistika jadvallarida (Sinflar, Oʻquvchilar) umumiy ishlatiladi.

    Halqaning oʻzi endi `ui/progress-ring` primitivida: bu yerda faqat
    domenga xos qismi — svetofor rangi va markazdagi foiz matni. */
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
  return (
    <ProgressRing
      pct={pct}
      size={size}
      strokeWidth={3}
      // Mavjud koʻrinish piksel-aniq saqlansin — eski nisbat.
      radius={size * (15 / DEFAULT_SIZE)}
      color={scoreBarColor(pct)}
      trackMix={16}
    >
      {showLabel && (
        <span className="text-[11px] font-semibold tabular-nums text-foreground">
          {Math.round(pct)}
          {showUnit && "%"}
        </span>
      )}
    </ProgressRing>
  );
}
