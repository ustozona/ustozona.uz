"use client";

import { fetchDashboardBootstrapAction } from "@/server/actions/bootstrap";
import type { DashboardBootstrap, DashboardPayloads } from "@/lib/sync/bootstrap-types";

/* ════════════════════════════════════════════════════════════════════
   BOOTSTRAP — CLIENT TOMONI.

   Barcha `*ServerSync` komponentlari mount'da shu yerdan oʻz boʻlagini
   soʻraydi. Soʻrov modul darajasida BIR MARTA yuboriladi: kim birinchi
   soʻrasa oʻsha boshlaydi, qolganlari AYNAN SHU promise'ni kutadi.

   Nega context emas: soʻrov faqat effekt ichidan boshlanishi kerak
   (SSR paytida boshlanib qolmasin), effektlar esa tartibi kafolatlanmagan
   15 ta komponentda. Modul-singleton shu ikkalasini ham hal qiladi va
   provider qoʻshishni talab qilmaydi.

   ⚠️ QAYTA URINISH YOʻQ. Yiqilgan boʻlak (yoki butun soʻrov — tarmoq
   uzilsa) `useHydrateStore` ichida xato boʻlib koʻrinadi, oʻsha store
   hydrate boʻlmaydi va uning sync'i BOSHLANMAYDI. Bu ataylab: hydration
   yiqilganda standart qiymatlarni serverga yozib yubormaslik qoidasi
   (`useHydrateStore` izohiga qarang) oʻz kuchida qoladi.
   ════════════════════════════════════════════════════════════════════ */

let inFlight: Promise<DashboardBootstrap> | null = null;

function bootstrapOnce(): Promise<DashboardBootstrap> {
  inFlight ??= fetchDashboardBootstrapAction();
  return inFlight;
}

/**
 * `useHydrateStore` kutadigan shakldagi fetcher qaytaradi — lekin tarmoqqa
 * chiqmaydi, umumiy bootstrap javobidan bitta boʻlakni oladi.
 *
 * Boʻlak serverda yiqilgan boʻlsa TASHLAYDI — shunda faqat SHU store
 * hydrate boʻlmaydi, qoʻshnilari normal ishlayveradi.
 *
 * Modul darajasida chaqiriladi:
 * `const fetchSlice = bootstrapSlice("grades");`
 */
export function bootstrapSlice<K extends keyof DashboardPayloads>(
  key: K
): () => Promise<DashboardPayloads[K]> {
  return async () => {
    const slice = (await bootstrapOnce())[key];
    if (!slice.ok) throw new Error(`bootstrap "${String(key)}": ${slice.error}`);
    return slice.value;
  };
}
