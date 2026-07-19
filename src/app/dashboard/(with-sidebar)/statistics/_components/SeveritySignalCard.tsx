"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertTriangle, CalendarX, ClipboardX, HeartCrack, ShieldAlert, TrendingDown, TrendingUp, UserX, UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { ATTENTION_DEFAULTS, type AttentionSeverity, type AttentionSignal } from "@/lib/attention";
import { DashboardSectionCard } from "@/components/DashboardSectionCard";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<AttentionSignal["kind"], LucideIcon> = {
  "absent-streak": UserX,
  "low-attendance": CalendarX,
  "grade-drop": TrendingDown,
  "behavior-cluster": HeartCrack,
  "attendance-missing": ClipboardX,
  "grade-rise": TrendingUp,
  "attendance-recovery": UserCheck,
};

const SEVERITY_ICON: Record<AttentionSeverity, LucideIcon> = {
  destructive: ShieldAlert,
  warning: AlertTriangle,
  success: TrendingUp,
};

const SEVERITY_TITLE_KEY: Record<AttentionSeverity, string> = {
  destructive: "severityDestructive",
  warning: "severityWarning",
  success: "severitySuccess",
};

/** Nechta jiddiylik kartasi haqiqatda koʻrsatiladigan boʻlsa (boʻsh
    turkumlar render qilinmaydi), grid ustunlari shunga moslashadi — 3 ta
    joy band qilinmaydi, masalan Davomatda faqat 2 tur boʻlsa 2 ustun. */
export function signalGridColsClass(activeCount: number): string {
  if (activeCount <= 1) return "grid-cols-1";
  if (activeCount === 2) return "grid-cols-1 lg:grid-cols-2";
  return "grid-cols-1 lg:grid-cols-3";
}

/** Bitta jiddiylik turkumi (Keskin / Eʼtibor kerak / Yaxshilanmoqda) uchun
    alohida karta — foydalanuvchi aniq soʻradi: aralash roʻyxat/sarlavha
    oʻrniga har biri OʻZ kartasida (Statistika Umumiy/Sinf/Baholar/Davomat/
    Xulq darajalarida bir xil, chaqiruvchi `signals`ni oldindan severity
    boʻyicha filtrlab beradi). Karta ichi 0 taʼqib boʻlsa render qilinmaydi —
    chaqiruvchi tomonda. */
export function SeveritySignalCard({
  severity,
  signals,
  classNameOf,
  variant = "capped",
}: {
  severity: AttentionSeverity;
  signals: AttentionSignal[];
  classNameOf?: (classId: string) => string | undefined;
  /** "fill" — ota konteyner balandligini toʻliq egallaydi (Baholar/Davomat/
      Xulq tablari — yagona kontent, ClassListPanel bilan bir xil boʻyda).
      "capped" — sahifada boshqa boʻlimlar bilan birga (Umumiy), balandlik
      kontentga qarab, ichki roʻyxat max-h bilan chegaralanadi. */
  variant?: "fill" | "capped";
}) {
  const t = useTranslations("AttentionSection");
  const Icon = SEVERITY_ICON[severity];

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

  if (signals.length === 0) return null;

  return (
    <DashboardSectionCard
      icon={Icon}
      title={t(SEVERITY_TITLE_KEY[severity])}
      action={<span className="text-xs tabular-nums text-muted-foreground">{signals.length}</span>}
      className={cn("flex flex-col", variant === "fill" && "h-full min-h-0")}
    >
      <div className={cn(variant === "fill" ? "flex-1 min-h-0 overflow-y-auto" : "max-h-[24rem] overflow-y-auto")}>
        <div className="flex flex-col divide-y divide-border/60">
          {signals.map((s) => {
            const KindIcon = KIND_ICON[s.kind];
            const title = s.kind === "attendance-missing" ? classNameOf?.(s.classId) ?? t("attendanceMissingTitle") : s.studentName;
            const subtitle = s.kind === "attendance-missing" ? null : classNameOf?.(s.classId);
            return (
              <div key={s.id} className="flex items-start gap-3 py-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                    severity === "destructive" && "bg-destructive/10 text-destructive",
                    severity === "warning" && "bg-warning/15 text-warning",
                    severity === "success" && "bg-success/15 text-success"
                  )}
                >
                  <KindIcon className="size-4" />
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
      </div>
    </DashboardSectionCard>
  );
}
