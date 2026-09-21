/* TASKS BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `tasks-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`tasks-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { TasksBatch } from "./tasks-batch";

export function emptyTasksBatch(): TasksBatch {
  return { tasksUpsert: [], tasksDelete: [] };
}

export function isEmptyTasksBatch(b: TasksBatch): boolean {
  return b.tasksUpsert.length === 0 && b.tasksDelete.length === 0;
}
