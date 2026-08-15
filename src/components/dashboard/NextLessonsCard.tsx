"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_ICON, STATUS_PILL_CLASS } from "@/components/LessonStatusBadge";
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
import { CLASS_COLOR_HEX, classTints } from "@/lib/class-colors";
import { lessonSessions, type Lesson } from "@/lib/lessons-data";
import { dateToKey, addDaysKey } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";
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
  lessonId: string;
  title: string;
  className: string;
  classHex: string;
  gradientTile: CSSProperties;
  date: string;
  startMin: number;
  endMin: number;
  status: Lesson["status"];
};


export function NextLessonsCard({ now }: { now: Date }) {
  const t = useTranslations("NextLessonsCard");
  const tLessons = useTranslations("LessonsPage");
  const STATUS_LABELS: Record<Lesson["status"], string> = {
    Completed: tLessons("statusCompleted"),
    Scheduled: tLessons("statusScheduled"),
    Unscheduled: tLessons("statusUnscheduled"),
    Draft: tLessons("statusDraft"),
  };
  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);

  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();
  const classMeta = useMemo(
    () =>
      new Map(
        liveClasses.map((c) => [
          c.id,
          { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)], tints: classTints(classColor(c)) },
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
          lessonId: l.id,
          title: l.title,
          className: meta?.name ?? t("unknownClass"),
          classHex: meta?.hex ?? "#94a3b8",
          gradientTile: meta?.tints.gradientTile ?? { backgroundColor: "#94a3b8" },
          date: s.date,
          startMin: s.startMin,
          endMin: s.endMin,
          status: l.status,
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
                      const StatusIcon = STATUS_ICON[r.status];
                      return (
                      <Link
                        key={r.key}
                        href={`/lessons/${r.lessonId}`}
                        className="list-card group flex items-center gap-3 p-4"
                        style={{ ["--card-accent" as string]: r.classHex }}
                      >
                        <div style={r.gradientTile} className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-foreground leading-tight transition-colors duration-fast group-hover:text-primary">
                            {r.title || t("untitledTopic")}
                          </h4>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground">
                              <ClassSwatch hex={r.classHex} className="size-2.5" />
                              {r.className}
                            </span>
                            <span className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />
                            <span className="shrink-0 tabular-nums">
                              {fmtMin(r.startMin)} — {fmtMin(r.endMin)} ({t("durationSuffix", { count: r.endMin - r.startMin })})
                            </span>
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "shrink-0 gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border-transparent",
                            STATUS_PILL_CLASS[r.status]
                          )}
                        >
                          <StatusIcon className="size-3" />
                          {STATUS_LABELS[r.status]}
                        </Badge>
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
