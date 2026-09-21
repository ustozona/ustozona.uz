/* NOTIFICATIONS BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `notifications-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`notifications-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { NotificationsBatch } from "./notifications-batch";

export function emptyNotificationsBatch(): NotificationsBatch {
  return { itemsUpsert: [], itemsDelete: [] };
}

export function isEmptyNotificationsBatch(b: NotificationsBatch): boolean {
  return b.itemsUpsert.length === 0 && b.itemsDelete.length === 0;
}
