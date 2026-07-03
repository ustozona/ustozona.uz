import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   TASKS SYNC BATCH — client diff ↔ server action shartnomasi.

   `data` = TOʻLIQ Task obyekti (JSONB'ga boradi); status/dueDate
   ustunlar undan denormallangan nusxa. Validatsiya ustunlarda qattiq,
   hujjatda yumshoq (obyekt boʻlsa yetadi — shakl client tipida).
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const taskUpsertSchema = z.object({
  id,
  status: z.enum(["todo", "in-progress", "done", "canceled"]),
  dueDate: z.string().max(20).nullable(),
  sortOrder: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
});

export const tasksBatchSchema = z.object({
  tasksUpsert: z.array(taskUpsertSchema).max(5000),
  tasksDelete: z.array(id).max(5000),
});

export type TaskUpsert = z.infer<typeof taskUpsertSchema>;
export type TasksBatch = z.infer<typeof tasksBatchSchema>;

export function emptyTasksBatch(): TasksBatch {
  return { tasksUpsert: [], tasksDelete: [] };
}

export function isEmptyTasksBatch(b: TasksBatch): boolean {
  return b.tasksUpsert.length === 0 && b.tasksDelete.length === 0;
}
