import { create } from "zustand";
import { manualTaskId, newManualTask, type FocusEntry, type Task, type TaskPriority, type TaskStatus } from "@/lib/tasks-data";
import { nextDate, type Recurrence } from "@/lib/recurrence";
import { todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR — server-backed store (grades/behavior/student-notes qolipi).

   TasksServerSync (dashboard layout) mount'da useHydrateStore orqali
   serverdan {items}ni yuklaydi, keyin har oʻzgarishni diff qilib server
   action'ga yuboradi.

   Avto-manba vazifalar (lesson/grading) TasksAutoReconciler orqali
   `applyAutoReconcile` bilan yoziladi; birthday B4'da qo'shiladi.
   ════════════════════════════════════════════════════════════════════ */

interface TasksState {
  items: Task[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  addManualTask: (input: {
    title: string;
    dueDate?: string | null;
    dueMin?: number | null;
    dueEndMin?: number | null;
    classId?: string | null;
    priority?: TaskPriority;
    estPomos?: number;
  }) => string;
  updateTask: (id: string, updater: (t: Task) => Task) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  setPriority: (id: string, priority: TaskPriority) => void;
  setNote: (id: string, note: string) => void;
  setDueDate: (id: string, dueDate: string | null, dueMin?: number | null) => void;
  /** Toʻliq muddat qoliplarni (sana/vaqt/oraliq) bitta zarbda yozadi — TaskTimeCard uchun. */
  setDueRange: (id: string, patch: { dueDate: string | null; dueMin?: number | null; dueEndMin?: number | null }) => void;
  setClassId: (id: string, classId: string | null) => void;
  setTags: (id: string, tags: string[]) => void;
  /** Faqat manual vazifalar uchun. */
  setRepeat: (id: string, repeat: Task["repeat"]) => void;
  setEstPomos: (id: string, estPomos: number) => void;
  /** Yakunlangan pomodoro yozuvi — kun boʻyicha yigʻiladi (FocusTimerPill). */
  addFocusEntry: (id: string, minutes: number) => void;
  /** Faqat manual vazifalar uchun — avto-vazifalar "Bekor qilish"ga ega. */
  deleteTask: (id: string) => void;
  /** Avto-vazifani bekor qilish (tombstone — reconciler qayta tug'dirmaydi). */
  cancelTask: (id: string) => void;
  /** Nusxasi har doim mustaqil manual vazifa sifatida yaratiladi (manba avto boʻlsa ham). */
  duplicateTask: (id: string) => string | null;
  /** Reconciler yozuvi — bitta immutable yangilanishda upsert + delete. */
  applyAutoReconcile: (upserts: Task[], deleteIds: string[]) => void;
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
    set((s) => {
      const target = s.items.find((t) => t.id === id);
      const done = status === "done";
      const items = s.items.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status,
          completedAt: done ? new Date().toISOString() : null,
          // Foydalanuvchi qo'lda belgilagani — reconciler shu vazifani qayta ochmaydi.
          doneManually: done,
        };
      });
      // Takrorlanuvchi manual vazifa done boʻlsa — keyingi nusxa yaratiladi.
      if (done && target && target.source.kind === "manual" && target.repeat) {
        const rec: Recurrence = { interval: target.repeat.every, unit: target.repeat.unit, weekdays: [], basis: "due" };
        const nd = nextDate(rec, target.dueDate);
        if (nd) {
          items.push({
            ...target,
            id: manualTaskId(),
            status: "todo",
            dueDate: nd,
            doneManually: false,
            notifiedAt: null,
            sortOrder: items.length,
            createdAt: new Date().toISOString(),
            completedAt: null,
          });
        }
      }
      return { items };
    }),

  setPriority: (id, priority) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, priority } : t)) })),

  setNote: (id, note) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, note } : t)) })),

  setDueDate: (id, dueDate, dueMin) =>
    set((s) => ({
      items: s.items.map((t) => (t.id === id ? { ...t, dueDate, dueMin: dueMin ?? null } : t)),
    })),

  setDueRange: (id, patch) =>
    set((s) => ({
      items: s.items.map((t) =>
        t.id === id
          ? {
              ...t,
              dueDate: patch.dueDate,
              dueMin: patch.dueDate ? (patch.dueMin ?? null) : null,
              dueEndMin: patch.dueDate ? (patch.dueEndMin ?? null) : null,
            }
          : t
      ),
    })),

  setClassId: (id, classId) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, classId } : t)) })),

  setTags: (id, tags) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, tags } : t)) })),

  setRepeat: (id, repeat) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, repeat } : t)) })),

  setEstPomos: (id, estPomos) =>
    set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, estPomos } : t)) })),

  addFocusEntry: (id, minutes) =>
    set((s) => ({
      items: s.items.map((t) => {
        if (t.id !== id) return t;
        const date = todayKey();
        const focus: FocusEntry[] = t.focus ? [...t.focus] : [];
        const idx = focus.findIndex((f) => f.date === date);
        if (idx >= 0) focus[idx] = { date, minutes: focus[idx].minutes + minutes };
        else focus.push({ date, minutes });
        return { ...t, focus };
      }),
    })),

  deleteTask: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),

  cancelTask: (id) =>
    set((s) => ({
      items: s.items.map((t) =>
        t.id === id ? { ...t, status: "canceled" as const, completedAt: null } : t
      ),
    })),

  duplicateTask: (id) => {
    const source = get().items.find((t) => t.id === id);
    if (!source) return null;
    const sortOrder = get().items.length;
    const task = newManualTask({
      title: source.title,
      dueDate: source.dueDate,
      dueMin: source.dueMin,
      classId: source.classId,
      priority: source.priority,
      estPomos: source.estPomos,
      sortOrder,
    });
    task.note = source.note;
    task.tags = source.tags ? [...source.tags] : [];
    set((s) => ({ items: [...s.items, task] }));
    return task.id;
  },

  applyAutoReconcile: (upserts, deleteIds) => {
    if (upserts.length === 0 && deleteIds.length === 0) return;
    const upsertById = new Map(upserts.map((t) => [t.id, t]));
    const deleteSet = new Set(deleteIds);
    set((s) => {
      const next: Task[] = [];
      for (const t of s.items) {
        if (deleteSet.has(t.id)) continue;
        next.push(upsertById.get(t.id) ?? t);
      }
      for (const t of upserts) if (!s.items.some((x) => x.id === t.id)) next.push(t);
      return { items: next };
    });
  },
}));
