"use client";

import { cn } from "@/lib/utils";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { MONTHS_UZ_SHORT } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI CHIZIGʻI — har sinf bitta qator: mavjud boʻlimlar (kulrang),
   yangi import (yashil), taʼtillar (chiziqli) va bugun (qizil chiziq).
   Pozitsiya — oʻquv yili boshidan kunlar ulushi.
   ════════════════════════════════════════════════════════════════════ */

export type TimelineBar = { key: string; label: string; start: string; end: string; isNew?: boolean };
export type TimelineLane = { id: string; name: string; bars: TimelineBar[] };

const DAY = 86_400_000;
const dayIndex = (from: string, key: string) => Math.round((dateKeyToDate(key).getTime() - dateKeyToDate(from).getTime()) / DAY);

export function YearTimeline({ start, end, today, holidays, lanes }: {
  start: string;
  end: string;
  today: string;
  holidays: { start: string; end: string }[];
  lanes: TimelineLane[];
}) {
  const total = Math.max(1, dayIndex(start, end) + 1);
  const pct = (key: string) => `${Math.min(100, Math.max(0, (dayIndex(start, key) / total) * 100))}%`;
  const span = (a: string, b: string) => `${Math.max(0.6, ((dayIndex(a, b) + 1) / total) * 100)}%`;

  // Oy boshlari (yuqoridagi shkala).
  const months: { key: string; label: string }[] = [];
  const first = dateKeyToDate(start);
  for (let d = new Date(first.getFullYear(), first.getMonth(), 1); ; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    if (key > end) break;
    months.push({ key: key < start ? start : key, label: MONTHS_UZ_SHORT[d.getMonth()] });
  }

  const showNames = lanes.length > 1;
  const todayIn = today >= start && today <= end;

  return (
    <div className={cn("grid items-center gap-x-3 gap-y-1.5", showNames ? "grid-cols-[48px_1fr]" : "grid-cols-1")}>
      {showNames && <span />}
      <div className="relative h-4 text-tag text-muted-foreground">
        {months.map((m) => (
          <span key={m.key} className="absolute top-0 -translate-x-0 capitalize" style={{ left: pct(m.key) }}>{m.label}</span>
        ))}
      </div>

      {lanes.map((lane) => (
        <FragmentLane key={lane.id} showName={showNames} name={lane.name}>
          <div className="relative h-8 overflow-hidden rounded-md bg-muted/50">
            {holidays.filter((h) => h.end >= start && h.start <= end).map((h) => (
              <span
                key={`${h.start}-${h.end}`}
                className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,var(--color-destructive)_0_1px,transparent_1px_5px)] opacity-40"
                style={{ left: pct(h.start < start ? start : h.start), width: span(h.start < start ? start : h.start, h.end > end ? end : h.end) }}
              />
            ))}
            {lane.bars.map((b) => (
              <span
                key={b.key}
                title={b.label}
                className={cn(
                  "absolute inset-y-1 truncate rounded px-1.5 text-tag leading-6",
                  b.isNew ? "z-10 bg-success/25 font-medium text-success ring-1 ring-success" : "bg-muted-foreground/20 text-muted-foreground",
                )}
                style={{ left: pct(b.start), width: span(b.start, b.end) }}
              >
                {b.label}
              </span>
            ))}
            {todayIn && <span className="absolute inset-y-0 z-20 w-0.5 bg-destructive" style={{ left: pct(today) }} />}
          </div>
        </FragmentLane>
      ))}
    </div>
  );
}

function FragmentLane({ showName, name, children }: { showName: boolean; name: string; children: React.ReactNode }) {
  return (
    <>
      {showName && <span className="truncate text-caption">{name}</span>}
      {children}
    </>
  );
}

/** Taʼtil kunlarini uzluksiz oraliqlarga yigʻish (kalendar maʼlumotidan). */
export function mergeRanges(ranges: { start: string; end: string }[]) {
  const sorted = [...ranges].filter((r) => r.start && r.end).sort((a, b) => a.start.localeCompare(b.start));
  const out: { start: string; end: string }[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= addDaysKey(last.end, 1)) { if (r.end > last.end) last.end = r.end; }
    else out.push({ ...r });
  }
  return out;
}
