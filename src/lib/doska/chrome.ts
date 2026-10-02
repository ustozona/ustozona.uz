/* ════════════════════════════════════════════════════════════════════
   DOSKA BOSHQARUVI GEOMETRIYASI — burchak tugmalari egallaydigan joy.

   Burchakdagi tugmalar (bosh sahifa · toʻliq ekran · menyu) vidjetlar
   USTIDA turadi. Shuning uchun vidjet joylashuvi (`placement.ts`) va eski
   ekranlar migratsiyasi (`store.ts`) ular egallaydigan balandlikni
   bilishi kerak. Raqamlar shu yerda — komponent klasslari bilan BIRGA
   oʻzgartiriladi:

     CHROME_INSET_PX  ↔ `DoskaShell` dagi burchak qatorining `p-2`
     CHROME_BUTTON_PX ↔ `barIconButtonClass` dagi `size-9` (`BarGroup.tsx`)
     CHROME_BORDER_PX ↔ `.doska-ctl` chegarasi (eng qalini — Oʻyinchoq, 3 px)
   ════════════════════════════════════════════════════════════════════ */

export const CHROME_INSET_PX = 8;
export const CHROME_BUTTON_PX = 36;
export const CHROME_BORDER_PX = 3;

/** Tepadagi burchak tugmalari qatori + vidjetdan boʻshliq (piksel). */
export const TOP_CHROME_PX = CHROME_INSET_PX + CHROME_BORDER_PX * 2 + CHROME_BUTTON_PX + CHROME_INSET_PX;
