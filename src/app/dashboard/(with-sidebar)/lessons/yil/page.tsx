"use client";

import { useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange, CalendarPlus } from "lucide-react";
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
import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { paceForClass, timelineBarsForClass } from "@/lib/curriculum-map";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI — Darslar sahifasining ikkinchi koʻrinishi: vaqt chizigʻi.
   Chapda sinflar, yuqorida oylar; har boʻlim oʻz sanalari boʻylab choʻzilgan
   chiziq, ichidagi toʻq qism — oʻtilgan mavzular ulushi. Qizil chiziq —
   bugun, xira ustunlar — taʼtil. Hisob-kitob `@/lib/curriculum-map` da.
   ════════════════════════════════════════════════════════════════════ */

const pad = (n: number) => String(n).padStart(2, "0");
const LANE_H = 32; // px — bitta yoʻlak (chiziq 28px + oraliq)
/** Tuzilma sahifasidagi «Boʻlimsiz» URL qiymati bilan bir xil. */
const NONE = "__none__";

const daysBetween = (a: string, b: string) =>
  Math.round((dateKeyToDate(b).getTime() - dateKeyToDate(a).getTime()) / 86_400_000);

export default function LessonsYearPage() {
  const t = useTranslations("LessonsYear");
  const tp = useTranslations("LessonsPage");
  const locale = useLocale();
  const classes = useLiveClasses();
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const calendar = useCalendarStore((s) => s.calendar);
  const today = todayKey();

  const range = useMemo(() => {
    if (calendar.range.start && calendar.range.end) return calendar.range;
    const now = dateKeyToDate(today);
    const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return { start: `${y}-09-01`, end: `${y + 1}-06-30` };
  }, [calendar.range, today]);
  const totalDays = daysBetween(range.start, range.end) + 1;
  /** Sana → chiziqdagi chap chekka (%), oraliqqa qisiladi. */
  const pos = (key: string) => (Math.min(Math.max(daysBetween(range.start, key), 0), totalDays) / totalDays) * 100;

  // Brauzerlarda oʻzbekcha oy nomlari yoʻq («M09» chiqadi) — oʻzimizniki.
  const monthLabel = (d: Date) => {
    const s = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
    return /^M\d/.test(s) ? MONTHS_UZ_SHORT[d.getMonth()] : s.replace(".", "");
  };
  const dayLabel = (key: string) => {
    const d = dateKeyToDate(key);
    return `${d.getDate()} ${monthLabel(d)}`;
  };

  const months: { key: string; left: number; width: number; date: Date }[] = [];
  {
    const s = dateKeyToDate(range.start);
    for (let d = new Date(s.getFullYear(), s.getMonth(), 1); dateToKey(d) <= range.end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const from = dateToKey(d) < range.start ? range.start : dateToKey(d);
      const nextKey = dateToKey(new Date(d.getFullYear(), d.getMonth() + 1, 1));
      const to = nextKey > range.end ? addDaysKey(range.end, 1) : nextKey;
      months.push({ key: from, left: pos(from), width: pos(to) - pos(from) || 100 - pos(from), date: d });
    }
  }

  const holidays = calendar.holidays
    .filter((h) => h.range.end >= range.start && h.range.start <= range.end && daysBetween(h.range.start, h.range.end) >= 1)
    .map((h) => ({ id: h.id, name: h.name, left: pos(h.range.start), width: pos(addDaysKey(h.range.end, 1)) - pos(h.range.start) }));
  const todayIn = today >= range.start && today <= range.end;

  const rows = useMemo(() => classes.map((c) => {
    const classLessons = lessons.filter((l) => lessonClassIds(l).includes(c.id));
    return {
      cls: c,
      hex: CLASS_COLOR_HEX[classColor(c)],
      pace: paceForClass(classLessons, c.id, today),
      bars: timelineBarsForClass(units, classLessons, c.id, today),
    };
  }), [classes, lessons, units, today]);

  const summary = useMemo(() => {
    const ids = new Set(classes.map((c) => c.id));
    const mine = lessons.filter((l) => lessonClassIds(l).some((id) => ids.has(id)));
    return tp("pageSummary", { classes: ids.size, lessons: mine.length, taught: mine.filter(isTaught).length });
  }, [classes, lessons, tp]);

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

  const legendItem = (style: CSSProperties, label: string, className?: string) => (
    <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
      <span className={cn("h-2.5 w-4 rounded-sm", className)} style={style} />
      {label}
    </span>
  );

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <LessonsViewSwitch active="year" summary={summary} />

      <Panel>
        <PanelHeader
          icon={<CalendarRange />}
          title={t("yearTitle")}
          count={`${dayLabel(range.start)} – ${dayLabel(range.end)}`}
          actions={
            <div className="hidden md:flex items-center gap-4">
              {legendItem({ backgroundColor: "var(--muted-foreground)" }, t("legendTaught"))}
              {legendItem({ backgroundColor: "color-mix(in oklch, var(--muted-foreground) 25%, transparent)" }, t("legendPlanned"))}
              {legendItem({}, t("legendHoliday"), "bg-muted")}
              {legendItem({}, t("legendToday"), "w-0.5 h-3 rounded-none bg-destructive")}
            </div>
          }
        />
        <PanelBody className="overflow-x-auto">
          <div className="min-w-[880px] px-5 py-4">
            {/* Oylar */}
            <div className="flex">
              <div className="w-44 shrink-0" />
              <div className="relative flex-1 h-6">
                {months.map((m) => (
                  <span
                    key={m.key}
                    className="absolute top-0 text-caption text-muted-foreground capitalize truncate pl-1.5"
                    style={{ left: `${m.left}%`, width: `${m.width}%` }}
                  >
                    {monthLabel(m.date)}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Fon: oy chegaralari, taʼtillar, bugun — hamma qatorlar ostida */}
              <div className="absolute inset-y-0 right-0 left-44 pointer-events-none">
                {months.map((m) => (
                  <span key={m.key} className="absolute inset-y-0 border-l border-border" style={{ left: `${m.left}%` }} />
                ))}
                {holidays.map((h) => (
                  <span key={h.id} className="absolute inset-y-0 bg-muted/70" style={{ left: `${h.left}%`, width: `${h.width}%` }} />
                ))}
                {todayIn && (
                  <span className="absolute -top-6 bottom-0 z-10 w-0.5 bg-destructive" style={{ left: `${pos(today)}%` }} />
                )}
              </div>

              {rows.map(({ cls, hex, pace, bars }) => {
                const pct = pace.total ? Math.round((pace.taught / pace.total) * 100) : 0;
                const behind = pace.expected - pace.taught;
                const lanes = Math.max(1, ...bars.map((b) => b.lane + 1));
                return (
                  <div key={cls.id} className="flex items-stretch border-t border-border first:border-t-0">
                    <Link
                      href={`/dashboard/lessons?classId=${cls.id}`}
                      className="w-44 shrink-0 py-3 pr-3 flex flex-col justify-center gap-0.5 group"
                    >
                      <span className="flex items-center gap-2">
                        <ClassSwatch hex={hex} />
                        <span className="text-sm font-semibold text-foreground truncate group-hover:underline">{cls.name}</span>
                      </span>
                      <span className="text-caption tabular-nums text-muted-foreground pl-4">
                        {pct}% · {pace.taught}/{pace.total}
                        {behind > 0 && <span className="text-warning"> · {t("behindShort", { count: behind })}</span>}
                      </span>
                    </Link>
                    <div className="relative flex-1 my-3" style={{ height: lanes * LANE_H - 4 }}>
                      {bars.length === 0 ? (
                        <div className="absolute inset-0 flex items-center gap-3 pl-2">
                          <span className="text-caption text-muted-foreground">{pace.total ? t("noDates") : t("paceNoLessons")}</span>
                          {pace.total > 0 && (
                            <Link href="/dashboard/planner" className="flex items-center gap-1 text-caption font-medium text-foreground hover:underline">
                              <CalendarPlus className="size-3.5" />
                              {t("planIt")}
                            </Link>
                          )}
                        </div>
                      ) : bars.map((b) => {
                        const left = pos(b.start);
                        const width = Math.max(pos(addDaysKey(b.end, 1)) - left, 1.2);
                        const done = b.total ? (b.taught / b.total) * 100 : 0;
                        const title = b.unitId ? `${pad(b.ordinal!)}. ${b.title}` : t("noUnit");
                        return (
                          <Link
                            key={b.unitId ?? NONE}
                            href={`/dashboard/lessons?classId=${cls.id}&unit=${b.unitId ?? NONE}`}
                            title={t("openUnit", { unit: title, taught: b.taught, total: b.total, dates: `${dayLabel(b.start)} – ${dayLabel(b.end)}` })}
                            className={cn(
                              "absolute h-7 rounded-md overflow-hidden flex items-center transition-shadow duration-fast hover:ring-2",
                              !b.unitId && "border border-dashed"
                            )}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              top: b.lane * LANE_H,
                              backgroundColor: `color-mix(in oklch, ${hex} 22%, var(--card))`,
                              borderColor: hex,
                              ["--tw-ring-color" as string]: hex,
                            }}
                          >
                            <span className="absolute inset-y-0 left-0" style={{ width: `${done}%`, backgroundColor: `color-mix(in oklch, ${hex} 70%, var(--card))` }} />
                            <span className="relative px-2 text-caption font-medium text-foreground truncate">{title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
