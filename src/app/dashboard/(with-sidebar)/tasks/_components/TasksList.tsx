"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, GraduationCap, Play, Plus } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { addDaysKey } from "@/lib/date-keys";
import { cn } from "@/lib/utils";
import {
  formatDateGroupLabel,
  formatMinutes,
  groupTasksByDate,
  PRIORITY_META,
  PRIORITY_ORDER,
  TAG_PILL_CLASS,
  type Task,
  type TaskPriority,
} from "@/lib/tasks-data";

type ClassMeta = { name: string; hex: string };

export function TasksList({
  title,
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
  classesById,
  liveClasses,
  pomoMinutes,
}: {
  title: string;
  count: number;
  activeTasks: Task[];
  doneTasks: Task[];
  isDoneView: boolean;
  hydrated: boolean;
  todayKey: string;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onQuickAdd: (input: { title: string; dueDate: string | null; classId: string | null; priority: TaskPriority }) => void;
  onStartFocus: (id: string) => void;
  classesById: Map<string, ClassMeta>;
  liveClasses: { id: string; name: string; hex: string }[];
  pomoMinutes: number;
}) {
  const t = useTranslations("TasksPage.list");
  const tomorrowKey = addDaysKey(todayKey, 1);

  const estimatedMinutes = activeTasks.reduce((sum, x) => sum + (x.estPomos ?? 0) * pomoMinutes, 0);
  const spentTodayMinutes = [...activeTasks, ...doneTasks].reduce((sum, x) => {
    const today = (x.focus ?? []).find((f) => f.date === todayKey);
    return sum + (today?.minutes ?? 0);
  }, 0);
  const doneCount = doneTasks.filter((x) => x.status === "done").length;

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
      <PanelHeader title={title} count={count > 0 ? count : undefined} />
      {!isDoneView && hydrated && (
        <div className="grid shrink-0 grid-cols-4 divide-x divide-border border-b border-border">
          {[
            { label: t("metricEstimated"), value: formatMinutes(estimatedMinutes) },
            { label: t("metricToDo"), value: String(activeTasks.length) },
            { label: t("metricSpentToday"), value: formatMinutes(spentTodayMinutes) },
            { label: t("metricDone"), value: String(doneCount) },
          ].map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-0.5 px-2 py-2.5">
              <span className="text-sm font-semibold tabular-nums text-foreground">{m.value}</span>
              <span className="truncate text-[10px] text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      )}
      <PanelBody>
        <div className="flex flex-col">
          {!hydrated ? (
            <div className="flex flex-col gap-2 px-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
          {!isDoneView && (
            <QuickAddRow onSubmit={onQuickAdd} liveClasses={liveClasses} />
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
            <div className="flex flex-col gap-4 px-3 pb-5 pt-2">
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
                      classesById={classesById}
                    />
                  ))
                : activeGroups.map((group) => (
                    <TaskGroup
                      key={group.key}
                      label={groupLabel(group.key)}
                      tasks={group.tasks}
                      selectedTaskId={selectedTaskId}
                      onSelectTask={onSelectTask}
                      onToggleStatus={onToggleStatus}
                      onStartFocus={onStartFocus}
                      classesById={classesById}
                    />
                  ))}

              {!isDoneView && doneTasks.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted [&[data-state=open]>svg]:rotate-180">
                    <ChevronDown className="size-4 shrink-0 transition-transform" />
                    {t("doneSection", { count: doneTasks.length })}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-4 pt-2">
                      {doneGroups.map((group) => (
                        <TaskGroup
                          key={group.key}
                          label={groupLabel(group.key)}
                          tasks={group.tasks}
                          selectedTaskId={selectedTaskId}
                          onSelectTask={onSelectTask}
                          onToggleStatus={onToggleStatus}
                          onStartFocus={onStartFocus}
                          classesById={classesById}
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
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleStatus,
  onStartFocus,
  classesById,
}: {
  label: string;
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onStartFocus: (id: string) => void;
  classesById: Map<string, ClassMeta>;
}) {
  const t = useTranslations("TasksPage.list");
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <div className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      {tasks.map((task) => {
        const done = task.status === "done";
        const canceled = task.status === "canceled";
        const cls = task.classId ? classesById.get(task.classId) : undefined;
        const prio = PRIORITY_META[task.priority];
        return (
          <div
            key={task.id}
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
            className="list-row group w-full cursor-pointer"
          >
            <Checkbox
              checked={done}
              onCheckedChange={() => onToggleStatus(task.id)}
              onClick={(e) => e.stopPropagation()}
              className={cn("size-4 shrink-0 rounded-full", !done && task.priority !== "none" && prio.ring, !done && task.priority !== "none" && "ring-2")}
            />
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left text-sm transition-colors duration-base",
                done ? "text-muted-foreground line-through" : canceled ? "text-muted-foreground/70" : "text-foreground"
              )}
            >
              {task.title}
              {canceled && <span className="ml-1.5 text-xs">· {t("canceledBadge")}</span>}
            </span>
            {!done && !canceled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus(task.id);
                }}
                aria-label={t("startFocusAria")}
                className="hidden shrink-0 rounded-full p-1.5 text-primary opacity-0 transition-opacity hover:bg-primary/10 group-hover:opacity-100 sm:flex"
              >
                <Play className="size-3.5 fill-current" />
              </button>
            )}
            {(task.tags ?? []).length > 0 && (
              <span className="hidden shrink-0 items-center gap-1 sm:flex">
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
            {cls && <ClassSwatch hex={cls.hex} className="shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function QuickAddRow({
  onSubmit,
  liveClasses,
}: {
  onSubmit: (input: { title: string; dueDate: string | null; classId: string | null; priority: TaskPriority }) => void;
  liveClasses: { id: string; name: string; hex: string }[];
}) {
  const t = useTranslations("TasksPage.list");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [classId, setClassId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("none");

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({ title: trimmed, dueDate: dueDate || null, classId, priority });
    setTitle("");
    setDueDate("");
    setClassId(null);
    setPriority("none");
  };

  const selectedClass = classId ? liveClasses.find((c) => c.id === classId) : undefined;
  const prio = PRIORITY_META[priority];

  return (
    <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            aria-label={t("priorityLabel")}
          >
            <span className={cn("size-2.5 rounded-full", priority === "none" ? "border border-muted-foreground/40" : prio.dot)} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PRIORITY_ORDER.map((p) => (
            <DropdownMenuItem key={p} onClick={() => setPriority(p)} className="gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_META[p].dot)} />
              {t(`priority.${p}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("quickAddPlaceholder")}
        className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />

      <DateKeyPicker
        value={dueDate}
        onChange={setDueDate}
        className={cn("h-7 shrink-0 gap-1 border-0 px-2 text-xs shadow-none hover:bg-muted", !dueDate && "text-muted-foreground/70")}
      />

      {liveClasses.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 shrink-0 items-center gap-1 rounded px-1.5 hover:bg-muted"
              aria-label={t("classLabel")}
            >
              {selectedClass ? (
                <ClassSwatch hex={selectedClass.hex} />
              ) : (
                <GraduationCap className="size-3.5 text-muted-foreground/70" />
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

      <button
        type="button"
        onClick={submit}
        disabled={!title.trim()}
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-30"
        aria-label={t("addAction")}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
