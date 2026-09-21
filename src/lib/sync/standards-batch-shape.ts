/* STANDARDS BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `standards-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`standards-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { StandardsBatch } from "./standards-batch";

export function emptyStandardsBatch(): StandardsBatch {
  return { setsUpsert: [], setsDelete: [] };
}

export function isEmptyStandardsBatch(b: StandardsBatch): boolean {
  return b.setsUpsert.length === 0 && b.setsDelete.length === 0;
}
