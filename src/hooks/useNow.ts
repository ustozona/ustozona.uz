"use client";

import { useEffect, useState } from "react";

/**
 * Joriy vaqt — daqiqa chegarasida yangilanadi («09:59 → 10:00» kechikmaydi).
 *
 * Vaqt QURILMA mintaqasida: oʻqituvchi qayerda boʻlsa, soat va sana oʻsha
 * joyniki (`Intl…resolvedOptions().timeZone`). Kun almashsa (tun yarmi)
 * «bugun» ham oʻzi yangilanadi — bu qiymatga tayangan memo'lar qayta
 * hisoblanadi.
 *
 * Yashirin tabda brauzer taymerlarni sekinlashtiradi — tab qaytganda vaqt
 * darhol yangilanadi, eski daqiqa koʻrinib turmaydi.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const d = new Date();
      const toNextMinute = 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds());
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, toNextMinute + 50);
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      setNow(new Date());
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return now;
}
