"use server";

import {
  getStudentNotesPayload,
  applyStudentNotesBatch,
  type StudentNotesPayload,
} from "@/server/dal/student-notes";
import { studentNotesBatchSchema, type StudentNotesBatch } from "@/lib/sync/student-notes-batch";

/* Student notes server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchStudentNotesAction(): Promise<StudentNotesPayload> {
  return getStudentNotesPayload();
}

export async function syncStudentNotesAction(batch: StudentNotesBatch): Promise<{ ok: true }> {
  await applyStudentNotesBatch(studentNotesBatchSchema.parse(batch));
  return { ok: true };
}
