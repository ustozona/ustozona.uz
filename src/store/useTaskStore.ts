import { create } from "zustand";
import { nextRecurrenceDate, type Task, type PomodoroSession } from "@/lib/tasks-data";
import { parseRule } from "@/lib/recurrence";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR — server-backed store (7-bosqich migratsiyasi)

   Manba endi Postgres: `TasksServerSync` (dashboard layout) mount'da
   serverdan {tasks}ni yuklaydi (hydration), keyin har oʻzgarishni diff
   qilib server action'ga yuboradi. Boshlangʻich holat BOʻSH
   (9-bosqich): TASKS_DATA seed olib tashlandi — u endi faqat
   scripts/seed.ts'da (demo oʻqituvchi) ishlatiladi.
   ════════════════════════════════════════════════════════════════════ */

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  addTask: (data: Partial<Task> & { title: string }) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  setSelectedTaskId: (id: string | null) => void;

  addComment: (taskId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtaskDone: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  addPomodoroSession: (taskId: string, session: Omit<PomodoroSession, "id">) => void;
}

export const useTaskStore = create<TaskState>()(
    (set) => ({
      tasks: [],
      selectedTaskId: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addTask: (data) => {
        const id = uid("t");
        const newTask: Task = {
          id,
          title: data.title,
          description: data.description ?? "",
          dueDate: data.dueDate ?? null,
          endDate: data.endDate ?? null,
          dueTime: data.dueTime ?? null,
          endTime: data.endTime ?? null,
          isRecurring: data.isRecurring ?? false,
          recurrenceRule: data.recurrenceRule ?? null,
          mentions: data.mentions ?? [],
          priority: data.priority ?? "none",
          status: data.status ?? "todo",
          classIds: data.classIds ?? [],
          assigneeIds: data.assigneeIds ?? [],
          tags: data.tags ?? [],
          comments: [],
          attachments: [],
          subtasks: data.subtasks ?? [],
          pomodoroSessions: [],
          estimatedPomodoros: data.estimatedPomodoros ?? 1,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        set((s) => ({ tasks: [...s.tasks, newTask] }));
        return id;
      },
      
      updateTask: (id, patch) => set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
      
      deleteTask: (id) => set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
        selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
      })),

      toggleTaskDone: (id) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== id) return t;
          const isDone = t.status === "done";
          // Takrorlanuvchi: bajarilganda "done" qilinmaydi — keyingi muddatga
          // suriladi va todo qoladi (subtasklar reset). Faqat oldinga (todo→).
          if (!isDone && t.isRecurring && t.recurrenceRule) {
            // basis="done" boʻlsa keyingi muddat bugundan (bajarilgan sana) hisoblanadi
            const basis = parseRule(t.recurrenceRule)?.basis ?? "due";
            const from = basis === "done" ? localDateStr(new Date()) : t.dueDate;
            const next = nextRecurrenceDate(from, t.recurrenceRule);
            if (next) {
              return {
                ...t,
                dueDate: next,
                status: "todo",
                completedAt: null,
                subtasks: (t.subtasks || []).map((st) => ({ ...st, isDone: false })),
              };
            }
          }
          return {
            ...t,
            status: isDone ? "todo" : "done",
            completedAt: isDone ? null : new Date().toISOString(),
          };
        }),
      })),

      // Qo'lda tartiblash: berilgan ids ketma-ketligiga `order` (0..n) beriladi.
      // Odatda bitta guruh ichidagi idlar yuboriladi — guruh saralash bosqichidan
      // keyin ajraladi, shuning uchun guruhlararo order qiymatlari to'qnashsa ham
      // har guruh ichidagi tartib to'g'ri qoladi.
      reorderTasks: (orderedIds) => set((s) => {
        const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
        return {
          tasks: s.tasks.map((t) =>
            orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t
          ),
        };
      }),

      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      addComment: (taskId, text) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const newComment = { id: uid("c"), text, createdAt: new Date().toISOString() };
          return { ...t, comments: [...t.comments, newComment] };
        }),
      })),

      deleteComment: (taskId, commentId) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return { ...t, comments: t.comments.filter(c => c.id !== commentId) };
        }),
      })),

      addSubtask: (taskId, title) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const newSubtask = { id: uid("st"), title, isDone: false };
          return { ...t, subtasks: [...(t.subtasks || []), newSubtask] };
        }),
      })),

      toggleSubtaskDone: (taskId, subtaskId) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, isDone: !st.isDone } : st)
          };
        }),
      })),

      deleteSubtask: (taskId, subtaskId) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId) };
        }),
      })),

      addPomodoroSession: (taskId, session) => set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const newSession = { ...session, id: uid("p") };
          return { ...t, pomodoroSessions: [...t.pomodoroSessions, newSession] };
        }),
      })),
    })
);
