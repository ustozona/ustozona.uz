"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarX, ClipboardX, HeartCrack, TrendingDown, TrendingUp, UserX, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import { ATTENTION_DEFAULTS, type AttentionSignal } from "@/lib/attention";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<AttentionSignal["kind"], typeof UserX> = {
  "absent-streak": UserX,
  "low-attendance": CalendarX,
  "grade-drop": TrendingDown,
  "behavior-cluster": HeartCrack,
  "attendance-missing": ClipboardX,
  "grade-rise": TrendingUp,
  "attendance-recovery": UserCheck,
};

/** AttentionSection'dan moslashtirilgan — dismisssiz, cheklovsiz, faqat
    oʻqish uchun risk registri (Statistika Umumiy/Sinf ikkala darajasida). */
export function RiskList({
  signals,
  classNameOf,
}: {
  signals: AttentionSignal[];
  classNameOf?: (classId: string) => string | undefined;
}) {
  const t = useTranslations("AttentionSection");

  if (signals.length === 0) {
    return <TypographyMuted className="py-6 text-center text-sm">{t("emptyTitle")}</TypographyMuted>;
  }

  const detailOf = (s: AttentionSignal): string => {
    switch (s.kind) {
      case "absent-streak":
        return t("detailAbsentStreak", { days: s.days });
      case "low-attendance":
        return t("detailLowAttendance", { pct: s.pct });
      case "grade-drop":
        return t("detailGradeDrop", { delta: s.delta });
      case "behavior-cluster":
        return t("detailBehaviorCluster", { count: s.count, days: ATTENTION_DEFAULTS.behaviorWindowDays });
      case "attendance-missing":
        return t("detailAttendanceMissing");
      case "grade-rise":
        return t("detailGradeRise", { delta: s.delta });
      case "attendance-recovery":
        return t("detailAttendanceRecovery", { pct: s.pct });
    }
  };

  const actionsOf = (s: AttentionSignal): { label: string; href: string }[] => {
    const attendance = { label: t("actionAttendance"), href: `/dashboard/attendance?classId=${encodeURIComponent(s.classId)}` };
    switch (s.kind) {
      case "absent-streak":
      case "low-attendance":
        return [{ label: t("actionProfile"), href: `/dashboard/students/${s.studentId}` }, attendance];
      case "grade-drop":
        return [
          { label: t("actionProfile"), href: `/dashboard/students/${s.studentId}` },
          { label: t("actionGrades"), href: `/dashboard/grades?classId=${encodeURIComponent(s.classId)}` },
        ];
      case "behavior-cluster":
        return [
          { label: t("actionProfile"), href: `/dashboard/students/${s.studentId}` },
          { label: t("actionBehavior"), href: "/dashboard/behavior" },
        ];
      case "attendance-missing":
        return [{ ...attendance, label: t("actionEnter") }];
      case "grade-rise":
        return [
          { label: t("actionProfile"), href: `/dashboard/students/${s.studentId}` },
          { label: t("actionGrades"), href: `/dashboard/grades?classId=${encodeURIComponent(s.classId)}` },
        ];
      case "attendance-recovery":
        return [{ label: t("actionProfile"), href: `/dashboard/students/${s.studentId}` }, attendance];
    }
  };

  return (
    <div className="flex flex-col divide-y divide-border/60">
      {signals.map((s) => {
        const Icon = KIND_ICON[s.kind];
        const title = s.kind === "attendance-missing" ? classNameOf?.(s.classId) ?? t("attendanceMissingTitle") : s.studentName;
        const subtitle = s.kind === "attendance-missing" ? null : classNameOf?.(s.classId);
        return (
          <div key={s.id} className="flex items-start gap-3 py-3">
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                s.severity === "destructive" && "bg-destructive/10 text-destructive",
                s.severity === "warning" && "bg-warning/15 text-warning",
                s.severity === "success" && "bg-success/15 text-success"
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-sm font-semibold text-foreground">{title}</span>
                {subtitle && <span className="shrink-0 text-xs text-muted-foreground">{subtitle}</span>}
              </div>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{detailOf(s)}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {actionsOf(s).map((a) => (
                  <Button key={a.href + a.label} asChild variant="outline" size="sm" className="h-6 rounded-full px-2.5 text-xs font-medium">
                    <Link href={a.href}>{a.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
