"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import {
  panelCardClass, panelCardHeaderClass, panelCardContentClass, panelScrollInnerClass,
} from "@/components/DashboardPage";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  statPeriods, currentStatPeriod, previousStatPeriod,
  overviewRows, genderBreakdown, signalCountsByClass,
  studentPeriodSummaries, genderGroupAverages,
} from "@/lib/class-stats";
import { PeriodSelect } from "./PeriodSelect";
import { ClassRowsCard } from "./ClassRowsCard";
import { RiskList } from "./RiskList";
import { GenderGroupCard } from "./GenderGroupCard";

export function OverviewPanel({ onSelectClass }: { onSelectClass: (id: string) => void }) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const liveClasses = useLiveClasses();
  const weights = useMemo(() => statusWeights(statuses), [statuses]);

  const periods = useMemo(() => statPeriods(calendar), [calendar]);
  const [periodId, setPeriodId] = useState<string | null>(null);
  const period = useMemo(() => {
    if (periodId) return periods.find((p) => p.id === periodId) ?? null;
    return currentStatPeriod(calendar, todayKey);
  }, [periods, periodId, calendar, todayKey]);
  const prevPeriod = useMemo(() => (period ? previousStatPeriod(calendar, period) : null), [calendar, period]);

  const classNameById = useMemo(() => new Map(liveClasses.map((c) => [c.id, c.name])), [liveClasses]);

  const signals = useMemo(
    () =>
      deriveAttentionSignals({
        classDataMap, recordsByClass, eventsByClass, versions, calendar, weights, todayKey,
      }).filter((s) => classNameById.has(s.classId)),
    [classDataMap, recordsByClass, eventsByClass, versions, calendar, weights, todayKey, classNameById]
  );

  const rows = useMemo(() => {
    if (!period) return [];
    return overviewRows({
      classDataMap, recordsByClass, eventsByClass, weights,
      range: period.range, prevRange: prevPeriod?.range ?? null,
      isYear: period.kind === "year", signalCounts: signalCountsByClass(signals),
    });
  }, [classDataMap, recordsByClass, eventsByClass, weights, period, prevPeriod, signals]);

  const gender = useMemo(() => {
    const students = Object.values(classDataMap)
      .filter((cd) => cd && classNameById.has(cd.info.id))
      .flatMap((cd) => cd!.students);
    return genderBreakdown(students);
  }, [classDataMap, classNameById]);

  const genderGroups = useMemo(() => {
    if (!period) return null;
    const isYear = period.kind === "year";
    const allSummaries = Object.entries(classDataMap)
      .filter(([classId, cd]) => cd && classNameById.has(classId))
      .flatMap(([classId, cd]) =>
        studentPeriodSummaries({
          classData: cd!,
          records: recordsByClass[classId] ?? [],
          events: eventsByClass[classId] ?? [],
          weights,
          range: period.range,
          isYear,
        })
      );
    return genderGroupAverages(allSummaries);
  }, [classDataMap, classNameById, recordsByClass, eventsByClass, weights, period]);

  const activeStudents = rows.reduce((sum, r) => sum + r.studentCount, 0);
  const todayAttendance = rows.length > 0
    ? Math.round(rows.filter((r) => r.attendanceAvg !== null).reduce((s, r) => s + (r.attendanceAvg ?? 0), 0) /
        Math.max(1, rows.filter((r) => r.attendanceAvg !== null).length))
    : null;

  return (
    <div className="h-full flex flex-col">
      <Card className={panelCardClass}>
        <CardHeader className={cnHeader()}>
          <div className="flex min-w-0 items-center gap-2 flex-1">
            <SectionIcon><BarChart3 /></SectionIcon>
            <CardTitle className="truncate">{t("overviewTitle")}</CardTitle>
          </div>
          {period && <PeriodSelect periods={periods} value={period.id} onChange={setPeriodId} />}
        </CardHeader>
        <CardContent className={panelCardContentClass}>
          <div className={panelScrollInnerClass + " space-y-7"}>
            {/* ── KPI plitkalar ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <KpiTile label={t("kpiActiveStudents")} value={activeStudents} sub={t("kpiGenderSub", {
                boys: gender.boys, boysPct: gender.boysPct ?? 0, girls: gender.girls, girlsPct: gender.girlsPct ?? 0,
              })} />
              <KpiTile label={t("kpiSignals")} value={signals.length} />
              <KpiTile label={t("kpiClasses")} value={rows.length} />
              <KpiTile label={t("kpiAttendanceToday")} value={todayAttendance !== null ? `${todayAttendance}%` : "—"} />
            </div>

            {/* ── Sinf qatorlari ── */}
            <div className="space-y-3">
              <TypographyLabel>{t("classesTitle")}</TypographyLabel>
              <ClassRowsCard rows={rows} onSelect={onSelectClass} />
            </div>

            {genderGroups && <GenderGroupCard averages={genderGroups} />}

            {/* ── Risk registri ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <TypographyLabel>{t("riskTitle")}</TypographyLabel>
                <TypographyMuted className="text-xs">{t("riskTodayNote")}</TypographyMuted>
              </div>
              <RiskList signals={signals} classNameOf={(id) => classNameById.get(id)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cnHeader() {
  return panelCardHeaderClass + " justify-between min-h-[4.5rem] px-5 py-5! gap-3";
}

function KpiTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3 flex flex-col gap-1">
      <TypographyLabel className="truncate">{label}</TypographyLabel>
      <div className="text-2xl font-bold tabular-nums leading-none">{value}</div>
      {sub && <div className="text-xs text-muted-foreground/80 truncate">{sub}</div>}
    </div>
  );
}
