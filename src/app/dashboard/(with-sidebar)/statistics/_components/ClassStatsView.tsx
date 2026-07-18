"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import {
  panelCardClass, panelCardContentClass, panelScrollInnerClass,
} from "@/components/DashboardPage";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useClassStore } from "@/store/useClassStore";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  studentPeriodSummaries, classPeriodSummary, gradeDistribution, topicMastery, genderBreakdown,
  attendanceWeeklyTrend, behaviorClimateTrend, assignmentCompletionRate, upcomingDeadlines,
  assignmentQuality, topicStudentMatrix,
  STAT_DEADBAND_PP, type StatPeriod,
} from "@/lib/class-stats";
import { DistributionCard } from "./DistributionCard";
import { TopicMasteryCard } from "./TopicMasteryCard";
import { RiskList } from "./RiskList";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { BehaviorClimateCard } from "./BehaviorClimateCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { AbsenceTierList } from "./AbsenceTierList";
import { AssignmentQualityCard } from "./AssignmentQualityCard";
import { TopicStudentMatrixCard } from "./TopicStudentMatrixCard";
import { GenderDonutChart } from "./GenderDonutChart";

export type StatsGroup = "overview" | "grades" | "attendance" | "behavior";

export function ClassStatsView({
  classId, period, prevPeriod, group,
}: {
  classId: string;
  period: StatPeriod | null;
  prevPeriod: StatPeriod | null;
  group: StatsGroup;
}) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());

  const classData = useGradesStore((s) => s.classDataMap[classId]);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
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
      <div className="h-full flex flex-col">
        <Card className={panelCardClass}>
          <CardContent className={panelCardContentClass}>
            <TypographyMuted className="p-6 text-sm">{t("notEnoughData")}</TypographyMuted>
          </CardContent>
        </Card>
      </div>
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
  const attendanceWeeks = attendanceWeeklyTrend(records, weights, period.range);
  const climate = behaviorClimateTrend(events, period.range);
  const completion = assignmentCompletionRate(classData, period.range, isYear);
  const deadlines = upcomingDeadlines(classData, todayKey);
  const quality = assignmentQuality(classData, period.range, isYear);
  const matrix = topicStudentMatrix(classData, period.range, isYear);

  const deltaStable = summary.summativeDelta === null || Math.abs(summary.summativeDelta) < STAT_DEADBAND_PP;

  return (
    <div className="h-full flex flex-col">
      <Card className={panelCardClass}>
        <CardContent className={panelCardContentClass}>
          <div className={panelScrollInnerClass + " space-y-7"}>
            {group === "overview" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <KpiTile
                    label={t("kpiSummative")}
                    value={summary.summativeAvg !== null ? `${Math.round(summary.summativeAvg)}%` : "—"}
                    sub={summary.summativeDelta !== null ? (deltaStable ? t("deltaStable") : `${summary.summativeDelta > 0 ? "+" : ""}${Math.round(summary.summativeDelta)}pp`) : undefined}
                  />
                  <KpiTile label={t("kpiMedian")} value={summary.summativeMedian !== null ? `${Math.round(summary.summativeMedian)}%` : "—"} />
                  <KpiTile label={t("kpiAttendance")} value={summary.attendanceAvg !== null ? `${Math.round(summary.attendanceAvg)}%` : "—"} />
                  <KpiTile label={t("kpiPositiveBehavior")} value={summary.positivePct !== null ? `${summary.positivePct}%` : "—"} />
                  <KpiTile label={t("kpiCompletion")} value={completion !== null ? `${completion.pct}%` : "—"} />
                </div>

                <GenderDonutChart gender={gender} boysLabel={t("boysShort")} girlsLabel={t("girlsShort")} totalLabel={t("kpiActiveStudents")} />

                <DeadlinesCard deadlines={deadlines} />

                <div className="space-y-3">
                  <TypographyLabel>{t("riskTitle")}</TypographyLabel>
                  <RiskList signals={signals} />
                </div>
              </>
            )}

            {group === "grades" && (
              <>
                <DistributionCard bins={bins} />
                <TopicMasteryCard rows={topics} />
                <AssignmentQualityCard rows={quality} />
                <TopicStudentMatrixCard matrix={matrix} />
              </>
            )}

            {group === "attendance" && (
              <>
                <AttendanceTrendCard weeks={attendanceWeeks} />
                <AbsenceTierList summaries={summaries} students={classData.students} />
              </>
            )}

            {group === "behavior" && <BehaviorClimateCard climate={climate} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
