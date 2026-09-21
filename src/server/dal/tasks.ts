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

/** Yangi Task shaklini tekshiradi — `tasks` jadvali eski (o'chirilgan)
    Tasks funksiyasidan qolgan boshqa shakldagi yozuvlarni ham saqlab
    qolgan bo'lishi mumkin (jadval hech qachon DROP qilinmagan). */
function isValidTask(data: unknown): data is Task {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.title === "string" &&
    typeof d.status === "string" &&
    typeof d.priority === "string" &&
    !!d.source &&
    typeof (d.source as Record<string, unknown>).kind === "string"
  );
}

export async function getTasksPayload(): Promise<TasksPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select({ id: tasks.id, data: tasks.data })
    .from(tasks)
    .where(eq(tasks.teacherId, teacher.id))
    .orderBy(asc(tasks.sortOrder));

  const items: Task[] = [];
  const staleIds: string[] = [];
  for (const r of rows) {
    if (isValidTask(r.data)) items.push(r.data);
    else staleIds.push(r.id);
  }
  // Eski (o'chirilgan) Tasks funksiyasidan qolgan mos kelmaydigan yozuvlar — tozalanadi.
  if (staleIds.length) {
    await db.delete(tasks).where(and(eq(tasks.teacherId, teacher.id), inArray(tasks.id, staleIds)));
  }
  return { items };
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
