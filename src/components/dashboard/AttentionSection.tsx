"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CalendarX,
  ClipboardX,
  HeartCrack,
  TrendingDown,
  TrendingUp,
  UserX,
  UserCheck,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
} from "@/components/DashboardPage";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { statusWeights } from "@/lib/attendance-data";
import {
  deriveAttentionSignals,
  ATTENTION_DEFAULTS,
  POSITIVE_KINDS,
  type AttentionSignal,
} from "@/lib/attention";
import { dateToKey } from "@/lib/date-keys";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   EʼTIBOR KERAK — ABC signallari (redesign M4). Engine — lib/attention.ts
   (sof derive), bu komponent faqat jonli maʼlumot uzatadi va chizadi.

   Karta anatomiyasi (Notasnet): jiddiylik-rangli ikonka-doira (TUR =
   ikonka, JIDDIYLIK = rang), matn, inline harakatlar. Kunlik "koʻrdim"
   dismiss localStorage'da sana-kalit bilan saqlanadi — ertaga signal
   qayta koʻrinadi (holat oʻzgarmagan boʻlsa).
   ════════════════════════════════════════════════════════════════════ */

const DISMISS_KEY = "ustozona-attention-dismissed-v1";
const VISIBLE_LIMIT = 4;

function readDismissed(todayKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date?: string; ids?: string[] };
    // Sana-kalit: faqat bugungi dismiss amal qiladi
    return parsed.date === todayKey && Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch {
    return [];
  }
}

const KIND_ICON: Record<AttentionSignal["kind"], typeof UserX> = {
  "absent-streak": UserX,
  "low-attendance": CalendarX,
  "grade-drop": TrendingDown,
  "behavior-cluster": HeartCrack,
  "attendance-missing": ClipboardX,
  "grade-rise": TrendingUp,
  "attendance-recovery": UserCheck,
};

export function AttentionSection({ now }: { now: Date }) {
  const t = useTranslations("AttentionSection");
  const todayKey = dateToKey(now);

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const statuses = useAttendanceStore((s) => s.statuses);
  const eventsByClass = useBehaviorStore((s) => s.eventsByClass);
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const liveClasses = useLiveClasses();

  const classNameById = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, c.name])),
    [liveClasses]
  );

  const signals = useMemo(
    () =>
      deriveAttentionSignals({
        classDataMap,
        recordsByClass,
        eventsByClass,
        versions,
        calendar,
        weights: statusWeights(statuses),
        todayKey,
      }).filter((s) => classNameById.has(s.classId) && !POSITIVE_KINDS.includes(s.kind)),
    [classDataMap, recordsByClass, eventsByClass, versions, calendar, statuses, todayKey, classNameById]
  );

  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed(todayKey));
  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISS_KEY, JSON.stringify({ date: todayKey, ids: next }));
    } catch {
      /* localStorage yopiq boʻlsa — sessiya ichida ishlayveradi */
    }
  };

  const active = signals.filter((s) => !dismissed.includes(s.id));
  const visible = active.slice(0, VISIBLE_LIMIT);
  const hiddenCount = active.length - visible.length;

  const detailOf = (s: AttentionSignal): string => {
    switch (s.kind) {
      case "absent-streak":
        return t("detailAbsentStreak", { days: s.days });
      case "low-attendance":
        return t("detailLowAttendance", { pct: s.pct });
      case "grade-drop":
        return t("detailGradeDrop", { delta: s.delta });
      case "behavior-cluster":
        return t("detailBehaviorCluster", {
          count: s.count,
          days: ATTENTION_DEFAULTS.behaviorWindowDays,
        });
      case "attendance-missing":
        return t("detailAttendanceMissing");
      case "grade-rise":
        return t("detailGradeRise", { delta: s.delta });
      case "attendance-recovery":
        return t("detailAttendanceRecovery", { pct: s.pct });
    }
  };

  const actionsOf = (s: AttentionSignal): { label: string; href: string }[] => {
    const attendance = {
      label: t("actionAttendance"),
      href: `/dashboard/attendance?classId=${encodeURIComponent(s.classId)}`,
    };
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
    <Card className={cn("shadow-sm", panelCardClass)}>
      <CardHeader className={cn(panelCardHeaderClass, "justify-between min-h-[4.5rem] px-5 py-5!")}>
        <div className="flex min-w-0 items-center gap-2">
          <SectionIcon>
            <AlertTriangle />
          </SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
          {active.length > 0 && (
            <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-warning">
              {active.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className={panelCardContentClass}>
        <div className="px-5 py-2">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AppleEmojiSprite emoji="✨" className="size-7" />
              <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {visible.map((s) => {
                const Icon = KIND_ICON[s.kind];
                const title =
                  s.kind === "attendance-missing"
                    ? classNameById.get(s.classId) ?? s.classId
                    : s.studentName;
                const subtitle =
                  s.kind === "attendance-missing" ? null : classNameById.get(s.classId);
                return (
                  <div key={s.id} className="group flex items-start gap-3 py-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        s.severity === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/15 text-warning"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {title}
                        </span>
                        {subtitle && (
                          <span className="shrink-0 text-xs text-muted-foreground">{subtitle}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {detailOf(s)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {actionsOf(s).map((a) => (
                          <Button
                            key={a.href + a.label}
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-6 rounded-full px-2.5 text-xs font-medium"
                          >
                            <Link href={a.href}>{a.label}</Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("dismiss")}
                      className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => dismiss(s.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {hiddenCount > 0 && (
            <p className="border-t border-border/60 py-2.5 text-center text-xs text-muted-foreground">
              {t("moreSignals", { count: hiddenCount })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
