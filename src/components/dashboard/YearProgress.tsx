"use client";

import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  type AcademicYearCalendar,
  isCalendarConfigured,
  daysInRange,
  diffDaysKeys,
  getQuarterForDate,
  getHolidayForDate,
  fmtDayMonthUz,
} from "@/lib/academic-calendar";

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * Oʻquv yili progress-koʻrsatkichi — hero pastida. Baholash davrlari
 * (chorak/semestr/trimestr) sozlangan boʻlsa — har biri uchun bitta
 * segment (soni davrga qarab moslashadi, qattiq "4" deb yozilmagan);
 * davrsiz hisoblar uchun (chorak: []) — yagona uzluksiz chiziq,
 * yorligʻi yil ichidagi hafta ulushi. Kalendar sozlanmagan boʻlsa
 * hech narsa chizmaydi.
 */
export function YearProgress({
  calendar,
  todayKey,
  className,
}: {
  calendar: AcademicYearCalendar;
  todayKey: string;
  className?: string;
}) {
  const t = useTranslations("YearProgress");
  if (!isCalendarConfigured(calendar)) return null;

  const total = daysInRange(calendar.range);
  if (total <= 1) return null;
  const pct = clamp01(diffDaysKeys(calendar.range.start, todayKey) / (total - 1)) * 100;
  const hasPeriods = calendar.quarters.length > 0;

  const quarter = getQuarterForDate(calendar, todayKey);
  const holiday = getHolidayForDate(calendar, todayKey);

  let label: string;
  let endLabel: string | null = null;
  if (quarter) {
    const week = Math.floor(diffDaysKeys(quarter.range.start, todayKey) / 7) + 1;
    const weeks = Math.max(Math.ceil(daysInRange(quarter.range) / 7), 1);
    label = t("quarterWeek", { quarter: quarter.name, week, weeks });
    endLabel = t("quarterEndDate", { date: fmtDayMonthUz(quarter.range.end) });
  } else if (holiday) {
    label = holiday.name;
  } else if (!hasPeriods) {
    const week = Math.floor(diffDaysKeys(calendar.range.start, todayKey) / 7) + 1;
    const weeks = Math.max(Math.ceil(total / 7), 1);
    label = t("weekOfYear", { week, weeks });
  } else {
    label = calendar.yearLabel;
  }

  const ariaLabel = t("ariaLabel", { year: calendar.yearLabel });

  if (!hasPeriods) {
    return (
      <div className={cn("flex items-center gap-3 min-w-0", className)}>
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel}
          className="relative h-1.5 flex-1 min-w-0 rounded-full bg-foreground/8 dark:bg-foreground/15"
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
            style={{ left: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{label}</span>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-medium text-foreground">{label}</span>
        {endLabel && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{endLabel}</span>}
      </div>
      <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel} className="flex gap-1">
        {calendar.quarters.map((q) => {
          const state = todayKey > q.range.end ? "done" : todayKey < q.range.start ? "future" : "current";
          return (
            <Tooltip key={q.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-1.5 flex-1 cursor-default rounded-full",
                    state === "done" && "bg-primary",
                    state === "current" && "bg-primary/55",
                    state === "future" && "bg-foreground/8 dark:bg-foreground/15"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>{t("quarterUntil", { name: q.name, date: fmtDayMonthUz(q.range.end) })}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
