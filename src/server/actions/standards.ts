"use server";

import {
  getStandardsPayload,
  applyStandardsBatch,
  type StandardsPayload,
} from "@/server/dal/standards";
import { standardsBatchSchema, type StandardsBatch } from "@/lib/sync/standards-batch";

/* Standards server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchStandardsAction(): Promise<StandardsPayload> {
  return getStandardsPayload();
}

export async function syncStandardsAction(batch: StandardsBatch): Promise<{ ok: true }> {
  await applyStandardsBatch(standardsBatchSchema.parse(batch));
  return { ok: true };
}
