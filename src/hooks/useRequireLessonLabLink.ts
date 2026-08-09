"use client";

import { useCallback } from "react";
import { useLinkDeferred } from "@/components/lessonlab/link-deferred";

/* ════════════════════════════════════════════════════════════════════
   MA'LUMOT YARATISHDAN OLDINGI TEKSHIRUV — «Keyinroq»ning juftligi.

   `Keyinroq` tugmasi bog'lash darvozasini chetga suradi, lekin qoidani
   BEKOR QILMAYDI: sinf yoki o'quvchi yaratilsa darvoza qaytadan
   ochilishi kerak. Sabab — majburiy bog'lashning butun maqsadi shu:
   bog'lanmagan sinf/o'quvchi qatori paydo bo'lmasin (2026-08-05: 8 sinf,
   94 o'quvchi bog'lanmagan nusxa bo'lib qolgan).

   NEGA HOLAT SO'RALMAYDI (server so'rovi yo'q)
   -------------------------------------------
   `deferred` faqat BITTA yo'l bilan `true` bo'ladi — foydalanuvchi
   darvoza ichidagi «Keyinroq»ni bosgan. Darvoza esa faqat
   `required && !linked` bo'lganda ko'rinadi. Demak `deferred === true`
   ning o'zi «bu o'qituvchi bog'lanishi shart, lekin hali bog'lanmagan»
   degani. Qo'shimcha `getLessonLabLinkStatusAction()` chaqirish har
   sahifada ortiqcha so'rov bo'lardi.

   ISHLATISH — amaldan OLDIN:

       const ensureLinked = useRequireLessonLabLink();
       if (!ensureLinked()) return;   // darvoza ochildi, amal bekor
   ════════════════════════════════════════════════════════════════════ */

/** `true` — davom etish mumkin. `false` — darvoza ochildi, amalni bekor qiling. */
export function useRequireLessonLabLink(): () => boolean {
  const deferred = useLinkDeferred((s) => s.deferred);
  const requireNow = useLinkDeferred((s) => s.requireNow);

  return useCallback(() => {
    if (!deferred) return true;
    requireNow();
    return false;
  }, [deferred, requireNow]);
}
