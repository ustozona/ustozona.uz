"use server";

import {
  getFeedbackPayload,
  applyFeedbackBatch,
  type FeedbackPayload,
} from "@/server/dal/feedback";
import { feedbackBatchSchema, type FeedbackBatch } from "@/lib/sync/feedback-batch";

/* Feedback server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchFeedbackAction(): Promise<FeedbackPayload> {
  return getFeedbackPayload();
}

export async function syncFeedbackAction(batch: FeedbackBatch): Promise<{ ok: true }> {
  await applyFeedbackBatch(feedbackBatchSchema.parse(batch));
  return { ok: true };
}
