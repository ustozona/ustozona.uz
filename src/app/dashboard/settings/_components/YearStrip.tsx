"use client";

import * as React from "react";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { inRange } from "@/lib/academic-calendar";
import { dateKeyToDate, todayKey } from "@/lib/date-keys";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { CLASS_COLOR_BASE, type ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   YIL LENTASI — oʻquv yilining vizual sharhi

   Bitta gorizontal chiziq: choraklar sinf-rang tizimidan (`CLASS_COLOR_BASE`,
   OKLCH kalibrlangan, dark mode avtomatik) toʻldiriladi — recharts uchun
   moʻljallangan `--chart-*` tokenlar ishlatilmaydi (--chart-3 qorongʻu navy,
   flat fon sifatida kulrang koʻrinadi). Taʼtillar shtrix (hatch) bilan.
   Ostida oy belgilari, pastda legend. Ranglar inline style'da — globals.css
   ichida color-mix(var()) buzilib ketadi (Turbopack), inline toʻgʻri hisoblanadi.
   ════════════════════════════════════════════════════════════════════ */

/** 4 ta aniq farqlanadigan, oʻqiladigan rang — choraklar uchun. */
const QUARTER_COLOR_KEYS: ClassColor[] = ["orange", "teal", "sky", "amber"];

function daysBetween(a: string, b: string): number {
  return Math.round((dateKeyToDate(b).getTime() - dateKeyToDate(a).getTime()) / 86_400_000);
}

export default function YearStrip({
  calendar,
  onSegmentClick,
}: {
  calendar: AcademicYearCalendar;
  /** Chorak yoki taʼtil segmenti bosilganda — tegishli sozlamalar qatoriga scroll qilish uchun. */
  onSegmentClick?: (target: { kind: "quarter" | "holiday"; id: string }) => void;
}) {
  const { range, quarters, holidays } = calendar;
  const total = Math.max(daysBetween(range.start, range.end) + 1, 1);

  const pct = (dateKey: string) =>
    Math.min(Math.max((daysBetween(range.start, dateKey) / total) * 100, 0), 100);
  const widthPct = (start: string, end: string) =>
    Math.max(pct(end) - pct(start) + (1 / total) * 100, 0.5);

  // Boshlanish oyi (yarim oydan boshlansa ham) — chapga tekislangan alohida yorliq.
  const startMonthLabel = MONTHS_UZ_SHORT[dateKeyToDate(range.start).getMonth()];

  // Keyingi oy boshlari (yil ichidagi 1-sanalar) — tick va markazlashgan yorliqlar uchun
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

  const today = todayKey();
  const showToday = inRange(today, range);

  return (
    <div className="space-y-2">
      <div className="relative h-8 overflow-hidden rounded-lg border border-border bg-muted/30">
        {quarters.map((q, i) => {
          const base = CLASS_COLOR_BASE[QUARTER_COLOR_KEYS[i % QUARTER_COLOR_KEYS.length]];
          return (
            <button
              key={q.id}
              type="button"
              title={`${q.name}: ${q.range.start} — ${q.range.end}`}
              onClick={() => onSegmentClick?.({ kind: "quarter", id: q.id })}
              className="absolute inset-y-0 flex items-center justify-center overflow-hidden transition-opacity hover:opacity-85"
              style={{
                left: `${pct(q.range.start)}%`,
                width: `${widthPct(q.range.start, q.range.end)}%`,
                backgroundColor: `color-mix(in oklch, ${base} 30%, var(--card))`,
              }}
            >
              <span
                className="truncate px-1 text-[10px] font-semibold"
                style={{ color: `color-mix(in oklch, ${base} 65%, var(--foreground))` }}
              >
                {q.name}
              </span>
            </button>
          );
        })}
        {holidays.map((h) => (
          <button
            key={h.id}
            type="button"
            title={`${h.name}: ${h.range.start} — ${h.range.end}`}
            onClick={() => onSegmentClick?.({ kind: "holiday", id: h.id })}
            className="absolute inset-y-0 transition-opacity hover:opacity-70"
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
        {/* Bugungi kun */}
        {showToday && (
          <div
            title={`Bugun: ${today}`}
            className="absolute inset-y-0 w-0.5 bg-primary"
            style={{ left: `${pct(today)}%` }}
          />
        )}
      </div>

      {/* Oy yorliqlari */}
      <div className="relative h-4">
        <span className="absolute top-0 left-0 text-[10px] text-muted-foreground">{startMonthLabel}</span>
        {monthTicks.map((t) => (
          <span
            key={t.key}
            className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground"
            style={{ left: `${t.leftPct}%` }}
          >
            {t.label}
          </span>
        ))}
        {showToday && (
          <span
            className="absolute top-0 -translate-x-1/2 rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
            style={{ left: `${pct(today)}%` }}
          >
            Bugun
          </span>
        )}
      </div>

      {/* Legend — chorak nomlari endi lentada, faqat taʼtil belgisi qoladi */}
      {holidays.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] border border-border" style={hatch} />
          <span className="text-[11px] text-muted-foreground">Taʼtil</span>
        </div>
      )}
    </div>
  );
}
