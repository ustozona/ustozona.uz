"use server";

import {
  getLessonsPayload,
  applyLessonsBatch,
  type LessonsPayload,
} from "@/server/dal/lessons";
import { lessonsBatchSchema, type LessonsBatch } from "@/lib/sync/lessons-batch";

/* Lessons server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchLessonsAction(): Promise<LessonsPayload> {
  return getLessonsPayload();
}

export async function syncLessonsAction(batch: LessonsBatch): Promise<{ ok: true }> {
  await applyLessonsBatch(lessonsBatchSchema.parse(batch));
  return { ok: true };
}
