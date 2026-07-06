"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { dateToKey } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";
import { cn } from "@/lib/utils";

/** Dushanba boshlangʻich hafta boshi (00:00). */
function startOfWeekMon(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // Ya=0 → 6, Du=1 → 0
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const WEEKDAYS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"] as const;

/**
 * Interaktiv haftalik kun tasmasi — oy-grid taqvim oʻrnini bosadi.
 * Kun tanlansa `onSelect` chaqiriladi; iste'molchi (bosh sahifa) oʻng ustunni
 * (darslar + vazifalar) shu kunga filtrlaydi. EMStudio manbasida yoʻq — farqlanish.
 */
export function WeekStrip({
  selected,
  onSelect,
  todayKey,
  hasLesson,
  isBlocked,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  todayKey: string;
  hasLesson: (key: string) => boolean;
  isBlocked: (date: Date) => boolean;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMon(selected));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Sarlavha: hafta sana-diapazoni (oʻzbekcha grammatika bilan)
  // Bir oy ichida:  "6 — 12-iyul"   ·  ikki oyda:  "29-iyun — 5-iyul"
  const rangeLabel = useMemo(() => {
    const first = days[0];
    const last = days[6];
    const m1 = MONTHS_UZ[first.getMonth()].toLowerCase();
    const m2 = MONTHS_UZ[last.getMonth()].toLowerCase();
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} — ${last.getDate()}-${m1}`;
    }
    return `${first.getDate()}-${m1} — ${last.getDate()}-${m2}`;
  }, [days]);

  const selectedKey = dateToKey(selected);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{rangeLabel}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Oldingi hafta"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Keyingi hafta"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="inline-flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const key = dateToKey(day);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const blocked = isBlocked(day);
          const lesson = hasLesson(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-lg py-2 transition-colors",
                // Tanlangan (faol harakat) = toʻliq qora katak; bugun (moʻljal) = accent katak
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent",
                blocked && !isSelected && !isToday && "text-muted-foreground/60"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {WEEKDAYS_UZ[i]}
              </span>
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm tabular-nums",
                  (isSelected || isToday) && "font-semibold"
                )}
              >
                {day.getDate()}
              </span>
              <span
                className={cn(
                  "size-1 rounded-full",
                  lesson ? (isSelected ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
