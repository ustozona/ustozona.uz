"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { panelHeaderClass } from "@/components/DashboardPage";
import { ClassSwatch } from "@/components/ClassSwatch";
import { useCalendarStore } from "@/store/useCalendarStore";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";
import { DAYS_UZ_SHORT, MONTHS_UZ_SHORT } from "@/lib/localization";
import { dominantBy, sessionsByDay, type DayEntry } from "@/lib/curriculum-map";
import type { Lesson } from "@/lib/lessons-data";

type Props = {
  title: string;
  lessons: Lesson[];
  classIds: string[];
  /** Katak guruhi: barcha sinflar koʻrinishida — sinf, bitta sinfda — boʻlim. */
  groupOf: (e: DayEntry) => string;
  colorOf: (group: string) => string;
  /** Tooltip qatori boshidagi yorliq (sinf yoki boʻlim nomi). */
  labelOf: (e: DayEntry) => string;
  legend: { key: string; label: string; color: string }[];
  onDayClick?: (entries: DayEntry[]) => void;
  onClose: () => void;
};

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI — Darslar sahifasining yil koʻrinishi (panel).
   12 oy, har kun katagi shu kungi darsning guruhi rangida. Oʻtib ketgan,
   lekin «Oʻtildi» belgilanmagan kun xira — nima belgilanmaganini bir
   qarashda koʻrsatadi. Ikki joydan ochiladi: Sinflar sarlavhasidan
   (barcha sinflar, sinf ranglari) va Boʻlimlar sarlavhasidan (tanlangan
   sinf, boʻlim tuslari).
   ════════════════════════════════════════════════════════════════════ */
export function YearCalendar({ title, lessons, classIds, groupOf, colorOf, labelOf, legend, onDayClick, onClose }: Props) {
  const t = useTranslations("LessonsYear");
  const locale = useLocale();
  const calendar = useCalendarStore((s) => s.calendar);
  const today = todayKey();

  const range = useMemo(() => {
    if (calendar.range.start && calendar.range.end) return calendar.range;
    const now = dateKeyToDate(today);
    const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return { start: `${y}-09-01`, end: `${y + 1}-08-31` };
  }, [calendar.range, today]);

  const months = useMemo(() => {
    const out: string[] = [];
    const s = dateKeyToDate(range.start);
    for (let d = new Date(s.getFullYear(), s.getMonth(), 1); dateToKey(d) <= range.end && out.length < 12; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      out.push(dateToKey(d));
    }
    return out;
  }, [range]);

  const byDay = useMemo(() => sessionsByDay(lessons, new Set(classIds)), [lessons, classIds]);

  // Brauzerlarda oʻzbek/qoraqalpoq oy va kun nomlari yoʻq («M09», inglizcha
  // «M T W») — shunda loyihaning oʻz roʻyxati olinadi.
  const intlMissing = new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2024, 8, 1)).startsWith("M0");
  const monthLabel = (d: Date) =>
    intlMissing ? MONTHS_UZ_SHORT[d.getMonth()] : new Intl.DateTimeFormat(locale, { month: "short" }).format(d).replace(".", "");
  const weekdays = intlMissing
    ? DAYS_UZ_SHORT.map((d) => d[0])
    : Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i)));
  const dayLabel = (key: string) => {
    const d = dateKeyToDate(key);
    return `${d.getDate()} ${monthLabel(d)}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
      <div className={cn(panelHeaderClass, "items-center justify-between gap-3")}>
        <div className="flex items-center gap-2 min-w-0">
          <SectionIcon><CalendarRange /></SectionIcon>
          <CardTitle className="truncate">{title}</CardTitle>
          <span className="text-caption tabular-nums text-muted-foreground whitespace-nowrap">
            {dayLabel(range.start)} – {dayLabel(range.end)}
          </span>
        </div>
        <Button variant="ghost" size="icon" title={t("close")} aria-label={t("close")} className="text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* lg+: 3 × 4 oy ekranga sigʻadi — qator balandligi boʻlinadi, oy kartasi
          esa kvadratga yaqin (aspect) boʻlib, kataklar choʻzilib ketmaydi. */}
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
            <div className="grid gap-3 p-4 grid-cols-2 md:grid-cols-3 lg:h-full lg:grid-rows-4">
              {months.map((mKey) => {
                const first = dateKeyToDate(mKey);
                const lead = (first.getDay() + 6) % 7; // hafta dushanbadan
                const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
                let count = 0;
                const cells: ReactNode[] = [];
                for (let i = 0; i < lead; i++) cells.push(<span key={`l${i}`} />);
                for (let d = 1; d <= daysIn; d++) {
                  const key = addDaysKey(mKey, d - 1);
                  const inYear = key >= range.start && key <= range.end;
                  const entries = byDay.get(key);
                  count += entries?.length ?? 0;
                  let style: CSSProperties | undefined;
                  let tip = dayLabel(key);
                  if (entries?.length) {
                    const dom = dominantBy(entries, groupOf);
                    const color = colorOf(dom.group);
                    style = { backgroundColor: key < today && !dom.taught ? `color-mix(in oklch, ${color} 40%, var(--card))` : color };
                    tip += "\n" + entries.map((e) => `${labelOf(e)} · ${e.title}`).join("\n");
                  } else if (inYear) {
                    const holiday = getHolidayForDate(calendar, key);
                    if (holiday) tip += ` · ${holiday.name}`;
                  }
                  const cls = cn(
                    "aspect-square rounded-[3px] lg:aspect-auto",
                    !entries?.length && inYear && "bg-muted/70",
                    key === today && "ring-2 ring-foreground ring-offset-1 ring-offset-card"
                  );
                  cells.push(
                    entries?.length && onDayClick ? (
                      <button key={key} type="button" title={tip} style={style} className={cn(cls, "cursor-pointer transition-transform duration-fast hover:scale-110")} onClick={() => onDayClick(entries)} />
                    ) : (
                      <span key={key} title={tip} style={style} className={cls} />
                    )
                  );
                }
                return (
                  <div key={mKey} className="flex flex-col gap-1.5 rounded-lg border border-border p-2.5 lg:h-full lg:min-h-0 lg:aspect-[8/9] lg:max-w-full lg:justify-self-center">
                    <div className="flex items-center justify-between">
                      <span className="text-label font-semibold uppercase">{monthLabel(first)}</span>
                      <span className="text-micro tabular-nums text-muted-foreground uppercase">{count || t("off")}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 lg:flex-1 lg:min-h-0 lg:grid-rows-7">
                      {weekdays.map((w, i) => (
                        <span key={`w${i}`} className="text-micro text-center text-muted-foreground">{w}</span>
                      ))}
                      {cells}
                    </div>
                  </div>
                );
              })}
            </div>
      </div>

      {legend.length > 0 && (
        <div className="shrink-0 border-t border-border px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {legend.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <ClassSwatch hex={l.color} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
