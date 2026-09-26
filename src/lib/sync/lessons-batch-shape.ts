/* LESSONS BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `lessons-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`lessons-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { LessonsBatch } from "./lessons-batch";

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
