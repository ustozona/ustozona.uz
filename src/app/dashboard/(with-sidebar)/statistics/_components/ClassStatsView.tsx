"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Users, CalendarClock, CalendarCheck, BarChart3, Layers, ClipboardCheck,
  Table as TableIcon, TrendingUp, UserX, HeartPulse, GraduationCap, Percent,
} from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useClassStore } from "@/store/useClassStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals, aggregateStudentRisk } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  studentPeriodSummaries, classPeriodSummary, gradeDistribution, topicMastery, genderBreakdown, genderPerformanceSplit,
  attendanceWeeklyTrend, behaviorClimateTrend, assignmentCompletionRate, upcomingDeadlines,
  assignmentQuality, topicStudentMatrix,
  STAT_DEADBAND_PP, type StatPeriod,
} from "@/lib/class-stats";
import { StatCard } from "@/components/StatCard";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { DistributionCard } from "./DistributionCard";
import { TopicMasteryCard } from "./TopicMasteryCard";
import { StudentRiskCard, PositiveStudentsStrip } from "./StudentRiskCard";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { BehaviorClimateCard } from "./BehaviorClimateCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { AbsenceTierList } from "./AbsenceTierList";
import { AssignmentQualityCard } from "./AssignmentQualityCard";
import { TopicStudentMatrixCard } from "./TopicStudentMatrixCard";
import { GenderDonutChart } from "./GenderDonutChart";

export type StatsGroup = "overview" | "classes" | "students" | "grades" | "attendance" | "behavior";

export function ClassStatsView({
  classId, period, prevPeriod, group, calendar,
}: {
  classId: string;
  period: StatPeriod | null;
  prevPeriod: StatPeriod | null;
  group: StatsGroup;
  calendar: AcademicYearCalendar;
}) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());

  const classData = useGradesStore((s) => s.classDataMap[classId]);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const journalScale = useClassStore((s) => s.journalScale);
  const weights = useMemo(() => statusWeights(statuses), [statuses]);
  const records = useMemo(() => recordsByClass[classId] ?? [], [recordsByClass, classId]);
  const events = useMemo(() => eventsByClass[classId] ?? [], [eventsByClass, classId]);

  const signals = useMemo(
    () =>
      deriveAttentionSignals({
        classDataMap, recordsByClass, eventsByClass, versions, calendar, weights, todayKey,
      }).filter((s) => s.classId === classId),
    [classDataMap, recordsByClass, eventsByClass, versions, calendar, weights, todayKey, classId]
  );

  if (!classData || !period) {
    return (
      <DashboardSectionCard>
        <TypographyMuted className="text-sm">{t("notEnoughData")}</TypographyMuted>
      </DashboardSectionCard>
    );
  }

  const isYear = period.kind === "year";
  const summaries = studentPeriodSummaries({ classData, records, events, weights, range: period.range, isYear });
  const summary = classPeriodSummary({
    classData, records, events, weights, range: period.range,
    prevRange: prevPeriod?.range ?? null, isYear,
  });
  const bins = gradeDistribution(summaries, journalScale.kind, journalScale.labelStyle);
  const topics = topicMastery(classData, period.range, isYear);
  const gender = genderBreakdown(classData.students);
  const genderGap = genderPerformanceSplit(summaries);
  const attendanceWeeks = attendanceWeeklyTrend(records, weights, period.range);
  const climate = behaviorClimateTrend(events, period.range);
  const completion = assignmentCompletionRate(classData, period.range, isYear);
  const deadlines = upcomingDeadlines(classData, todayKey);
  const quality = assignmentQuality(classData, period.range, isYear);
  const matrix = topicStudentMatrix(classData, period.range, isYear);
  const hasFlaggedAbsence = summaries.some((s) => s.absenceTier === "watch" || s.absenceTier === "chronic");
  const riskSummaries = aggregateStudentRisk(signals);

  const deltaStable = summary.summativeDelta === null || Math.abs(summary.summativeDelta) < STAT_DEADBAND_PP;

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-1">
        {group === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={GraduationCap}
                label={t("kpiSummative")}
                value={summary.summativeAvg !== null ? `${Math.round(summary.summativeAvg)}%` : "—"}
                sub={summary.summativeDelta !== null && deltaStable ? t("deltaStable") : undefined}
                delta={summary.summativeDelta !== null && !deltaStable ? `${Math.round(Math.abs(summary.summativeDelta))}pp` : undefined}
                deltaType={summary.summativeDelta !== null && summary.summativeDelta > 0 ? "positive" : "negative"}
              />
              <StatCard icon={Percent} label={t("kpiMedian")} value={summary.summativeMedian !== null ? `${Math.round(summary.summativeMedian)}%` : "—"} />
              <StatCard icon={CalendarCheck} label={t("kpiAttendance")} value={summary.attendanceAvg !== null ? `${Math.round(summary.attendanceAvg)}%` : "—"} />
              <StatCard icon={HeartPulse} label={t("kpiPositiveBehavior")} value={summary.positivePct !== null ? `${summary.positivePct}%` : "—"} />
              <StatCard icon={ClipboardCheck} label={t("kpiCompletion")} value={completion !== null ? `${completion.pct}%` : "—"} />
            </div>

            <DashboardSectionCard icon={Users} title={t("genderTitle")}>
              <GenderDonutChart
                gender={gender}
                boysLabel={t("boysFull")}
                girlsLabel={t("girlsFull")}
                unitLabel={t("unitPeople")}
                totalLabel={t("totalStudentsLabel")}
                gap={genderGap}
                gapGradeLabel={t("kpiSummative")}
                gapAttendanceLabel={t("kpiAttendance")}
              />
            </DashboardSectionCard>

            {deadlines.length > 0 && (
              <DashboardSectionCard icon={CalendarClock} title={t("deadlinesTitle")}>
                <DeadlinesCard deadlines={deadlines} />
              </DashboardSectionCard>
            )}

            <StudentRiskCard summaries={riskSummaries} />
            <PositiveStudentsStrip summaries={riskSummaries} />
          </>
        )}

        {group === "grades" && (
          <>
            <DashboardSectionCard icon={BarChart3} title={t("distributionTitle")}>
              <DistributionCard bins={bins} />
            </DashboardSectionCard>
            <DashboardSectionCard icon={Layers} title={t("topicsTitle")}>
              <TopicMasteryCard rows={topics} />
            </DashboardSectionCard>
            <DashboardSectionCard icon={ClipboardCheck} title={t("assignmentQualityTitle")}>
              <AssignmentQualityCard rows={quality} />
            </DashboardSectionCard>
            <DashboardSectionCard icon={TableIcon} title={t("matrixTitle")}>
              <TopicStudentMatrixCard matrix={matrix} />
            </DashboardSectionCard>
          </>
        )}

        {group === "attendance" && (
          <>
            <DashboardSectionCard icon={TrendingUp} title={t("attendanceTrendTitle")}>
              <AttendanceTrendCard weeks={attendanceWeeks} />
            </DashboardSectionCard>
            {hasFlaggedAbsence && (
              <DashboardSectionCard icon={UserX} title={t("absenceTiersTitle")}>
                <AbsenceTierList summaries={summaries} students={classData.students} />
              </DashboardSectionCard>
            )}
          </>
        )}

        {group === "behavior" && (
          <DashboardSectionCard icon={HeartPulse} title={t("behaviorClimateTitle")}>
            <BehaviorClimateCard climate={climate} />
          </DashboardSectionCard>
        )}
      </div>
    </div>
  );
}
