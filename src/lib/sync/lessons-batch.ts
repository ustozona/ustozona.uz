import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   LESSONS SYNC BATCH — client diff ↔ server action shartnomasi.

   `data` = TOʻLIQ Lesson obyekti (JSONB'ga boradi); qattiq tiplangan
   ustunlar undan denormallangan nusxa. Validatsiya ustunlarda qattiq,
   hujjatda yumshoq (obyekt boʻlsa yetadi — shakl client tipida).
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const unitUpsertSchema = z.object({
  id,
  classId: id,
  number: z.number().int().min(0).max(10000),
  title: z.string().min(1).max(300),
  description: z.string().max(2000),
  sortOrder: z.number().int().min(0),
});

export const lessonUpsertSchema = z.object({
  id,
  classId: id,
  unitId: id.nullable(),
  number: z.number().int().min(0).max(10000),
  title: z.string().min(1).max(500),
  status: z.enum(["Completed", "Scheduled", "Unscheduled", "Draft"]),
  sortOrder: z.number().int().min(0),
  data: z.record(z.string(), z.unknown()),
});

export const lessonsBatchSchema = z.object({
  unitsUpsert: z.array(unitUpsertSchema).max(2000),
  unitsDelete: z.array(id).max(2000),
  lessonsUpsert: z.array(lessonUpsertSchema).max(5000),
  lessonsDelete: z.array(id).max(5000),
});

export type UnitUpsert = z.infer<typeof unitUpsertSchema>;
export type LessonUpsert = z.infer<typeof lessonUpsertSchema>;
export type LessonsBatch = z.infer<typeof lessonsBatchSchema>;

export function emptyLessonsBatch(): LessonsBatch {
  return { unitsUpsert: [], unitsDelete: [], lessonsUpsert: [], lessonsDelete: [] };
}

export function isEmptyLessonsBatch(b: LessonsBatch): boolean {
  return (
    b.unitsUpsert.length === 0 &&
    b.unitsDelete.length === 0 &&
    b.lessonsUpsert.length === 0 &&
    b.lessonsDelete.length === 0
  );
}
