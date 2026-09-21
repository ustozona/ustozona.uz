/* TIMETABLE BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `timetable-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`timetable-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { TimetableBatch } from "./timetable-batch";

export function emptyTimetableBatch(): TimetableBatch {
  return { versionsUpsert: [], versionsDelete: [] };
}

export function isEmptyTimetableBatch(b: TimetableBatch): boolean {
  return b.versionsUpsert.length === 0 && b.versionsDelete.length === 0;
}
