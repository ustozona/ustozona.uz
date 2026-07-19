"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarX, ClipboardX, HeartCrack, TrendingDown, TrendingUp, UserX, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
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

type Domain = "attendance" | "grades" | "behavior";

const KIND_DOMAIN: Record<AttentionSignal["kind"], Domain> = {
  "absent-streak": "attendance",
  "low-attendance": "attendance",
  "attendance-missing": "attendance",
  "attendance-recovery": "attendance",
  "grade-drop": "grades",
  "grade-rise": "grades",
  "behavior-cluster": "behavior",
};

/** AttentionSection'dan moslashtirilgan — dismisssiz, cheklovsiz, faqat
    oʻqish uchun risk registri (Statistika Umumiy/Sinf ikkala darajasida).
    Turlar ustuvorlik boʻyicha bitta ro‘yxatda aralash chiqadi (GitHub
    Notifications/Linear Inbox naqshi) — domen boʻyicha ajratilgan bir necha
    kartaga BOʻLINMAYDI, ustida ixtiyoriy filtr-chip qatori bor xolos. */
export function RiskList({
  signals,
  classNameOf,
}: {
  signals: AttentionSignal[];
  classNameOf?: (classId: string) => string | undefined;
}) {
  const t = useTranslations("AttentionSection");
  const [filter, setFilter] = useState<"all" | Domain>("all");

  const counts = useMemo(
    () => ({
      attendance: signals.filter((s) => KIND_DOMAIN[s.kind] === "attendance").length,
      grades: signals.filter((s) => KIND_DOMAIN[s.kind] === "grades").length,
      behavior: signals.filter((s) => KIND_DOMAIN[s.kind] === "behavior").length,
    }),
    [signals]
  );

  const filtered = useMemo(
    () => (filter === "all" ? signals : signals.filter((s) => KIND_DOMAIN[s.kind] === filter)),
    [signals, filter]
  );

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <AppleEmojiSprite emoji="✨" className="size-7" />
        <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
      </div>
    );
  }

  const chips: { id: "all" | Domain; label: string; count: number }[] = [
    { id: "all", label: t("filterAll"), count: signals.length },
    { id: "attendance", label: t("filterAttendance"), count: counts.attendance },
    { id: "grades", label: t("filterGrades"), count: counts.grades },
    { id: "behavior", label: t("filterBehavior"), count: counts.behavior },
  ];

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
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1.5 pb-3">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            disabled={c.id !== "all" && c.count === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
              filter === c.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
            <span className={cn("tabular-nums", filter === c.id ? "opacity-70" : "opacity-60")}>{c.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{t("filterEmpty")}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {filtered.map((s) => {
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
      )}
    </div>
  );
}
