"use client";

import * as React from "react";

/* ════════════════════════════════════════════════════════════════════
   useHydrateStore — server → zustand store hydration (v1 pattern).

   Mount'da read action chaqiriladi, natija `setState` bilan store'ga
   qoʻyiladi va `_hasHydrated: true` belgilanadi (mavjud mount-gate'lar
   shu flagga qaraydi). Fetch xato bersa (offline, sessiya tugagan) —
   store default holatida qoladi, lekin flag baribir yoqiladi, UI
   qotib qolmaydi.

   Qaytaradi: hydration tugadimi (sync qatlamini shundan KEYIN
   ishga tushirish uchun — aks holda defaultlar server ustiga yoziladi).
   ════════════════════════════════════════════════════════════════════ */

type HydratableStore<S> = {
  getState: () => S;
  setState: (partial: Partial<S>) => void;
};

export function useHydrateStore<S extends { _hasHydrated: boolean }>(
  store: HydratableStore<S>,
  fetchPayload: () => Promise<Partial<S> | null | undefined>
): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  const started = React.useRef(false);

  React.useEffect(() => {
    // StrictMode'da effect ikki marta chaqiriladi — bitta fetch yetadi.
    if (started.current) return;
    started.current = true;
    // Shu sessiyada allaqachon hydrate boʻlgan (masalan, boshqa layout'da) —
    // qayta fetch lokal, hali push qilinmagan oʻzgarishlarni bosib ketardi.
    if (store.getState()._hasHydrated) {
      setHydrated(true);
      return;
    }
    (async () => {
      let ok = true;
      try {
        const payload = await fetchPayload();
        if (payload) store.setState(payload);
      } catch (err) {
        ok = false;
        console.error("[hydrate] server payload olinmadi:", err);
      }
      // `_hasHydrated` yiqilganda HAM yoqiladi — UI qotib qolmasligi
      // uchun (mount-gate'lar shunga qaraydi).
      store.setState({ _hasHydrated: true } as Partial<S>);
      // ⛔ LEKIN QAYTARILADIGAN QIYMAT — FAQAT MUVAFFAQIYAT.
      //
      // Bu qiymat sync qatlamini ishga tushiradi. Ilgari u yiqilganda
      // ham `true` bo'lardi va oqibati og'ir edi: hydration yiqilsa
      // store STANDART qiymatda qoladi, sync esa o'sha standartlarni
      // SERVERGA YOZADI — ya'ni o'qituvchining haqiqiy ismi, maktabi
      // va fani standart qiymat bilan ustiga yozilib ketishi mumkin.
      //
      // Endi xato bo'lsa sync umuman boshlanmaydi: ekranda eski/bo'sh
      // ma'lumot ko'rinadi, lekin serverdagi HAQIQIY ma'lumot
      // buzilmaydi. Ma'lumotni yo'qotishdan ko'ra ko'rsatmaslik afzal.
      setHydrated(ok);
    })();
    // store va action referenslari barqaror — qayta ishga tushirilmaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hydrated;
}
