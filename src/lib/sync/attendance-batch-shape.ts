/* ATTENDANCE BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `attendance-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`attendance-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { AttendanceBatch } from "./attendance-batch";

export function emptyAttendanceBatch(): AttendanceBatch {
  return { statusesUpsert: [], statusesDelete: [], recordsUpsert: [], recordsDelete: [] };
}

export function isEmptyAttendanceBatch(b: AttendanceBatch): boolean {
  return (
    b.statusesUpsert.length === 0 &&
    b.statusesDelete.length === 0 &&
    b.recordsUpsert.length === 0 &&
    b.recordsDelete.length === 0
  );
}
