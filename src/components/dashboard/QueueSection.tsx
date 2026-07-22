"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ListTodo } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
} from "@/components/DashboardPage";
import { useGradesStore } from "@/store/useGradesStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import {
  pendingCheckRows,
  upcomingSummativeDeadlines,
  type CheckRow,
  type DeadlineRow,
} from "@/lib/home-metrics";
import { dateToKey } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   ISHLAR NAVBATI — bosh sahifa chap ustuni.

   Ikki manba: tekshirish qatorlari (ball kiritilishi chala assignmentlar)
   + kelgusi summativ muddatlar (useGradesStore). Guruhlar: Muddati oʻtgan /
   Bugun / Keyinroq (Keyinroq ufqi qattiq — 7 kun).
   ════════════════════════════════════════════════════════════════════ */

type QueueRow =
  | { kind: "check"; key: string; row: CheckRow }
  | { kind: "deadline"; key: string; row: DeadlineRow };

const KIND_RANK: Record<QueueRow["kind"], number> = { check: 0, deadline: 1 };

function rowDue(r: QueueRow): string | null {
  return r.row.due;
}

function addDaysKey(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return dateToKey(d);
}

export function QueueSection({ now }: { now: Date }) {
  const t = useTranslations("QueueSection");

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const liveClasses = useLiveClasses();

  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(now, 1);
  const weekKey = addDaysKey(now, 7);

  const classMeta = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] }])),
    [liveClasses]
  );

  const checkRows = useMemo(() => pendingCheckRows(classDataMap, todayKey), [classDataMap, todayKey]);
  const deadlineRows = useMemo(
    () => upcomingSummativeDeadlines(classDataMap, todayKey),
    [classDataMap, todayKey]
  );

  // ── Guruhlash: Muddati oʻtgan / Bugun / Keyinroq (scope ufqi) ──
  const groups = useMemo(() => {
    const overdue: QueueRow[] = [];
    const today: QueueRow[] = [];
    const later: QueueRow[] = [];

    for (const row of checkRows) {
      const item: QueueRow = { kind: "check", key: `c-${row.classId}-${row.assignmentId}`, row };
      (row.due < todayKey ? overdue : today).push(item);
    }
    for (const row of deadlineRows) {
      if (row.due > weekKey) continue;
      later.push({ kind: "deadline", key: `d-${row.classId}-${row.assignmentId}`, row });
    }

    const byDue = (a: QueueRow, b: QueueRow) => {
      const da = rowDue(a);
      const db = rowDue(b);
      if (da !== db) {
        if (da == null) return 1;
        if (db == null) return -1;
        return da.localeCompare(db);
      }
      return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    };
    overdue.sort(byDue);
    today.sort(byDue);
    later.sort(byDue);
    return { overdue, today, later };
  }, [checkRows, deadlineRows, todayKey, weekKey]);

  const isEmpty = groups.overdue.length + groups.today.length + groups.later.length === 0;

  // ── Muddat matni + jiddiylik rangi ──
  const dueLabel = (due: string | null): { text: string; cls: string } => {
    if (!due) return { text: t("noDue"), cls: "text-muted-foreground" };
    if (due < todayKey) {
      const [, m, d] = due.split("-").map(Number);
      return { text: `${d}-${MONTHS_UZ[m - 1].toLowerCase()}`, cls: "text-destructive" };
    }
    if (due === todayKey) return { text: t("dueToday"), cls: "text-warning" };
    if (due === tomorrowKey) return { text: t("dueTomorrow"), cls: "text-warning" };
    const [, m, d] = due.split("-").map(Number);
    return { text: `${d}-${MONTHS_UZ[m - 1].toLowerCase()}`, cls: "text-muted-foreground" };
  };

  const renderGroup = (label: string, rows: QueueRow[], accent?: "destructive") => {
    if (rows.length === 0) return null;
    return (
      <div>
        <div className="mb-1 flex items-center gap-2 px-1">
          <span
            className={cn(
              "text-xs font-semibold",
              accent === "destructive" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground/60">{rows.length}</span>
        </div>
        <div className="flex flex-col divide-y divide-dashed divide-border/70">
          {rows.map((row) => {
            if (row.kind === "check") {
              const meta = classMeta.get(row.row.classId);
              const due = dueLabel(row.row.due);
              return (
                <Link
                  key={row.key}
                  href={`/dashboard/grades?classId=${encodeURIComponent(row.row.classId)}`}
                  className="group flex items-center gap-3 py-2.5"
                >
                  <ProgressRing entered={row.row.entered} total={row.row.total} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground transition-colors duration-fast group-hover:text-primary">
                      {row.row.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("enteredOf", { entered: row.row.entered, total: row.row.total })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning"
                  >
                    {t("checkStatus")}
                  </Badge>
                  {meta && <ClassChip name={meta.name} hex={meta.hex} />}
                  <span className={cn("shrink-0 text-xs font-medium tabular-nums", due.cls)}>
                    {due.text}
                  </span>
                </Link>
              );
            }
            const meta = classMeta.get(row.row.classId);
            const due = dueLabel(row.row.due);
            const [, m, d] = row.row.due.split("-").map(Number);
            return (
              <Link
                key={row.key}
                href={`/dashboard/grades?classId=${encodeURIComponent(row.row.classId)}`}
                className="group flex items-center gap-3 py-2.5"
              >
                <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-card">
                  <span className="text-sm font-bold leading-none tabular-nums text-foreground">{d}</span>
                  <span className="mt-0.5 text-[9px] font-medium uppercase leading-none text-muted-foreground">
                    {MONTHS_UZ[m - 1].slice(0, 3)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground transition-colors duration-fast group-hover:text-primary">
                    {row.row.title}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning"
                >
                  {t("controlBadge")}
                </Badge>
                {meta && <ClassChip name={meta.name} hex={meta.hex} />}
                <span className={cn("shrink-0 text-xs font-medium tabular-nums", due.cls)}>
                  {due.text}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card data-tour="home-queue" className={panelCardClass}>
      <CardHeader className={cn(panelCardHeaderClass, "justify-between min-h-16 px-5 pt-4! pb-4!")}>
        <div className="flex min-w-0 items-center gap-2">
          <SectionIcon>
            <ListTodo />
          </SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={panelCardContentClass}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-5 pb-5 pt-4">
            {isEmpty ? (
              <Empty className="border-0 p-4 gap-4">
                <EmptyHeader>
                  <EmptyMedia>
                    <Illustration name="30" className="h-[clamp(4.5rem,12vh,7rem)] text-black dark:text-white" />
                  </EmptyMedia>
                  <EmptyTitle className="flex items-center justify-center gap-1.5">
                    {t("emptyTitle")}
                    <AppleEmojiSprite emoji="☕" className="size-4.5" />
                  </EmptyTitle>
                  <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-4">
                {renderGroup(t("groupOverdue"), groups.overdue, "destructive")}
                {renderGroup(t("groupToday"), groups.today)}
                {renderGroup(t("groupLater"), groups.later)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Sinf chipi — ClassSwatch + nom (kvadrat indikator standarti). */
function ClassChip({ name, hex }: { name: string; hex: string }) {
  return (
    <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground md:inline-flex">
      <ClassSwatch hex={hex} className="size-2.5" />
      {name}
    </span>
  );
}

/** Kiritilish progress-halqasi — "15/30" kasr bilan. */
function ProgressRing({ entered, total }: { entered: number; total: number }) {
  const pct = total > 0 ? entered / total : 0;
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-9 shrink-0">
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-border" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          className="stroke-warning"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold tabular-nums text-foreground">
        {entered}/{total}
      </span>
    </div>
  );
}
