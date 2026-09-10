"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ListTodo, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionIcon } from "@/components/ui/section-icon";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
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
import { CLASS_COLOR_HEX, autoClassColor } from "@/lib/class-colors";
import { addDaysKey, dateToKey } from "@/lib/date-keys";
import { formatDateGroupLabel, sortTasks, type Task } from "@/lib/tasks-data";
import { DEMO_CLASS_NAMES } from "@/components/tour/home-tour-demo";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR — bosh sahifa oʻng ustuni.

   Vidjet — tasks store'ning proyeksiyasi (parallel model emas): faol
   vazifalar kechikkan → bugun → 7 kun ichida → muddatsiz guruhlarida.
   Dars-manbali vazifalar kirmaydi — ular oʻrta ustundagi bugungi darslarda
   allaqachon koʻrinadi. Qatorlar Vazifalar sahifasi bilan bir xil `TaskRow`
   komponentidan foydalanadi — checkbox ikkala joyda sinxron.

   Bosh sahifada faqat eng koʻp takrorlanadigan ikki harakat bor: belgilash
   va tez qoʻshish. Tahrirlash Vazifalar sahifasida qoladi.
   [[stat-tile-canonical]]
   ════════════════════════════════════════════════════════════════════ */

const MAX_ROWS = 7;

type GroupKey = "overdue" | "today" | "later" | "nodate";
const GROUP_ORDER: GroupKey[] = ["overdue", "today", "later", "nodate"];

