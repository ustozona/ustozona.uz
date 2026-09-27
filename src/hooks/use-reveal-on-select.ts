import * as React from "react";

/**
 * Tor ekranda (lg dan kichik) ustunlar ustma-ust tiziladi: roʻyxatda
 * biror narsa tanlansa, uning tafsiloti pastda chiqadi va foydalanuvchi
 * buni sezmaydi («bosdim — hech narsa boʻlmadi»). Bu hook tanlov
 * OʻZGARGANDA tafsilot ustunini koʻrinishga silliq olib keladi.
 *
 * Birinchi render (URL'dan tiklangan tanlov) va desktop tegilmaydi.
 * `prefers-reduced-motion` da sakrab oʻtadi.
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
    ref.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [key]);

  return ref;
}
