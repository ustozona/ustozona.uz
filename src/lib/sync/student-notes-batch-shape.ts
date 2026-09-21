/* STUDENT-NOTES BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `student-notes-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`student-notes-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { StudentNotesBatch } from "./student-notes-batch";

export function emptyStudentNotesBatch(): StudentNotesBatch {
  return { itemsUpsert: [], itemsDelete: [] };
}

export function isEmptyStudentNotesBatch(b: StudentNotesBatch): boolean {
  return b.itemsUpsert.length === 0 && b.itemsDelete.length === 0;
}
