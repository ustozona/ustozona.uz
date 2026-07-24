"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Ban, CalendarOff, ChevronDown, Copy, Flag, GraduationCap, Play, Plus, Repeat, Sun, Sunrise, Trash2 } from "lucide-react";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtKey } from "@/components/ui/date-key-picker";
import { TaskTimeCard } from "./TaskTimeCard";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { WeekStrip } from "@/components/dashboard/WeekStrip";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { cn } from "@/lib/utils";
import {
  formatDateGroupLabel,
  formatMinutes,
  groupTasksByDate,
  PRIORITY_META,
  PRIORITY_ORDER,
  TAG_PILL_CLASS,
  taskPomoLengthMin,
  type Task,
  type TaskPriority,
} from "@/lib/tasks-data";

/** Vazifa qatorida vaqt koʻrsatiladi — dars-manbali boʻlsa oraliq (10:35–11:20). */
function fmtTaskTime(task: Task): string {
  const start = minToHHMM(task.dueMin!);
  if (task.dueEndMin == null) return start;
  return `${start}–${minToHHMM(task.dueEndMin)}`;
}

type ClassMeta = { name: string; hex: string };

export function TasksList({
  title,
  icon,
  count,
  activeTasks,
  doneTasks,
  isDoneView,
  hydrated,
  todayKey,
  selectedTaskId,
  onSelectTask,
  onToggleStatus,
  onQuickAdd,
  onStartFocus,
  onSetPriority,
  onSetDueDate,
  onSetClassId,
  onDelete,
  onCancel,
  onDuplicate,
  classesById,
  liveClasses,
  pomoMinutes,
  defaultDueDate,
  weekSelectedDate,
  dateFilter,
  taskDayKeys,
  onSelectDate,
  showWeekStrip,
}: {
  title: string;
  icon?: React.ReactNode;
  count: number;
  activeTasks: Task[];
  doneTasks: Task[];
  isDoneView: boolean;
  hydrated: boolean;
  todayKey: string;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onQuickAdd: (input: {
    title: string;
    dueDate: string | null;
    dueMin?: number | null;
    dueEndMin?: number | null;
    classId: string | null;
    priority: TaskPriority;
  }) => void;
  /** Tez-qoʻshishda oldindan tanlangan sana (joriy roʻyxat konteksti). */
  defaultDueDate?: string;
  onStartFocus: (id: string) => void;
  /** Qator ustida oʻng-klik menyusi uchun (Focus To-Do uslubi). */
  onSetPriority: (id: string, priority: TaskPriority) => void;
  onSetDueDate: (id: string, key: string | null) => void;
  onSetClassId: (id: string, classId: string | null) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onDuplicate: (id: string) => void;
  classesById: Map<string, ClassMeta>;
  liveClasses: { id: string; name: string; hex: string }[];
  pomoMinutes: number;
  /** Mini-kalendar (WeekStrip) tanlovi — bosh sahifadagi "Bugungi darslar" uslubi. */
  weekSelectedDate: Date;
  dateFilter: string | null;
  taskDayKeys: Set<string>;
  onSelectDate: (d: Date) => void;
  /** Faqat kun-koʻrinishlarida (Bugun/Ertaga) koʻrsatiladi. */
  showWeekStrip: boolean;
}) {
  const t = useTranslations("TasksPage.list");
  const tomorrowKey = addDaysKey(todayKey, 1);

  const groupLabel = (key: string) => {
    if (key === "nodate") return t("noDateGroup");
    if (key === todayKey) return t("todayGroup");
    if (key === tomorrowKey) return t("tomorrowGroup");
    return formatDateGroupLabel(key);
  };

  const activeGroups = groupTasksByDate(activeTasks);
  const doneGroups = groupTasksByDate(doneTasks, { dateField: "completedAt", order: "desc" });

  return (
    <Panel>
      <PanelHeader
        icon={icon}
        title={title}
        divider={!showWeekStrip}
        count={
          count > 0 ? (
            <Badge variant="secondary" className="size-6 rounded-full bg-muted p-0 text-xs tabular-nums text-muted-foreground">
              {count}
            </Badge>
          ) : undefined
        }
      />
      {showWeekStrip && (
        <div className="mx-4 mb-1 mt-1 shrink-0 rounded-lg border border-border bg-muted/20 p-2">
          <WeekStrip
            selected={dateFilter ? dateKeyToDate(dateFilter) : weekSelectedDate}
            onSelect={onSelectDate}
            todayKey={todayKey}
            hasLesson={(key) => taskDayKeys.has(key)}
            isBlocked={(date) => date.getDay() === 0}
          />
        </div>
      )}
      <PanelBody>
        <div className="flex flex-col">
          {!hydrated ? (
            <div className="flex flex-col gap-2 px-4 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
          {!isDoneView && (
            <QuickAddRow
              onSubmit={onQuickAdd}
              liveClasses={liveClasses}
              todayKey={todayKey}
              defaultDueDate={defaultDueDate ?? ""}
              tight={showWeekStrip}
            />
          )}

          {activeTasks.length === 0 && doneTasks.length === 0 ? (
            <Empty className="h-full border-0 py-10">
              <EmptyHeader>
                <EmptyMedia>
                  <Illustration name="31" className="h-28 text-black dark:text-white" />
                </EmptyMedia>
                <EmptyTitle className="flex items-center justify-center gap-1.5">
                  {t("emptyTitle")}
                  <AppleEmojiSprite emoji="📝" className="size-4.5" />
                </EmptyTitle>
                <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3 px-4 py-4">
              {isDoneView
                ? doneGroups.map((group) => (
                    <TaskGroup
                      key={group.key}
                      label={groupLabel(group.key)}
                      tasks={group.tasks}
                      selectedTaskId={selectedTaskId}
                      onSelectTask={onSelectTask}
                      onToggleStatus={onToggleStatus}
                      onStartFocus={onStartFocus}
                      onSetPriority={onSetPriority}
                      onSetDueDate={onSetDueDate}
                      onSetClassId={onSetClassId}
                      onDelete={onDelete}
                      onCancel={onCancel}
                      onDuplicate={onDuplicate}
                      classesById={classesById}
                      liveClasses={liveClasses}
                      pomoMinutes={pomoMinutes}
                      todayKey={todayKey}
                    />
                  ))
                : activeGroups.map((group) => (
                    <TaskGroup
                      key={group.key}
                      label={groupLabel(group.key)}
                      overdue={group.key !== "nodate" && group.key < todayKey}
                      tasks={group.tasks}
                      selectedTaskId={selectedTaskId}
                      onSelectTask={onSelectTask}
                      onToggleStatus={onToggleStatus}
                      onStartFocus={onStartFocus}
                      onSetPriority={onSetPriority}
                      onSetDueDate={onSetDueDate}
                      onSetClassId={onSetClassId}
                      onDelete={onDelete}
                      onCancel={onCancel}
                      onDuplicate={onDuplicate}
                      classesById={classesById}
                      liveClasses={liveClasses}
                      pomoMinutes={pomoMinutes}
                      todayKey={todayKey}
                    />
                  ))}

              {!isDoneView && doneTasks.length > 0 && (
                <Collapsible className="flex flex-col items-center gap-4">
                  <CollapsibleTrigger className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted [&[data-state=open]>svg]:rotate-180">
                    {t("doneSection", { count: doneTasks.length })}
                    <ChevronDown className="size-3.5 shrink-0 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="w-full">
                    <div className="flex flex-col gap-4">
                      {doneGroups.map((group) => (
                        <TaskGroup
                          key={group.key}
                          label={groupLabel(group.key)}
                          tasks={group.tasks}
                          selectedTaskId={selectedTaskId}
                          onSelectTask={onSelectTask}
                          onToggleStatus={onToggleStatus}
                          onStartFocus={onStartFocus}
                          onSetPriority={onSetPriority}
                          onSetDueDate={onSetDueDate}
                          onSetClassId={onSetClassId}
                          onDelete={onDelete}
                          onCancel={onCancel}
                          onDuplicate={onDuplicate}
                          classesById={classesById}
                          liveClasses={liveClasses}
                          pomoMinutes={pomoMinutes}
                          todayKey={todayKey}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}

function TaskGroup({
  label,
  overdue,
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleStatus,
  onStartFocus,
  onSetPriority,
  onSetDueDate,
  onSetClassId,
  onDelete,
  onCancel,
  onDuplicate,
  classesById,
  liveClasses,
  pomoMinutes,
  todayKey,
}: {
  label: string;
  overdue?: boolean;
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onStartFocus: (id: string) => void;
  onSetPriority: (id: string, priority: TaskPriority) => void;
  onSetDueDate: (id: string, key: string | null) => void;
  onCancel: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetClassId: (id: string, classId: string | null) => void;
  onDelete: (id: string) => void;
  classesById: Map<string, ClassMeta>;
  liveClasses: { id: string; name: string; hex: string }[];
  pomoMinutes: number;
  todayKey: string;
}) {
  const t = useTranslations("TasksPage.list");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const tomorrowKey = addDaysKey(todayKey, 1);
  // Focus To-Do uslubi: qator oxirida qisqa muddat yorligʻi.
  const dueLabel = (due: string | null) => {
    if (!due) return null;
    if (due < todayKey) return { text: formatDateGroupLabel(due), cls: "text-destructive" };
    if (due === todayKey) return { text: t("todayGroup"), cls: "text-primary" };
    if (due === tomorrowKey) return { text: t("tomorrowGroup"), cls: "text-muted-foreground/70" };
    return { text: formatDateGroupLabel(due), cls: "text-muted-foreground/70" };
  };
  if (tasks.length === 0) return null;
  // Focus To-Do uslubi: guruh sarlavhasida faol vazifalarning taxminiy vaqti.
  const estimatedMin = tasks
    .filter((x) => x.status !== "done" && x.status !== "canceled")
    .reduce((sum, x) => sum + (x.estPomos ?? 0) * taskPomoLengthMin(x, pomoMinutes), 0);
  return (
    <div className="flex flex-col">
      {label && (
        <div
          className={cn(
            "px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider",
            overdue ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {label}
          {estimatedMin > 0 && (
            <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
              · {formatMinutes(estimatedMin)}
            </span>
          )}
        </div>
      )}
      {tasks.map((task) => {
        const done = task.status === "done";
        const canceled = task.status === "canceled";
        const prio = PRIORITY_META[task.priority];
        return (
        <ContextMenu key={task.id}>
        <ContextMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectTask(task.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectTask(task.id);
              }
            }}
            data-active={selectedTaskId === task.id || undefined}
            className={cn(
              // Focus To-Do qator tili: default — nozik pastki chiziq; hover — yumshoq
              // yumaloq fon (chiziq yashirinadi); tanlangan — turgʻun muted fon.
              "group relative flex min-h-10 w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors duration-fast",
              "border-b border-border/40 last:border-b-0",
              "hover:border-transparent hover:bg-muted/60",
              "focus-visible:ring-2 focus-visible:ring-ring",
              "data-[active=true]:border-transparent data-[active=true]:bg-muted"
            )}
          >
            <Checkbox
              checked={done}
              onCheckedChange={() => onToggleStatus(task.id)}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mt-0.5 size-4 shrink-0 rounded-full",
                done
                  ? "border-success bg-success data-[state=checked]:border-success data-[state=checked]:bg-success"
                  : prio.checkbox
              )}
            />
            <span
              className={cn(
                "min-w-0 flex-1 text-left text-sm break-words whitespace-normal transition-colors duration-base",
                done ? "text-muted-foreground line-through" : canceled ? "text-muted-foreground/70" : "text-foreground"
              )}
            >
              {task.title}
              {canceled && <span className="ml-1.5 text-xs">· {t("canceledBadge")}</span>}
            </span>
            {task.repeat && (
              <Repeat className="mt-0.5 hidden size-3 shrink-0 text-muted-foreground/70 sm:flex" />
            )}
            {(task.tags ?? []).length > 0 && (
              <span className="mt-0.5 hidden shrink-0 items-center gap-1 sm:flex">
                {(task.tags ?? []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", TAG_PILL_CLASS)}
                  >
                    {tag}
                  </span>
                ))}
              </span>
            )}
            {(() => {
              const dl = dueLabel(task.dueDate);
              if (!dl && task.dueMin == null) return null;
              return (
                <span className={cn("mt-0.5 hidden shrink-0 text-xs tabular-nums sm:flex", dl?.cls ?? "text-muted-foreground/70")}>
                  {dl?.text}
                  {task.dueMin != null && (dl ? ` ${fmtTaskTime(task)}` : fmtTaskTime(task))}
                </span>
              );
            })()}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {!done && !canceled && (
            <>
              <ContextMenuItem onClick={() => onStartFocus(task.id)}>
                <Play />
                {t("contextStartFocus")}
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => onSetDueDate(task.id, todayKey)}>
            <Sun />
            {t("todayGroup")}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onSetDueDate(task.id, tomorrowKey)}>
            <Sunrise />
            {t("tomorrowGroup")}
          </ContextMenuItem>
          {task.dueDate && (
            <ContextMenuItem onClick={() => onSetDueDate(task.id, null)}>
              <CalendarOff />
              {t("contextNoDate")}
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <div className="flex items-center justify-between gap-1 px-2 py-1.5">
            {PRIORITY_ORDER.slice().reverse().map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSetPriority(task.id, p)}
                aria-label={t(`priority.${p}`)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors hover:bg-accent",
                  task.priority === p && "bg-accent"
                )}
              >
                <Flag
                  className={cn("size-3.5 shrink-0", p === "none" ? "text-muted-foreground/40" : PRIORITY_META[p].text)}
                  fill={p === "none" ? "none" : "currentColor"}
                />
              </button>
            ))}
          </div>
          {liveClasses.length > 0 && (
            <>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <GraduationCap />
                  {t("contextMoveToClass")}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onClick={() => onSetClassId(task.id, null)}>
                    {t("noClass")}
                  </ContextMenuItem>
                  {liveClasses.map((cls) => (
                    <ContextMenuItem key={cls.id} onClick={() => onSetClassId(task.id, cls.id)} className="gap-2">
                      <ClassSwatch hex={cls.hex} />
                      {cls.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onDuplicate(task.id)}>
            <Copy />
            {t("contextDuplicate")}
          </ContextMenuItem>
          {task.source.kind !== "manual" ? (
            task.status !== "canceled" && (
              <ContextMenuItem onClick={() => onCancel(task.id)}>
                <Ban />
                {t("contextWontDo")}
              </ContextMenuItem>
            )
          ) : (
            <ContextMenuItem variant="destructive" onClick={() => setDeleteId(task.id)}>
              <Trash2 />
              {t("contextDelete")}
            </ContextMenuItem>
          )}
        </ContextMenuContent>
        </ContextMenu>
        );
      })}

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("contextDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("contextDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("contextDeleteCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              {t("contextDeleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QuickAddRow({
  onSubmit,
  liveClasses,
  todayKey,
  defaultDueDate,
  tight,
}: {
  onSubmit: (input: {
    title: string;
    dueDate: string | null;
    dueMin?: number | null;
    dueEndMin?: number | null;
    classId: string | null;
    priority: TaskPriority;
  }) => void;
  liveClasses: { id: string; name: string; hex: string }[];
  todayKey: string;
  /** Joriy roʻyxat konteksti (Bugun/Ertaga) boʻyicha oldindan tanlangan sana. */
  defaultDueDate: string;
  /** Ustida WeekStrip bor boʻlsa (kichikroq boʻshliq kifoya). */
  tight?: boolean;
}) {
  const t = useTranslations("TasksPage.list");
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [dueMin, setDueMin] = useState<number | null>(null);
  const [dueEndMin, setDueEndMin] = useState<number | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("none");
  const containerRef = useRef<HTMLDivElement>(null);

  // Roʻyxat almashsa (Bugun → Ertaga) sana konteksti ham yangilanadi.
  useEffect(() => setDueDate(defaultDueDate), [defaultDueDate]);

  // Boshqa joyga bosilsa (boʻsh holatda) qatorni yigʻish — dropdown/popover
  // kontenti portal orqali DOM tashqarisida render boʻlgani uchun ularni
  // data-slot orqali istisno qilamiz (aks holda sana/bayroq tanlashda yopilib qolardi).
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;
      if (target.closest('[data-slot="dropdown-menu-content"]')) return;
      if (target.closest('[data-slot="popover-content"]')) return;
      if (!title.trim()) setExpanded(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded, title]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({ title: trimmed, dueDate: dueDate || null, dueMin, dueEndMin, classId, priority });
    setTitle("");
    setDueDate(defaultDueDate);
    setDueMin(null);
    setDueEndMin(null);
    setClassId(null);
    setPriority("none");
  };

  const selectedClass = classId ? liveClasses.find((c) => c.id === classId) : undefined;
  const prio = PRIORITY_META[priority];
  const isToday = dueDate === todayKey;
  const dateLabel = (key: string) => {
    if (!key) return fmtKey(key);
    if (key === todayKey) return t("todayGroup");
    if (key === addDaysKey(todayKey, 1)) return t("tomorrowGroup");
    if (key === addDaysKey(todayKey, 2)) return t("dayAfterTomorrowGroup");
    if (key === addDaysKey(todayKey, -1)) return t("yesterdayGroup");
    return fmtKey(key);
  };

  /* Yigʻilgan holat — "+ Vazifa qoʻshish" chizma tugma, bosilsa toʻliq
     muharrirga ochiladi (Todoist uslubi). */
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          "mx-4 mb-0.5 flex h-10 items-center gap-2 rounded-lg border border-dashed border-border px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 hover:text-foreground",
          tight ? "mt-2" : "mt-3"
        )}
      >
        <Plus className="size-4 shrink-0" />
        {t("quickAddPlaceholder")}
      </button>
    );
  }

  /* Ochiq holat — tepada matn maydoni, pastda amallar qatori + "Qoʻshish"
     tugmasi. Dropdown/popover kontenti portal orqali DOM tashqarisida
     render boʻlgani uchun blur-asosli avtomatik yigʻish ISHLATILMAYDI —
     matn boʻsh boʻlsa ham pastdagi tugmalar (sana/bayroq/sinf) ishlayveradi;
     boshqa joyga bosilsa (matn boʻsh boʻlsa) mousedown-listener yigʻadi;
     yopish yana Escape orqali ham mumkin. */
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-4 mb-0.5 flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm transition-colors",
        tight ? "mt-2" : "mt-3"
      )}
    >
      <BorderBeam duration={6} size={80} colorFrom="#FBC02D" colorTo="var(--primary)" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setTitle("");
            setExpanded(false);
          }
        }}
        placeholder={t("quickAddPlaceholder")}
        className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-center gap-1">
        <TaskTimeCard
          value={{ dueDate: dueDate || null, dueMin, dueEndMin }}
          onChange={(patch) => {
            setDueDate(patch.dueDate ?? "");
            setDueMin(patch.dueMin ?? null);
            setDueEndMin(patch.dueEndMin ?? null);
          }}
          trigger={
            <button
              type="button"
              className={cn(
                "flex h-7 shrink-0 items-center gap-1.5 rounded-md border-0 bg-muted/50 px-2 text-xs font-medium shadow-none hover:bg-muted",
                isToday ? "text-primary" : !dueDate && "text-muted-foreground"
              )}
            >
              {dateLabel(dueDate)}
              {dueMin != null && (
                <span className="tabular-nums">
                  {" "}
                  {minToHHMM(dueMin)}
                  {dueEndMin != null ? `–${minToHHMM(dueEndMin)}` : ""}
                </span>
              )}
            </button>
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-muted"
              aria-label={t("priorityLabel")}
            >
              <Flag
                className={cn("size-3.5 shrink-0", priority === "none" ? "text-muted-foreground/40" : prio.text)}
                fill={priority === "none" ? "none" : "currentColor"}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRIORITY_ORDER.map((p) => (
              <DropdownMenuItem key={p} onClick={() => setPriority(p)} className="gap-2">
                <Flag
                  className={cn("size-3.5 shrink-0", p === "none" ? "text-muted-foreground/40" : PRIORITY_META[p].text)}
                  fill={p === "none" ? "none" : "currentColor"}
                />
                {t(`priority.${p}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {liveClasses.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 max-w-32 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-xs hover:bg-muted"
                aria-label={t("classLabel")}
              >
                {selectedClass ? (
                  <>
                    <ClassSwatch hex={selectedClass.hex} />
                    <span className="truncate text-foreground">{selectedClass.name}</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="size-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate text-muted-foreground/70">{t("classLabel")}</span>
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setClassId(null)}>{t("noClass")}</DropdownMenuItem>
              {liveClasses.map((cls) => (
                <DropdownMenuItem key={cls.id} onClick={() => setClassId(cls.id)} className="gap-2">
                  <ClassSwatch hex={cls.hex} />
                  {cls.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1" />

        <Button size="sm" onClick={submit} disabled={!title.trim()} className="h-7 px-4">
          {t("addAction")}
        </Button>
      </div>
    </div>
  );
}
