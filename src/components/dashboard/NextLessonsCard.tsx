"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  panelCardClass,
  panelCardHeaderClass,
  panelCardContentClass,
} from "@/components/DashboardPage";
import { useLessonStore } from "@/store/useLessonStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { lessonSessions } from "@/lib/lessons-data";
import { dateToKey, addDaysKey } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";
import { fmtMin } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   KELGUSI DARSLAR — bosh sahifa hero ostidagi karta. Bugundan keyingi
   rejalashtirilgan dars sessiyalari (lessonSessions, koʻp-sinf/koʻp-sana
   qoʻllab-quvvatlanadi), sanaga koʻra tartiblangan, birinchi bir nechtasi.
   ════════════════════════════════════════════════════════════════════ */

const LIMIT = 8;

type Row = {
  key: string;
  lessonId: string;
  title: string;
  className: string;
  classHex: string;
  date: string;
  startMin: number;
};

export function NextLessonsCard({ now }: { now: Date }) {
  const t = useTranslations("NextLessonsCard");
  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);

  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();
  const classMeta = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] }])),
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
          lessonId: l.id,
          title: l.title,
          className: meta?.name ?? t("unknownClass"),
          classHex: meta?.hex ?? "#94a3b8",
          date: s.date,
          startMin: s.startMin,
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

  return (
    <Card className={cn(panelCardClass, "shadow-sm")}>
      <CardHeader className={cn(panelCardHeaderClass, "min-h-[4.5rem] px-5 py-5!")}>
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
            <div className="flex flex-col divide-y divide-border/60 px-5 py-1">
              {rows.map((r) => (
                <Link
                  key={r.key}
                  href={`/lessons/${r.lessonId}`}
                  className="group flex items-center gap-2.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground transition-colors duration-fast group-hover:text-primary">
                      {r.title || t("untitledTopic")}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ClassSwatch hex={r.classHex} className="size-2" />
                      {r.className}
                      <span className="size-0.5 rounded-full bg-muted-foreground/60" />
                      {fmtMin(r.startMin)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {whenLabel(r.date)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
