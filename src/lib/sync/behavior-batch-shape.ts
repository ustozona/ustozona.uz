/* BEHAVIOR BATCH — boʻsh paket va "boʻshmi?" tekshiruvi.

   Bular `behavior-batch.ts` da edi, lekin u fayl tepasida `zod` ni
   import qiladi. Mijozdagi diff moduli (`behavior-sync.ts`) shu ikki
   yordamchini QIYMAT sifatida olgani uchun zod ham brauzer paketiga
   tushardi — tekshiruv esa faqat serverda kerak. Tiplar `import type`
   bilan olinadi va kompilyatsiyada oʻchadi, shuning uchun bu modul
   zod'dan butunlay xoli. */
import type { BehaviorBatch } from "./behavior-batch";

export function emptyBehaviorBatch(): BehaviorBatch {
  return {
    skillsUpsert: [],
    skillsDelete: [],
    eventsUpsert: [],
    eventsDelete: [],
    rewardsUpsert: [],
    rewardsDelete: [],
    redemptionsUpsert: [],
    redemptionsDelete: [],
    deletionsInsert: [],
    autoSettingsUpsert: [],
  };
}

export function isEmptyBehaviorBatch(b: BehaviorBatch): boolean {
  return (
    b.skillsUpsert.length === 0 &&
    b.skillsDelete.length === 0 &&
    b.eventsUpsert.length === 0 &&
    b.eventsDelete.length === 0 &&
    b.rewardsUpsert.length === 0 &&
    b.rewardsDelete.length === 0 &&
    b.redemptionsUpsert.length === 0 &&
    b.redemptionsDelete.length === 0 &&
    b.deletionsInsert.length === 0 &&
    b.autoSettingsUpsert.length === 0
  );
}
