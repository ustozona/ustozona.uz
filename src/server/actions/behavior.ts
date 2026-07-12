"use server";

import {
  getBehaviorPayload,
  applyBehaviorBatch,
  type BehaviorPayload,
} from "@/server/dal/behavior";
import { behaviorBatchSchema, type BehaviorBatch } from "@/lib/sync/behavior-batch";

/* Behavior server actions — yupqa qatlam: zod-parse → DAL.
   Auth tekshiruvi DAL ichida (requireTeacher). */

export async function fetchBehaviorAction(): Promise<BehaviorPayload> {
  return getBehaviorPayload();
}

export async function syncBehaviorAction(batch: BehaviorBatch): Promise<{ ok: true }> {
  await applyBehaviorBatch(behaviorBatchSchema.parse(batch));
  return { ok: true };
}
