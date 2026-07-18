"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { dateToKey } from "@/lib/date-keys";
import { addDays, startOfWeekMon } from "@/lib/calendar-core/date-math";
import { cn } from "@/lib/utils";

// Tarixiy import yoʻli saqlansin (TodayRail va b.) — yagona manba calendar-core.
export { addDays, startOfWeekMon };

/** Yakshanba doim dam olish kuni — tasmada koʻrsatilmaydi. */
const WEEKDAYS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh"] as const;

/**
 * Interaktiv haftalik kun tasmasi (Dushanba—Shanba) — oy-grid taqvim
 * oʻrnini bosadi. Kun tanlansa `onSelect` chaqiriladi; iste'molchi (bosh
 * sahifa) oʻng ustunni (darslar) shu kunga filtrlaydi. Hafta almashtirish
 * tugmalari kun katakchalari bilan bir qatorda, bir xil oʻlchamda.
 */
export function WeekStrip({
  selected,
  onSelect,
  todayKey,
  hasLesson,
  isBlocked,
  weekStart: weekStartProp,
  onWeekStartChange,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  todayKey: string;
  hasLesson: (key: string) => boolean;
  isBlocked: (date: Date) => boolean;
  /** Boshqariladigan hafta boshi — berilmasa ichki holat ishlatiladi. */
  weekStart?: Date;
  onWeekStartChange?: (d: Date) => void;
}) {
  const t = useTranslations("WeekStrip");
  const [internalWeekStart, setInternalWeekStart] = useState(() => startOfWeekMon(selected));
  const weekStart = weekStartProp ?? internalWeekStart;
  const setWeekStart = onWeekStartChange
    ? (updater: (w: Date) => Date) => onWeekStartChange(updater(weekStart))
    : setInternalWeekStart;

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const selectedKey = dateToKey(selected);

  return (
    <div className="grid grid-cols-8 gap-0.5">
      <button
        type="button"
        aria-label={t("prevWeek")}
        onClick={() => setWeekStart((w) => addDays(w, -7))}
        className="flex items-center justify-center self-stretch rounded-md bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground"
      >
        <ChevronLeft className="size-4" />
      </button>

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
              "group flex flex-col items-center gap-0.5 rounded-md py-1 transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isToday
                  ? "bg-[#FBC02D] text-[#3B2F0B] hover:bg-[#FBC02D]/90 active:bg-[#FBC02D]/90"
                  : "text-foreground hover:bg-accent active:bg-accent",
              blocked && !isSelected && !isToday && "text-muted-foreground/60"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-medium leading-none",
                isSelected
                  ? "text-primary-foreground/70"
                  : isToday
                    ? "text-[#3B2F0B]/70"
                    : "text-muted-foreground"
              )}
            >
              {WEEKDAYS_UZ[i]}
            </span>
            {/* Tanlangan / bugun — ikkalasi ham butun katak boyaladi (hover bilan bir
                xil oʻlcham), faqat tus farqlanadi (bugun = yumshoq brend rang). Dars bor
                kun — burchak-belgi (alohida qator ajratmaydi, unread-badge konvensiyasi). */}
            <span className="relative inline-flex size-6 items-center justify-center rounded-[4px] text-sm font-semibold tabular-nums">
              {day.getDate()}
              {lesson && (
                <span
                  className={cn(
                    "absolute -bottom-px -right-px size-1 rounded-full ring-1",
                    isSelected
                      ? "bg-primary-foreground ring-primary"
                      : isToday
                        ? "bg-[#3B2F0B] ring-[#FBC02D]"
                        : "bg-primary ring-background"
                  )}
                />
              )}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        aria-label={t("nextWeek")}
        onClick={() => setWeekStart((w) => addDays(w, 7))}
        className="flex items-center justify-center self-stretch rounded-md bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
