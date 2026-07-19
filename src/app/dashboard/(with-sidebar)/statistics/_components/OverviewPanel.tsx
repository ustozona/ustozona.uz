"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Users, GraduationCap, ShieldAlert, CalendarCheck, TrendingUp } from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals, aggregateStudentRisk } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  overviewRows, genderBreakdown, signalCountsByClass,
  studentPeriodSummaries, genderGroupAverages, attendanceWeeklyTrend, type StatPeriod,
} from "@/lib/class-stats";
import { StatCard } from "@/components/StatCard";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { StudentRiskCard, PositiveStudentsStrip } from "./StudentRiskCard";
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

  const riskSummaries = useMemo(() => aggregateStudentRisk(signals), [signals]);
  const riskStudentCount = riskSummaries.filter((s) => s.riskScore > 0).length;

  const prevRows = useMemo(() => {
    if (!prevPeriod) return [];
    return overviewRows({
      classDataMap, recordsByClass, eventsByClass, weights,
      range: prevPeriod.range, prevRange: null,
      isYear: prevPeriod.kind === "year", signalCounts: {},
    });
  }, [classDataMap, recordsByClass, eventsByClass, weights, prevPeriod]);

  const avgAttendance = (list: typeof rows) => {
    const withRate = list.filter((r) => r.attendanceAvg !== null);
    return withRate.length > 0
      ? Math.round(withRate.reduce((s, r) => s + (r.attendanceAvg ?? 0), 0) / withRate.length)
      : null;
  };

  const activeStudents = rows.reduce((sum, r) => sum + r.studentCount, 0);
  const periodAttendance = avgAttendance(rows);
  const prevPeriodAttendance = avgAttendance(prevRows);
  const attendanceDelta =
    periodAttendance !== null && prevPeriodAttendance !== null ? periodAttendance - prevPeriodAttendance : null;

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
          <StatCard icon={ShieldAlert} label={t("riskTitle")} value={riskStudentCount} unit={t("unitPeople")} />
          <StatCard icon={GraduationCap} label={t("kpiClasses")} value={rows.length} unit={t("unitCount")} />
          <StatCard
            icon={CalendarCheck}
            label={t("kpiAttendance")}
            value={periodAttendance !== null ? `${periodAttendance}%` : "—"}
            delta={attendanceDelta !== null && Math.abs(attendanceDelta) >= 1 ? `${Math.round(Math.abs(attendanceDelta))}pp` : undefined}
            deltaType={attendanceDelta !== null && attendanceDelta > 0 ? "positive" : "negative"}
          />
        </div>

        <DashboardSectionCard icon={TrendingUp} title={t("attendanceTrendTitle")}>
          <AttendanceTrendCard weeks={attendanceWeeks} />
        </DashboardSectionCard>

        <StudentRiskCard summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />
        <PositiveStudentsStrip summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
          <DashboardSectionCard icon={Users} title={t("genderTitle")}>
            <GenderDonutChart gender={gender} boysLabel={t("boysFull")} girlsLabel={t("girlsFull")} unitLabel={t("unitPeople")} />
          </DashboardSectionCard>

          {genderGroups && (
            <DashboardSectionCard icon={Users} title={t("genderGroupTitle")}>
              <GenderGroupCard averages={genderGroups} />
            </DashboardSectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
