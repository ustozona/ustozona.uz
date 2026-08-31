"use client";

import * as React from "react";

/* ════════════════════════════════════════════════════════════════════
   MATNNI QUTIGA SIGʻDIRISH.

   ⚠️ Nega `cqw` yetmaydi: konteyner birligi faqat KENGLIKKA qaraydi.
   Baland boʻlmagan qutiga uzun jumla yozilsa, shrift oʻsha-oʻsha
   qolib matn pastdan chiqib ketadi. Sinf ekranida bu eng yomon
   nosozlik — matn saqlangan, lekin koʻrinmaydi, va oʻquvchi uni
   aylantirib oʻqiy olmaydi (doskani hech kim skroll qilmaydi).

   Shuning uchun kenglikdan olingan oʻlcham YUQORI CHEGARA boʻladi,
   sigʻmasa esa ikkilik qidiruv bilan pasaytiriladi. Bu Keynote va
   Canva'dagi «shrink text on overflow» xatti-harakati.

   Narxi — oʻlchash uchun majburiy reflow. Uni qadamlar sonining
   QATʼIYligi ushlab turadi: sakkiz qadam, yaʼni eng yomon holatda ham
   toʻqqizta oʻlchov, va hammasi bitta kichik elementda.

   ⚠️ `requestAnimationFrame` ATAYLAB ISHLATILMAYDI. U yashirin
   sahifada (boshqa tabga oʻtilgan, oyna kichraytirilgan) UMUMAN ishga
   tushmaydi — yaʼni shu paytda yozilgan yoki yuklangan matn notoʻgʻri
   oʻlchamda qotib qolardi, va qaytib kelinganda ham tuzalmasdi, chunki
   element oʻlchami oʻzgarmagani uchun `ResizeObserver` ham jim turadi.
   Bir marta shu tuzoqqa tushilgan (2026-08-31): oʻlcham hech qachon
   qoʻllanmadi va sabab uzoq izlandi.
   ════════════════════════════════════════════════════════════════════ */

type FitOptions = {
  /** Matn — oʻzgarganda qayta oʻlchanadi. */
  text: string;
  /** Yuqori chegara: element KENGLIGIGA nisbatan ulush. */
  widthRatio: number;
  /** Piksel chegaralari. `min` dan pastga tushmaydi. */
  min: number;
  max: number;
};

export function useFitText(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  { text, widthRatio, min, max }: FitOptions,
) {
  /**
   * Oʻlchovchi. Ref orqali — matn oʻzgarganda `ResizeObserver` qayta
   * ulanmasin (u har harfda uzilib-ulansa oʻzi ham qimmatga tushadi).
   */
  const measureRef = React.useRef<() => void>(() => {});

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const upper = Math.min(max, Math.max(min, el.clientWidth * widthRatio));

      // Avval yuqori chegarani sinab koʻramiz — matn qisqarganda
      // shrift QAYTA kattalashishi kerak, aks holda bir marta
      // kichraygan matn shundayligicha qolib ketardi.
      el.style.fontSize = `${upper}px`;
      if (el.scrollHeight <= el.clientHeight) return;

      // Sakkiz qadam — 80px oraliqni ~0.3px gacha toraytiradi, bu
      // koʻzga sezilmaydigan aniqlik.
      let lo = min;
      let hi = upper;
      let best = min;

      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.scrollHeight <= el.clientHeight) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      el.style.fontSize = `${best}px`;
    };

    measureRef.current = measure;
    measure();

    // Vidjet oʻlchami oʻzgarganda ham qayta sigʻdiriladi.
    // ⚠️ Cheksiz halqa yoʻq: element oʻlchami ota-onadan keladi
    // (`size-full`), shrift uni oʻzgartirmaydi.
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, [ref, widthRatio, min, max]);

  React.useLayoutEffect(() => {
    measureRef.current();
  }, [text]);
}
