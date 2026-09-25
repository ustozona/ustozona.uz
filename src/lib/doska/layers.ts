/* ════════════════════════════════════════════════════════════════════
   DOSKA Z-QATLAMLARI — «Markazga» va parda.

   Asosiy qatlamlar `globals.css` da (`--z-doska-*`, docs/doska-dizayn-
   tizimi.md §5). Bu ikkitasi ATAYLAB oʻsha umumiy faylga qoʻshilmadi —
   ular mavjud tokenlardan HOSIL qilinadi, shuning uchun markaziy fayl
   tahrirlanmaydi (AGENTS.md, git tartibi 5-qoida), tartib esa
   baribir bir joydan boshqariladi:

     … panel 1000100 · kontekst 1000105 · yuqori 1000110
     «Markazga»: parda top+10 · vidjet top+11 · chiqish tugmasi top+12
     … tooltip 1001000 · PARDA tooltip+1000

   «Markazga» panel va kontekstdan YUQORI: bu rejimda faqat bitta vidjet
   koʻrinadi. Parda hamma narsadan yuqori, tooltipdan ham.
   ════════════════════════════════════════════════════════════════════ */

export const Z_SPOTLIGHT_SCRIM = "calc(var(--z-doska-top) + 10)";
export const Z_SPOTLIGHT_WIDGET = "calc(var(--z-doska-top) + 11)";
export const Z_SPOTLIGHT_EXIT = "calc(var(--z-doska-top) + 12)";
export const Z_CURTAIN = "calc(var(--z-doska-tooltip) + 1000)";
