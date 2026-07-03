import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { tasks } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { Task } from "@/lib/tasks-data";
import type { TasksBatch } from "@/lib/sync/tasks-batch";

/* ════════════════════════════════════════════════════════════════════
   TASKS DAL — useTaskStore'ning server tomoni.

   Oʻqish: tasks.data JSONB = haqiqat manbai (toʻliq Task hujjati),
   ustunlar faqat denormallangan nusxa. Yozish: lessons DAL qoidalari
   (idempotent upsert + setWhere teacherId; tranzaksiyasiz).
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 200;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export type TasksPayload = { tasks: Task[] };

export async function getTasksPayload(): Promise<TasksPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.teacherId, teacher.id))
    .orderBy(asc(tasks.sortOrder));
  return { tasks: rows.map((r) => r.data as unknown as Task) };
}

export async function applyTasksBatch(batch: TasksBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  for (const part of chunks(batch.tasksUpsert)) {
    await db
      .insert(tasks)
      .values(
        part.map((t) => ({
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
          updatedAt: now,
        },
        setWhere: eq(tasks.teacherId, tid),
      });
  }

  for (const part of chunks(batch.tasksDelete)) {
    await db.delete(tasks).where(and(eq(tasks.teacherId, tid), inArray(tasks.id, part)));
  }
}
