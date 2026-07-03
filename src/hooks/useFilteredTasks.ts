import { useMemo } from "react";
import { type Task } from "@/lib/tasks-data";
import { type TaskFilter } from "@/components/tasks/TasksSidebar";
import { CLASSES } from "@/lib/grades-data";

export type GroupByMode = "status" | "date" | "priority" | "class" | "none";
export type SortByMode = "default" | "date" | "title" | "priority" | "created";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

/**
 * Faol filtr (smart-list yoki sinf) bo'yicha vazifalarni ajratadi — TasksList va
 * TaskStats bir xil scope ko'rishi uchun YAGONA manba. Bajarilganlarni yashirmaydi
 * (statistika to'liq scope ustida ishlaydi); done yashirish faqat ro'yxat tomonida.
 */
export function filterTasksByFilter(tasks: Task[], activeFilter: TaskFilter): Task[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (activeFilter === "today") {
    return tasks.filter(t =>
      t.dueDate === todayStr ||
      (t.dueDate && t.dueDate < todayStr && t.status !== "done") ||
      t.status === "in-progress"
    );
  }
  if (activeFilter === "upcoming") return tasks.filter(t => t.dueDate && t.dueDate > todayStr && t.dueDate <= nextWeekStr);
  if (activeFilter === "overdue") return tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== "done");
  if (activeFilter === "important") return tasks.filter(t => t.priority === "high");
  if (activeFilter === "inbox") return tasks.filter(t => (t.classIds?.length ?? 0) === 0 && !t.dueDate);
  if (activeFilter === "completed") return tasks.filter(t => t.status === "done");
  if (activeFilter.startsWith("class-")) {
    const cid = activeFilter.replace("class-", "");
    return tasks.filter(t => cid === "none" ? (t.classIds?.length ?? 0) === 0 : t.classIds?.includes(cid));
  }
  return tasks;
}

export function useFilteredTasks(
  tasks: Task[],
  activeFilter: TaskFilter,
  groupBy: GroupByMode = "status",
  sortBy: SortByMode = "default",
  showCompleted: boolean = false
) {
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return useMemo(() => {
    // 1. Filtrlash (yagona manba — filterTasksByFilter)
    const list = filterTasksByFilter(tasks, activeFilter);

    // Counts filtr natijasidan (done yashirilishidan OLDIN) — progress maʼnoli qoladi.
    const filteredTotal = list.length;
    const filteredCompleted = list.filter(t => t.status === "done").length;

    // Done yashirish: faol roʻyxatlarda default yashirin; "completed" roʻyxati va
    // showCompleted yoqilganда istisno.
    const hideCompleted = !showCompleted && activeFilter !== "completed";
    const visible = hideCompleted ? list.filter(t => t.status !== "done") : list;

    // 2. Saralash (Sort)
    const sorted = [...visible];
    if (sortBy === "default") {
      // Qo'lda tartib: `order` bo'lганлар yuqorida (kichik=oldin), qolgani tabiiy
      // (seed) tartibni saqlaydi. Hech narsa drag qilinmaганда barchasi tabiiy.
      sorted.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    } else if (sortBy === "date") {
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title, "uz"));
    } else if (sortBy === "priority") {
      sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));
    } else if (sortBy === "created") {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    // 3. Guruhlash (Group)
    const groups: Record<string, Task[]> = {};
    
    if (groupBy === "none") {
      groups["all"] = sorted;
    } else if (groupBy === "status") {
      groups["todo"] = [];
      groups["in-progress"] = [];
      groups["done"] = [];
      sorted.forEach(task => {
        if (groups[task.status]) {
          groups[task.status].push(task);
        } else {
          groups[task.status] = [task];
        }
      });
    } else if (groupBy === "date") {
      groups["bugun"] = [];
      groups["ertaga"] = [];
      groups["kelasi hafta"] = [];
      groups["muddatsiz"] = [];
      groups["o'tgan"] = [];
      
      const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      sorted.forEach(task => {
        if (!task.dueDate) {
          groups["muddatsiz"].push(task);
        } else if (task.dueDate < todayStr) {
          groups["o'tgan"].push(task);
        } else if (task.dueDate === todayStr) {
          groups["bugun"].push(task);
        } else if (task.dueDate === tomorrowStr) {
          groups["ertaga"].push(task);
        } else {
          groups["kelasi hafta"].push(task);
        }
      });
    } else if (groupBy === "priority") {
      groups["high"] = [];
      groups["medium"] = [];
      groups["low"] = [];
      groups["none"] = [];
      sorted.forEach(task => {
        const key = task.priority || "none";
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      });
    } else if (groupBy === "class") {
      // Har bir sinf uchun group
      CLASSES.forEach(cls => {
        if (cls.id !== "no-class") groups[cls.id] = [];
      });
      groups["none"] = []; // Sinfsiz
      sorted.forEach(task => {
        if (!task.classIds || task.classIds.length === 0) {
          groups["none"].push(task);
        } else {
          task.classIds.forEach(cid => {
            if (!groups[cid]) groups[cid] = [];
            groups[cid].push(task);
          });
        }
      });
    }

    return {
      tasksList: sorted,
      groupedTasks: groups,
      totalTasks: filteredTotal,
      completedTasks: filteredCompleted
    };
  }, [tasks, activeFilter, groupBy, sortBy, showCompleted, todayStr, nextWeekStr]);
}
