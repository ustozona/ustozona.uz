import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { tasks } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { Task } from "@/lib/tasks-data";
import type { TasksBatch } from "@/lib/sync/tasks-batch";

/* Tasks DAL — useTasksStore'ning server tomoni (student-notes qolipi:
   idempotent upsert + setWhere teacherId). `data` JSONB — to'liq Task
   obyekti (yagona haqiqat manbai); status/dueDate/sortOrder ustunlari
   denormallangan nusxa — kelgusida server-side filtr/sort uchun. */

export type TasksPayload = { items: Task[] };

export async function getTasksPayload(): Promise<TasksPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select({ data: tasks.data })
    .from(tasks)
    .where(eq(tasks.teacherId, teacher.id))
    .orderBy(asc(tasks.sortOrder));
  return { items: rows.map((r) => r.data as Task) };
}

export async function applyTasksBatch(batch: TasksBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  if (batch.tasksUpsert.length) {
    await db
      .insert(tasks)
      .values(
        batch.tasksUpsert.map((t) => ({
          id: t.id,
          teacherId: tid,
          status: t.status,
          dueDate: t.dueDate,
          sortOrder: t.sortOrder,
          data: t.data,
        }))
      )
      .onConflictDoUpdate({
        target: tasks.id,
        set: {
          status: sql`excluded.status`,
          dueDate: sql`excluded.due_date`,
          sortOrder: sql`excluded.sort_order`,
          data: sql`excluded.data`,
          updatedAt: sql`now()`,
        },
        setWhere: eq(tasks.teacherId, tid),
      });
  }

  if (batch.tasksDelete.length) {
    await db.delete(tasks).where(and(eq(tasks.teacherId, tid), inArray(tasks.id, batch.tasksDelete)));
  }
}
