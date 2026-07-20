"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Users, CalendarClock, CalendarCheck, BarChart3, Layers, ClipboardCheck,
  Table as TableIcon, TrendingUp, UserX, HeartPulse, BookOpen, FileText,
} from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useClassStore } from "@/store/useClassStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { statusWeights, deriveLessonDays } from "@/lib/attendance-data";
import { skillBreakdown, eventStats } from "@/lib/behavior-data";
import { deriveAttentionSignals, aggregateStudentRisk } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  studentPeriodSummaries, classPeriodSummary, gradeDistribution, topicMastery, genderBreakdown,
  attendanceWeeklyTrend, assignmentCompletionRate, upcomingDeadlines,
  assignmentQuality, topicStudentMatrix, assignmentsInRange,
  type StatPeriod,
} from "@/lib/class-stats";
import { StatCard } from "@/components/StatCard";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { BehaviorDonut } from "@/components/behavior/BehaviorDonut";
import { DistributionCard } from "./DistributionCard";
import { TopicMasteryCard } from "./TopicMasteryCard";
import { StudentRiskCard, PositiveStudentsStrip } from "./StudentRiskCard";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { AbsenceTierList } from "./AbsenceTierList";
import { AssignmentQualityCard } from "./AssignmentQualityCard";
import { TopicStudentMatrixCard } from "./TopicStudentMatrixCard";
import { GenderDonutChart } from "./GenderDonutChart";
import { CompletionDonutChart } from "./CompletionDonutChart";
import { StatEmpty } from "./StatEmpty";

/** Sinf tanlanganda YAGONA uzluksiz koʻrinish — avvalgi Umumiy/Baholar/
    Davomat/Xulq tab boʻlinishi olib tashlandi, barcha kartalar bitta
    aylantiriladigan oqimda: KPI → jins → muddatlar → eʼtibor → baholar
    (taqsimot/mavzular/sifat/matritsa) → davomat (trend/darajalar) → xulq. */
export function ClassStatsView({
  classId, period, prevPeriod, calendar,
}: {
  classId: string;
  period: StatPeriod | null;
  prevPeriod: StatPeriod | null;
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
  const attendanceWeeks = attendanceWeeklyTrend(records, weights, period.range);
  const completion = assignmentCompletionRate(classData, period.range, isYear);
  const deadlines = upcomingDeadlines(classData, todayKey);
  const quality = assignmentQuality(classData, period.range, isYear);
  const matrix = topicStudentMatrix(classData, period.range, isYear);
  const hasFlaggedAbsence = summaries.some((s) => s.absenceTier === "watch" || s.absenceTier === "chronic");
  const riskSummaries = aggregateStudentRisk(signals);
  const activeStudentCount = classData.students.filter((s) => s.status !== "archived").length;
  const lessonsCount = deriveLessonDays(classId, period.range, calendar, versions).length;
  const assignmentsCount = assignmentsInRange(classData.assignments, period.range, isYear).length;

  const eventsInRange = events.filter((e) => e.date >= period.range.start && e.date <= period.range.end);
  const behaviorSlices = skillBreakdown(eventsInRange);
  const behaviorStats = eventStats(eventsInRange);

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label={t("kpiActiveStudents")} value={activeStudentCount} unit={t("unitPeople")} />
          <StatCard icon={CalendarCheck} label={t("kpiAttendance")} value={summary.attendanceAvg !== null ? `${Math.round(summary.attendanceAvg)}%` : "—"} />
          <StatCard icon={BookOpen} label={t("kpiLessons")} value={lessonsCount} unit={t("unitCount")} />
          <StatCard icon={FileText} label={t("kpiAssignments")} value={assignmentsCount} unit={t("unitCount")} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DashboardSectionCard icon={Users} title={t("genderTitle")}>
            <GenderDonutChart
              gender={gender}
              boysLabel={t("boysFull")}
              girlsLabel={t("girlsFull")}
              unitLabel={t("unitPeople")}
              totalLabel={t("totalStudentsLabel")}
            />
          </DashboardSectionCard>

          <DashboardSectionCard icon={HeartPulse} title={t("behaviorSplitTitle")}>
            {behaviorSlices.length === 0 ? (
              <StatEmpty icon={HeartPulse} title={t("notEnoughData")} />
            ) : (
              <BehaviorDonut slices={behaviorSlices} positivePct={behaviorStats.positivePct} />
            )}
          </DashboardSectionCard>

          <DashboardSectionCard icon={ClipboardCheck} title={t("kpiCompletion")}>
            {completion === null ? (
              <StatEmpty icon={ClipboardCheck} title={t("notEnoughData")} />
            ) : (
              <CompletionDonutChart
                completion={completion}
                completedLabel={t("completedLabel")}
                notCompletedLabel={t("notCompletedLabel")}
                totalLabel={t("kpiCompletion")}
                unitLabel={t("unitCount")}
              />
            )}
          </DashboardSectionCard>
        </div>

        {deadlines.length > 0 && (
          <DashboardSectionCard icon={CalendarClock} title={t("deadlinesTitle")}>
            <DeadlinesCard deadlines={deadlines} />
          </DashboardSectionCard>
        )}

        <StudentRiskCard summaries={riskSummaries} />
        <PositiveStudentsStrip summaries={riskSummaries} />

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

        <DashboardSectionCard icon={TrendingUp} title={t("attendanceTrendTitle")}>
          <AttendanceTrendCard weeks={attendanceWeeks} />
        </DashboardSectionCard>
        {hasFlaggedAbsence && (
          <DashboardSectionCard icon={UserX} title={t("absenceTiersTitle")}>
            <AbsenceTierList summaries={summaries} students={classData.students} />
          </DashboardSectionCard>
        )}
      </div>
    </div>
  );
}
