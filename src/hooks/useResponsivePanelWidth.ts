"use client";

import { useEffect, useState } from "react";

/**
 * Toʻliq ekranli muharrirlarning yon panel razmeri — doim viewport kengligining
 * `vwPct` ulushi (noutbuk va katta desktopda bir xil proporsiya), faqat juda
 * tor oynada `min`gacha qisqarishi cheklanadi.
 *
 * Framer Motion width animatsiyasi son talab qilgani uchun CSS `clamp()` emas,
 * JS hisoblaydi. Dars muharriri va topshiriq muharriri umumiy ishlatadi.
 */
export function useResponsivePanelWidth(min: number, vwPct: number) {
  const [width, setWidth] = useState(min);
  useEffect(() => {
    const calc = () => setWidth(Math.max(min, window.innerWidth * vwPct));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [min, vwPct]);
  return width;
}
