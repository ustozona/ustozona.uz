"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Flag, GraduationCap, Play, Plus, Repeat } from "lucide-react";
import { minToHHMM } from "@/lib/calendar-core/date-math";
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
  classesById,
  liveClasses,
  pomoMinutes,
  defaultDueDate,
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
  onQuickAdd: (input: { title: string; dueDate: string | null; classId: string | null; priority: TaskPriority }) => void;
  /** Tez-qoʻshishda oldindan tanlangan sana (joriy roʻyxat konteksti). */
  defaultDueDate?: string;
  onStartFocus: (id: string) => void;
  classesById: Map<string, ClassMeta>;
  liveClasses: { id: string; name: string; hex: string }[];
  pomoMinutes: number;
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
      <PanelHeader icon={icon} title={title} count={count > 0 ? count : undefined} />
      <PanelBody>
        <div className="flex flex-col">
          {!hydrated ? (
            <div className="flex flex-col gap-2 px-5 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
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
            <div className="flex flex-col gap-4 px-5 py-5">
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
                      classesById={classesById}
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
                          classesById={classesById}
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
  classesById,
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
  classesById: Map<string, ClassMeta>;
  pomoMinutes: number;
  todayKey: string;
}) {
  const t = useTranslations("TasksPage.list");
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
    .reduce((sum, x) => sum + (x.estPomos ?? 0) * pomoMinutes, 0);
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
            className={cn(
              // Focus To-Do qator tili: default — nozik pastki chiziq; hover — yumshoq
              // yumaloq fon (chiziq yashirinadi); tanlangan — turgʻun muted fon.
              "group relative flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left outline-none transition-colors duration-fast",
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
              className={cn("size-4 shrink-0 rounded-full", !done && prio.checkbox)}
            />
            {/* Focus To-Do uslubi: ▶ checkbox yonida, doim koʻrinadi. */}
            {!done && !canceled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus(task.id);
                }}
                aria-label={t("startFocusAria")}
                className="hidden shrink-0 rounded-full p-1 text-primary transition-colors duration-fast hover:bg-primary/10 sm:flex"
              >
                <Play className="size-3.5 fill-current" />
              </button>
            )}
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left text-sm transition-colors duration-base",
                done ? "text-muted-foreground line-through" : canceled ? "text-muted-foreground/70" : "text-foreground"
              )}
            >
              {task.title}
              {canceled && <span className="ml-1.5 text-xs">· {t("canceledBadge")}</span>}
            </span>
            {task.repeat && (
              <Repeat className="hidden size-3 shrink-0 text-muted-foreground/70 sm:flex" />
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
            {(() => {
              const dl = dueLabel(task.dueDate);
              if (!dl && task.dueMin == null) return null;
              return (
                <span className={cn("hidden shrink-0 text-xs tabular-nums sm:flex", dl?.cls ?? "text-muted-foreground/70")}>
                  {dl?.text}
                  {task.dueMin != null && (dl ? ` ${minToHHMM(task.dueMin)}` : minToHHMM(task.dueMin))}
                </span>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

function QuickAddRow({
  onSubmit,
  liveClasses,
  todayKey,
  defaultDueDate,
}: {
  onSubmit: (input: { title: string; dueDate: string | null; classId: string | null; priority: TaskPriority }) => void;
  liveClasses: { id: string; name: string; hex: string }[];
  todayKey: string;
  /** Joriy roʻyxat konteksti (Bugun/Ertaga) boʻyicha oldindan tanlangan sana. */
  defaultDueDate: string;
}) {
  const t = useTranslations("TasksPage.list");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [classId, setClassId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("none");

  // Roʻyxat almashsa (Bugun → Ertaga) sana konteksti ham yangilanadi.
  useEffect(() => setDueDate(defaultDueDate), [defaultDueDate]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({ title: trimmed, dueDate: dueDate || null, classId, priority });
    setTitle("");
    setDueDate(defaultDueDate);
    setClassId(null);
    setPriority("none");
  };

  const selectedClass = classId ? liveClasses.find((c) => c.id === classId) : undefined;
  const prio = PRIORITY_META[priority];
  const isToday = dueDate === todayKey;

  /* Focus To-Do uslubi: bitta qator — [+] [matn] | [bayroq] [sana] [sinf].
     Saqlash faqat Enter bilan (alohida tugma yoʻq). */
  return (
    <div className="mx-5 mb-1 mt-4 flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 transition-colors focus-within:border-primary/40 focus-within:bg-background">
      <Plus className="size-4 shrink-0 text-muted-foreground/60" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("quickAddPlaceholder")}
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />

      <div className="h-4 w-px shrink-0 bg-border" />

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
        <DropdownMenuContent align="end">
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

      <DateKeyPicker
        value={dueDate}
        onChange={setDueDate}
        className={cn(
          "h-7 shrink-0 gap-1 border-0 px-1.5 text-xs shadow-none hover:bg-muted",
          isToday ? "text-primary" : !dueDate && "text-muted-foreground/70"
        )}
      />

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
          <DropdownMenuContent align="end">
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
    </div>
  );
}
