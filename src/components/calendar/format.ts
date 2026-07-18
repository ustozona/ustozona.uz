"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

/* ════════════════════════════════════════════════════════════════════
   KALENDAR FORMATLASH — kun/oy nomlari MESSAGE-ASOSLI (Calendar
   namespace, 6 til). date-fns/ICU ishlatilmaydi: qoraqalpoq (kaa)
   tilida ular yoʻq. src/lib/localization.ts konstantalari faqat
   uz-fallback/legacy sifatida qoladi.

   Kun fazosi — ISO: 1=Dushanba .. 7=Yakshanba (calendar-core bilan mos).
   Oy — JS oy indeksi 0..11.
   ════════════════════════════════════════════════════════════════════ */

export function useCalendarFormat() {
  const t = useTranslations("Calendar");
  // Memo — useMemo deplarida bemalol ishlatish uchun barqaror obyekt.
  return useMemo(() => ({
    t,
    /** ISO kun (1=Du..7=Ya) → toʻliq nom. */
    dayName: (isoDay: number) => t(`days.d${isoDay}`),
    /** ISO kun → qisqa nom (2-3 harf). */
    dayShort: (isoDay: number) => t(`daysShort.d${isoDay}`),
    /** JS oy indeksi (0..11) → toʻliq nom. */
    monthName: (month0: number) => t(`months.m${month0 + 1}`),
    /** JS oy indeksi → qisqa nom. */
    monthShort: (month0: number) => t(`monthsShort.m${month0 + 1}`),
  }), [t]);
}
