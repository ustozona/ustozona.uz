"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  panelCardClass, panelCardHeaderClass, panelCardContentClass, panelScrollInnerClass,
} from "@/components/DashboardPage";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useClassStore } from "@/store/useClassStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  statPeriods, currentStatPeriod, previousStatPeriod,
  studentPeriodSummaries, classPeriodSummary, gradeDistribution, topicMastery, genderBreakdown,
  attendanceWeeklyTrend, behaviorClimateTrend, assignmentCompletionRate, upcomingDeadlines,
  assignmentQuality, topicStudentMatrix,
  STAT_DEADBAND_PP,
} from "@/lib/class-stats";
import { PeriodSelect } from "./PeriodSelect";
import { DistributionCard } from "./DistributionCard";
import { TopicMasteryCard } from "./TopicMasteryCard";
import { RiskList } from "./RiskList";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { BehaviorClimateCard } from "./BehaviorClimateCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { AbsenceTierList } from "./AbsenceTierList";
import { AssignmentQualityCard } from "./AssignmentQualityCard";
import { TopicStudentMatrixCard } from "./TopicStudentMatrixCard";

export function ClassStatsView({ classId, onBack }: { classId: string; onBack: () => void }) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());

  const classData = useGradesStore((s) => s.classDataMap[classId]);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const journalScale = useClassStore((s) => s.journalScale);
  const weights = useMemo(() => statusWeights(statuses), [statuses]);
  const records = useMemo(() => recordsByClass[classId] ?? [], [recordsByClass, classId]);
  const events = useMemo(() => eventsByClass[classId] ?? [], [eventsByClass, classId]);

  const periods = useMemo(() => statPeriods(calendar), [calendar]);
  const [periodId, setPeriodId] = useState<string | null>(null);
  const period = useMemo(() => {
    if (periodId) return periods.find((p) => p.id === periodId) ?? null;
    return currentStatPeriod(calendar, todayKey);
  }, [periods, periodId, calendar, todayKey]);
  const prevPeriod = useMemo(() => (period ? previousStatPeriod(calendar, period) : null), [calendar, period]);

  const classDataMap = useGradesStore((s) => s.classDataMap);

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
  const hex = CLASS_COLOR_HEX[classColor(classData.info)];
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
        <CardHeader className={panelCardHeaderClass + " justify-between min-h-[4.5rem] px-5 py-5! gap-3"}>
          <div className="flex min-w-0 items-center gap-2 flex-1">
            <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("backToOverview")}>
              <ArrowLeft className="size-4" />
            </Button>
            <SectionIcon><ClassSwatch hex={hex} className="size-4" /></SectionIcon>
            <div className="min-w-0">
              <CardTitle className="truncate">{classData.info.name}</CardTitle>
              <TypographyMuted className="text-xs truncate">
                {t("genderSummary", { boys: gender.boys, boysPct: gender.boysPct ?? 0, girls: gender.girls, girlsPct: gender.girlsPct ?? 0 })}
              </TypographyMuted>
            </div>
          </div>
          <PeriodSelect periods={periods} value={period.id} onChange={setPeriodId} />
        </CardHeader>
        <CardContent className={panelCardContentClass}>
          <div className={panelScrollInnerClass + " space-y-7"}>
            {/* ── KPI qatori ── */}
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

            <DistributionCard bins={bins} />
            <TopicMasteryCard rows={topics} />
            <AttendanceTrendCard weeks={attendanceWeeks} />
            <BehaviorClimateCard climate={climate} />
            <DeadlinesCard deadlines={deadlines} />
            <AbsenceTierList summaries={summaries} students={classData.students} />
            <AssignmentQualityCard rows={quality} />
            <TopicStudentMatrixCard matrix={matrix} />

            <div className="space-y-3">
              <TypographyLabel>{t("riskTitle")}</TypographyLabel>
              <RiskList signals={signals} />
            </div>
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
