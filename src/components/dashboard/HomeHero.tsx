"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ClipboardCheck, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { YearProgress } from "@/components/dashboard/YearProgress";
import { cn } from "@/lib/utils";
import { fmtMin } from "@/lib/timetable";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import type { AttendanceEntryStatus } from "@/lib/home-metrics";

/** Bugungi dars — hero subtitle hisobi uchun minimal koʻrinish. */
export type HeroEvent = { startMin: number; endMin: number; className: string };

/**
 * Bosh sahifa hero'si — salom + kun konteksti + harakat-chiplar +
 * oʻquv yili progress-chizigʻi.
 */
export function HomeHero({
  firstName,
  greeting,
  dateLabel,
  restNote,
  classCount,
  todayEvents,
  nowMin,
  checkCount,
  attendance,
  calendar,
  todayKey,
}: {
  firstName: string;
  greeting: string;
  dateLabel: string;
  /** Dam olish kuni / taʼtil izohi — ixtiyoriy. */
  restNote?: string;
  classCount: number;
  /** Bugungi jadval darslari (vaqt boʻyicha tartiblangan). */
  todayEvents: HeroEvent[];
  /** Joriy vaqt (kun boshidan daqiqada). */
  nowMin: number;
  /** Tekshirilishi kutayotgan ishlar soni. */
  checkCount: number;
  /** Bugun davomat kiritilishi (darsi bor sinflar boʻyicha). */
  attendance: AttendanceEntryStatus;
  calendar: AcademicYearCalendar;
  todayKey: string;
}) {
  const t = useTranslations("HomeHero");

  const isSetup = classCount > 0;
  const hasLessons = todayEvents.length > 0;

  // ── Subtitle — kun holatiga qarab ──
  let subtitle: string;
  if (!isSetup) {
    subtitle = t("subtitleGetStarted");
  } else if (!hasLessons) {
    subtitle = dateLabel;
  } else {
    const ongoing = todayEvents.find((e) => e.startMin <= nowMin && nowMin < e.endMin);
    const next = todayEvents.find((e) => e.startMin > nowMin);
    const isFirst = next ? todayEvents.indexOf(next) === 0 : false;
    let status: string;
    if (ongoing) {
      status = t("ongoing", { className: ongoing.className });
    } else if (next) {
      const diff = next.startMin - nowMin;
      if (diff <= 90) {
        status = isFirst
          ? t("firstInMinutes", { minutes: diff })
          : t("nextInMinutes", { minutes: diff });
      } else {
        status = isFirst
          ? t("firstAt", { time: fmtMin(next.startMin) })
          : t("nextAt", { time: fmtMin(next.startMin) });
      }
    } else {
      status = t("allDone");
    }
    subtitle = `${t("lessonsCount", { count: todayEvents.length })} · ${status}`;
  }

  const attendanceDone = attendance.total > 0 && attendance.entered >= attendance.total;
  const showChips = isSetup && (checkCount > 0 || attendance.total > 0);

  return (
    <Card className="relative shrink-0 overflow-hidden rounded-xl border-0 p-0 card-elevation">
      <CardContent className="p-0">
        {/* Landing hero gradienti — yumshoq blur blob (sky → white → amber) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 z-0 rounded-full bg-linear-to-r from-sky-100 via-white to-amber-100 opacity-80 blur-2xl dark:from-slate-800 dark:via-black dark:to-stone-700"
        />
        <div className="relative z-10 px-5 py-4 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="heading-section">
                {greeting}, {firstName}! <AppleEmoji code="1f60a" label="Tabassum" />
              </p>
              <p className="mt-1 text-caption">
                {subtitle}
                {isSetup && !hasLessons && restNote ? (
                  <span className="text-foreground/70">. {restNote}</span>
                ) : null}
              </p>
              {showChips ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {checkCount > 0 ? (
                    <HeroChip href="/dashboard/grades">
                      <ClipboardCheck className="size-4 text-amber-600 dark:text-amber-400" />
                      <span className="tabular-nums font-medium">
                        <AnimatedCounter value={checkCount} />
                      </span>
                      <span className="text-muted-foreground">{t("chipChecks")}</span>
                    </HeroChip>
                  ) : null}
                  {attendance.total > 0 ? (
                    <HeroChip href="/dashboard/attendance">
                      <UserCheck
                        className={cn("size-4", attendanceDone ? "text-success" : "text-sky-600 dark:text-sky-400")}
                      />
                      <span className="text-muted-foreground">{t("chipAttendance")}</span>
                      <span className={cn("tabular-nums font-medium", attendanceDone && "text-success")}>
                        {attendance.entered}/{attendance.total}
                      </span>
                    </HeroChip>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <YearProgress calendar={calendar} todayKey={todayKey} className="mt-3" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Hero harakat-chipi — frosted yuza. */
function HeroChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/45 px-2.5 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
    >
      {children}
    </Link>
  );
}
