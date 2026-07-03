"use client";

import * as React from "react";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { dateKeyToDate } from "@/lib/date-keys";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   YIL LENTASI — oʻquv yilining vizual sharhi

   Bitta gorizontal chiziq: choraklar chart-token ranglarida, taʼtillar
   shtrix (hatch) bilan. Ostida oy belgilari, pastda legend. Barcha
   ranglar inline style'da — globals.css ichida color-mix(var()) buzilib
   ketadi (Turbopack), inline esa brauzerda toʻgʻri hisoblanadi.
   ════════════════════════════════════════════════════════════════════ */

const QUARTER_VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4"] as const;

function daysBetween(a: string, b: string): number {
  return Math.round((dateKeyToDate(b).getTime() - dateKeyToDate(a).getTime()) / 86_400_000);
}

export default function YearStrip({ calendar }: { calendar: AcademicYearCalendar }) {
  const { range, quarters, holidays } = calendar;
  const total = Math.max(daysBetween(range.start, range.end) + 1, 1);

  const pct = (dateKey: string) =>
    Math.min(Math.max((daysBetween(range.start, dateKey) / total) * 100, 0), 100);
  const widthPct = (start: string, end: string) =>
    Math.max(pct(end) - pct(start) + (1 / total) * 100, 0.5);

  // Oy boshlari (yil ichidagi 1-sanalar) — tick va yorliqlar uchun
  const monthTicks: { key: string; label: string; leftPct: number }[] = [];
  {
    const d = dateKeyToDate(range.start);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1); // birinchi TOʻLIQ oy boshidan
    const end = dateKeyToDate(range.end);
    while (d <= end) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      monthTicks.push({ key, label: MONTHS_UZ_SHORT[d.getMonth()], leftPct: pct(key) });
      d.setMonth(d.getMonth() + 1);
    }
  }

  const hatch = {
    backgroundImage:
      "repeating-linear-gradient(45deg, transparent 0 4px, color-mix(in srgb, var(--muted-foreground) 25%, transparent) 4px 8px)",
  } as React.CSSProperties;

  return (
    <div className="space-y-2">
      <div className="relative h-8 overflow-hidden rounded-lg border border-border bg-muted/30">
        {quarters.map((q, i) => (
          <div
            key={q.id}
            title={`${q.name}: ${q.range.start} — ${q.range.end}`}
            className="absolute inset-y-0"
            style={{
              left: `${pct(q.range.start)}%`,
              width: `${widthPct(q.range.start, q.range.end)}%`,
              backgroundColor: `color-mix(in srgb, var(${QUARTER_VARS[i % QUARTER_VARS.length]}) 32%, transparent)`,
            }}
          />
        ))}
        {holidays.map((h) => (
          <div
            key={h.id}
            title={`${h.name}: ${h.range.start} — ${h.range.end}`}
            className="absolute inset-y-0"
            style={{
              left: `${pct(h.range.start)}%`,
              width: `${widthPct(h.range.start, h.range.end)}%`,
              ...hatch,
            }}
          />
        ))}
        {/* Oy chegaralari */}
        {monthTicks.map((t) => (
          <div
            key={t.key}
            className="absolute inset-y-0 w-px bg-border"
            style={{ left: `${t.leftPct}%` }}
          />
        ))}
      </div>

      {/* Oy yorliqlari */}
      <div className="relative h-4">
        {monthTicks.map((t) => (
          <span
            key={t.key}
            className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground"
            style={{ left: `${t.leftPct}%` }}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {quarters.map((q, i) => (
          <span key={q.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="size-2.5 rounded-[3px]"
              style={{
                backgroundColor: `color-mix(in srgb, var(${QUARTER_VARS[i % QUARTER_VARS.length]}) 45%, transparent)`,
              }}
            />
            {q.name}
          </span>
        ))}
        <span className={cn("inline-flex items-center gap-1.5 text-[11px] text-muted-foreground")}>
          <span className="size-2.5 rounded-[3px] border border-border" style={hatch} />
          Taʼtil
        </span>
      </div>
    </div>
  );
}
