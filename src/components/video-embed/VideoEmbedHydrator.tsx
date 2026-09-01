"use client";

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VideoEmbedFacade } from "./VideoEmbedFacade";
import type { VideoEmbedRef, VideoProvider } from "@/lib/video-embed";

/**
 * NASHR QILINGAN SAHIFADAGI VIDEOLARNI «YUKSALTIRISH»
 *
 * Maqola tanasi `dangerouslySetInnerHTML` bilan chiqariladi (Tiptap HTML
 * round-trip aynan saqlanadi), yaʼni ichidagi video bloklari React
 * daraxtiga tegishli EMAS. Shuning uchun bu komponent mount'dan keyin
 * `[data-video-embed]` placeholder'larni topib, har biriga ALOHIDA React
 * root ochadi va fasadni ustiga qoʻyadi.
 *
 * Nega HTML'ni React'ga parse qilmaymiz: butun prose'ni parserdan
 * oʻtkazish (html-react-parser va oʻxshashlari) yangi bogʻliqlik,
 * sanitizatsiya va matn oqimidagi nozik farqlar demak. Bu yerda esa
 * yuksaltirilishi kerak boʻlgan yagona narsa — video bloklari.
 *
 * Progressiv: JS yuklanmasa placeholder ichidagi `<a>` havolasi koʻrinib
 * turadi (`renderHTML` shuni yozadi), yaʼni kontent yoʻqolmaydi.
 */

/* ════════════════════════════════════════════════════════════════════
   ROOT HISOBI — StrictMode ikki marta mount qilganda buzilmasligi uchun

   ⛔ MUAMMO. React StrictMode (App Router'da dev'da yoqilgan) effektni
      ikki marta chaqiradi: mount → cleanup → mount. Cleanup'dagi
      `unmount()` esa mikrotaskka suriladi (sinxron chaqirilsa React
      "Attempted to synchronously unmount a root while React was already
      rendering" deb ogohlantiradi). Natijada tartib shunday boʻladi:

          mount#1 (root ochildi) → cleanup#1 (unmount navbatga) →
          mount#2 → mikrotask: unmount ← TIRIK root oʻldiriladi

      Yaʼni dev'da video maydoni boʻm-boʻsh qolar, prodda esa hammasi
      joyida — chalgʻituvchi farqning eng yomon turi. Har mount'da
      `createRoot` qayta ochilsa buning ustiga React'ning "container has
      already been passed to createRoot()" xatosi ham qoʻshiladi.

   ✅ YECHIM. Element boʻyicha root SAQLANADI va QAYTA ISHLATILADI, unga
      esa foydalanuvchilar SONI qoʻshiladi. Unmount faqat hisob 0 ga
      tushganda bajariladi:

          mount#1 → 1 · cleanup#1 → (navbat) · mount#2 → 2
          mikrotask: 2−1 = 1 > 0 → unmount YOʻQ, root tirik qoladi

      Haqiqiy ketishda (boshqa sahifaga oʻtish) hisob 0 ga tushadi va
      root normal yopiladi. WeakMap — element DOM'dan chiqsa yozuvlar
      oʻzi yoʻqoladi.
   ════════════════════════════════════════════════════════════════════ */
const ROOTS = new WeakMap<Element, Root>();
const USES = new WeakMap<Element, number>();

export function VideoEmbedHydrator({ selector }: { selector: string }) {
  useEffect(() => {
    const container = document.querySelector(selector);
    if (!container) return;

    const mounted: HTMLElement[] = [];
    for (const el of container.querySelectorAll<HTMLElement>("[data-video-embed]")) {
      const videoId = el.dataset.videoId;
      if (!videoId) continue;
      const video: VideoEmbedRef = {
        provider: (el.dataset.provider as VideoProvider) || "youtube",
        videoId,
        kind: (el.dataset.kind as VideoEmbedRef["kind"]) || undefined,
        url: el.dataset.url || "",
      };

      let root = ROOTS.get(el);
      if (!root) {
        /* `createRoot` konteynerni oʻzi tozalaydi — ichidagi zaxira `<a>`
           havolasi shu yerda almashadi. */
        root = createRoot(el);
        ROOTS.set(el, root);
      }
      USES.set(el, (USES.get(el) ?? 0) + 1);
      root.render(<VideoEmbedFacade video={video} />);
      mounted.push(el);
    }

    return () => {
      queueMicrotask(() => {
        for (const el of mounted) {
          const left = (USES.get(el) ?? 1) - 1;
          if (left > 0) {
            USES.set(el, left);
            continue;
          }
          USES.delete(el);
          const root = ROOTS.get(el);
          ROOTS.delete(el);
          root?.unmount();
        }
      });
    };
  }, [selector]);

  return null;
}
