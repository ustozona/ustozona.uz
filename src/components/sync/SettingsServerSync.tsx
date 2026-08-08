"use client";

import * as React from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { authClient } from "@/lib/auth-client";
import { getAuthHealthAction } from "@/server/actions/auth-health";
import {
  fetchSettingsAction,
  saveSettingsAction,
  type SettingsSaveInput,
} from "@/server/actions/settings";

/* Settings store ↔ server koʻprigi (renderi yoʻq).
   Dashboard layoutda turadi: mount → hydration → sync.
   Oddiy store — diff'siz, butun snapshot yuboriladi. */

type SettingsState = ReturnType<typeof useSettingsStore.getState>;

function selectSaveInput(s: SettingsState): SettingsSaveInput {
  return {
    name: s.profile.name,
    school: s.profile.school,
    subject: s.profile.subject,
    birthDate: s.profile.birthDate,
    avatarUrl: s.profile.avatarUrl,
    avatarColor: s.profile.avatarColor,
    academicYear: s.academicYear,
    language: s.language,
    workspaceBackground: s.workspaceBackground,
    backgroundScale: s.backgroundScale,
    onboardingCompleted: s.onboardingCompleted,
    completedTours: s.completedTours,
    tasksSettings: s.tasksSettings,
  };
}

export default function SettingsServerSync() {
  const hydrated = useHydrateStore(useSettingsStore, fetchSettingsAction);

  /* ⛔ YARoQSIZ COOKIE TUZOG'I — bu effekt aynan shuni yechadi.
     (2026-08-08 da real foydalanuvchida ushlangan holat.)

     `proxy.ts` faqat cookie BORLIGINI tekshiradi, imzosini emas.
     Shuning uchun cookie bor-u serverda yaroqsiz bo'lsa:

       · proxy sizni `/dashboard` ga qo'yaveradi (sahifa ochiladi)
       · lekin HAR BIR Server Action rad etiladi → hech narsa yuklanmaydi
       · «Foydalanuvchi», bo'sh email, «Holatni tekshirib bo'lmadi»
       · va eng yomoni: `/login` ga borsangiz proxy cookie'ni ko'rib
         sizni QAYTIB `/dashboard` ga uloqtiradi — chiqib ketolmaysiz

     Ya'ni «qaytadan kiring» maslahati bu holatda ISHLAMAYDI.

     Yechim: sababni so'raymiz va `unauthorized` bo'lsa cookie'ni
     TOZALAB (`signOut`) keyin `/login` ga o'tamiz. Tartib muhim:
     tozalamasdan yo'naltirish yuqoridagi halqani hosil qilardi.

     ⚠️ Faqat `unauthorized` da. `server` (vaqtinchalik nosozlik) da
     chiqarib yuborish foydalanuvchini bekordan-bekor ishidan
     uzardi — u holatda ekranda xato ko'rsatiladi, holos.

     ⚠️ «HALI TUGAMADI» va «YIQILDI» ni ajratish shart. `hydrated`
     boshlanishda ham `false` — shu holatda tekshiruv qilsak, HAR
     dashboard yuklanishida keraksiz so'rov ketardi. `_hasHydrated`
     esa hydration TUGAGANDA (muvaffaqiyat ham, xato ham) yoqiladi.
     Ikkisi birga aniq javob beradi: tugagan-u muvaffaqiyat yo'q =
     yiqilgan. Shu sababli umumiy `useHydrateStore` ni o'zgartirish
     kerak emas — signal allaqachon store'da bor. */
  const hydrationFinished = useSettingsStore((s) => s._hasHydrated);

  React.useEffect(() => {
    if (!hydrationFinished || hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const health = await getAuthHealthAction();
        if (cancelled || !("failed" in health)) return;
        if (health.failed !== "unauthorized") return;

        /* ⛔ HALQA HIMOYASI — bu tekshiruvni olib tashlamang.
           Sabab TIZIMLI bo'lsa (masalan imzo kaliti mos kelmasa),
           yangi kirish ham yaroqsiz cookie beradi. Bunda quyidagi
           chiqarish HAR yuklanishda takrorlanib, foydalanuvchi
           «kirish → chiqarib yuborish → kirish» halqasiga tushardi —
           hozirgi holatdan ham yomon. Shuning uchun bitta brauzer
           yorlig'ida FAQAT BIR MARTA urinamiz. */
        const KEY = "uz_auth_recovery_tried";
        if (sessionStorage.getItem(KEY)) {
          console.error(
            "[settings-sync] sessiya qayta kirishdan keyin ham yaroqsiz — " +
            "sabab tizimli (server sozlamasi). Halqaga kirmaslik uchun " +
            "chiqarib yuborilmadi."
          );
          return;
        }
        sessionStorage.setItem(KEY, "1");

        await authClient.signOut().catch(() => {});
        // `router.push` EMAS: to'liq reload kerak — xotiradagi
        // store'larda oldingi hisob ma'lumoti qolib ketmasligi uchun
        // (HeaderAccountMenu'dagi chiqish bilan bir xil sabab).
        window.location.href = "/login";
      } catch (err) {
        console.error("[settings-sync] sessiya holati aniqlanmadi:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrationFinished, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    // Hydration ishladi — halqa bayrog'ini tozalaymiz, aks holda
    // keyingi HAQIQIY sessiya tugashida tiklash ishlamay qolardi.
    try {
      sessionStorage.removeItem("uz_auth_recovery_tried");
    } catch (err) {
      // Private rejim / sessionStorage yopiq — tiklash bir marta
      // ishlamaydi, holos. Bloklamaydi.
      console.debug("[settings-sync] sessionStorage yozilmadi:", err);
    }
    const sync = createServerSync({
      store: useSettingsStore,
      select: selectSaveInput,
      push: saveSettingsAction,
      errorMessage: "Sozlamalar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
