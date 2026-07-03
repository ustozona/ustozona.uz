"use server";

import { getTasksPayload, applyTasksBatch, type TasksPayload } from "@/server/dal/tasks";
import { tasksBatchSchema, type TasksBatch } from "@/lib/sync/tasks-batch";

/* Tasks server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchTasksAction(): Promise<TasksPayload> {
  return getTasksPayload();
}

export async function syncTasksAction(batch: TasksBatch): Promise<{ ok: true }> {
  await applyTasksBatch(tasksBatchSchema.parse(batch));
  return { ok: true };
}
