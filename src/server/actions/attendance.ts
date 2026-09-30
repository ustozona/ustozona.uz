"use server";

import {
  getAttendancePayload,
  applyAttendanceBatch,
  type AttendancePayload,
} from "@/server/dal/attendance";
import {
  attendanceBatchSchema,
  type AttendanceBatch,
  type AttendanceSyncResult,
} from "@/lib/sync/attendance-batch";

/* Attendance server actions — yupqa qatlam: zod-parse → DAL.
   Auth tekshiruvi DAL ichida (requireTeacher). */

export async function fetchAttendanceAction(): Promise<AttendancePayload> {
  return getAttendancePayload();
}

export async function syncAttendanceAction(
  batch: AttendanceBatch
): Promise<AttendanceSyncResult> {
  const { rejected } = await applyAttendanceBatch(attendanceBatchSchema.parse(batch));
  return { ok: true, rejected };
}
