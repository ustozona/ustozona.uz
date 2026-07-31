"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { productFor, surfaceFor } from "@/lib/product-scope";

/* `<html data-product>`/`data-surface` faqat SERVER render'da (layout.tsx,
   `headers()`) qoʻyiladi. Next.js App Router client-side navigatsiyada
   (Link bosish) root layout QAYTA ISHLAMAYDI — atribut avvalgi sahifadan
   "qotib qoladi" (masalan /dashboard/baholash'dan /dashboard/assignments'ga
   oʻtilsa, ranglar koʻk boʻlib qolaveradi). Shu komponent har navigatsiyada
   `usePathname()` orqali toʻgʻri qiymatni majburan qoʻyadi — sof funksiyalar
   (`productFor`/`surfaceFor`) client'da ham xavfsiz ishlaydi. */
export function ProductScopeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.product = productFor(pathname);
    html.dataset.surface = surfaceFor(pathname);
  }, [pathname]);

  return null;
}
