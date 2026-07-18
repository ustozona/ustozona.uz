"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { STAT_DEADBAND_PP, type ClassOverviewRow } from "@/lib/class-stats";
import { cn } from "@/lib/utils";

export function ClassRowsCard({
  rows,
  onSelect,
}: {
  rows: ClassOverviewRow[];
  onSelect: (classId: string) => void;
}) {
  const t = useTranslations("StatisticsPage");

  if (rows.length === 0) {
    return <TypographyMuted className="py-6 text-center text-sm">{t("notEnoughData")}</TypographyMuted>;
  }

  return (
    <div className="flex flex-col divide-y divide-border/60">
      {rows.map((r) => {
        const hex = CLASS_COLOR_HEX[classColor({ id: r.classId, name: r.name, color: r.color })];
        const delta = r.summativeDelta;
        const stable = delta === null || Math.abs(delta) < STAT_DEADBAND_PP;
        return (
          <button
            key={r.classId}
            type="button"
            onClick={() => onSelect(r.classId)}
            className="flex items-center gap-3 py-3 text-left hover:bg-muted/40 -mx-1 px-1 rounded-md transition-colors"
          >
            <ClassSwatch hex={hex} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-foreground">{r.name}</span>
                {r.signalCount > 0 && (
                  <span className="shrink-0 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-warning">
                    {r.signalCount}
                  </span>
                )}
              </div>
              <TypographyMuted className="text-xs">
                {t("studentsCount", { count: r.studentCount })}
                {r.attendanceAvg !== null && ` · ${t("attendanceShort", { pct: r.attendanceAvg })}`}
              </TypographyMuted>
            </div>
            <div className="flex items-center gap-1 shrink-0 tabular-nums text-sm">
              <span className="font-semibold">{r.summativeAvg !== null ? `${Math.round(r.summativeAvg)}%` : "—"}</span>
              {delta !== null && (
                <span
                  className={cn(
                    "flex items-center text-xs",
                    stable ? "text-muted-foreground" : delta > 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {stable ? <Minus className="size-3" /> : delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
