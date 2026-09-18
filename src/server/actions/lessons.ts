"use server";

import {
  getLessonsPayload,
  applyLessonsBatch,
  deleteLessonsAndUnits,
  type LessonsPayload,
} from "@/server/dal/lessons";
import {
  lessonsBatchSchema,
  lessonsDeleteSchema,
  type LessonsBatch,
  type LessonsDeleteCommand,
} from "@/lib/sync/lessons-batch";

/* Lessons server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchLessonsAction(): Promise<LessonsPayload> {
  return getLessonsPayload();
}

export async function syncLessonsAction(batch: LessonsBatch): Promise<{ ok: true }> {
  await applyLessonsBatch(lessonsBatchSchema.parse(batch));
  return { ok: true };
}

/**
 * Oʻchirish — aniq buyruq, javobi kutiladi. Nega `syncLessonsAction`
 * ichida emasligi `lessons-batch.ts` da yozilgan.
 */
export async function deleteLessonsAction(
  cmd: LessonsDeleteCommand
): Promise<{ lessons: number; units: number }> {
  return deleteLessonsAndUnits(lessonsDeleteSchema.parse(cmd));
}
