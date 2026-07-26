"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useTasksStore } from "@/store/useTasksStore";
import { useFocusStore } from "@/store/useFocusStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { addDaysKey, dateToKey, todayKey } from "@/lib/date-keys";
import {
  collectTags,
  formatDateGroupLabel,
  matchesSmartList,
  SMART_LIST_KEYS,
  taskPomoLengthMin,
  type SmartListKey,
  type TaskPriority,
} from "@/lib/tasks-data";
import { TasksNav, SMART_LIST_ICONS } from "./_components/TasksNav";
import { TasksList } from "./_components/TasksList";
import { TaskDetail } from "./_components/TaskDetail";
import { TasksStatsPanel } from "./_components/TasksStatsPanel";

/** `?list=` — chap paneldagi aqlli roʻyxat tanlovi (sinf tanlansa boʻshatiladi). */
function useListParam(): [SmartListKey | null, (v: SmartListKey | null) => void] {
  const [list, setList] = useState<SmartListKey | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("list");
    setList((SMART_LIST_KEYS as string[]).includes(v ?? "") ? (v as SmartListKey) : null);
  }, []);
  const update = (v: SmartListKey | null) => {
    setList(v);
    const url = new URL(window.location.href);
    if (v) url.searchParams.set("list", v);
    else url.searchParams.delete("list");
    window.history.replaceState(null, "", url);
  };
  return [list, update];
}

