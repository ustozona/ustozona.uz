"use client";

import { useMemo, useState } from "react";
import TasksSidebar, { type TaskFilter } from "@/components/tasks/TasksSidebar";
import TasksList from "@/components/tasks/TasksList";
import TaskDetail from "@/components/tasks/TaskDetail";
import TaskStats from "@/components/tasks/TaskStats";
import { useTaskStore } from "@/store/useTaskStore";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeTasksTourDemoClasses, makeTasksTourDemoTasks } from "@/components/tour/tasks-tour-demo";

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("today");
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const tasks = useTaskStore((s) => s.tasks);

  const detailMode = !!selectedTaskId;

  // Boʻsh hisobda "vazifalar" turi ishga tushsa — namunaviy sinf + turli
  // holatdagi vazifalar koʻrsatiladi (standards/attendance turi bilan bir xil naqsh).
  const tourActive = useTourRequest((s) => s.activeTourId === "tasks");
  const isDemoMode = tourActive && tasks.length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeTasksTourDemoClasses() : null), [isDemoMode]);
  const demoTasks = useMemo(() => (isDemoMode ? makeTasksTourDemoTasks() : null), [isDemoMode]);

  return (
    <div className="flex-1 min-w-0 h-full min-h-0 flex gap-6 p-4 md:p-6 overflow-hidden">
      {/* ── Column 1: Sidebar (doim ~20%) ── */}
      <div data-tour="tasks-sidebar" className="hidden lg:block min-w-0 min-h-0 h-full shrink-0 lg:w-64 xl:w-[20%]" >
        <TasksSidebar
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          demoTasks={demoTasks ?? undefined}
          demoClasses={demoClasses ?? undefined}
        />
      </div>

      {/* ── Column 2: Tasks List (Qolgan qism) ── */}
      <div data-tour="tasks-list" className="min-w-0 min-h-0 h-full flex flex-col flex-1 transition-all duration-base">
        <TasksList
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          demoTasks={demoTasks ?? undefined}
          demoClasses={demoClasses ?? undefined}
        />
      </div>

      {/* ── Column 3: Task Detail (vazifa tanlanganda) ── */}
      {detailMode && (
        <div className="hidden md:flex min-w-0 min-h-0 h-full flex-col shrink-0 animate-in slide-in-from-right-8 fade-in-0 duration-base w-full md:w-[350px] lg:w-[400px] xl:w-[25%] max-w-lg">
          <TaskDetail />
        </div>
      )}

      {/* ── Column 3 (muqobil): Statistika (hech narsa tanlanmaganda) ── */}
      {!detailMode && (
        <div data-tour="tasks-stats" className="hidden xl:flex min-w-0 min-h-0 h-full flex-col shrink-0 animate-in fade-in-0 duration-base w-[360px] xl:w-[25%] max-w-md">
          <TaskStats
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            demoTasks={demoTasks ?? undefined}
            demoClasses={demoClasses ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
