"use server";

import { getGradesPayload, applyGradesBatch } from "@/server/dal/grades";
import { gradesBatchSchema, type GradesBatch } from "@/lib/sync/grades-batch";
import type { ClassData } from "@/lib/grades-data";

/* Grades server actions — yupqa qatlam: zod-parse → DAL.
   Auth tekshiruvi DAL ichida (requireTeacher). */

export async function fetchGradesAction(): Promise<{
  classDataMap: Record<string, ClassData>;
}> {
  return { classDataMap: await getGradesPayload() };
}

export async function syncGradesAction(batch: GradesBatch): Promise<{ ok: true }> {
  await applyGradesBatch(gradesBatchSchema.parse(batch));
  return { ok: true };
}
