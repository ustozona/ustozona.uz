"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { collatorFor } from "./collation";

/**
 * Interfeys tiliga mos taqqoslagich — FOYDALANUVCHI kiritgan matnlar
 * (oʻquvchi ismi, sinf nomi, material sarlavhasi) uchun.
 *
 * Oʻzbek tilida Oʻ/Gʻ/Sh/Ch alifbo oxirida turadi; rus tilida kirill
 * tartibi; inglizchada odatiy. Har biri oʻz tilida toʻgʻri chiqadi —
 * shuning uchun tartib qatʼiy "uz" emas, TANLANGAN tilga bogʻlangan.
 *
 * Tarjima qilinmaydigan roʻyxatlar (viloyat/tuman) uchun esa
 * `compareUz` ishlatiladi — u har doim oʻzbekcha tartib beradi.
 */
export function useCollator(): (a: string, b: string) => number {
  const locale = useLocale();
  return React.useMemo(() => {
    const c = collatorFor(locale);
    return (a: string, b: string) => c.compare(a, b);
  }, [locale]);
}
