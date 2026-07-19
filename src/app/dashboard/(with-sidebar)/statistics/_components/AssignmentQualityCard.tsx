"use client";

import { useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import { scoreBarColor } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import type { AssignmentQuality } from "@/lib/class-stats";
import { StatEmpty } from "./StatEmpty";

export function AssignmentQualityCard({ rows }: { rows: AssignmentQuality[] }) {
  const t = useTranslations("StatisticsPage");

  if (rows.length === 0) {
    return <StatEmpty icon={ClipboardCheck} title={t("notEnoughData")} />;
  }

  return (
    <div>
      <div className="flex flex-col divide-y divide-border/60">
        {rows.map((r) => (
          <div key={r.assignmentId} className="flex items-center gap-2.5 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-foreground/90">{r.title}</span>
                {r.ceiling && (
                  <span className="shrink-0 rounded-full bg-info/15 px-1.5 py-0.5 text-[10px] font-medium text-info">
                    {t("ceilingChip")}
                  </span>
                )}
                {r.floor && (
                  <span className="shrink-0 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    {t("floorChip")}
                  </span>
                )}
              </div>
              {r.topicName && <TypographyMuted className="text-xs truncate">{r.topicName}</TypographyMuted>}
            </div>
            <div className="shrink-0 text-right tabular-nums">
              <div className="text-xs text-muted-foreground">{t("difficultyLabel")}</div>
              <div className="font-semibold" style={{ color: scoreBarColor(r.p) }}>{r.p}%</div>
            </div>
            <div className="shrink-0 text-right tabular-nums w-14">
              <div className="text-xs text-muted-foreground">{t("discriminationLabel")}</div>
              <div className={cn("font-semibold", r.d === null ? "text-muted-foreground" : r.d >= 20 ? "text-success" : r.d < 0 ? "text-destructive" : "text-foreground")}>
                {r.d === null ? "—" : `${r.d > 0 ? "+" : ""}${r.d}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
