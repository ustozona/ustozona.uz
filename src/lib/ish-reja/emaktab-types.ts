/* ════════════════════════════════════════════════════════════════════
   eMAKTAB EKSPORTI — tiplar (neytral modul).

   Server action (`src/server/actions/ish-reja.ts`) va client
   (`ImportSource.tsx`) ikkalasi shu yerdan oladi. `"use server"` faylida
   tip eksport qilinmaydi — AGENTS.md dagi prodni buzadigan xato.
   ════════════════════════════════════════════════════════════════════ */

export type EmaktabLesson = {
  /** "YYYY-MM-DD" yoki eMaktabdagi asl yozuv (tanilmasa). */
  date: string;
  topic: string;
  homework: string;
  lesson_number: number;
};

export type EmaktabLessonPlan = {
  class_name: string;
  group: string;
  quarter: number;
  subject: string;
  teacher: string;
  lessons: EmaktabLesson[];
};

/** `unavailable` — LessonLab sozlanmagan/javob bermadi: import odatiy
    yoʻl bilan davom etadi, foydalanuvchiga xato koʻrsatilmaydi. */
export type EmaktabParseResult =
  | { type: "lesson_plan"; data: EmaktabLessonPlan }
  | { type: "schedule" | "journal" | "unknown" | "unavailable" };
