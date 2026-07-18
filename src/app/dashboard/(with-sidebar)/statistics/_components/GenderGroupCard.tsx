"use client";

import { useTranslations } from "next-intl";
import { TypographyMuted } from "@/components/ui/typography";
import { STAT_DEADBAND_PP, type GenderGroupAverages } from "@/lib/class-stats";

/** Oʻgʻil/qiz oʻrtachalari — har guruh MIN_GENDER_GROUP dan kam boʻlsa
    "—" (kichik tanlama), farq deadband ostida boʻlsa "farq yoʻq". */
export function GenderGroupCard({ averages }: { averages: GenderGroupAverages }) {
  const t = useTranslations("StatisticsPage");
  const { boys, girls } = averages;

  if (boys.summativeAvg === null && girls.summativeAvg === null &&
      boys.attendanceAvg === null && girls.attendanceAvg === null) {
    return null;
  }

  const rows: { label: string; b: number | null; g: number | null; suffix: string }[] = [
    { label: t("genderMetricGrade"), b: boys.summativeAvg, g: girls.summativeAvg, suffix: "%" },
    { label: t("genderMetricAttendance"), b: boys.attendanceAvg, g: girls.attendanceAvg, suffix: "%" },
    { label: t("genderMetricBehavior"), b: boys.positivePct, g: girls.positivePct, suffix: "%" },
  ];

  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const diff = r.b !== null && r.g !== null ? r.b - r.g : null;
        const stable = diff === null || Math.abs(diff) < STAT_DEADBAND_PP;
        return (
          <div key={r.label} className="flex items-center justify-between text-sm gap-2">
            <span className="text-foreground/80">{r.label}</span>
            <div className="flex items-center gap-3 tabular-nums text-xs">
              <span>{t("boysShort")}: {r.b !== null ? `${Math.round(r.b)}${r.suffix}` : "—"}</span>
              <span>{t("girlsShort")}: {r.g !== null ? `${Math.round(r.g)}${r.suffix}` : "—"}</span>
              <TypographyMuted className={stable ? "" : "text-foreground/70 font-medium"}>
                {diff === null ? "—" : stable ? t("deltaStable") : `Δ ${Math.round(Math.abs(diff))}${r.suffix}`}
              </TypographyMuted>
            </div>
          </div>
        );
      })}
    </div>
  );
}
