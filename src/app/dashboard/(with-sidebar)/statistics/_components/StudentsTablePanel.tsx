"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, Users } from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import { classColor } from "@/lib/grades-data";
import { studentPeriodSummaries, type AbsenceTier, type StatPeriod } from "@/lib/class-stats";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { StudentsTable, type StudentOverviewRow } from "./StudentsTable";

type TierFilter = "all" | Exclude<AbsenceTier, null>;

/** "Oʻquvchilar" tabining sahifa darajasidagi qobigʻi — barcha jonli
    sinflar boʻyicha `studentPeriodSummaries`ni yigʻib, bitta tekis
    roʻyxatga aylantiradi (Umumiy koʻrinishdagi sinflar jadvalining oʻquvchi
    darajasidagi hamkasbi). Qatorga sinf nomi/rangi ham biriktiriladi. */
export function StudentsTablePanel({
  onSelectStudent, period, calendar, classId,
}: {
  onSelectStudent: (studentId: string) => void;
  period: StatPeriod | null;
  calendar: AcademicYearCalendar;
  /** Berilsa, roʻyxat shu sinf oʻquvchilari bilan cheklanadi (sinf detali
      ichidagi "Oʻquvchilar" tabi) — aks holda butun maktab boʻyicha. */
  classId?: string;
}) {
  const t = useTranslations("StatisticsPage");
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [scrolled, setScrolled] = useState(false);

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const liveClasses = useLiveClasses();
  const weights = useMemo(() => statusWeights(statuses), [statuses]);

  const rows = useMemo<StudentOverviewRow[]>(() => {
    if (!period) return [];
    const isYear = period.kind === "year";
    const scoped = classId ? liveClasses.filter((cls) => cls.id === classId) : liveClasses;
    return scoped.flatMap((cls) => {
      const classData = classDataMap[cls.id];
      if (!classData) return [];
      const color = classColor({ id: cls.id, name: cls.name, color: cls.color });
      const summaries = studentPeriodSummaries({
        classData,
        records: recordsByClass[cls.id] ?? [],
        events: eventsByClass[cls.id] ?? [],
        weights,
        range: period.range,
        isYear,
      });
      return summaries.map((s) => ({ ...s, classId: cls.id, className: cls.name, classColor: color }));
    });
  }, [liveClasses, classDataMap, recordsByClass, eventsByClass, weights, period, classId]);

  const tierCounts = useMemo(
    () => ({
      chronic: rows.filter((r) => r.absenceTier === "chronic").length,
      watch: rows.filter((r) => r.absenceTier === "watch").length,
    }),
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
        .filter((r) => tier === "all" || r.absenceTier === tier),
    [rows, query, tier]
  );

  const TIER_LABEL: Partial<Record<TierFilter, string>> = {
    all: t("tierAll"),
    watch: t("tierWatch"),
    chronic: t("tierChronic"),
  };

  return (
    <div className="h-full min-h-0">
      <DashboardSectionCard className="h-full min-h-0 flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <SectionIcon>
              <Users />
            </SectionIcon>
            <CardTitle className="truncate">{t("groupStudents")}</CardTitle>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-72 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("studentsSearchPlaceholder")}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-muted-foreground">
                {TIER_LABEL[tier]}
                {tier !== "all" && (
                  <span className="tabular-nums text-xs opacity-70">
                    {tier === "watch" ? tierCounts.watch : tierCounts.chronic}
                  </span>
                )}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup value={tier} onValueChange={(v) => setTier(v as TierFilter)}>
                <DropdownMenuRadioItem value="all">{t("tierAll")}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="watch">
                  {t("tierWatch")} {tierCounts.watch > 0 && <span className="ml-1 tabular-nums opacity-60">{tierCounts.watch}</span>}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="chronic">
                  {t("tierChronic")} {tierCounts.chronic > 0 && <span className="ml-1 tabular-nums opacity-60">{tierCounts.chronic}</span>}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className="flex-1 min-h-0 overflow-auto"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          <StudentsTable rows={filteredRows} scrolled={scrolled} onSelect={onSelectStudent} hideClassColumn={!!classId} />
        </div>

        <div className="mt-3 shrink-0 text-xs text-muted-foreground">
          {t("studentsShownCount", { count: filteredRows.length, total: rows.length })}
        </div>
      </DashboardSectionCard>
    </div>
  );
}
