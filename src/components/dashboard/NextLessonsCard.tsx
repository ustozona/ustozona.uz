"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonDateLeaf, LessonStatusPill } from "@/components/lessons/LessonPlanMarks";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { ClassBadge } from "@/components/ClassBadge";
import {
  panelCardClass,
  panelCardHeaderClass,
  panelCardContentClass,
} from "@/components/DashboardPage";
import { useLessonStore } from "@/store/useLessonStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { subjectLabel } from "@/lib/standards-data";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { lessonSessions, type Lesson } from "@/lib/lessons-data";
import { dateToKey, addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { DAYS_UZ_SUN, MONTHS_UZ_SHORT } from "@/lib/localization";
import { fmtMin } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import { useCalendarFormat } from "@/components/calendar/format";

/* ════════════════════════════════════════════════════════════════════
   KELGUSI DARSLAR — bosh sahifa hero ostidagi karta. Bugundan keyingi
   rejalashtirilgan dars sessiyalari (lessonSessions, koʻp-sinf/koʻp-sana
   qoʻllab-quvvatlanadi), sanaga koʻra tartiblangan, birinchi bir nechtasi.
   ════════════════════════════════════════════════════════════════════ */

const LIMIT = 40;

type Row = {
  key: string;
  lesson: Lesson;
  classId: string;
  title: string;
  className: string;
  classHex: string;
  classColor: ClassColor | null;
  subject: string;
  date: string;
  startMin: number;
  endMin: number;
};


export function NextLessonsCard({ now }: { now: Date }) {
  const t = useTranslations("NextLessonsCard");
  const calFmt = useCalendarFormat();
  const locale = useLocale();
  // Oy qisqartmasi darslar sahifasidagi barg bilan bir xil: Intl, ICU maʼlumoti yoʻq tilda (uz) — MONTHS_UZ_SHORT.
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short" }), [locale]);
  const intlMonthMissing = monthFmt.format(new Date(2024, 8, 1)).startsWith("M0");
  const shortMonth = (y: number, m: number) =>
    intlMonthMissing ? MONTHS_UZ_SHORT[m - 1] : monthFmt.format(new Date(y, m - 1, 1)).replace(".", "");
  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);

  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();
  const classMeta = useMemo(
    () =>
      new Map(
        liveClasses.map((c) => [
          c.id,
          { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)], color: classColor(c), subject: c.subject ? subjectLabel(c.subject) : "" },
        ])
      ),
    [liveClasses]
  );

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const l of allLessons) {
      for (const s of lessonSessions(l)) {
        if (s.date <= todayKey) continue;
        const meta = classMeta.get(s.classId);
        out.push({
          key: `${l.id}-${s.classId}-${s.date}-${s.startMin}`,
          lesson: l,
          classId: s.classId,
          title: l.title,
          className: meta?.name ?? t("unknownClass"),
          classHex: meta?.hex ?? "#94a3b8",
          classColor: meta?.color ?? null,
          subject: meta?.subject ?? "",
          date: s.date,
          startMin: s.startMin,
          endMin: s.endMin,
        });
      }
    }
    out.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
    return out.slice(0, LIMIT);
  }, [allLessons, classMeta, todayKey, t]);

  // Sana kartadagi bargda turadi — hafta akkordeoni, ichida har kun BITTA qatorda: «Payshanba, 1 ——— 2 kundan keyin». Oy nomi yoʻq (barg koʻrsatadi).
  /** Haftaning dushanbasi — hafta guruhi kaliti. */
  const mondayOf = (dateKey: string): string => addDaysKey(dateKey, -((dateKeyToDate(dateKey).getDay() + 6) % 7));
  /** Hafta oraligʻi — Rejalashtiruvchi sarlavhasi bilan bir xil imlo: «21–27-sentabr»,
      ikki oyga boʻlinsa «29-sentabr – 5-oktabr». */
  const weekLabel = (monday: string): string => {
    const a = dateKeyToDate(monday), b = dateKeyToDate(addDaysKey(monday, 6));
    const mon = (d: Date) => calFmt.monthName(d.getMonth()).toLowerCase();
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()}-${mon(a)}`;
    return `${a.getDate()}-${mon(a)} – ${b.getDate()}-${mon(b)}`;
  };
  const weekday = (dateKey: string): string => {
    const date = dateKeyToDate(dateKey);
    const w = intlMonthMissing ? DAYS_UZ_SUN[date.getDay()] : new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
    return w.charAt(0).toUpperCase() + w.slice(1);
  };
  const relDays = (dateKey: string): string => {
    if (dateKey === tomorrowKey) return t("tomorrow");
    const days = Math.round((dateKeyToDate(dateKey).getTime() - dateKeyToDate(todayKey).getTime()) / 86_400_000);
    return t("inDays", { count: days });
  };

  const weeks = useMemo(() => {
    const out: { monday: string; days: { date: string; rows: Row[] }[]; count: number }[] = [];
    for (const r of rows) {
      const monday = mondayOf(r.date);
      let w = out[out.length - 1];
      if (!w || w.monday !== monday) out.push((w = { monday, days: [], count: 0 }));
      const day = w.days[w.days.length - 1];
      if (day && day.date === r.date) day.rows.push(r);
      else w.days.push({ date: r.date, rows: [r] });
      w.count++;
    }
    return out;
  }, [rows]);

  return (
    <Card className={panelCardClass}>
      <CardHeader className={cn(panelCardHeaderClass, "min-h-16 px-5 pt-4! pb-4!")}>
        <div className="flex min-w-0 items-center gap-2">
          <SectionIcon>
            <CalendarClock />
          </SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
        </div>
      </CardHeader>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ScrollFade position="top" />
        <div className={panelCardContentClass}>
          {rows.length === 0 ? (
            <div className="px-4 py-4">
              <Empty className="border-0 p-4 gap-4">
                <EmptyHeader>
                  <EmptyMedia>
                    <Illustration name="28" className="h-[clamp(4.5rem,12vh,7rem)] text-black dark:text-white" />
                  </EmptyMedia>
                  <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                  <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              {/* Hafta — akkordeon (eng yaqin hafta ochiq); ichida har kun bitta ingichka qator. */}
              {weeks.map((w, wi) => (
                <Collapsible key={w.monday} defaultOpen={wi === 0} className="group/week flex flex-col">
                  <CollapsibleTrigger className="flex items-center gap-2 rounded-md px-1 py-1 text-caption outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronDown className="size-3.5 shrink-0 -rotate-90 text-muted-foreground transition-transform duration-fast group-data-[state=open]/week:rotate-0" />
                    <span className="shrink-0 font-medium text-foreground">{weekLabel(w.monday)}</span>
                    <span className="shrink-0 text-tag tabular-nums text-muted-foreground">{w.count}</span>
                    <span className="h-px flex-1 bg-border" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-2 pt-1">
                  {w.days.map((day) => (
                  <div key={day.date} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1 pl-6 text-caption text-muted-foreground">
                      <span className="shrink-0">{weekday(day.date)}, {Number(day.date.slice(8))}</span>
                      <span className="h-px flex-1 bg-border/60" />
                      <span className="shrink-0 tabular-nums">{relDays(day.date)}</span>
                    </div>
                    {day.rows.map((r) => {
                      const [y, m, d] = r.date.split("-").map(Number);
                      return (
                      <Link
                        key={r.key}
                        href={`/lessons/${r.lesson.id}`}
                        className="list-card group flex items-center gap-3 p-4"
                        style={{ ["--card-accent" as string]: r.classHex }}
                      >
                        <LessonDateLeaf lesson={r.lesson} classId={r.classId} hex={r.classHex} day={String(d)} month={shortMonth(y, m)} />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-foreground leading-tight transition-colors duration-fast group-hover:text-primary">
                            {r.title || t("untitledTopic")}
                          </h4>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {r.classColor ? (
                              <ClassBadge color={r.classColor} name={r.className} className="shrink-0" />
                            ) : (
                              <span className="shrink-0 text-tag font-semibold">{r.className}</span>
                            )}
                            {r.subject && (
                              <>
                                <span className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />
                                <span className="min-w-0 truncate">{r.subject}</span>
                              </>
                            )}
                            <span className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />
                            <span className="shrink-0 tabular-nums">
                              {fmtMin(r.startMin)} — {fmtMin(r.endMin)} ({t("durationSuffix", { count: r.endMin - r.startMin })})
                            </span>
                          </p>
                        </div>
                        <span className="hidden sm:inline-flex shrink-0"><LessonStatusPill lesson={r.lesson} classId={r.classId} /></span>
                      </Link>
                      );
                    })}
                  </div>
                  ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
