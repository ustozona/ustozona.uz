"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals, type AttentionSignal } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { SeveritySignalCard, signalGridColsClass } from "./SeveritySignalCard";
import { cn } from "@/lib/utils";

export type SignalDomain = "attendance" | "grades" | "behavior";

const DOMAIN_KINDS: Record<SignalDomain, AttentionSignal["kind"][]> = {
  attendance: ["absent-streak", "low-attendance", "attendance-missing", "attendance-recovery"],
  grades: ["grade-drop", "grade-rise"],
  behavior: ["behavior-cluster"],
};

/** Sinf tanlanmaganda Baholar/Davomat/Xulq tablari — butun maktab boʻyicha
    shu domenning eʼtibor signallari, jiddiylik boʻyicha ALOHIDA kartalarda
    (Keskin / Eʼtibor kerak / Yaxshilanmoqda — [SeveritySignalCard.tsx](SeveritySignalCard.tsx)).
    Umumiy tabidagi "Eʼtibor kerak" bloki bilan bir xil `deriveAttentionSignals`
    manbasidan foydalanadi, faqat shu domenga oldindan filtrlanadi. */
export function DomainSignalsPanel({
  domain, calendar,
}: {
  domain: SignalDomain;
  calendar: AcademicYearCalendar;
}) {
  const t = useTranslations("AttentionSection");
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

  if (signals.length === 0) {
    return (
      <div className="h-full min-h-0">
        <DashboardSectionCard className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AppleEmojiSprite emoji="✨" className="size-7" />
            <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        </DashboardSectionCard>
      </div>
    );
  }

  const destructive = signals.filter((s) => s.severity === "destructive");
  const warning = signals.filter((s) => s.severity === "warning");
  const success = signals.filter((s) => s.severity === "success");
  const activeCount = [destructive, warning, success].filter((g) => g.length > 0).length;

  return (
    <div className={cn("h-full min-h-0 grid auto-rows-fr gap-4", signalGridColsClass(activeCount))}>
      <SeveritySignalCard severity="destructive" signals={destructive} classNameOf={(id) => classNameById.get(id)} variant="fill" />
      <SeveritySignalCard severity="warning" signals={warning} classNameOf={(id) => classNameById.get(id)} variant="fill" />
      <SeveritySignalCard severity="success" signals={success} classNameOf={(id) => classNameById.get(id)} variant="fill" />
    </div>
  );
}
