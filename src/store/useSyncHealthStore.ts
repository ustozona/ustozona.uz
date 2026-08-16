import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   SINXRONIZATSIYA SOGʻLIGʻI — "saqlandi/saqlanmadi" ni koʻrsatish uchun.

   Nega kerak: muharrirlarda doimiy yonib turadigan «Saqlandi» nishoni
   bor edi. U holat emas, oddiy konstanta edi — hech qachon oʻzgarmasdi
   va push MUVAFFAQIYATSIZ tugaganda ham «Saqlandi» deb turaverardi.
   Jahon amaliyoti teskarisi: sukunat = saqlangan (Notion), gapiriladigan
   yagona holat — XATO.

   Shuning uchun bu yerda faqat "hozir muammo bormi" saqlanadi.
   `createServerSync` push xato bersa `fail()`, muvaffaqiyatda `ok()`
   chaqiradi; kalit — sinxronlanadigan boʻlak nomi, chunki bir vaqtda
   bir nechta store sinxronlanadi va biri tuzalgani hammasini tuzatmaydi.

   Qurilma-lokal, saqlanmaydi (persist YOʻQ): sahifa yangilansa holat
   birinchi push bilan qaytadan aniqlanadi.
   ════════════════════════════════════════════════════════════════════ */

interface SyncHealthState {
  /** Hozir muvaffaqiyatsiz sinxronlanayotgan boʻlaklar. */
  failing: string[];
  fail: (scope: string) => void;
  ok: (scope: string) => void;
}

export const useSyncHealthStore = create<SyncHealthState>()((set) => ({
  failing: [],
  fail: (scope) =>
    set((s) => (s.failing.includes(scope) ? s : { failing: [...s.failing, scope] })),
  ok: (scope) =>
    set((s) => (s.failing.includes(scope) ? { failing: s.failing.filter((x) => x !== scope) } : s)),
}));

/** Serverga yozilmayaptimi. `scope` berilsa — faqat oʻsha boʻlak.

    Boʻlakni koʻrsatish MUHIM: topshiriq muharriri baholar store'iga yozadi,
    shuning uchun u "bildirishnomalar sinxronlanmadi" degan xabarni oʻz
    sarlavhasida koʻrsatmasligi kerak. */
export function useSyncFailing(scope?: string): boolean {
  return useSyncHealthStore((s) => (scope ? s.failing.includes(scope) : s.failing.length > 0));
}
