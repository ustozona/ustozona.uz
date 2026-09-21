"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { ClassSwatch } from "@/components/ClassSwatch";
import { LessonsViewSwitch } from "@/components/lessons/LessonsViewSwitch";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useLessonStore } from "@/store/useLessonStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { isTaught, lessonClassIds } from "@/lib/lessons-data";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";
import { DAYS_UZ_SHORT, MONTHS_UZ_SHORT } from "@/lib/localization";
import { dominantOf, sessionsByDay } from "@/lib/curriculum-map";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI — Darslar sahifasining ikkinchi koʻrinishi: 12 oylik kalendar.
   Har kun katagi shu kungi darsning sinfi rangida. Oʻtib ketgan, lekin
   «Oʻtildi» belgilanmagan kun xira — oʻqituvchi nimani belgilamaganini
   bir qarashda koʻradi. Hisob-kitob `@/lib/curriculum-map` da.
   ════════════════════════════════════════════════════════════════════ */

export default function LessonsYearPage() {
  const t = useTranslations("LessonsYear");
  const tp = useTranslations("LessonsPage");
  const locale = useLocale();
  const classes = useLiveClasses();
  const lessons = useLessonStore((s) => s.lessons);
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

  const hexOf = useMemo(() => new Map(classes.map((c) => [c.id, CLASS_COLOR_HEX[classColor(c)]])), [classes]);
  const nameOf = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const byDay = useMemo(() => sessionsByDay(lessons, new Set(classes.map((c) => c.id))), [lessons, classes]);

  const summary = useMemo(() => {
    const ids = new Set(classes.map((c) => c.id));
    const mine = lessons.filter((l) => lessonClassIds(l).some((id) => ids.has(id)));
    return tp("pageSummary", { classes: ids.size, lessons: mine.length, taught: mine.filter(isTaught).length });
  }, [classes, lessons, tp]);

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

  if (classes.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6">
        <LessonsViewSwitch active="year" />
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <LessonsViewSwitch active="year" summary={summary} />

      {/* shrink-0: aks holda flex ustun panelni ekran balandligiga siqib, pastini kesadi */}
      <Panel className="shrink-0">
        <PanelHeader
          icon={<CalendarRange />}
          title={t("yearTitle")}
          count={`${dayLabel(range.start)} – ${dayLabel(range.end)}`}
          actions={
            <div className="hidden md:flex flex-wrap items-center gap-3">
              {classes.map((c) => (
                <span key={c.id} className="flex items-center gap-1.5 text-caption text-muted-foreground">
                  <ClassSwatch hex={hexOf.get(c.id)!} />
                  {c.name}
                </span>
              ))}
            </div>
          }
        />
        <PanelBody inset className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
              let title = dayLabel(key);
              if (entries?.length) {
                const dom = dominantOf(entries);
                const hex = hexOf.get(dom.classId)!;
                const unconfirmed = key < today && !dom.taught;
                style = { backgroundColor: unconfirmed ? `color-mix(in oklch, ${hex} 40%, var(--card))` : hex };
                title += "\n" + entries.map((e) => `${nameOf.get(e.classId)} · ${e.title}`).join("\n");
              } else if (inYear) {
                const holiday = getHolidayForDate(calendar, key);
                if (holiday) title += ` · ${holiday.name}`;
              }
              cells.push(
                <span
                  key={key}
                  title={title}
                  style={style}
                  className={cn(
                    "aspect-square rounded-[3px]",
                    !entries?.length && inYear && "bg-muted/70",
                    key === today && "ring-2 ring-foreground ring-offset-1 ring-offset-card"
                  )}
                />
              );
            }
            return (
              <div key={mKey} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-label font-semibold uppercase">{monthLabel(first)}</span>
                  <span className="text-micro tabular-nums text-muted-foreground uppercase">{count || t("off")}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weekdays.map((w, i) => (
                    <span key={`w${i}`} className="text-micro text-center text-muted-foreground">{w}</span>
                  ))}
                  {cells}
                </div>
              </div>
            );
          })}
        </PanelBody>
      </Panel>
    </div>
  );
}
