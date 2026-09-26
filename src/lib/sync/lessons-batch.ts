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
  /* Yangi dars boʻsh sarlavha ("Qoralama") bilan yaratiladi — muharrirda
     toʻldiriladi, shuning uchun min(1) emas. */
  title: z.string().max(500),
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

/* ════════════════════════════════════════════════════════════════════
   OʻCHIRISH BUYRUGʻI — batch'dan ATAYLAB alohida.

   Yuqoridagi `lessonsDelete`/`unitsDelete` maydonlari ikki suratning
   FARQIDAN tugʻiladi: «avval bu id bor edi, endi yoʻq — demak
   oʻchirilgan». Bu taxmin tahrir uchun yetarli, lekin oʻchirish uchun
   xavfli: paket serverga yetib bormasa (refresh, uzilish, xato) hech
   kim sezmaydi va qator bazada qolib ketadi. Kuzatilgani: oʻchirilgan
   darslar plannerda va Materiallarda «tirilib» qaytardi.

   Shuning uchun oʻchirish endi AYTIB bajariladi: chaqiruvchi shu
   buyruqni yuboradi va javobini KUTADI. Tasdiq kelmasa interfeys
   oʻchganini koʻrsatmaydi — xato chiqaradi.

   Buyruq idempotent: allaqachon oʻchgan id xato bermaydi, shuning
   uchun qayta yuborish xavfsiz.
   ════════════════════════════════════════════════════════════════════ */

export const lessonsDeleteSchema = z.object({
  unitIds: z.array(id).max(2000).default([]),
  lessonIds: z.array(id).max(5000).default([]),
});

export type LessonsDeleteCommand = z.infer<typeof lessonsDeleteSchema>;
