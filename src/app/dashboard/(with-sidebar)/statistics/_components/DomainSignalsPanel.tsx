"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, BarChart3, HeartPulse } from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useClassStore } from "@/store/useClassStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals, aggregateStudentRisk, type AttentionSignal } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  overviewRows, studentPeriodSummaries, gradeDistribution, attendanceWeeklyTrend,
  behaviorClimateTrend, type StatPeriod,
} from "@/lib/class-stats";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { DistributionCard } from "./DistributionCard";
import { BehaviorClimateCard } from "./BehaviorClimateCard";
import { ClassRankingCard } from "./ClassRankingCard";
import { StudentRiskCard, PositiveStudentsStrip } from "./StudentRiskCard";

export type SignalDomain = "attendance" | "grades" | "behavior";

const DOMAIN_KINDS: Record<SignalDomain, AttentionSignal["kind"][]> = {
  attendance: ["absent-streak", "low-attendance", "attendance-missing", "attendance-recovery"],
  grades: ["grade-drop", "grade-rise"],
  behavior: ["behavior-cluster"],
};

/** Sinf tanlanmaganda Baholar/Davomat/Xulq tablari — endi faqat xom signal
    roʻyxati emas, maktab-darajali agregat (trend/taqsimot/iqlim grafigi +
    sinflar reytingi) + shu domenning oʻquvchi-markazli risk roʻyxati
    (StudentRiskCard — Umumiy bilan bir xil naqsh). Sinf-ichi koʻrinish
    (ClassStatsView) bilan bir xil pure agregatsiya funksiyalaridan
    (`class-stats.ts`) foydalanadi, faqat butun maktab boʻyicha yigʻilgan
    holda. */
export function DomainSignalsPanel({
  domain, calendar, period, onSelectClass,
}: {
  domain: SignalDomain;
  calendar: AcademicYearCalendar;
  period: StatPeriod | null;
  onSelectClass?: (classId: string) => void;
}) {
  const tStat = useTranslations("StatisticsPage");
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
      })
        .filter((s) => classNameById.has(s.classId))
        .filter((s) => DOMAIN_KINDS[domain].includes(s.kind)),
    [classDataMap, recordsByClass, eventsByClass, versions, calendar, weights, todayKey, classNameById, domain]
  );
  const riskSummaries = useMemo(() => aggregateStudentRisk(signals), [signals]);

  const rows = useMemo(() => {
    if (!period) return [];
    return overviewRows({
      classDataMap, recordsByClass, eventsByClass, weights,
      range: period.range, prevRange: null, isYear: period.kind === "year", signalCounts: {},
    }).filter((r) => classNameById.has(r.classId));
  }, [classDataMap, recordsByClass, eventsByClass, weights, period, classNameById]);

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

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-1">
        {domain === "attendance" && (
          <>
            <DashboardSectionCard icon={TrendingUp} title={tStat("attendanceTrendTitle")}>
              <AttendanceTrendCard weeks={attendanceWeeks} />
            </DashboardSectionCard>
            <ClassRankingCard
              icon={TrendingUp}
              title={tStat("attendanceRankingTitle")}
              rows={rows.map((r) => ({ classId: r.classId, name: r.name, color: r.color, studentCount: r.studentCount, value: r.attendanceAvg }))}
              onSelect={onSelectClass}
            />
          </>
        )}

        {domain === "grades" && (
          <>
            <DashboardSectionCard icon={BarChart3} title={tStat("distributionTitle")}>
              <DistributionCard bins={bins} />
            </DashboardSectionCard>
            <ClassRankingCard
              icon={BarChart3}
              title={tStat("gradesRankingTitle")}
              rows={rows.map((r) => ({ classId: r.classId, name: r.name, color: r.color, studentCount: r.studentCount, value: r.summativeAvg }))}
              onSelect={onSelectClass}
            />
          </>
        )}

        {domain === "behavior" && climate && (
          <DashboardSectionCard icon={HeartPulse} title={tStat("behaviorClimateTitle")}>
            <BehaviorClimateCard climate={climate} />
          </DashboardSectionCard>
        )}

        <StudentRiskCard summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />
        <PositiveStudentsStrip summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />
      </div>
    </div>
  );
}
