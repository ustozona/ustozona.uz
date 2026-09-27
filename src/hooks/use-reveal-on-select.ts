import * as React from "react";

/**
 * Tor ekranda (lg dan kichik) ustunlar ustma-ust tiziladi: roʻyxatda
 * biror narsa tanlansa, uning tafsiloti pastda chiqadi va foydalanuvchi
 * buni sezmaydi («bosdim — hech narsa boʻlmadi»). Bu hook tanlov
 * OʻZGARGANDA tafsilot ustunini koʻrinishga silliq olib keladi.
 *
 * Birinchi render (URL'dan tiklangan tanlov) va desktop tegilmaydi.
 * `prefers-reduced-motion` da sakrab oʻtadi.
 *
 * ⛔ `scrollIntoView` ISHLATILMAYDI: u `overflow: hidden` ota-bloklarni
 * ham (dasturiy) aylantiradi — dashboard qobigʻida ular bor
 * (`SidebarInset`, with-sidebar layout). Siljigan hidden-blokni barmoq
 * bilan qaytarib boʻlmaydi → ekran «qotib qoladi» (2026-09-27, telefon).
 * Shuning uchun faqat eng yaqin HAQIQIY scroll konteyneri aylantiriladi.
 */
export function useRevealOnSelect<T extends HTMLElement>(key: unknown): React.RefObject<T | null> {
  const ref = React.useRef<T | null>(null);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!key || !ref.current) return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    const scroller = scrollParent(el);
    const top =
      el.getBoundingClientRect().top -
      (scroller ? scroller.getBoundingClientRect().top : 0) -
      12;
    (scroller ?? window).scrollBy({ top, behavior: reduce ? "auto" : "smooth" });
  }, [key]);

  return ref;
}

/** Eng yaqin foydalanuvchi aylantira oladigan ota (overflow-y: auto|scroll).
    Topilmasa null — unda oyna (window) aylantiriladi. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}
