import type { Task } from "@/lib/tasks-data";
import { emptyTasksBatch, isEmptyTasksBatch, type TasksBatch, type TaskUpsert } from "./tasks-batch";

/* Tasks diff — {items} (prev, next) → batch | null. student-notes-sync
   bilan bir xil: id boʻyicha, reference oʻzgargan element upsert;
   yoʻqolgan id delete. `data` — toʻliq Task obyekti (JSONB); status/
   dueDate/sortOrder — denormallangan ustunlar. */

export type TasksSnapshot = { items: Task[] };

function toUpsert(t: Task): TaskUpsert {
  return {
    id: t.id,
    status: t.status,
    dueDate: t.dueDate,
    sortOrder: t.sortOrder,
    data: t as unknown as Record<string, unknown>,
  };
}

export function diffTasks(prev: TasksSnapshot, next: TasksSnapshot): TasksBatch | null {
  if (prev.items === next.items) return null;
  const batch = emptyTasksBatch();

  const prevById = new Map(prev.items.map((t) => [t.id, t]));
  for (const t of next.items) {
    const p = prevById.get(t.id);
    if (!p || p !== t) batch.tasksUpsert.push(toUpsert(t));
  }

  const nextIds = new Set(next.items.map((t) => t.id));
  for (const t of prev.items) if (!nextIds.has(t.id)) batch.tasksDelete.push(t.id);

  return isEmptyTasksBatch(batch) ? null : batch;
}
