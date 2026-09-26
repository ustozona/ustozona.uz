import type { CSSProperties } from "react";

import { classColorValue, type ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   IKONA TUSI — IERARXIK rejim (bitta tus, ikki shaffoflik).

   Solar duotone SVG'ida ikki qatlam bor: `opacity=".5"` li massa va
   usti detal. Ierarxik rejimda IKKALASI HAM bitta rang oladi — farq
   faqat shaffoflikda. Bu Apple SF Symbols'ning «hierarchical» rejimi.

   Shuning uchun bu yerda hisob-kitob YOʻQ: tus palitradan qanday
   boʻlsa shundayligicha olinadi. Fayl shu holicha qolishi kerak —
   quyidagi ikki tuzoq aynan shu joyda ikki marta ish yegan.

   ⚠️ TUZOQ 1 — kontrastga «tuzatish» qoʻshmang.
   2026-08-21 da yorqinlik oq fonga 3:1 kontrast chiqquncha tushirilgan
   edi (WCAG 1.4.11). Koʻk, qizil, binafsha deyarli oʻzgarmagan, lekin
   sariq `#ffb900` dan `#c08b00` ga — oltindan xantalga — qulagan.
   Sariq oq fonda bir vaqtda sariq ham, 3:1 ham boʻla olmaydi.

   Va qoida notoʻgʻri qoʻllangan edi: WCAG 1.4.11 mazmunni tushunish
   uchun ZARUR grafikaga tegishli. Bizning har tugmamizda koʻrinadigan
   matn yorligʻi bor («Soat», «Taymer»), maʼnoni oʻsha tashiydi — ikona
   uni kuchaytiradi, almashtirmaydi.

   → Ikona matn yorligʻisiz, YAKKA maʼno tashiydigan joyda ishlatilsa
     (masalan faqat ikonali asboblar qatori), unda kontrast talab
     qayta paydo boʻladi — lekin uni SHU YERDA emas, oʻsha kontekstda
     hal qiling. Panelga tegmang.

   ⚠️ TUZOQ 2 — `color-mix` ishlatmang.
   U yaroqsiz deb topilsa `var()` fallback ISHLAMAYDI: xususiyat
   butunlay tushib qoladi va ikona nasl orqali qora boʻlib qoladi.

   ⚠️ Uchinchi tuzoq SVG tomonda va u eng koʻp vaqt yegani:
   `<g fill="…">` CSS'ni toʻxtatadi. Batafsil — icons.tsx sarlavhasi.
   ════════════════════════════════════════════════════════════════════ */

export function iconTint(tint: ClassColor): string {
  return classColorValue(tint);
}

export function iconTintStyle(tint: ClassColor): CSSProperties {
  return { ["--doska-icon-tint"]: iconTint(tint) } as CSSProperties;
}
