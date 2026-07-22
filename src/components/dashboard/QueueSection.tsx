"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { ClipboardList, ListTodo, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { ClassSwatch } from "@/components/ClassSwatch";
import { TaskComposer, type TaskComposerHandle } from "@/components/tasks/TaskComposer";
import {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
} from "@/components/DashboardPage";
import { useTaskStore } from "@/store/useTaskStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeHomeTourDemo } from "@/components/tour/home-tour-demo";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { TASK_STATUS, type TaskStatus } from "@/lib/tasks-data";
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
   ISHLAR NAVBATI — bosh sahifa chap ustuni (redesign M3).

   Uch manba, yangi model YOʻQ: ochiq vazifalar (useTaskStore) +
   tekshirish qatorlari (ball kiritilishi chala assignmentlar) + kelgusi
   summativ muddatlar (useGradesStore). Guruhlar: Muddati oʻtgan / Bugun /
   Keyinroq (Keyinroq ufqi qattiq — 7 kun).
   ════════════════════════════════════════════════════════════════════ */

/** Navbat ishlatadigan minimal vazifa koʻrinishi (tur-demo ham shu shaklda). */
type QueueTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: TaskStatus;
  classIds?: string[];
};

type QueueRow =
  | { kind: "check"; key: string; row: CheckRow }
  | { kind: "task"; key: string; task: QueueTask }
  | { kind: "deadline"; key: string; row: DeadlineRow };

const KIND_RANK: Record<QueueRow["kind"], number> = { check: 0, task: 1, deadline: 2 };

function rowDue(r: QueueRow): string | null {
  if (r.kind === "task") return r.task.dueDate;
  return r.row.due;
}

function addDaysKey(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return dateToKey(d);
}

export function QueueSection({ now }: { now: Date }) {
  const t = useTranslations("QueueSection");
  const composerRef = useRef<TaskComposerHandle>(null);

  const allTasks = useTaskStore((s) => s.tasks);
  const toggleTaskDone = useTaskStore((s) => s.toggleTaskDone);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const liveClasses = useLiveClasses();

  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(now, 1);
  const weekKey = addDaysKey(now, 7);

  const classMeta = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] }])),
    [liveClasses]
  );

  const openTasks = useMemo<QueueTask[]>(
    () =>
      allTasks.filter(
        (task) => task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.CANCELED
      ),
    [allTasks]
  );
  const checkRows = useMemo(() => pendingCheckRows(classDataMap, todayKey), [classDataMap, todayKey]);
  const deadlineRows = useMemo(
    () => upcomingSummativeDeadlines(classDataMap, todayKey),
    [classDataMap, todayKey]
  );

  // ── Tur-demo — boʻsh hisobda namunaviy vazifalar ──
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "home");
  const demoTasks = useMemo<QueueTask[]>(() => {
    if (!tourDemoActive) return [];
    return makeHomeTourDemo(now).tasks.map((task) => ({ ...task, classIds: [] }));
  }, [tourDemoActive, now]);
  const tasks =
    demoTasks.length > 0 && openTasks.length === 0 && checkRows.length === 0 ? demoTasks : openTasks;

  // ── Guruhlash: Muddati oʻtgan / Bugun / Keyinroq (scope ufqi) ──
  const groups = useMemo(() => {
    const overdue: QueueRow[] = [];
    const today: QueueRow[] = [];
    const later: QueueRow[] = [];

    for (const row of checkRows) {
      const item: QueueRow = { kind: "check", key: `c-${row.classId}-${row.assignmentId}`, row };
      (row.due < todayKey ? overdue : today).push(item);
    }
    for (const task of tasks) {
      const item: QueueRow = { kind: "task", key: `t-${task.id}`, task };
      if (task.dueDate && task.dueDate < todayKey) overdue.push(item);
      else if (task.dueDate === todayKey) today.push(item);
      else if (task.dueDate && task.dueDate <= weekKey) later.push(item);
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
  }, [checkRows, tasks, deadlineRows, todayKey, weekKey]);

  const isEmpty = groups.overdue.length + groups.today.length + groups.later.length === 0;

  // ── Footer: bugungi vazifalar bajarilishi ──
  const todayDone = useMemo(() => {
    const todays = allTasks.filter(
      (task) => task.dueDate === todayKey && task.status !== TASK_STATUS.CANCELED
    );
    return {
      done: todays.filter((task) => task.status === TASK_STATUS.DONE).length,
      total: todays.length,
    };
  }, [allTasks, todayKey]);

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
            if (row.kind === "task") {
              const meta = row.task.classIds?.length
                ? classMeta.get(row.task.classIds[0])
                : undefined;
              const due = dueLabel(row.task.dueDate);
              return (
                <div key={row.key} className="group flex items-center gap-3 py-2.5">
                  <Checkbox
                    checked={row.task.status === TASK_STATUS.DONE}
                    onCheckedChange={() => toggleTaskDone(row.task.id)}
                    aria-label={t("markDone")}
                  />
                  <Link href="/dashboard/tasks" className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground transition-colors duration-fast group-hover:text-primary">
                      {row.task.title}
                    </p>
                  </Link>
                  {meta && <ClassChip name={meta.name} hex={meta.hex} />}
                  <span className={cn("shrink-0 text-xs font-medium tabular-nums", due.cls)}>
                    {due.text}
                  </span>
                </div>
              );
            }
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
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="icon"
            aria-label={t("addTask")}
            onClick={() => composerRef.current?.focus()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={panelCardContentClass}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 px-5 pt-4 empty:hidden">
            <TaskComposer ref={composerRef} seed={{ dueDate: todayKey }} hideTrigger />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-5 pb-5 pt-3">
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
          {todayDone.total > 0 && (
            <div className="flex shrink-0 items-center justify-center border-t border-border px-5 py-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                  todayDone.done >= todayDone.total
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t("footerDone", { done: todayDone.done, total: todayDone.total })}
              </span>
            </div>
          )}
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
