"use client";

import * as React from "react";

/* ════════════════════════════════════════════════════════════════════
   SUZUVCHI ELEMENT JOYI — vidjet ustidagi kontekst panel (`WidgetToolbar`).

   Ilgari sozlama kartasi ham shu hook bilan vidjet yoniga qoʻyilardi;
   endi sozlama oynasi ekran chetida (`WidgetSettingsCard`), unga kerak emas.

   Panel oʻlchami mazmunga bogʻliq (tugmalar soni, til) va render paytida
   nomaʼlum. Shuning uchun joy DOMʼda hisoblanadi va toʻgʻridan-toʻgʻri
   `style` ga yoziladi — holat va qayta render yoʻq.

   QACHON qayta hisoblanadi (va faqat shunda):
     • `key` oʻzgarganda — vidjetning oʻrni yoki oʻlchami (sudrash);
     • elementning oʻz oʻlchami oʻzgarganda (`ResizeObserver`) — masalan
       qulf yozuvi yoki til almashganda;
     • oyna oʻlchami oʻzgarganda (planshet burildi, toʻliq ekran).

   Har renderda EMAS: Doskada ishlayotgan taymer store'ni har soniya
   yangilaydi va har render sinxron layout oʻqishini (`offsetWidth`)
   majburlardi.

   `place` elementni oʻlchaydi va joyini oʻzi yozadi — geometriya
   komponentga xos, bu hook faqat vaqtini boshqaradi.
   ════════════════════════════════════════════════════════════════════ */

export function usePinnedPosition(
  ref: React.RefObject<HTMLElement | null>,
  key: string,
  place: (el: HTMLElement) => void,
) {
  // Oxirgi `place` ref orqali: kuzatuvchilar bir marta ulanadi.
  const placeRef = React.useRef(place);
  React.useLayoutEffect(() => {
    placeRef.current = place;
  });

  React.useLayoutEffect(() => {
    if (ref.current) placeRef.current(ref.current);
  }, [ref, key]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (ref.current) placeRef.current(ref.current);
    };
    const observer = new ResizeObserver(run);
    observer.observe(el);
    window.addEventListener("resize", run);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", run);
    };
  }, [ref]);
}

/** `v` ni [min, max] oraligʻiga qisadi; oraliq teskari boʻlsa `min` ustun. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), Math.max(min, max));
}
