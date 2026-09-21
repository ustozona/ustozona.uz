"use client";

import { fetchDashboardBootstrapAction } from "@/server/actions/bootstrap";
import type { DashboardBootstrap } from "@/lib/sync/bootstrap-types";

/* ════════════════════════════════════════════════════════════════════
   BOOTSTRAP — CLIENT TOMONI.

   Barcha `*ServerSync` komponentlari mount'da shu yerdan oʻz boʻlagini
   soʻraydi. Soʻrov modul darajasida BIR MARTA yuboriladi: kim birinchi
   soʻrasa oʻsha boshlaydi, qolganlari AYNAN SHU promise'ni kutadi.

   Nega context emas: soʻrov faqat effekt ichidan boshlanishi kerak
   (SSR paytida boshlanib qolmasin), effektlar esa tartibi kafolatlanmagan
   15 ta komponentda. Modul-singleton shu ikkalasini ham hal qiladi va
   provider qoʻshishni talab qilmaydi.

   ⚠️ Promise QAYTA URINILMAYDI. Yiqilsa har store `useHydrateStore`
   ichida oʻz xatosini koʻradi va sync BOSHLANMAYDI — bu ataylab:
   hydration yiqilganda standart qiymatlarni serverga yozib yubormaslik
   qoidasi (`useHydrateStore` izohiga qarang) oʻz kuchida qoladi.
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
 * Modul darajasida chaqiriladi:
 * `const fetchSlice = bootstrapSlice("grades");`
 */
export function bootstrapSlice<K extends keyof DashboardBootstrap>(
  key: K
): () => Promise<DashboardBootstrap[K]> {
  return async () => (await bootstrapOnce())[key];
}
