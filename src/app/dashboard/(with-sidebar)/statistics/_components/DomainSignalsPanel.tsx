"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, CalendarCheck, HeartPulse, type LucideIcon } from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { RiskList, type SignalDomain } from "./RiskList";

const DOMAIN_ICON: Record<SignalDomain, LucideIcon> = {
  attendance: CalendarCheck,
  grades: BookOpen,
  behavior: HeartPulse,
};

const DOMAIN_KINDS: Record<SignalDomain, string[]> = {
  attendance: ["absent-streak", "low-attendance", "attendance-missing", "attendance-recovery"],
  grades: ["grade-drop", "grade-rise"],
  behavior: ["behavior-cluster"],
};

/** Sinf tanlanmaganda Baholar/Davomat/Xulq tablari — butun maktab boʻyicha
    shu domenning toʻliq eʼtibor signal roʻyxati (RiskList'ning `limit`siz,
    domen filtrisiz, ichki scroll bilan koʻrinishi). Umumiy tabidagi
    "Eʼtibor kerak" kartasi bilan bir xil `deriveAttentionSignals` manbasidan
    foydalanadi, faqat shu domenga oldindan filtrlanadi. */
export function DomainSignalsPanel({
  domain, calendar,
}: {
  domain: SignalDomain;
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
      })
        .filter((s) => classNameById.has(s.classId))
        .filter((s) => DOMAIN_KINDS[domain].includes(s.kind)),
    [classDataMap, recordsByClass, eventsByClass, versions, calendar, weights, todayKey, classNameById, domain]
  );

  const titleKey = domain === "attendance" ? "groupAttendance" : domain === "grades" ? "groupGrades" : "groupBehavior";
  const Icon = DOMAIN_ICON[domain];

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <DashboardSectionCard icon={Icon} title={t(titleKey)}>
        <RiskList signals={signals} classNameOf={(id) => classNameById.get(id)} showFilters={false} />
      </DashboardSectionCard>
    </div>
  );
}
