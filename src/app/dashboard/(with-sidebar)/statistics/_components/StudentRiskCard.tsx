"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, ShieldAlert, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import type { StudentRiskSummary } from "@/lib/attention";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { cn } from "@/lib/utils";

/** Sinf-markazli xom signal roʻyxatlari oʻrniga oʻquvchi-markazli agregat
    koʻrinish (EWS composite-risk naqshi): bitta oʻquvchi bir necha
    kartada sochilib ketmasin, uning barcha signallari birlashtirilgan
    risk balli bilan bitta qatorda. Umumiy tabining eng koʻzga koʻrinadigan
    "eʼtibor kerak" bloki shu — toʻliq xom roʻyxatlar domen tablarida qoladi. */
export function StudentRiskCard({
  summaries,
  classNameOf,
  limit = 25,
}: {
  summaries: StudentRiskSummary[];
  classNameOf?: (classId: string) => string | undefined;
  limit?: number;
}) {
  const t = useTranslations("AttentionSection");
  const risky = summaries.filter((s) => s.riskScore > 0);

  if (risky.length === 0) {
    return (
      <DashboardSectionCard icon={ShieldAlert} title={t("riskStudentsTitle")}>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <AppleEmojiSprite emoji="✨" className="size-7" />
          <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
        </div>
      </DashboardSectionCard>
    );
  }

  const shown = risky.slice(0, limit);
  const restCount = risky.length - shown.length;

  return (
    <DashboardSectionCard
      icon={ShieldAlert}
      title={t("riskStudentsTitle")}
      action={<span className="text-xs tabular-nums text-muted-foreground">{risky.length}</span>}
    >
      <div className="-mx-1.5 flex max-h-[22rem] flex-col divide-y divide-border/60 overflow-y-auto px-1.5">
        {shown.map((s) => {
          const high = s.destructiveCount > 0;
          return (
            <Link
              key={s.studentId}
              href={`/dashboard/students/${s.studentId}`}
              className="group/row -mx-1.5 flex items-start gap-3 rounded-md px-1.5 py-3 transition-colors hover:bg-muted/40"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                  high ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"
                )}
              >
                <ShieldAlert className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-sm font-semibold text-foreground">{s.studentName}</span>
                  {classNameOf?.(s.classId) && (
                    <span className="shrink-0 text-xs text-muted-foreground">{classNameOf(s.classId)}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={high ? "destructive" : "outline"} className={!high ? "border-warning/40 text-warning" : undefined}>
                    {high ? t("riskLevelHigh") : t("riskLevelMedium")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{t("moreSignals", { count: s.signals.length })}</span>
                </div>
              </div>
              <ChevronRight className="mt-1.5 size-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover/row:opacity-100" />
            </Link>
          );
        })}
      </div>
      {restCount > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("moreStudents", { count: restCount })}</p>
      )}
    </DashboardSectionCard>
  );
}

/** Yuqori diqqat markazidan ataylab past — ijobiy signal xavfni
    kamaytirmaydi, shovqin bermasligi uchun kichikroq, gorizontal chip
    roʻyxat sifatida koʻrsatiladi (max 6 ta). */
export function PositiveStudentsStrip({
  summaries,
  classNameOf,
}: {
  summaries: StudentRiskSummary[];
  classNameOf?: (classId: string) => string | undefined;
}) {
  const t = useTranslations("AttentionSection");
  const positive = summaries.filter((s) => s.positiveCount > 0 && s.riskScore === 0).slice(0, 6);
  if (positive.length === 0) return null;

  return (
    <DashboardSectionCard icon={TrendingUp} title={t("positiveStudentsTitle")}>
      <div className="flex flex-wrap gap-2">
        {positive.map((s) => (
          <Link
            key={s.studentId}
            href={`/dashboard/students/${s.studentId}`}
            className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/15"
          >
            <span className="truncate">{s.studentName}</span>
            {classNameOf?.(s.classId) && <span className="text-success/70">· {classNameOf(s.classId)}</span>}
          </Link>
        ))}
      </div>
    </DashboardSectionCard>
  );
}
