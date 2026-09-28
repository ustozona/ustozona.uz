"use client";

import { cn } from "@/lib/utils";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { useCalendarFormat } from "@/components/calendar/format";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI CHIZIGʻI — har qator bitta polosa-yoʻlagi: mavjud boʻlimlar
   (kulrang), yangi import (yashil), taʼtillar (chiziqli), baholash
   davrlari chegarasi (uzuq chiziq) va bugun (qizil chiziq). Pozitsiya —
   oʻquv yili boshidan kunlar ulushi.

   Ikki isteʼmolchi: import oynasi (sinf = qator) va Darslar sahifasidagi
   yoʻl xaritasi (boʻlim = qator, `TimelineAxis` + `TimelineTrack` alohida,
   chunki qatorlar sudraladigan roʻyxat ichida turadi).
   ════════════════════════════════════════════════════════════════════ */

export type TimelineDot = { key: string; date: string; tone: "done" | "flow" | "warn" };
export type TimelineBar = {
  key: string;
  label: string;
  start: string;
  end: string;
  isNew?: boolean;
  /** Polosa ichidagi darslar — boʻshliqlar koʻrinib turadi. */
  dots?: TimelineDot[];
  /** Yil oxirigacha sigʻmaydigan darslar soni — polosadan yil oxirigacha uzuq davom. */
  overflow?: number;
  /** Tartiblash qoralamasida siljigan polosa. */
  moved?: boolean;
};
export type TimelineLane = { id: string; name: string; bars: TimelineBar[] };
/** Baholash davri (chorak, semestr…) — ixtiyoriy, 0..N. */
export type TimelinePeriod = { key: string; name: string; start: string; end: string };
type Range = { start: string; end: string };

const DAY = 86_400_000;
const dayIndex = (from: string, key: string) => Math.round((dateKeyToDate(key).getTime() - dateKeyToDate(from).getTime()) / DAY);

function geometry(start: string, end: string) {
  const total = Math.max(1, dayIndex(start, end) + 1);
  const clamp = (k: string) => (k < start ? start : k > end ? end : k);
  return {
    pct: (key: string) => `${Math.min(100, Math.max(0, (dayIndex(start, key) / total) * 100))}%`,
    span: (a: string, b: string) => `${Math.max(0.6, ((dayIndex(clamp(a), clamp(b)) + 1) / total) * 100)}%`,
    clamp,
  };
}

/** Oylar shkalasi va (boʻlsa) baholash davrlari nomlari. */
export function TimelineAxis({ start, end, periods = [], className }: Range & { periods?: TimelinePeriod[]; className?: string }) {
  const { monthShort } = useCalendarFormat();
  const { pct } = geometry(start, end);
  const months: { key: string; label: string }[] = [];
  const first = dateKeyToDate(start);
  for (let d = new Date(first.getFullYear(), first.getMonth(), 1); ; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    if (key > end) break;
    months.push({ key: key < start ? start : key, label: monthShort(d.getMonth()) });
  }
  const shown = periods.filter((p) => p.end >= start && p.start <= end);
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="relative h-4 text-tag text-muted-foreground">
        {months.map((m) => (
          <span key={m.key} className="absolute top-0 capitalize" style={{ left: pct(m.key) }}>{m.label}</span>
        ))}
      </div>
      {shown.length > 0 && (
        <div className="relative h-4 text-tag font-medium text-foreground/70">
          {shown.map((p) => (
            <span key={p.key} className="absolute top-0 truncate border-l border-dashed border-foreground/30 pl-1" style={{ left: pct(p.start < start ? start : p.start) }}>
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bitta yoʻlak: taʼtil soyasi, davr chegaralari, polosalar, bugun. */
export function TimelineTrack({
  start, end, today, holidays, periods = [], bars, overflowLabel, className,
}: Range & {
  today: string;
  holidays: Range[];
  periods?: TimelinePeriod[];
  bars: TimelineBar[];
  /** Sigʻmaydigan qism yorligʻi (`overflow` soni bilan). */
  overflowLabel?: (count: number) => string;
  className?: string;
}) {
  const { pct, span } = geometry(start, end);
  const todayIn = today >= start && today <= end;
  return (
    <div className={cn("relative h-8 overflow-hidden rounded-md bg-muted/50", className)}>
      {holidays.filter((h) => h.end >= start && h.start <= end).map((h) => (
        <span
          key={`${h.start}-${h.end}`}
          className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,var(--color-destructive)_0_1px,transparent_1px_5px)] opacity-40"
          style={{ left: pct(h.start < start ? start : h.start), width: span(h.start, h.end) }}
        />
      ))}
      {periods.filter((p) => p.start > start && p.start <= end).map((p) => (
        <span key={p.key} className="absolute inset-y-0 border-l border-dashed border-foreground/25" style={{ left: pct(p.start) }} />
      ))}
      {bars.map((b) => (
        <span key={b.key}>
          {!!b.overflow && (
            <span
              title={overflowLabel?.(b.overflow)}
              className="absolute inset-y-1 rounded border border-dashed border-destructive/70 bg-destructive/5"
              style={{ left: pct(b.end), width: span(b.end, end) }}
            />
          )}
          <span
            title={b.label}
            className={cn(
              "absolute inset-y-1 truncate rounded px-1.5 text-tag leading-6 transition-[left,width] duration-fast ease-standard",
              b.isNew ? "z-10 bg-success/25 font-medium text-success ring-1 ring-success"
                : b.moved ? "bg-primary/15 font-medium text-foreground ring-1 ring-primary/40"
                  : "bg-muted-foreground/20 text-muted-foreground",
            )}
            style={{ left: pct(b.start), width: span(b.start, b.end) }}
          >
            {b.dots?.length ? null : b.label}
          </span>
          {b.dots?.map((d) => (
            <span
              key={d.key}
              className={cn(
                "absolute top-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-fast ease-standard",
                d.tone === "done" ? "bg-success" : d.tone === "warn" ? "bg-warning" : "bg-foreground/60",
              )}
              style={{ left: pct(d.date) }}
            />
          ))}
        </span>
      ))}
      {todayIn && <span className="absolute inset-y-0 z-20 w-0.5 bg-destructive" style={{ left: pct(today) }} />}
    </div>
  );
}

export function YearTimeline({ start, end, today, holidays, lanes, periods }: {
  start: string;
  end: string;
  today: string;
  holidays: Range[];
  lanes: TimelineLane[];
  periods?: TimelinePeriod[];
}) {
  const showNames = lanes.length > 1;
  return (
    <div className={cn("grid items-center gap-x-3 gap-y-1.5", showNames ? "grid-cols-[48px_1fr]" : "grid-cols-1")}>
      {showNames && <span />}
      <TimelineAxis start={start} end={end} periods={periods} />
      {lanes.map((lane) => (
        <FragmentLane key={lane.id} showName={showNames} name={lane.name}>
          <TimelineTrack start={start} end={end} today={today} holidays={holidays} periods={periods} bars={lane.bars} />
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

/** Kalendardagi baholash davrlari → chiziq davrlari (davrsiz kalendar — boʻsh). */
export function timelinePeriods(quarters: { id: string; name: string; range: Range }[]): TimelinePeriod[] {
  return quarters.filter((q) => q.range.start && q.range.end)
    .map((q) => ({ key: q.id, name: q.name, start: q.range.start, end: q.range.end }));
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