export default function TasksPage() {
  const tNav = useTranslations("TasksPage.nav");
  const tList = useTranslations("TasksPage.list");

  const [urlList, setUrlList] = useListParam();
  const [classId, setClassId] = useClassIdParam();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [weekSelectedDate, setWeekSelectedDate] = useState(() => new Date());
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const items = useTasksStore((s) => s.items);
  const hydrated = useTasksStore((s) => s._hasHydrated);
  const addManualTask = useTasksStore((s) => s.addManualTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const setStatus = useTasksStore((s) => s.setStatus);
  const setPriority = useTasksStore((s) => s.setPriority);
  const setNote = useTasksStore((s) => s.setNote);
  const setDueDate = useTasksStore((s) => s.setDueDate);
  const setDueRange = useTasksStore((s) => s.setDueRange);
  const setTaskClassId = useTasksStore((s) => s.setClassId);
  const setTags = useTasksStore((s) => s.setTags);
  const setRepeat = useTasksStore((s) => s.setRepeat);
  const setEstPomos = useTasksStore((s) => s.setEstPomos);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const cancelTask = useTasksStore((s) => s.cancelTask);
  const duplicateTask = useTasksStore((s) => s.duplicateTask);
  const startFocus = useFocusStore((s) => s.startWork);
  const tasksSettings = useSettingsStore((s) => s.tasksSettings);
  const setTasksSettings = useSettingsStore((s) => s.setTasksSettings);
  const pomoMinutes = tasksSettings.pomoMinutes;

  const liveClasses = useLiveClasses();
  const classesById = useMemo(() => {
    const map = new Map<string, { name: string; hex: string }>();
    for (const c of liveClasses) map.set(c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] });
    return map;
  }, [liveClasses]);
  const liveClassesWithHex = useMemo(
    () => liveClasses.map((c) => ({ id: c.id, name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] })),
    [liveClasses]
  );

  const today = todayKey();
  const effectiveList: SmartListKey | null = classId ? null : (urlList ?? "today");

  // Sinf yoki roʻyxat almashganda tafsilot paneli yopiladi (students sahifasi naqshi).
  useEffect(() => setSelectedTaskId(null), [classId, effectiveList]);

  const handleSelectList = (list: SmartListKey) => {
    setUrlList(list);
    setClassId(null);
    setDateFilter(null);
  };
  const handleSelectClass = (id: string) => {
    setClassId(id);
    setUrlList(null);
    setDateFilter(null);
  };
  const handleSelectDate = (d: Date) => {
    setWeekSelectedDate(d);
    const key = dateToKey(d);
    setDateFilter((prev) => (prev === key ? null : key));
  };

  const taskDayKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of items) {
      if (t.dueDate && t.status !== "done" && t.status !== "canceled") set.add(t.dueDate);
    }
    return set;
  }, [items]);

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) => t.title.toLowerCase().includes(q));
  }, [items, search]);

  const allTags = useMemo(() => collectTags(items), [items]);

  const scoped = useMemo(() => {
    let list = classId ? searchFiltered.filter((t) => t.classId === classId) : searchFiltered;
    if (activeTag) list = list.filter((t) => (t.tags ?? []).includes(activeTag));
    return list;
  }, [searchFiltered, classId, activeTag]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(SMART_LIST_KEYS.map((k) => [k, 0])) as Record<SmartListKey, number>;
    for (const list of SMART_LIST_KEYS) c[list] = searchFiltered.filter((t) => matchesSmartList(t, list, today)).length;
    return c;
  }, [searchFiltered, today]);

  const isDoneView = effectiveList === "done";
  const activeTasks = useMemo(() => {
    if (isDoneView) return [];
    if (dateFilter) return scoped.filter((t) => t.status !== "done" && t.status !== "canceled" && t.dueDate === dateFilter);
    if (classId) return scoped.filter((t) => t.status !== "done" && t.status !== "canceled");
    return scoped.filter((t) => matchesSmartList(t, effectiveList!, today));
  }, [scoped, classId, effectiveList, isDoneView, today, dateFilter]);
  const doneTasks = useMemo(
    () => scoped.filter((t) => t.status === "done" || t.status === "canceled"),
    [scoped]
  );

  const title = classId
    ? (classesById.get(classId)?.name ?? "")
    : dateFilter
      ? dateFilter === today
        ? tList("todayGroup")
        : dateFilter === addDaysKey(today, 1)
          ? tList("tomorrowGroup")
          : dateFilter === addDaysKey(today, 2)
            ? tList("dayAfterTomorrowGroup")
            : dateFilter === addDaysKey(today, -1)
              ? tList("yesterdayGroup")
              : formatDateGroupLabel(dateFilter)
      : tNav(effectiveList ?? "today");
  const ListIcon = classId ? GraduationCap : SMART_LIST_ICONS[effectiveList ?? "today"];
  // Mini-kalendar faqat kun-koʻrinishlarida mantiqiy (Bugun/Ertaga) — "Shu hafta"/
  // "Sanasiz"/"Bajarilgan"/sinf kabi bitta kunga bogʻliq boʻlmagan roʻyxatlarda yashiriladi.
  const showWeekStrip = !classId && (effectiveList === "today" || effectiveList === "tomorrow");

  // Tez-qoʻshish sanasi roʻyxat kontekstidan: Bugun → bugun, Ertaga → ertaga.
  const quickAddDefaultDue =
    effectiveList === "today" ? today : effectiveList === "tomorrow" ? addDaysKey(today, 1) : "";

  const selectedTask = items.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <DashboardColumns
        template="minmax(0,25fr) minmax(0,75fr)"
        xlTemplate="minmax(0,25fr) minmax(0,50fr) minmax(0,25fr)"
        className="h-full overflow-hidden p-4 md:p-6"
      >
        <DashboardColumn hideBelow="lg">
          <TasksNav
            listKey={effectiveList}
            classId={classId}
            counts={counts}
            search={search}
            onSearchChange={setSearch}
            onSelectList={handleSelectList}
            onSelectClass={handleSelectClass}
            allTags={allTags}
            activeTag={activeTag}
            onSelectTag={setActiveTag}
          />
        </DashboardColumn>

        <DashboardColumn>
          <TasksList
            title={title}
            icon={<ListIcon />}
            count={isDoneView ? doneTasks.length : activeTasks.length}
            activeTasks={activeTasks}
            doneTasks={doneTasks}
            isDoneView={isDoneView}
            hydrated={hydrated}
            todayKey={today}
            selectedTaskId={selectedTaskId}
            onSelectTask={(id) => setSelectedTaskId((prev) => (prev === id ? null : id))}
            onToggleStatus={(id) => {
              const task = items.find((x) => x.id === id);
              if (task) setStatus(id, task.status === "done" ? "todo" : "done");
            }}
            onQuickAdd={(input) => {
              const id = addManualTask({
                title: input.title,
                dueDate: input.dueDate,
                dueMin: input.dueMin,
                dueEndMin: input.dueEndMin,
                classId: input.classId ?? classId ?? null,
                priority: input.priority,
              });
              setSelectedTaskId(id);
            }}
            onStartFocus={(id) => {
              const task = items.find((x) => x.id === id);
              startFocus(id, task ? taskPomoLengthMin(task, pomoMinutes) : pomoMinutes);
            }}
            onSetPriority={(id, p) => setPriority(id, p)}
            onSetDueDate={(id, key) => setDueDate(id, key)}
            onSetClassId={(id, cid) => setTaskClassId(id, cid)}
            onDelete={(id) => {
              deleteTask(id);
              setSelectedTaskId((prev) => (prev === id ? null : prev));
            }}
            onCancel={(id) => cancelTask(id)}
            onDuplicate={(id) => duplicateTask(id)}
            classesById={classesById}
            liveClasses={liveClassesWithHex}
            pomoMinutes={pomoMinutes}
            defaultDueDate={quickAddDefaultDue}
            weekSelectedDate={weekSelectedDate}
            dateFilter={dateFilter}
            taskDayKeys={taskDayKeys}
            onSelectDate={handleSelectDate}
            showWeekStrip={showWeekStrip}
          />
        </DashboardColumn>

        <DashboardColumn hideBelow="xl">
          {selectedTask ? (
            <TaskDetail
              task={selectedTask}
              onToggleStatus={() => setStatus(selectedTask.id, selectedTask.status === "done" ? "todo" : "done")}
              onSetPriority={(p: TaskPriority) => setPriority(selectedTask.id, p)}
              onSetDueDate={(key) => setDueDate(selectedTask.id, key)}
              onSetDueRange={(patch) => setDueRange(selectedTask.id, patch)}
              onSetClassId={(id) => setTaskClassId(selectedTask.id, id)}
              onSetNote={(note) => setNote(selectedTask.id, note)}
              onSetTitle={(title) => updateTask(selectedTask.id, (t) => ({ ...t, title }))}
              onSetTags={(tags) => setTags(selectedTask.id, tags)}
              onSetRepeat={(repeat) => setRepeat(selectedTask.id, repeat)}
              onSetEstPomos={(n) => setEstPomos(selectedTask.id, n)}
              onSetPomoMinutes={(n) => setTasksSettings({ ...tasksSettings, pomoMinutes: n })}
              onStartFocus={() => startFocus(selectedTask.id, taskPomoLengthMin(selectedTask, pomoMinutes))}
              onDelete={() => {
                deleteTask(selectedTask.id);
                setSelectedTaskId(null);
              }}
              onCancel={() => cancelTask(selectedTask.id)}
              onClose={() => setSelectedTaskId(null)}
              pomoMinutes={pomoMinutes}
            />
          ) : (
            <TasksStatsPanel
              activeTasks={activeTasks}
              doneTasks={doneTasks}
              pomoMinutes={pomoMinutes}
            />
          )}
        </DashboardColumn>
      </DashboardColumns>
    </div>
  );
}
