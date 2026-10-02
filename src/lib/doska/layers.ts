/* ════════════════════════════════════════════════════════════════════
   DOSKA Z-QATLAMLARI — «Markazga» va parda.

   Asosiy qatlamlar `src/styles/doska.css` da (`--z-doska-*`,
   docs/doska-dizayn-tizimi.md §5). Bu ikkitasi mavjud tokenlardan HOSIL
   qilinadi — yangi raqam kiritilmaydi va tartib baribir bir joydan
   boshqariladi:

     … panel 1000100 · kontekst 1000105 · yuqori 1000110
     «Markazga»: parda top+10 · vidjet top+11 · chiqish tugmasi top+12
     … tooltip 1001000 · PARDA tooltip+1000

   «Markazga» panel va kontekstdan YUQORI: bu rejimda faqat bitta vidjet
   koʻrinadi. Parda hamma narsadan yuqori, tooltipdan ham.
   ════════════════════════════════════════════════════════════════════ */

/** Chetga qoʻyilgan vidjetlar tugmalari — vidjetlar ustida, pardadan past. */
export const Z_PARKED = "calc(var(--z-doska-top) + 5)";

/**
 * Sozlama oynasi — oʻngdan butun balandlikda, shuning uchun oʻng tepadagi
 * burchak tugmalaridan (`--z-doska-top`) YUQORI: aks holda ular oyna
 * sarlavhasi va «Yopish» tugmasi ustida qolardi. «Markazga» dan past.
 */
export const Z_SETTINGS = "calc(var(--z-doska-top) + 6)";
export const Z_SPOTLIGHT_SCRIM = "calc(var(--z-doska-top) + 10)";
export const Z_SPOTLIGHT_WIDGET = "calc(var(--z-doska-top) + 11)";
export const Z_SPOTLIGHT_EXIT = "calc(var(--z-doska-top) + 12)";
export const Z_CURTAIN = "calc(var(--z-doska-tooltip) + 1000)";

/**
 * Yorliqlar roʻyxati (`K`) — butun boshqaruvdan va «Markazga» dan
 * yuqori: uni oʻqituvchining oʻzi chaqiradi va u hamma narsani yopib
 * turishi kerak. Tooltipdan past, pardadan past (parda ochiq paytda
 * klaviatura baribir pardaniki).
 */
export const Z_SHORTCUTS_SCRIM = "calc(var(--z-doska-top) + 20)";
export const Z_SHORTCUTS = "calc(var(--z-doska-top) + 21)";

/**
 * Chizgʻich va transportir — siyoh USTIDA, shaffof plastik kabi: ostidagi
 * yozuv koʻrinib turadi, barmoq esa yozuvni emas, asbobni ushlaydi.
 * Tanlov tutqichlaridan past.
 */
export const Z_INK_GUIDE = "calc(var(--z-doska-ink) + 1)";
