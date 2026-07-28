"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ListTodo } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { ClassSwatch } from "@/components/ClassSwatch";
import { TaskRow } from "@/app/dashboard/(with-sidebar)/tasks/_components/TasksList";
import {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
} from "@/components/DashboardPage";
import { useTasksStore } from "@/store/useTasksStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { addDaysKey, dateToKey } from "@/lib/date-keys";
import { formatDateGroupLabel, sortTasks, type Task } from "@/lib/tasks-data";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   ISHLAR NAVBATI — bosh sahifa chap ustuni.

   Vidjet — tasks store'ning proyeksiyasi (parallel model emas): faqat
   "grading" (baholash) manbali, hali toʻliq belgilanmagan vazifalar,
   7 kunlik ufq bilan filtrlanadi. Qatorlar Vazifalar sahifasi bilan bir
   xil `TaskRow` komponentidan foydalanadi — checkbox shu yerda ham
   ishlaydi va ikkala joyda ham sinxron. [[stat-tile-canonical]]
   ════════════════════════════════════════════════════════════════════ */

const MAX_ROWS = 7;

export function QueueSection({ now }: { now: Date }) {
  const t = useTranslations("QueueSection");
  const router = useRouter();

  const items = useTasksStore((s) => s.items);
  const setStatus = useTasksStore((s) => s.setStatus);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const liveClasses = useLiveClasses();

  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);
  const weekKey = addDaysKey(todayKey, 7);

  const classMeta = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] }])),
    [liveClasses]
  );

  // ── Baholash navbati: faqat "grading" manbali, hali bajarilmagan,
  //    7 kunlik ufq ichidagi vazifalar (Vazifalar sahifasidagi "todo" bilan bir xil). ──
  const queueTasks = useMemo(
    () =>
      items.filter(
        (task) =>
          task.source.kind === "grading" &&
          task.status !== "done" &&
          task.status !== "canceled" &&
          task.dueDate != null &&
          task.dueDate <= weekKey
      ),
    [items, weekKey]
  );

  const groups = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const later: Task[] = [];
    for (const task of sortTasks(queueTasks)) {
      if (task.dueDate! < todayKey) overdue.push(task);
      else if (task.dueDate === todayKey) today.push(task);
      else later.push(task);
    }
    return { overdue, today, later };
  }, [queueTasks, todayKey]);

  const total = groups.overdue.length + groups.today.length + groups.later.length;
  const isEmpty = total === 0;
  const shown = { overdue: 0, today: 0, later: 0 };
  let budget = MAX_ROWS;
  for (const key of ["overdue", "today", "later"] as const) {
    const take = Math.min(groups[key].length, budget);
    shown[key] = take;
    budget -= take;
  }
  const hiddenCount = total - (shown.overdue + shown.today + shown.later);

  // ── Kiritilish progress matni ("13/15 kiritildi") — faqat KOʻRSATISH
  //    uchun, navbat aʼzoligi endi Task.status ("todo") orqali belgilanadi. ──
  const enteredOf = (task: Task): string | null => {
    if (task.source.kind !== "grading") return null;
    const { classId, assignmentId } = task.source;
    const cd = classDataMap[classId];
    if (!cd) return null;
    const activeStudents = cd.students.filter((s) => s.status !== "archived");
    if (activeStudents.length === 0) return null;
    const scored = new Set(
      cd.grades
        .filter((g) => g.assignmentId === assignmentId && (g.score != null || g.missing || g.isMissing))
        .map((g) => g.studentId)
    );
    const entered = activeStudents.filter((s) => scored.has(s.id)).length;
    return t("enteredOf", { entered, total: activeStudents.length });
  };

  // ── Muddat matni + jiddiylik rangi ──
  const dueLabel = (due: string): { text: string; cls: string } => {
    if (due < todayKey) return { text: formatDateGroupLabel(due), cls: "text-destructive" };
    if (due === todayKey) return { text: t("dueToday"), cls: "text-warning" };
    if (due === tomorrowKey) return { text: t("dueTomorrow"), cls: "text-warning" };
    return { text: formatDateGroupLabel(due), cls: "text-muted-foreground" };
  };

  const renderGroup = (label: string, tasks: Task[], accent?: "destructive") => {
    if (tasks.length === 0) return null;
    return (
      <div key={label}>
        <div className="mb-1 flex items-center gap-2 px-1">
          <span
            className={cn(
              "text-xs font-semibold",
              accent === "destructive" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground/60">{tasks.length}</span>
        </div>
        <div className="flex flex-col">
          {tasks.map((task) => {
            const meta = task.classId ? classMeta.get(task.classId) : undefined;
            const progress = enteredOf(task);
            return (
              <TaskRow
                key={task.id}
                task={task}
                due={dueLabel(task.dueDate!)}
                onToggleStatus={() => setStatus(task.id, task.status === "done" ? "todo" : "done")}
                onClick={() => {
                  if (task.classId) router.push(`/dashboard/grades?classId=${encodeURIComponent(task.classId)}`);
                }}
                trailing={
                  progress || meta ? (
                    <>
                      {progress && (
                        <span className="shrink-0 text-xs text-muted-foreground">{progress}</span>
                      )}
                      {meta && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground">
                          <ClassSwatch hex={meta.hex} className="size-2.5" />
                          {meta.name}
                        </span>
                      )}
                    </>
                  ) : undefined
                }
              />
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
                {renderGroup(t("groupOverdue"), groups.overdue.slice(0, shown.overdue), "destructive")}
                {renderGroup(t("groupToday"), groups.today.slice(0, shown.today))}
                {renderGroup(t("groupLater"), groups.later.slice(0, shown.later))}
                {hiddenCount > 0 && (
                  <Button asChild variant="ghost" size="sm" className="mx-auto text-xs text-muted-foreground">
                    <Link href="/dashboard/tasks">{t("viewAll", { count: hiddenCount })}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
