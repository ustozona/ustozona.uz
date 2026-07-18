"use client";

import { useTranslations } from "next-intl";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { scoreBarColor } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import type { TopicMasteryRow } from "@/lib/class-stats";

export function TopicMasteryCard({ rows }: { rows: TopicMasteryRow[] }) {
  const t = useTranslations("StatisticsPage");

  return (
    <div className="space-y-3">
      <TypographyLabel>{t("topicsTitle")}</TypographyLabel>
      {rows.length === 0 ? (
        <TypographyMuted className="py-4 text-sm">{t("notEnoughData")}</TypographyMuted>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.topicId} className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 text-foreground/80 min-w-0 truncate">
                  {r.name}
                  {r.isFormative && (
                    <span className="shrink-0 rounded-full bg-info/15 px-1.5 py-0.5 text-[10px] font-medium text-info">
                      {t("formativeChip")}
                    </span>
                  )}
                  {r.lowCount > 0 && (
                    <span className="shrink-0 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                      {t("topicLow", { count: r.lowCount })}
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">{Math.round(r.avg)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500")}
                  style={{ width: `${Math.round(r.avg)}%`, backgroundColor: scoreBarColor(r.avg) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
