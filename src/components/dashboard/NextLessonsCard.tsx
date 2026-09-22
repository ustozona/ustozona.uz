"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
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
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { lessonSessions, type Lesson } from "@/lib/lessons-data";
import { dateToKey, addDaysKey } from "@/lib/date-keys";
import { MONTHS_UZ, MONTHS_UZ_SHORT } from "@/lib/localization";
import { fmtMin } from "@/lib/timetable";
import { cn } from "@/lib/utils";

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
  date: string;
  startMin: number;
  endMin: number;
};


export function NextLessonsCard({ now }: { now: Date }) {
  const t = useTranslations("NextLessonsCard");
  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);

  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();
  const classMeta = useMemo(
    () =>
      new Map(
        liveClasses.map((c) => [
          c.id,
          { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)], color: classColor(c) },
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
          date: s.date,
          startMin: s.startMin,
          endMin: s.endMin,
        });
      }
    }
    out.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
    return out.slice(0, LIMIT);
  }, [allLessons, classMeta, todayKey, t]);

  const whenLabel = (dateKey: string): string => {
    if (dateKey === tomorrowKey) return t("tomorrow");
    const [, m, d] = dateKey.split("-").map(Number);
    return `${d}-${MONTHS_UZ[m - 1].toLowerCase()}`;
  };

  const groups = useMemo(() => {
    const out: { date: string; rows: Row[] }[] = [];
    for (const r of rows) {
      const last = out[out.length - 1];
      if (last && last.date === r.date) last.rows.push(r);
      else out.push({ date: r.date, rows: [r] });
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
            <div className="flex flex-col gap-4 px-4 pt-3 pb-4">
              {groups.map((g) => (
                <div key={g.date}>
                  <div className="mb-1.5 flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold text-muted-foreground">{whenLabel(g.date)}</span>
                    <span className="text-xs tabular-nums text-muted-foreground/60">{g.rows.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {g.rows.map((r) => {
                      const [, m, d] = r.date.split("-").map(Number);
                      return (
                      <Link
                        key={r.key}
                        href={`/lessons/${r.lesson.id}`}
                        className="list-card group flex items-center gap-3 p-4"
                        style={{ ["--card-accent" as string]: r.classHex }}
                      >
                        <LessonDateLeaf lesson={r.lesson} classId={r.classId} hex={r.classHex} day={String(d)} month={MONTHS_UZ_SHORT[m - 1]} />
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
