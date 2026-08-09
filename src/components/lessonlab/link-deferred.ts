import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   «KEYINROQ» — bog'lash darvozasini VAQTINCHA chetga surish.

   Darvoza ilgari mutlaqo o'tib bo'lmaydigan edi: bog'lamaguncha
   dashboard butunlay yopiq. Bu haddan tashqari qattiq — o'qituvchi
   avval nimaga ro'yxatdan o'tganini ko'rishi kerak, keyin qaror qiladi.

   ⛔ LEKIN QOIDA YUMSHAMAYDI — FAQAT KECHIKADI
   -------------------------------------------
   Majburiy bog'lashning maqsadi «tanishishni to'sish» emas, balki
   BOG'LANMAGAN sinf/o'quvchi qatori paydo bo'lishining oldini olish
   (2026-08-05: 8 sinf, 94 o'quvchi bog'lanmagan nusxa bo'lib qolgan).
   Shuning uchun `Keyinroq` faqat KO'RISHga ruxsat beradi; sinf yoki
   o'quvchi YARATISHGA urinilganda `requireNow()` chaqiriladi va darvoza
   qaytadan ochiladi.

   ⚠️ PERSIST QILINMAYDI. Sahifa yangilansa darvoza qaytadi. Ataylab:
   «keyinroq» — bu sessiya uchun, abadiy emas. localStorage'ga yozilsa
   bir marta bosilgan tugma qoidani butunlay o'chirib qo'yardi.
   ════════════════════════════════════════════════════════════════════ */

type LinkDeferredState = {
  deferred: boolean;
  /** «Keyinroq» — shu sessiya uchun chetga surish. */
  defer: () => void;
  /** Ma'lumot yaratishga urinildi — darvozani QAYTA ochamiz. */
  requireNow: () => void;
};

export const useLinkDeferred = create<LinkDeferredState>((set) => ({
  deferred: false,
  defer: () => set({ deferred: true }),
  requireNow: () => set({ deferred: false }),
}));
