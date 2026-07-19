"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Table as TableIcon } from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { deriveAttentionSignals } from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import { overviewRows, signalCountsByClass, type StatPeriod } from "@/lib/class-stats";
import { Input } from "@/components/ui/input";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { ClassesTable } from "./ClassesTable";

/** "Sinflar" tabining sahifa darajasidagi qobigʻi — `overviewRows` agregatsiyasini
    `OverviewPanel`dan mustaqil hisoblaydi (ikkalasi ham xuddi shu pure funksiyani
    chaqiradi, faqat taqdimoti boshqa: bittasi triage, bittasi toʻliq jadval).
    Karta sarlavhasi boshqa boʻlim kartalari bilan bir xil naqsh (ikonka+sarlavha,
    oʻngda amal) — qidiruv shu joyda; jadval sarlavhasi sticky, faqat tana scroll. */
export function ClassesTablePanel({
  onSelectClass, period, prevPeriod, calendar,
}: {
  onSelectClass: (id: string) => void;
  period: StatPeriod | null;
  prevPeriod: StatPeriod | null;
  calendar: AcademicYearCalendar;
}) {
  const t = useTranslations("StatisticsPage");
  const todayKey = dateToKey(new Date());
  const [query, setQuery] = useState("");
  // Sticky sarlavha soyasi faqat scroll boshlanganda koʻrinadi (GitHub/Linear
  // naqshi) — tepada turganda ortiqcha chiziq/soya boʻlmasligi uchun.
  const [scrolled, setScrolled] = useState(false);

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

  const filteredRows = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, query]
  );

  return (
    <div className="h-full min-h-0">
      <DashboardSectionCard
        icon={TableIcon}
        title={t("groupClasses")}
        className="h-full min-h-0 flex flex-col"
        action={
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("classesSearchPlaceholder")}
              className="pl-9 h-9 text-sm"
            />
          </div>
        }
      >
        <div
          className="flex-1 min-h-0 overflow-auto"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          <ClassesTable rows={filteredRows} scrolled={scrolled} onSelect={onSelectClass} />
        </div>
      </DashboardSectionCard>
    </div>
  );
}
