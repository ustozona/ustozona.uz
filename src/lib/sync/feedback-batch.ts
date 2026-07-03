import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   FEEDBACK SYNC BATCH — client diff ↔ server action shartnomasi.

   `data` = TOʻLIQ FeedbackItem (JSONB'ga boradi); status/category
   denormallangan nusxa. DIQQAT: rasmli fikrlar base64 data-URL —
   bitta item bir necha yuz KB boʻlishi mumkin; server action body
   limiti (default 1MB) uchun batch max kichik tutiladi.
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const feedbackUpsertSchema = z.object({
  id,
  status: z.enum(["yangi", "korilmoqda", "rejalashtirilgan", "bajarilmoqda", "bajarildi", "rad"]),
  category: z.enum(["taklif", "xato", "savol", "maqtov", "boshqa"]),
  sortOrder: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
});

export const feedbackBatchSchema = z.object({
  itemsUpsert: z.array(feedbackUpsertSchema).max(500),
  itemsDelete: z.array(id).max(2000),
});

export type FeedbackUpsert = z.infer<typeof feedbackUpsertSchema>;
export type FeedbackBatch = z.infer<typeof feedbackBatchSchema>;

export function emptyFeedbackBatch(): FeedbackBatch {
  return { itemsUpsert: [], itemsDelete: [] };
}

export function isEmptyFeedbackBatch(b: FeedbackBatch): boolean {
  return b.itemsUpsert.length === 0 && b.itemsDelete.length === 0;
}
