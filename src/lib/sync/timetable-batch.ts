import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   TIMETABLE SYNC BATCH — jadval versiyalari (id boʻyicha hujjatlar).
   events/bellConfig snapshotlari JSONB'ga butunligicha boradi.
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const versionUpsertSchema = z.object({
  id,
  effectiveFrom: z.string().min(8).max(20), // "YYYY-MM-DD"
  note: z.string().max(500).nullable(),
  createdAt: z.string().max(40), // ISO satr (client yaratadi)
  bellConfig: z.record(z.string(), z.unknown()),
  events: z.array(z.record(z.string(), z.unknown())).max(2000),
});

export const timetableBatchSchema = z.object({
  versionsUpsert: z.array(versionUpsertSchema).max(200),
  versionsDelete: z.array(id).max(200),
});

export type VersionUpsert = z.infer<typeof versionUpsertSchema>;
export type TimetableBatch = z.infer<typeof timetableBatchSchema>;

export function emptyTimetableBatch(): TimetableBatch {
  return { versionsUpsert: [], versionsDelete: [] };
}

export function isEmptyTimetableBatch(b: TimetableBatch): boolean {
  return b.versionsUpsert.length === 0 && b.versionsDelete.length === 0;
}
