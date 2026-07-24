"use server";

import { z } from "zod";
import {
  getFeedbackPayload,
  createFeedbackItem,
  editFeedbackItem,
  deleteFeedbackItem,
  toggleFeedbackReaction,
  toggleFeedbackReplyReaction,
  addFeedbackReply,
  type FeedbackPayload,
} from "@/server/dal/feedback";
import type { FeedbackItem } from "@/store/useFeedbackStore";

/* Feedback server actions — yupqa qatlam: zod-parse → DAL. Umumiy
   doskaga oʻtgach (2-bosqich) har amal oʻz targetli action'i orqali
   oʻtadi — whole-document diff+push endi yoʻq (feedback-batch.ts /
   feedback-sync.ts ishlatilmaydi). */

const feedbackItemSchema = z.custom<FeedbackItem>((v) => typeof v === "object" && v !== null);
const quoteSchema = z
  .object({ author: z.string(), excerpt: z.string(), targetId: z.string().optional() })
  .optional();

export async function fetchFeedbackAction(): Promise<FeedbackPayload> {
  return getFeedbackPayload();
}

export async function createFeedbackAction(item: FeedbackItem): Promise<{ ok: true }> {
  await createFeedbackItem(feedbackItemSchema.parse(item));
  return { ok: true };
}

export async function editFeedbackAction(input: { id: string; body: string }): Promise<{ ok: true }> {
  const schema = z.object({ id: z.string().min(1), body: z.string().min(1).max(4000) });
  const { id, body } = schema.parse(input);
  await editFeedbackItem(id, body);
  return { ok: true };
}

export async function deleteFeedbackAction(id: string): Promise<{ ok: true }> {
  await deleteFeedbackItem(z.string().min(1).parse(id));
  return { ok: true };
}

export async function toggleFeedbackReactionAction(input: { id: string; emoji: string }): Promise<{ ok: true }> {
  const schema = z.object({ id: z.string().min(1), emoji: z.string().min(1).max(16) });
  const { id, emoji } = schema.parse(input);
  await toggleFeedbackReaction(id, emoji);
  return { ok: true };
}

export async function toggleFeedbackReplyReactionAction(input: {
  id: string;
  replyId: string;
  emoji: string;
}): Promise<{ ok: true }> {
  const schema = z.object({
    id: z.string().min(1),
    replyId: z.string().min(1),
    emoji: z.string().min(1).max(16),
  });
  const { id, replyId, emoji } = schema.parse(input);
  await toggleFeedbackReplyReaction(id, replyId, emoji);
  return { ok: true };
}

export async function addFeedbackReplyAction(input: {
  id: string;
  body: string;
  quote?: { author: string; excerpt: string; targetId?: string };
  parentId?: string;
}): Promise<{ ok: true }> {
  const schema = z.object({
    id: z.string().min(1),
    body: z.string().min(1).max(4000),
    quote: quoteSchema,
    parentId: z.string().optional(),
  });
  const { id, body, quote, parentId } = schema.parse(input);
  await addFeedbackReply(id, { body, quote, parentId });
  return { ok: true };
}
