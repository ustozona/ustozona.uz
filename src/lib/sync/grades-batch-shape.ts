/* GRADES BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `grades-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`grades-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { GradesBatch } from "./grades-batch";

export function emptyGradesBatch(): GradesBatch {
  return {
    classesUpsert: [],
    classesDelete: [],
    studentsUpsert: [],
    studentsDelete: [],
    topicsUpsert: [],
    topicsDelete: [],
    assignmentsUpsert: [],
    assignmentsDelete: [],
    gradesUpsert: [],
    gradesDelete: [],
  };
}

export function isEmptyGradesBatch(b: GradesBatch): boolean {
  return (
    b.classesUpsert.length === 0 &&
    b.classesDelete.length === 0 &&
    b.studentsUpsert.length === 0 &&
    b.studentsDelete.length === 0 &&
    b.topicsUpsert.length === 0 &&
    b.topicsDelete.length === 0 &&
    b.assignmentsUpsert.length === 0 &&
    b.assignmentsDelete.length === 0 &&
    b.gradesUpsert.length === 0 &&
    b.gradesDelete.length === 0
  );
}
