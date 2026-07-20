"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Users, GraduationCap, ShieldAlert, CalendarCheck, TrendingUp, BarChart3, HeartPulse,
} from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useClassStore } from "@/store/useClassStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals, aggregateStudentRisk } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  overviewRows, genderBreakdown, signalCountsByClass,
  studentPeriodSummaries, gradeDistribution, attendanceWeeklyTrend, behaviorClimateTrend,
  type StatPeriod,
} from "@/lib/class-stats";
import { StatCard } from "@/components/StatCard";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { StudentRiskCard, PositiveStudentsStrip } from "./StudentRiskCard";
import { GenderDonutChart } from "./GenderDonutChart";
import { ClassRankingCard } from "./ClassRankingCard";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { DistributionCard } from "./DistributionCard";
import { BehaviorClimateCard } from "./BehaviorClimateCard";

/** Butun maktab boʻyicha YAGONA koʻrinish — avvalgi Umumiy/Baholar/Davomat/
    Xulq tablari shu bitta oqimga yigʻildi: KPI + eʼtibor roʻyxati + jins
    donut + domen grafiklari (davomat trendi, baho taqsimoti, xulq iqlimi).
    Sinf tanlansa oʻrnini ClassStatsView egallaydi. */
export function OverviewPanel({
  period, prevPeriod, calendar, onSelectClass,
}: {
  period: StatPeriod | null;
  prevPeriod: StatPeriod | null;
  calendar: AcademicYearCalendar;
  onSelectClass?: (classId: string) => void;
}) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const journalScale = useClassStore((s) => s.journalScale);
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

  // Barcha jonli sinflar oʻquvchilarining davr xulosalari — baho taqsimoti
  // shu hisobdan foydalanadi.
  const allSummaries = useMemo(() => {
    if (!period) return [];
    const isYear = period.kind === "year";
    return Object.entries(classDataMap)
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
  }, [classDataMap, classNameById, recordsByClass, eventsByClass, weights, period]);

  const bins = useMemo(
    () => (period ? gradeDistribution(allSummaries, journalScale.kind, journalScale.labelStyle) : null),
    [allSummaries, journalScale, period]
  );

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

  const allEvents = useMemo(
    () =>
      Object.entries(eventsByClass)
        .filter(([classId]) => classNameById.has(classId))
        .flatMap(([, events]) => events),
    [eventsByClass, classNameById]
  );
  const climate = useMemo(
    () => (period ? behaviorClimateTrend(allEvents, period.range) : null),
    [allEvents, period]
  );

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

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-1">
        {/* ── KPI plitkalar ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={GraduationCap} label={t("kpiClasses")} value={rows.length} unit={t("unitCount")} />
          <StatCard icon={Users} label={t("kpiActiveStudents")} value={activeStudents} unit={t("unitPeople")} />
          <StatCard
            icon={CalendarCheck}
            label={t("kpiAttendance")}
            value={periodAttendance !== null ? `${periodAttendance}%` : "—"}
            delta={attendanceDelta !== null && Math.abs(attendanceDelta) >= 1 ? `${Math.round(Math.abs(attendanceDelta))}pp` : undefined}
            deltaType={attendanceDelta !== null && attendanceDelta > 0 ? "positive" : "negative"}
          />
          <StatCard icon={ShieldAlert} label={t("riskTitle")} value={riskStudentCount} unit={t("unitPeople")} />
        </div>

        <ClassRankingCard
          icon={ShieldAlert}
          title={t("riskRankingTitle")}
          format="count"
          limit={3}
          rows={rows.map((r) => ({ classId: r.classId, name: r.name, color: r.color, studentCount: r.studentCount, value: r.signalCount }))}
          onSelect={onSelectClass}
        />

        <StudentRiskCard summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />
        <PositiveStudentsStrip summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />

        <DashboardSectionCard icon={Users} title={t("genderTitle")}>
          <GenderDonutChart
            gender={gender}
            boysLabel={t("boysFull")}
            girlsLabel={t("girlsFull")}
            unitLabel={t("unitPeople")}
            totalLabel={t("totalStudentsLabel")}
          />
        </DashboardSectionCard>

        {/* ── Domen grafiklari (avvalgi Davomat/Baholar/Xulq tablaridan) ── */}
        <DashboardSectionCard icon={TrendingUp} title={t("attendanceTrendTitle")}>
          <AttendanceTrendCard weeks={attendanceWeeks} />
        </DashboardSectionCard>

        <DashboardSectionCard icon={BarChart3} title={t("distributionTitle")}>
          <DistributionCard bins={bins} />
        </DashboardSectionCard>

        {climate && (
          <DashboardSectionCard icon={HeartPulse} title={t("behaviorClimateTitle")}>
            <BehaviorClimateCard climate={climate} />
          </DashboardSectionCard>
        )}
      </div>
    </div>
  );
}
