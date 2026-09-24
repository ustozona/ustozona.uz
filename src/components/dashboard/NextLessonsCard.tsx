"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, ChevronDown, Link as LinkIcon, Sun } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonDateLeaf, LessonStatusPill } from "@/components/lessons/LessonPlanMarks";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { ClassBadge } from "@/components/ClassBadge";
import { AddTopicButton } from "@/components/calendar/AddTopicButton";
import { LinkLessonDialog, type LinkLessonSlot } from "@/components/LinkLessonDialog";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { sessionMatchesSlot } from "@/lib/calendar-core/resolve";
import { startOfWeekMon } from "@/lib/calendar-core/date-math";
import {
  panelCardClass,
  panelCardHeaderClass,
  panelCardContentClass,
} from "@/components/DashboardPage";
import { useLessonStore } from "@/store/useLessonStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { subjectLabel } from "@/lib/standards-data";
import { autoClassColor, classTints, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { lessonSessions, type Lesson } from "@/lib/lessons-data";
import { dateToKey, addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { DAYS_UZ_SUN, MONTHS_UZ_SHORT } from "@/lib/localization";
import { fmtMin } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   KELGUSI DARSLAR — bosh sahifa hero ostidagi karta. Bugundan keyingi
   rejalashtirilgan dars sessiyalari (lessonSessions, koʻp-sinf/koʻp-sana
   qoʻllab-quvvatlanadi), sanaga koʻra tartiblangan, birinchi bir nechtasi.

   Ufq ichida (shu hafta + keyingi hafta, shanbagacha) dars jadvalidagi
   MAVZUSIZ soatlar ham chiqadi — «arvoh karta»: mavzuli karta bilan bir
   xil geometriya, lekin xira sinf rangi, uzuq chegara va «+ Mavzu
   qoʻshish» / «Ulash» chorlovi (planner hafta/kun koʻrinishi grammatikasi).
   Yashirilgan boʻshliq oʻqituvchini adashtirardi: hafta yengilroq
   koʻrinardi, kunlar esa izohsiz tushib qolardi.
   ════════════════════════════════════════════════════════════════════ */

const LIMIT = 40;

type Row = {
  key: string;
  /** null — jadvaldagi mavzusiz soat (arvoh karta). */
  lesson: Lesson | null;
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

type Day = { date: string; rows: Row[]; holiday?: string };

/** Mavzusiz soatlar koʻrsatiladigan ufq (bugundan keyingi kun — keyingi haftaning shanbasi). */
const HORIZON_DAYS_FROM_MONDAY = 12;


export function NextLessonsCard({ now }: { now: Date }) {
  const t = useTranslations("NextLessonsCard");
  const locale = useLocale();
  // Oy qisqartmasi darslar sahifasidagi barg bilan bir xil: Intl, ICU maʼlumoti yoʻq tilda (uz) — MONTHS_UZ_SHORT.
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short" }), [locale]);
  const intlMonthMissing = monthFmt.format(new Date(2024, 8, 1)).startsWith("M0");
  const shortMonth = (y: number, m: number) =>
    intlMonthMissing ? MONTHS_UZ_SHORT[m - 1] : monthFmt.format(new Date(y, m - 1, 1)).replace(".", "");
  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);

  const router = useRouter();
  const allLessons = useLessonStore((s) => s.lessons);
  const addLesson = useLessonStore((s) => s.addLesson);
  const addScheduleForClass = useLessonStore((s) => s.addScheduleForClass);
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const [linkSlot, setLinkSlot] = useState<LinkLessonSlot | null>(null);
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

  const weekStartKey = dateToKey(startOfWeekMon(now));
  const thisWeekEndKey = addDaysKey(weekStartKey, 5);
  const horizonEndKey = addDaysKey(weekStartKey, HORIZON_DAYS_FROM_MONDAY);

  const { rows, holidays } = useMemo(() => {
    const makeRow = (lesson: Lesson | null, classId: string, date: string, startMin: number, endMin: number): Row => {
      const meta = classMeta.get(classId);
      const color = meta?.color ?? null;
      return {
        key: `${lesson?.id ?? "slot"}-${classId}-${date}-${startMin}`,
        lesson,
        classId,
        title: lesson?.title ?? "",
        className: meta?.name ?? t("unknownClass"),
        classHex: meta?.hex ?? CLASS_COLOR_HEX[autoClassColor(classId)],
        classColor: color,
        subject: meta?.subject ?? "",
        date,
        startMin,
        endMin,
      };
    };

    // Mavzu sessiyalari — sanaga koʻra guruhlangan.
    const sessionsByDate = new Map<string, { lesson: Lesson; classId: string; startMin: number; endMin: number }[]>();
    for (const l of allLessons) {
      for (const s of lessonSessions(l)) {
        if (s.date <= todayKey) continue;
        const list = sessionsByDate.get(s.date) ?? [];
        list.push({ lesson: l, classId: s.classId, startMin: s.startMin, endMin: s.endMin });
        sessionsByDate.set(s.date, list);
      }
    }

    const out: Row[] = [];
    const hol: { date: string; name: string }[] = [];
    const used = new Set<string>();
    // Ufq ichida — jadval asosiy skelet, mavzular uning ichiga tushadi.
    for (let key = addDaysKey(todayKey, 1); key <= horizonEndKey; key = addDaysKey(key, 1)) {
      const dow = dateKeyToDate(key).getDay();
      if (dow === 0) continue;
      const events = (resolveVersionForDate(versions, key)?.events ?? []).filter((e) => e.day === dow);
      const holiday = getHolidayForDate(calendar, key);
      if (holiday) {
        if (events.length) hol.push({ date: key, name: holiday.name });
        continue;
      }
      const sessions = sessionsByDate.get(key) ?? [];
      for (const ev of events) {
        const matched = sessions.filter((s) => sessionMatchesSlot(ev, s, "overlap"));
        if (matched.length === 0) {
          out.push(makeRow(null, ev.classId, key, ev.startMin, ev.endMin));
          continue;
        }
        for (const s of matched) {
          const id = `${s.lesson.id}-${s.classId}-${key}-${s.startMin}`;
          if (used.has(id)) continue;
          used.add(id);
          out.push(makeRow(s.lesson, s.classId, key, s.startMin, s.endMin));
        }
      }
    }
    // Jadvalga tushmagan (qoʻshimcha) va ufqdan keyingi mavzular — oldingidek.
    for (const [date, sessions] of sessionsByDate) {
      for (const s of sessions) {
        const id = `${s.lesson.id}-${s.classId}-${date}-${s.startMin}`;
        if (used.has(id)) continue;
        out.push(makeRow(s.lesson, s.classId, date, s.startMin, s.endMin));
      }
    }
    out.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
    return { rows: out.slice(0, LIMIT), holidays: hol };
  }, [allLessons, classMeta, todayKey, horizonEndKey, versions, calendar, t]);

  const weekStats = useMemo(() => {
    const week = rows.filter((r) => r.date <= thisWeekEndKey);
    return { total: week.length, done: week.filter((r) => r.lesson).length };
  }, [rows, thisWeekEndKey]);

  const createLessonInSlot = (r: Row) => {
    const id = addLesson({ classId: r.classId, unitId: null, title: t("untitledTopic"), status: "Draft" });
    addScheduleForClass(id, r.classId, r.date, r.startMin, r.endMin);
    router.push(`/lessons/${id}`);
  };

  // Sana kartadagi bargda turadi — har kun akkordeon (default ochiq), sarlavhada faqat: «Payshanba ——— 2 kundan keyin».
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

  const days = useMemo(() => {
    const out: Day[] = [];
    for (const r of rows) {
      const day = out[out.length - 1];
      if (day && day.date === r.date) day.rows.push(r);
      else out.push({ date: r.date, rows: [r] });
    }
    // Taʼtil kunlari — oʻz oʻrnida ingichka qator (faqat roʻyxat oraligʻida).
    const last = out[out.length - 1]?.date;
    for (const h of holidays) if (last && h.date < last) out.push({ date: h.date, rows: [], holiday: h.name });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, holidays]);

  return (
    <Card className={panelCardClass}>
      <CardHeader className={cn(panelCardHeaderClass, "min-h-16 px-5 pt-4! pb-4!")}>
        <div className="flex min-w-0 items-center gap-2">
          <SectionIcon>
            <CalendarClock />
          </SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
        </div>
        {weekStats.total > 0 && (
          <div
            className="ml-auto flex shrink-0 items-center gap-2 text-caption text-muted-foreground"
            aria-label={t("weekProgressAria", { done: weekStats.done, total: weekStats.total })}
          >
            <span className="hidden sm:inline">{t("thisWeek")}</span>
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${(weekStats.done / weekStats.total) * 100}%` }} />
            </span>
            <span className={cn("font-semibold tabular-nums", weekStats.done === weekStats.total ? "text-success" : "text-foreground")}>
              {weekStats.done}/{weekStats.total}
            </span>
          </div>
        )}
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
              {/* Kun — akkordeon, hammasi default ochiq. */}
              {days.map((day) => day.holiday ? (
                <div key={`h-${day.date}`} className="flex items-center gap-2 px-1 py-1 text-caption text-warning">
                  <Sun className="size-3.5 shrink-0" />
                  <span className="shrink-0">{t("holidayRow", { day: weekday(day.date), name: day.holiday })}</span>
                  <span className="h-px flex-1 bg-warning/30" />
                </div>
              ) : (
                <Collapsible key={day.date} defaultOpen className="group/day flex flex-col gap-2">
                  <CollapsibleTrigger className="flex items-center gap-2 rounded-md px-1 py-1 text-caption text-muted-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronDown className="size-3.5 shrink-0 -rotate-90 transition-transform duration-fast group-data-[state=open]/day:rotate-0" />
                    <span className="shrink-0">{weekday(day.date)}</span>
                    <span className="h-px flex-1 bg-border/60" />
                    <span className="shrink-0 tabular-nums">
                      {(() => {
                        const done = day.rows.filter((r) => r.lesson).length;
                        const full = done === day.rows.length;
                        return (
                          <span className={cn("font-semibold", full ? "text-success" : "text-foreground")}>
                            {done}/{day.rows.length}
                            {" · "}
                          </span>
                        );
                      })()}
                      {relDays(day.date)}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-2">
                    {day.rows.map((r) => {
                      const [y, m, d] = r.date.split("-").map(Number);
                      if (!r.lesson) return (
                        <EmptySlotCard
                          key={r.key}
                          row={r}
                          day={String(d)}
                          month={shortMonth(y, m)}
                          onCreate={() => createLessonInSlot(r)}
                          onLink={() => setLinkSlot({ dateKey: r.date, classId: r.classId, startMin: r.startMin, endMin: r.endMin })}
                        />
                      );
                      const lesson = r.lesson;
                      return (
                      <Link
                        key={r.key}
                        href={`/lessons/${lesson.id}`}
                        className="list-card group flex items-center gap-3 p-4"
                        style={{ ["--card-accent" as string]: r.classHex }}
                      >
                        <LessonDateLeaf lesson={lesson} classId={r.classId} hex={r.classHex} day={String(d)} month={shortMonth(y, m)} />
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
                        <span className="hidden sm:inline-flex shrink-0"><LessonStatusPill lesson={lesson} classId={r.classId} /></span>
                      </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>
      <LinkLessonDialog slot={linkSlot} onOpenChange={(open) => !open && setLinkSlot(null)} />
    </Card>
  );
}

/* ARVOH KARTA — jadvaldagi mavzusiz soat. Mavzuli karta bilan bir xil
   geometriya (mavzu ulanganda joyidan sakramaydi), lekin holat uch belgi
   bilan beriladi (faqat rang emas): xira sinf yuzasi + uzuq chegara, uzuq
   sana bargi, «Mavzu biriktirilmagan» yozuvi. Chorlov — kalendar
   yuzalaridagi [[AddTopicButton]] juftligi (TodayRail, Planner). */
function EmptySlotCard({
  row,
  day,
  month,
  onCreate,
  onLink,
}: {
  row: Row;
  day: string;
  month: string;
  onCreate: () => void;
  onLink: () => void;
}) {
  const t = useTranslations("NextLessonsCard");
  const color = row.classColor ?? autoClassColor(row.classId);
  const tints = classTints(color);
  return (
    <div
      className="group flex items-center gap-3 rounded-xl border border-dashed p-4 transition-[filter] duration-fast hover:brightness-[0.98]"
      style={{ ...tints.tint, ...tints.borderMedium }}
    >
      <div className="relative w-11 shrink-0">
        <div className="overflow-hidden rounded-lg border border-dashed text-center" style={{ borderColor: row.classHex }}>
          <div className="py-px text-tag font-semibold uppercase" style={{ color: row.classHex }}>{month}</div>
          <div className="text-base font-semibold leading-6 tabular-nums text-foreground">{day}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium italic leading-tight text-muted-foreground">{t("noTopic")}</h4>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {row.classColor ? (
            <ClassBadge color={row.classColor} name={row.className} className="shrink-0" />
          ) : (
            <span className="shrink-0 text-tag font-semibold">{row.className}</span>
          )}
          {row.subject && (
            <>
              <span className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span className="min-w-0 truncate">{row.subject}</span>
            </>
          )}
          <span className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className="shrink-0 tabular-nums">
            {fmtMin(row.startMin)} — {fmtMin(row.endMin)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-stretch gap-1.5">
        <AddTopicButton
          color={color}
          label={t("addTopic")}
          tooltip={t("addTopicTooltip")}
          className="max-sm:hidden"
          onClick={onCreate}
        />
        <AddTopicButton color={color} label={t("addTopic")} tooltip={t("addTopicTooltip")} iconOnly className="sm:hidden" onClick={onCreate} />
        <AddTopicButton color={color} label={t("link")} tooltip={t("linkTooltip")} icon={LinkIcon} iconOnly onClick={onLink} />
      </div>
    </div>
  );
}
