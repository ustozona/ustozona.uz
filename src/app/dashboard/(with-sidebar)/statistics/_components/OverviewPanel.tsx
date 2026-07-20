"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Users, GraduationCap, ShieldAlert, CalendarCheck, TrendingUp, BarChart3, HeartPulse,
  BookOpen, ClipboardList, Info, ClipboardCheck,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useClassStore } from "@/store/useClassStore";
import { useLessonStore } from "@/store/useLessonStore";
import { lessonClassIds } from "@/lib/lessons-data";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { skillBreakdown, eventStats } from "@/lib/behavior-data";
import { deriveAttentionSignals, aggregateStudentRisk } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import {
  overviewRows, genderBreakdown, signalCountsByClass, assignmentCompletionRate,
  studentPeriodSummaries, gradeDistribution, attendanceWeeklyTrend,
  type StatPeriod,
} from "@/lib/class-stats";
import { StatCard } from "@/components/StatCard";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { BehaviorDonut } from "@/components/behavior/BehaviorDonut";
import { PositiveStudentsStrip } from "./StudentRiskCard";
import { GenderDonutChart } from "./GenderDonutChart";
import { CompletionDonutChart } from "./CompletionDonutChart";
import { AttendanceTrendCard } from "./AttendanceTrendCard";
import { DistributionCard } from "./DistributionCard";
import { StatEmpty } from "./StatEmpty";

/** Butun maktab boʻyicha YAGONA koʻrinish — avvalgi Umumiy/Baholar/Davomat/
    Xulq tablari shu bitta oqimga yigʻildi: KPI + eʼtibor roʻyxati + jins
    donut + domen grafiklari (davomat trendi, baho taqsimoti, xulq iqlimi).
    Sinf tanlansa oʻrnini ClassStatsView egallaydi. */
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
  const journalScale = useClassStore((s) => s.journalScale);
  const allLessons = useLessonStore((s) => s.lessons);
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
  // Xulq-atvor donutchasi — sinf tanlanganda ClassStatsView'dagi bilan bir
  // xil hisob, faqat butun maktab hodisalari boʻyicha.
  const behaviorEventsInRange = useMemo(
    () => (period ? allEvents.filter((e) => e.date >= period.range.start && e.date <= period.range.end) : []),
    [allEvents, period]
  );
  const behaviorSlices = useMemo(() => skillBreakdown(behaviorEventsInRange), [behaviorEventsInRange]);
  const behaviorStats = useMemo(() => eventStats(behaviorEventsInRange), [behaviorEventsInRange]);

  // Topshiriqlar bajarilishi — har sinfning slotlarini yigʻib, umumiy foizni
  // qayta hisoblaymiz (bitta sinfnikini oʻrtachalash emas, toʻgʻri vaznlangan).
  const completion = useMemo(() => {
    if (!period) return null;
    const isYear = period.kind === "year";
    let totalSlots = 0;
    let unsubmittedCount = 0;
    for (const [classId, cd] of Object.entries(classDataMap)) {
      if (!cd || !classNameById.has(classId)) continue;
      const rate = assignmentCompletionRate(cd, period.range, isYear);
      if (!rate) continue;
      totalSlots += rate.totalSlots;
      unsubmittedCount += rate.unsubmittedCount;
    }
    if (totalSlots === 0) return null;
    return {
      pct: Math.round(((totalSlots - unsubmittedCount) / totalSlots) * 100),
      unsubmittedCount,
      totalSlots,
    };
  }, [classDataMap, classNameById, period]);

  // Barcha jonli sinflar boʻyicha jami darslar/topshiriqlar — KPI plitkalari uchun
  const totalLessons = useMemo(
    () => allLessons.filter((l) => lessonClassIds(l).some((id) => classNameById.has(id))).length,
    [allLessons, classNameById]
  );
  const totalAssignments = useMemo(
    () =>
      Object.entries(classDataMap)
        .filter(([classId]) => classNameById.has(classId))
        .reduce((sum, [, cd]) => sum + (cd?.assignments.length ?? 0), 0),
    [classDataMap, classNameById]
  );

  // Brauzerning "scroll anchoring"i (yuqoriga yangi element qoʻshilganda
  // koʻrinishni saqlab qolish uchun avtomatik scroll qilishi) shu panelda
  // KPI qatori tepasi kesilib koʻrinishiga sabab boʻladi — oʻchiramiz va
  // tab/davr almashganda scrollni tepaga qaytaramiz (Gmail/Notion naqshi).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [period, prevPeriod]);

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
    <div ref={scrollRef} className="h-full min-h-0 overflow-y-auto" style={{ overflowAnchor: "none" }}>
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
          <StatCard icon={BookOpen} label={t("kpiLessons")} value={totalLessons} unit={t("unitCount")} />
          <StatCard icon={ClipboardList} label={t("kpiAssignments")} value={totalAssignments} unit={t("unitCount")} />
        </div>

        {/* ── Ijobiy oʻquvchilar — maʼlumot boʻlmasa hech narsa chiqarmaydi ── */}
        <PositiveStudentsStrip summaries={riskSummaries} classNameOf={(id) => classNameById.get(id)} />

        {/* ── Toʻrtta donut/grafik karta — bir xil balandlikda, keng ekranda toʻrt ustunda.
              items-start YOʻQ — grid standart "stretch" orqali hammasi bir xil
              balandlikka choʻziladi, ichki kontent esa vertikal markazlashadi. ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardSectionCard icon={Users} title={t("genderTitle")} className="h-full">
            <div className="flex flex-1 flex-col justify-center">
              <GenderDonutChart
                gender={gender}
                boysLabel={t("boysFull")}
                girlsLabel={t("girlsFull")}
                unitLabel={t("unitPeople")}
                totalLabel={t("totalStudentsLabel")}
              />
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard icon={HeartPulse} title={t("behaviorSplitTitle")} className="h-full">
            <div className="flex flex-1 flex-col justify-center">
              {behaviorSlices.length === 0 ? (
                <StatEmpty icon={HeartPulse} title={t("notEnoughData")} />
              ) : (
                <BehaviorDonut slices={behaviorSlices} positivePct={behaviorStats.positivePct} />
              )}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard icon={ClipboardCheck} title={t("kpiCompletion")} className="h-full">
            <div className="flex flex-1 flex-col justify-center">
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
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard
            icon={BarChart3}
            title={t("distributionTitleShort")}
            className="h-full"
            action={
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground" aria-label={t("distributionHint")}>
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-56">{t("distributionHint")}</TooltipContent>
              </Tooltip>
            }
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <DistributionCard bins={bins} />
            </div>
          </DashboardSectionCard>
        </div>

        {/* ── Domen grafigi (avvalgi Davomat tabidan) ── */}
        <DashboardSectionCard icon={TrendingUp} title={t("attendanceTrendTitle")}>
          <AttendanceTrendCard weeks={attendanceWeeks} />
        </DashboardSectionCard>
      </div>
    </div>
  );
}
