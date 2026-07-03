"use client";

import { useEffect, useState } from "react";

/**
 * Klient mount boʻlganini bildiruvchi gate.
 *
 * Persist (localStorage) Zustand storeʼlardan oʻqiydigan komponentlar uchun:
 * SSR va ilk klient renderi seed bilan mos kelishi, soʻng (mount'dan keyin)
 * tiklangan maʼlumotga oʻtishi uchun ishlatiladi — gidratsiya nomuvofiqligini
 * oldini oladi. `false` qaytguncha placeholder koʻrsating.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
