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
    (async () => {
      try {
        const payload = await fetchPayload();
        if (payload) store.setState(payload);
      } catch (err) {
        console.error("[hydrate] server payload olinmadi:", err);
      }
      store.setState({ _hasHydrated: true } as Partial<S>);
      setHydrated(true);
    })();
    // store va action referenslari barqaror — qayta ishga tushirilmaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hydrated;
}
