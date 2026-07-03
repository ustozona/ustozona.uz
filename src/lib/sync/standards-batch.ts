import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   STANDARDS SYNC BATCH — client diff ↔ server action shartnomasi.

   Bitta jadval ikki roʻyxatni koʻtaradi: kind="class" → sets,
   kind="custom" → customSets. `data` = TOʻLIQ hujjat; name/subject
   denormallangan nusxa. Delete uchun id yetadi — id fazosi umumiy.
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const standardSetUpsertSchema = z.object({
  id,
  kind: z.enum(["class", "custom"]),
  name: z.string().min(1).max(300),
  subject: z.string().max(200),
  sortOrder: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
});

export const standardsBatchSchema = z.object({
  setsUpsert: z.array(standardSetUpsertSchema).max(2000),
  setsDelete: z.array(id).max(2000),
});

export type StandardSetUpsert = z.infer<typeof standardSetUpsertSchema>;
export type StandardsBatch = z.infer<typeof standardsBatchSchema>;

export function emptyStandardsBatch(): StandardsBatch {
  return { setsUpsert: [], setsDelete: [] };
}

export function isEmptyStandardsBatch(b: StandardsBatch): boolean {
  return b.setsUpsert.length === 0 && b.setsDelete.length === 0;
}
