"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { canGoBackInApp } from "@/lib/app-history";

/** Toʻliq-ekran koʻrinishni (dars muharriri, oʻquvchi profili) yopish —
    [[app-history]] izohiga qarang. Ilova ichida qaytadigan yozuv boʻlsa
    \`back()\`: manba sahifa butun holati bilan (URL param'lari, skroll oʻrni)
    tiklanadi va tarixda tuzoq qolmaydi. Aks holda (toʻgʻridan-toʻgʻri havola
    bilan kirilgan) — \`fallbackHref\` ga oʻtiladi; unga kontekstni (masalan
    \`?classId=\`) chaqiruvchi qoʻshib beradi. */
export function useBackOrPush() {
  const router = useRouter();
  return useCallback(
    (fallbackHref: string) => {
      if (canGoBackInApp()) {
        router.back();
        return;
      }
      router.push(fallbackHref);
    },
    [router]
  );
}
