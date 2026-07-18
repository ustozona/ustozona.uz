"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/grades-data";
import type { StudentPeriodSummary } from "@/lib/class-stats";
import { CopyListButton } from "./CopyListButton";

/** Faqat "watch"/"chronic" darajadagi oʻquvchilar koʻrsatiladi — "ok" katta
    koʻpchilik boʻlib, roʻyxatni shovqinlashtiradi (actionable printsipi). */
export function AbsenceTierList({ summaries, students }: { summaries: StudentPeriodSummary[]; students: Student[] }) {
  const t = useTranslations("StatisticsPage");
  const flagged = summaries
    .filter((s) => s.absenceTier === "watch" || s.absenceTier === "chronic")
    .sort((a, b) => (a.attendancePct ?? 0) - (b.attendancePct ?? 0));

  if (flagged.length === 0) return null;

  const studentById = new Map(students.map((s) => [s.id, s]));
  const copyEntries = flagged.map((s) => ({ name: s.name, parentPhone: studentById.get(s.studentId)?.parentPhone }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <TypographyLabel>{t("absenceTiersTitle")}</TypographyLabel>
        <CopyListButton entries={copyEntries} />
      </div>
      <div className="flex flex-col divide-y divide-border/60">
        {flagged.map((s) => (
          <Link
            key={s.studentId}
            href={`/dashboard/students/${s.studentId}`}
            className="flex items-center gap-2.5 py-2 text-sm hover:bg-muted/40 -mx-1 px-1 rounded-md transition-colors"
          >
            <span className="truncate flex-1 text-foreground/90">{s.name}</span>
            <TypographyMuted className="tabular-nums text-xs">{s.attendancePct}%</TypographyMuted>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                s.absenceTier === "chronic" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
              )}
            >
              {s.absenceTier === "chronic" ? t("tierChronic") : t("tierWatch")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