export function QueueSection({ now, demoTasks }: { now: Date; /** Tur faol paytida boʻsh navbat oʻrniga koʻrsatiladigan namunaviy vazifalar — store'ga taʼsir qilmaydi. */ demoTasks?: Task[] }) {
  const t = useTranslations("QueueSection");
  const router = useRouter();

  const storeItems = useTasksStore((s) => s.items);
  const items = demoTasks ?? storeItems;
  const setStatus = useTasksStore((s) => s.setStatus);
  const addManualTask = useTasksStore((s) => s.addManualTask);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const liveClasses = useLiveClasses();
  const [draft, setDraft] = useState("");

  const todayKey = dateToKey(now);
  const tomorrowKey = addDaysKey(todayKey, 1);
  const weekKey = addDaysKey(todayKey, 7);

  // Demo vazifalar `liveClasses`da yoʻq — nomi/rangi DEMO_CLASS_NAMES'dan
  // (TodayRail'dagi bilan bir xil naqsh, [[dashboard-hero-stats]]).
  const classMeta = useMemo(() => {
    const map = new Map(liveClasses.map((c) => [c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] }]));
    if (demoTasks) {
      for (const classId of Object.keys(DEMO_CLASS_NAMES)) {
        map.set(classId, { name: DEMO_CLASS_NAMES[classId], hex: CLASS_COLOR_HEX[autoClassColor(classId)] });
      }
    }
    return map;
  }, [liveClasses, demoTasks]);

  // ── Faol, dars-manbali boʻlmagan vazifalar guruhlarga boʻlinadi. 7 kundan
  //    keyingilari koʻrsatilmaydi, faqat boʻsh holat matni uchun sanaladi. ──
  const { groups, beyondCount } = useMemo(() => {
    const groups: Record<GroupKey, Task[]> = { overdue: [], today: [], later: [], nodate: [] };
    let beyondCount = 0;
    for (const task of sortTasks(items)) {
      if (task.source.kind === "lesson" || task.status === "done" || task.status === "canceled") continue;
      if (task.dueDate == null) groups.nodate.push(task);
      else if (task.dueDate < todayKey) groups.overdue.push(task);
      else if (task.dueDate === todayKey) groups.today.push(task);
      else if (task.dueDate <= weekKey) groups.later.push(task);
      else beyondCount++;
    }
    return { groups, beyondCount };
  }, [items, todayKey, weekKey]);

  const total = GROUP_ORDER.reduce((sum, key) => sum + groups[key].length, 0);
  const isEmpty = total === 0;
  const shown: Record<GroupKey, number> = { overdue: 0, today: 0, later: 0, nodate: 0 };
  let budget = MAX_ROWS;
  for (const key of GROUP_ORDER) {
    const take = Math.min(groups[key].length, budget);
    shown[key] = take;
    budget -= take;
  }
  const hiddenCount = total - GROUP_ORDER.reduce((sum, key) => sum + shown[key], 0);

  const submitDraft = () => {
    const title = draft.trim();
    if (!title || demoTasks) return;
    addManualTask({ title, dueDate: todayKey });
    setDraft("");
  };

  // ── Bosilganda vazifa oʻz manbasiga olib boradi. ──
  const openTask = (task: Task) => {
    const { source } = task;
    if (source.kind === "grading") {
      router.push(`/dashboard/grades?classId=${encodeURIComponent(source.classId)}`);
    } else if (source.kind === "birthday") {
      router.push(`/dashboard/students/${encodeURIComponent(source.studentId)}`);
    } else {
      router.push(`/dashboard/tasks?task=${encodeURIComponent(task.id)}`);
    }
  };

  // ── Kiritilish progress matni ("13/15 kiritildi") — faqat baholash vazifalarida. ──
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
  const dueLabel = (due: string | null): { text: string; cls: string } | null => {
    if (due == null) return null;
    if (due < todayKey) return { text: formatDateGroupLabel(due), cls: "text-destructive" };
    if (due === todayKey) return { text: t("dueToday"), cls: "text-warning" };
    if (due === tomorrowKey) return { text: t("dueTomorrow"), cls: "text-warning" };
    return { text: formatDateGroupLabel(due), cls: "text-muted-foreground" };
  };

  const groupLabel: Record<GroupKey, string> = {
    overdue: t("groupOverdue"),
    today: t("groupToday"),
    later: t("groupLater"),
    nodate: t("noDue"),
  };

  const renderGroup = (key: GroupKey) => {
    const tasks = groups[key].slice(0, shown[key]);
    if (tasks.length === 0) return null;
    return (
      <div key={key}>
        <div className="mb-1 flex items-center gap-2 px-1">
          <span
            className={cn(
              "text-xs font-semibold",
              key === "overdue" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {groupLabel[key]}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground/60">{groups[key].length}</span>
        </div>
        <div className="flex flex-col">
          {tasks.map((task) => {
            const meta = task.classId ? classMeta.get(task.classId) : undefined;
            const progress = enteredOf(task);
            return (
              <TaskRow
                key={task.id}
                task={task}
                due={key === "today" ? null : dueLabel(task.dueDate)}
                onToggleStatus={() => setStatus(task.id, task.status === "done" ? "todo" : "done")}
                onClick={() => openTask(task)}
                onKeyDown={(e) => {
                  // Ichki checkbox'dan koʻtarilgan tugmalar uning oʻziga qoladi.
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openTask(task);
                  }
                }}
                trailing={
                  progress || meta ? (
                    <>
                      {progress && (
                        <span className="shrink-0 text-xs text-muted-foreground">{progress}</span>
                      )}
                      {meta && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground">
                          <ClassSwatch hex={meta.hex} />
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
        <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
          <Link href="/dashboard/tasks">{t("scopeAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent className={panelCardContentClass}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="px-5 pt-4">
            <div className="relative">
              <Plus className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitDraft();
                  if (e.key === "Escape") setDraft("");
                }}
                placeholder={t("quickAddPlaceholder")}
                aria-label={t("quickAddPlaceholder")}
                className="pl-9 shadow-none"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 scrollbar-hover overflow-y-auto scrollbar-thin px-5 pb-5 pt-4">
            {isEmpty ? (
              <Empty className="border-0 p-4 gap-4">
                <EmptyHeader>
                  <EmptyMedia>
                    <Illustration name="30" className="h-[clamp(4.5rem,12vh,7rem)] text-black dark:text-white" />
                  </EmptyMedia>
                  <EmptyTitle>{beyondCount > 0 ? t("emptyWeekTitle") : t("emptyTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {beyondCount > 0 ? t("emptyWeekDescription", { count: beyondCount }) : t("emptyDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-4">
                {GROUP_ORDER.map(renderGroup)}
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
