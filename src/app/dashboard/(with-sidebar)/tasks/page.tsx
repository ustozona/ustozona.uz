"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useTasksStore } from "@/store/useTasksStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { todayKey } from "@/lib/date-keys";
import { matchesSmartList, SMART_LIST_KEYS, type SmartListKey, type TaskPriority } from "@/lib/tasks-data";
import { TasksNav } from "./_components/TasksNav";
import { TasksList } from "./_components/TasksList";
import { TaskDetail } from "./_components/TaskDetail";

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

  const [urlList, setUrlList] = useListParam();
  const [classId, setClassId] = useClassIdParam();
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const items = useTasksStore((s) => s.items);
  const hydrated = useTasksStore((s) => s._hasHydrated);
  const addManualTask = useTasksStore((s) => s.addManualTask);
  const updateTask = useTasksStore((s) => s.updateTask);
  const setStatus = useTasksStore((s) => s.setStatus);
  const setPriority = useTasksStore((s) => s.setPriority);
  const setNote = useTasksStore((s) => s.setNote);
  const setDueDate = useTasksStore((s) => s.setDueDate);
  const setTaskClassId = useTasksStore((s) => s.setClassId);
  const deleteTask = useTasksStore((s) => s.deleteTask);

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
  };
  const handleSelectClass = (id: string) => {
    setClassId(id);
    setUrlList(null);
  };

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) => t.title.toLowerCase().includes(q));
  }, [items, search]);

  const scoped = useMemo(
    () => (classId ? searchFiltered.filter((t) => t.classId === classId) : searchFiltered),
    [searchFiltered, classId]
  );

  const counts = useMemo(() => {
    const c = { today: 0, tomorrow: 0, week: 0, planned: 0, nodate: 0, done: 0 } as Record<SmartListKey, number>;
    for (const list of SMART_LIST_KEYS) c[list] = searchFiltered.filter((t) => matchesSmartList(t, list, today)).length;
    return c;
  }, [searchFiltered, today]);

  const isDoneView = effectiveList === "done";
  const activeTasks = useMemo(() => {
    if (isDoneView) return [];
    if (classId) return scoped.filter((t) => t.status !== "done" && t.status !== "canceled");
    return scoped.filter((t) => matchesSmartList(t, effectiveList!, today));
  }, [scoped, classId, effectiveList, isDoneView, today]);
  const doneTasks = useMemo(() => scoped.filter((t) => t.status === "done"), [scoped]);

  const title = classId
    ? (classesById.get(classId)?.name ?? "")
    : tNav(effectiveList ?? "today");

  const selectedTask = items.find((t) => t.id === selectedTaskId) ?? null;

  const xlTemplate = selectedTask
    ? "minmax(0,25fr) minmax(0,50fr) minmax(0,25fr)"
    : "minmax(0,25fr) minmax(0,75fr)";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <DashboardColumns
        template="minmax(0,25fr) minmax(0,75fr)"
        xlTemplate={xlTemplate}
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
          />
        </DashboardColumn>

        <DashboardColumn>
          <TasksList
            title={title}
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
                classId: input.classId ?? classId ?? null,
                priority: input.priority,
              });
              setSelectedTaskId(id);
            }}
            classesById={classesById}
            liveClasses={liveClassesWithHex}
          />
        </DashboardColumn>

        {selectedTask && (
          <DashboardColumn hideBelow="xl">
            <TaskDetail
              task={selectedTask}
              onToggleStatus={() => setStatus(selectedTask.id, selectedTask.status === "done" ? "todo" : "done")}
              onSetPriority={(p: TaskPriority) => setPriority(selectedTask.id, p)}
              onSetDueDate={(key) => setDueDate(selectedTask.id, key)}
              onSetClassId={(id) => setTaskClassId(selectedTask.id, id)}
              onSetNote={(note) => setNote(selectedTask.id, note)}
              onSetTitle={(title) => updateTask(selectedTask.id, (t) => ({ ...t, title }))}
              onDelete={() => {
                deleteTask(selectedTask.id);
                setSelectedTaskId(null);
              }}
            />
          </DashboardColumn>
        )}
      </DashboardColumns>
    </div>
  );
}
