"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   SPARKLINE — kartadagi kichkina tendensiya chizigʻi.

   Ilgari bu `recharts`ning `<AreaChart>` i edi. Diagramma kutubxonasi
   329 kB va `StatCard` orqali yettita marshrutga tushardi — 64×32px
   rasm uchun. Bu yerda oʻsha chiziq qoʻlda chizilgan: bir xil monoton
   kubik interpolyatsiya (chiziq maʼlumot nuqtalaridan oshib ketmaydi),
   bir xil gradiyent toʻldirish, bir xil oʻlcham.

   ⚠️ Gradiyent id `useId` dan olinadi. Ilgari u qattiq yozilgan edi,
   shuning uchun bitta sahifadagi hamma sparkline BIRINCHI kartaning
   rangini olardi — SVG'da id global.
   ════════════════════════════════════════════════════════════════════ */

const W = 64;
const H = 32;
const TOP = 2; // recharts'dagi `margin.top` bilan bir xil

const sign = (x: number) => (x < 0 ? -1 : 1);

/** Monoton kubik urinmalar (Fritsch–Carlson) — `type="monotone"` ayni shu. */
function tangents(ys: number[], dx: number): number[] {
  const n = ys.length;
  if (n < 2) return [0];
  const sec = ys.slice(0, -1).map((y, i) => (ys[i + 1] - y) / dx);
  const t: number[] = new Array(n);
  // Ikki nuqtada ichki urinma yoʻq — chiziq shunchaki tekis.
  if (n === 2) return [sec[0], sec[0]];
  for (let i = 1; i < n - 1; i++) {
    const [s0, s1] = [sec[i - 1], sec[i]];
    const p = (s0 + s1) / 2;
    t[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), Math.abs(p) / 2) || 0;
  }
  // Chekka nuqtalar: ichki urinmaga moslab, oshib ketmaydigan qilib.
  t[0] = (3 * sec[0] - t[1]) / 2;
  t[n - 1] = (3 * sec[n - 2] - t[n - 2]) / 2;
  return t;
}

function buildPath(values: number[]): { line: string; area: string } {
  const max = Math.max(...values, 0);
  const dx = W / (values.length - 1);
  const xs = values.map((_, i) => i * dx);
  // Qiymat 0 boʻlsa ham chiziq koʻrinsin: maxsiz holatda tagida yotadi.
  const ys = values.map((v) => (max === 0 ? H : H - (v / max) * (H - TOP)));
  const t = tangents(ys, dx);

  let line = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < values.length - 1; i++) {
    const h = dx / 3;
    line += `C${xs[i] + h},${ys[i] + h * t[i]} ${xs[i + 1] - h},${ys[i + 1] - h * t[i + 1]} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return { line, area: `${line}L${W},${H}L0,${H}Z` };
}

export function Sparkline({
  values,
  color,
  className,
}: {
  values: number[];
  /** Chiziq va gradiyent rangi (hex). */
  color: string;
  className?: string;
}) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const { line, area } = buildPath(values);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden
      className={cn("h-8 w-16 shrink-0 overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
