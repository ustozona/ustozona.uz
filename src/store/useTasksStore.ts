import { create } from "zustand";
import { newManualTask, type Task, type TaskPriority, type TaskStatus } from "@/lib/tasks-data";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR — server-backed store (grades/behavior/student-notes qolipi).

   TasksServerSync (dashboard layout) mount'da useHydrateStore orqali
   serverdan {items}ni yuklaydi, keyin har oʻzgarishni diff qilib server
   action'ga yuboradi.

   Avto-manba vazifalar (lesson/grading/birthday) B3/B4'da reconciler
   orqali yoziladi — bu yerdagi amallar hozircha faqat manual vazifalar
   uchun ishlatiladi.
   ════════════════════════════════════════════════════════════════════ */

interface TasksState {
  items: Task[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  addManualTask: (input: {
    title: string;
    dueDate?: string | null;
    dueMin?: number | null;
    classId?: string | null;
    priority?: TaskPriority;
  }) => string;
  updateTask: (id: string, updater: (t: Task) => Task) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  setPriority: (id: string, priority: TaskPriority) => void;
  setNote: (id: string, note: string) => void;
  setDueDate: (id: string, dueDate: string | null, dueMin?: number | null) => void;
  setClassId: (id: string, classId: string | null) => void;
  /** Faqat manual vazifalar uchun — avto-vazifalar "Bekor qilish"ga ega boʻladi (B3+). */
  deleteTask: (id: string) => void;
}

export const useTasksStore = create<TasksState>()((set, get) => ({
  items: [],
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  addManualTask: (input) => {
    const sortOrder = get().items.length;
    const task = newManualTask({ ...input, sortOrder });
    set((s) => ({ items: [...s.items, task] }));
    return task.id;
  },

  updateTask: (id, updater) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? updater(t) : t)) })),

  setStatus: (id, status) =>
    set((s) => ({
      items: s.items.map((t) => {
        if (t.id !== id) return t;
        const done = status === "done";
        return {
          ...t,
          status,
          completedAt: done ? new Date().toISOString() : null,
          ...(t.source.kind === "manual" ? { doneManually: done } : {}),
        };
      }),
    })),

  setPriority: (id, priority) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, priority } : t)) })),

  setNote: (id, note) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, note } : t)) })),

  setDueDate: (id, dueDate, dueMin) =>
    set((s) => ({
      items: s.items.map((t) => (t.id === id ? { ...t, dueDate, dueMin: dueMin ?? null } : t)),
    })),

  setClassId: (id, classId) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, classId } : t)) })),

  deleteTask: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
