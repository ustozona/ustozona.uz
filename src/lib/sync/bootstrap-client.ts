"use client";

import { fetchDashboardBackgroundAction } from "@/server/actions/bootstrap";
import { fetchSettingsAction } from "@/server/actions/settings";
import { fetchGradesAction } from "@/server/actions/grades";
import { fetchBehaviorAction } from "@/server/actions/behavior";
import type { DashboardBackground, DashboardPayloads } from "@/lib/sync/bootstrap-types";

/* ════════════════════════════════════════════════════════════════════
   BOOTSTRAP — CLIENT TOMONI.

   Barcha `*ServerSync` komponentlari mount'da shu yerdan oʻz boʻlagini
   soʻraydi. Profil → sinflar → qolgan boʻlaklar tartibida uchta soʻrov:
   12 ta sekinroq boʻlak profil/sinfni 5–10 soniya ushlab turmasin.
   Har bosqich modul darajasida bir marta yuboriladi, barcha isteʼmolchi
   ayni promise'ni kutadi. Serverdagi pool avvalgidek chegaralangan.

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

let settingsFlight: ReturnType<typeof fetchSettingsAction> | null = null;
let gradesFlight: ReturnType<typeof fetchGradesAction> | null = null;
let backgroundFlight: Promise<DashboardBackground> | null = null;
let behaviorFlight: ReturnType<typeof fetchBehaviorAction> | null = null;

function settingsOnce() {
  settingsFlight ??= fetchSettingsAction();
  return settingsFlight;
}

function gradesOnce() {
  // Settings xatosi qolgan boʻlimlarni bloklamaydi: oʻzining store'i
  // hydrate boʻlmaydi, sinflar baribir mustaqil olinadi.
  gradesFlight ??= settingsOnce().then(fetchGradesAction, fetchGradesAction);
  return gradesFlight;
}

function backgroundOnce() {
  // Hamma sync mount'da boshlanadi, lekin ogʻir 12 boʻlak sinflarni
  // DB pool'ida navbatga qoʻymasligi uchun avval sinflarni kutadi.
  backgroundFlight ??= gradesOnce().then(fetchDashboardBackgroundAction, fetchDashboardBackgroundAction);
  return backgroundFlight;
}

function behaviorOnce() {
  // Xulq oʻz soʻrovida, fon boʻlaklaridan KEYIN: katta javob ular bilan
  // pool talashmasin (bootstrap-types.ts dagi DashboardBackground izohi).
  behaviorFlight ??= backgroundOnce().then(fetchBehaviorAction, fetchBehaviorAction);
  return behaviorFlight;
}

/**
 * `useHydrateStore` kutadigan shakldagi fetcher qaytaradi. Profil va
 * sinflar alohida keladi; qolganlar umumiy javobdan oʻz boʻlagini oladi.
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
    if (key === "settings") return settingsOnce() as Promise<DashboardPayloads[K]>;
    if (key === "grades") return gradesOnce() as Promise<DashboardPayloads[K]>;
    if (key === "behavior") return behaviorOnce() as Promise<DashboardPayloads[K]>;

    const background = await backgroundOnce();
    const slice = background[key as keyof DashboardBackground];
    if (!slice.ok) throw new Error(`bootstrap "${String(key)}": ${slice.error}`);
    return slice.value as DashboardPayloads[K];
  };
}
