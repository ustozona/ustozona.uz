"use server";

import {
  getTimetablePayload,
  applyTimetableBatch,
  type TimetablePayload,
} from "@/server/dal/timetable";
import {
  timetableBatchSchema,
  type TimetableBatch,
} from "@/lib/sync/timetable-batch";

/* Timetable server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchTimetableAction(): Promise<TimetablePayload> {
  return getTimetablePayload();
}

export async function syncTimetableAction(batch: TimetableBatch): Promise<{ ok: true }> {
  await applyTimetableBatch(timetableBatchSchema.parse(batch));
  return { ok: true };
}
