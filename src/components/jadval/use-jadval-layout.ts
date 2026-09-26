"use client";

import { useEffect, useState } from "react";

/* ════════════════════════════════════════════════════════════════════
   JADVAL SIRTINING UCH OʻLCHAMI.

   Bitta `isMobile` yetmaydi: 1200 katakli muharrir uchta boshqa-boshqa
   holatda yashaydi.

   | Daraja  | Kenglik   | Nima boʻladi |
   |---------|-----------|--------------|
   | mobile  | < 768px   | Faqat OʻQISH — varaq. Tahrirlash yoʻq |
   | compact | 768–1279  | Toʻr toʻliq enda; rels va panellar Sheet ichida |
   | wide    | ≥ 1280px  | Rels + toʻr + panel yonma-yon, oʻlchami sozlanadi |

   ⚠️ Mobil «kichraytirilgan desktop» EMAS. Barmoq bilan 27px katakka
   tegib boʻlmaydi (tavsiya etilgan eng kichik nishon ~44px), 36 ta ustun
   esa telefon ekraniga sigʻmaydi. Shuning uchun telefonda tahrirlash
   ataylab yopiq — buni yashirmaymiz, ochiq aytamiz
   (docs/dars-jadvali-spec.md §12.7).
   ════════════════════════════════════════════════════════════════════ */

export type JadvalLayout = "mobile" | "compact" | "wide";

const COMPACT_MIN = 768;
const WIDE_MIN = 1280;

export function useJadvalLayout(): JadvalLayout {
  /* SSR va birinchi render — `wide`. Server bilan mos kelishi uchun
     boshlangʻich qiymat qatʼiy boʻlishi shart; haqiqiy oʻlcham
     effektda oʻlchanadi. */
  const [layout, setLayout] = useState<JadvalLayout>("wide");

  useEffect(() => {
    const read = (): JadvalLayout => {
      const w = window.innerWidth;
      if (w < COMPACT_MIN) return "mobile";
      if (w < WIDE_MIN) return "compact";
      return "wide";
    };
    const onResize = () => setLayout(read());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return layout;
}
