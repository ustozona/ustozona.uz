"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Users, GraduationCap, ShieldAlert, CalendarCheck, TrendingUp } from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  overviewRows, genderBreakdown, signalCountsByClass,
  studentPeriodSummaries, genderGroupAverages, attendanceWeeklyTrend, type StatPeriod,
} from "@/lib/class-stats";
import { StatCard } from "@/components/StatCard";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { RiskList } from "./RiskList";
import { GenderGroupCard } from "./GenderGroupCard";
import { GenderDonutChart } from "./GenderDonutChart";
import { AttendanceTrendCard } from "./AttendanceTrendCard";

export function OverviewPanel({
  period, prevPeriod, calendar,
}: {
  period: StatPeriod | null;
  prevPeriod: StatPeriod | null;
  calendar: AcademicYearCalendar;
}) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const liveClasses = useLiveClasses();
  const weights = useMemo(() => statusWeights(statuses), [statuses]);

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
  const attendanceRows = rows.filter((r) => r.attendanceAvg !== null);
  const periodAttendance = attendanceRows.length > 0
    ? Math.round(attendanceRows.reduce((s, r) => s + (r.attendanceAvg ?? 0), 0) / attendanceRows.length)
    : null;

  const allRecords = useMemo(
    () =>
      Object.entries(recordsByClass)
        .filter(([classId]) => classNameById.has(classId))
        .flatMap(([, records]) => records),
    [recordsByClass, classNameById]
  );
  const attendanceWeeks = useMemo(
    () => (period ? attendanceWeeklyTrend(allRecords, weights, period.range) : []),
    [allRecords, weights, period]
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-1">
        {/* ── KPI plitkalar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label={t("kpiActiveStudents")} value={activeStudents} unit={t("unitPeople")} />
          <StatCard icon={ShieldAlert} label={t("riskTitle")} value={signals.length} unit={t("unitCount")} />
          <StatCard icon={GraduationCap} label={t("kpiClasses")} value={rows.length} unit={t("unitCount")} />
          <StatCard icon={CalendarCheck} label={t("kpiAttendance")} value={periodAttendance !== null ? `${periodAttendance}%` : "—"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
          <DashboardSectionCard icon={Users} title={t("genderTitle")}>
            <GenderDonutChart gender={gender} boysLabel={t("boysFull")} girlsLabel={t("girlsFull")} unitLabel={t("unitPeople")} />
          </DashboardSectionCard>

          <DashboardSectionCard icon={TrendingUp} title={t("attendanceTrendTitle")}>
            <AttendanceTrendCard weeks={attendanceWeeks} />
          </DashboardSectionCard>
        </div>

        {genderGroups && (
          <DashboardSectionCard icon={Users} title={t("genderGroupTitle")}>
            <GenderGroupCard averages={genderGroups} />
          </DashboardSectionCard>
        )}

        <DashboardSectionCard
          icon={ShieldAlert}
          title={t("riskTitle")}
          action={<TypographyMuted className="text-xs">{t("riskTodayNote")}</TypographyMuted>}
        >
          <RiskList signals={signals} classNameOf={(id) => classNameById.get(id)} />
        </DashboardSectionCard>
      </div>
    </div>
  );
}
