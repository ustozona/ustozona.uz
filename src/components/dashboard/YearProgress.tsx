"use client";

import { useTranslations } from "next-intl";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
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

/** Choraklarga mos fasl emojilari (1-chorak kuzda boshlanadi). */
const SEASON_EMOJI = ["🍂", "❄️", "🌸", "☀️"];

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * Oʻquv yili progress-chizigʻi — hero pastida yupqa bar: yil boshidan
 * bugungacha oʻtilgan yoʻl, chorak-marralar (fasl emojilari bilan) va
 * joriy pozitsiya. Yonida "{chorak} · {hafta}/{jami}-hafta" yorligʻi.
 * Kalendar sozlanmagan boʻlsa hech narsa chizmaydi.
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

  // Oʻng yorliq: chorak ichida — "{chorak} · {hafta}/{jami}-hafta";
  // taʼtilda — taʼtil nomi; yil tashqarisida — yil yorligʻi.
  const quarter = getQuarterForDate(calendar, todayKey);
  const holiday = getHolidayForDate(calendar, todayKey);
  let label: string;
  if (quarter) {
    const week = Math.floor(diffDaysKeys(quarter.range.start, todayKey) / 7) + 1;
    const weeks = Math.max(Math.ceil(daysInRange(quarter.range) / 7), 1);
    label = t("quarterWeek", { quarter: quarter.name, week, weeks });
  } else if (holiday) {
    label = holiday.name;
  } else {
    label = calendar.yearLabel;
  }

  // Marralar — har chorak tugashi nuqtasida fasl emojisi.
  const marks = calendar.quarters.map((q, i) => ({
    id: q.id,
    name: q.name,
    endLabel: fmtDayMonthUz(q.range.end),
    pct: clamp01(diffDaysKeys(calendar.range.start, q.range.end) / (total - 1)) * 100,
    emoji: SEASON_EMOJI[i % SEASON_EMOJI.length],
    done: todayKey > q.range.end,
  }));

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("ariaLabel", { year: calendar.yearLabel })}
        className="relative h-1.5 flex-1 min-w-0 rounded-full bg-foreground/8 dark:bg-foreground/15"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
          style={{ width: `${pct}%` }}
        />
        {marks.map((m) => (
          <Tooltip key={m.id}>
            <TooltipTrigger asChild>
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-default"
                style={{ left: `${m.pct}%` }}
              >
                <AppleEmojiSprite
                  emoji={m.emoji}
                  className={cn("size-4", !m.done && "opacity-45 saturate-50")}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("quarterUntil", { name: m.name, date: m.endLabel })}</TooltipContent>
          </Tooltip>
        ))}
        {/* Joriy pozitsiya */}
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{label}</span>
    </div>
  );
}
