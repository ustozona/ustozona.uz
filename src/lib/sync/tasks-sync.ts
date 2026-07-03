import type { Task } from "@/lib/tasks-data";
import {
  emptyTasksBatch,
  isEmptyTasksBatch,
  type TasksBatch,
  type TaskUpsert,
} from "./tasks-batch";

/* ════════════════════════════════════════════════════════════════════
   TASKS DIFF — {tasks} (prev, next) → batch | null.
   lessons-sync bilan bir xil: id boʻyicha, reference yoki pozitsiya
   oʻzgargan element upsert; yoʻqolgan id delete.
   ════════════════════════════════════════════════════════════════════ */

export type TasksSnapshot = { tasks: Task[] };

function toTaskUpsert(t: Task, sortOrder: number): TaskUpsert {
  return {
    id: t.id,
    status: t.status,
    dueDate: t.dueDate ?? null,
    sortOrder,
    data: t as unknown as Record<string, unknown>,
  };
}

export function diffTasks(prev: TasksSnapshot, next: TasksSnapshot): TasksBatch | null {
  if (prev.tasks === next.tasks) return null;
  const batch = emptyTasksBatch();

  const prevById = new Map<string, { item: Task; index: number }>();
  prev.tasks.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.tasks.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) {
      batch.tasksUpsert.push(toTaskUpsert(item, index));
    }
  });

  const nextIds = new Set(next.tasks.map((t) => t.id));
  for (const t of prev.tasks) if (!nextIds.has(t.id)) batch.tasksDelete.push(t.id);

  return isEmptyTasksBatch(batch) ? null : batch;
}
