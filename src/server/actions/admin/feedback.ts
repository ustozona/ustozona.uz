"use server";

import { z } from "zod";
import {
  replyToFeedbackAsTeam,
  setFeedbackStatus,
} from "@/server/dal/admin/feedback";

/* Admin fikrlar markazi mutatsiyalari — auth tekshiruvi DAL ichida
   (requireAdmin). */

const replySchema = z.object({
  feedbackId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

export async function replyToFeedbackAction(input: z.infer<typeof replySchema>) {
  const { feedbackId, body } = replySchema.parse(input);
  await replyToFeedbackAsTeam(feedbackId, body);
  return { ok: true as const };
}

const statusSchema = z.object({
  feedbackId: z.string().min(1),
  status: z.enum(["yangi", "jarayonda", "bajarildi", "rad"]),
});

export async function setFeedbackStatusAction(
  input: z.infer<typeof statusSchema>,
) {
  const { feedbackId, status } = statusSchema.parse(input);
  await setFeedbackStatus(feedbackId, status);
  return { ok: true as const };
}
