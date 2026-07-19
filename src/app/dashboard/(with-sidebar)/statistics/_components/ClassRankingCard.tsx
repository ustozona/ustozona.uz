"use client";

import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { ClassSwatch } from "@/components/ClassSwatch";
import { Progress } from "@/components/ui/progress";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { cn } from "@/lib/utils";
import { StatEmpty } from "./StatEmpty";

export type ClassRankingRow = {
  classId: string;
  name: string;
  color?: ClassColor;
  studentCount: number;
  value: number | null;
};

/** Sinflarni bitta koʻrsatkich boʻyicha saralaydi — maktab boʻyicha domen
    tabida "qaysi sinfda muammo toʻplangan" savoliga tezkor javob. Qator
    butunlay bosiluvchi (tugma-shovqinsiz), bosilsa oʻsha sinf tanlanadi.
    `format="percent"` (davomat/oʻzlashtirish %) — eng past qiymat tepada;
    `format="count"` (signal soni) — eng yuqori qiymat tepada (eng xavfli
    sinf birinchi), progress-bar oʻrniga xom sonli belgi koʻrsatiladi. */
export function ClassRankingCard({
  icon,
  title,
  rows,
  onSelect,
  format = "percent",
  limit,
}: {
  icon: LucideIcon;
  title: string;
  rows: ClassRankingRow[];
  onSelect?: (classId: string) => void;
  format?: "percent" | "count";
  limit?: number;
}) {
  const t = useTranslations("StatisticsPage");
  const sorted = [...rows]
    .sort((a, b) => {
      if (a.value === null && b.value === null) return a.name.localeCompare(b.name);
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return format === "count" ? b.value - a.value : a.value - b.value;
    })
    .slice(0, limit ?? rows.length);

  if (sorted.length === 0) {
    return (
      <DashboardSectionCard icon={icon} title={title}>
        <StatEmpty icon={icon} title={t("notEnoughData")} />
      </DashboardSectionCard>
    );
  }

  return (
    <DashboardSectionCard icon={icon} title={title}>
      <div className="flex flex-col divide-y divide-border/60">
        {sorted.map((r) => {
          const hex = CLASS_COLOR_HEX[r.color ?? "gray"];
          const Row = onSelect ? "button" : "div";
          return (
            <Row
              key={r.classId}
              type={onSelect ? "button" : undefined}
              onClick={onSelect ? () => onSelect(r.classId) : undefined}
              className={
                "flex w-full items-center gap-3 py-2.5 text-left" +
                (onSelect ? " transition-colors hover:bg-muted/40 rounded-md px-1.5 -mx-1.5 cursor-pointer" : "")
              }
            >
              <ClassSwatch hex={hex} className="size-2.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">{r.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{t("studentsCount", { count: r.studentCount })}</span>
                </div>
                {format === "percent" && <Progress value={r.value ?? 0} className="mt-1.5 h-1.5" />}
              </div>
              {format === "count" ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    r.value && r.value > 0 ? "bg-warning/15 text-warning" : "text-muted-foreground/50"
                  )}
                >
                  {r.value ?? 0}
                </span>
              ) : (
                <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                  {r.value !== null ? `${Math.round(r.value)}%` : "—"}
                </span>
              )}
            </Row>
          );
        })}
      </div>
    </DashboardSectionCard>
  );
}
