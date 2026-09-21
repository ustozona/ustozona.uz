"use client";

import { useEffect, useState } from "react";

/* Yozuvlar maʼlumoti (~50 kB) sidebar orqali har sahifaga tushmasligi
   uchun talabga koʻra yuklanadi — badge baribir mount'gacha 0. */
const loadChangelog = () => import("@/lib/changelog-data");

/* Yangilanishlar "koʻrilmagan" hisoblagichi. localStorage'da oxirgi koʻrilgan
   yozuvlar SONI saqlanadi (sana emas — bir kunlik ikki reliz tirqishi yoʻq).
   Gotcha: "storage" eventi yozgan tabning OʻZIDA otilmaydi — sahifa ochilganda
   sidebar badge darhol oʻchishi uchun custom event majburiy. */

const STORAGE_KEY = "ustozona-changelog-seen-count";
const SEEN_EVENT = "ustozona:changelog-seen";

function readSeenCount(): number | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Koʻrilmagan yozuvlar soni. Mount boʻlmaguncha 0 (hydration mismatch
    oldini oladi — useTaskCount'dagi `hydrated ? count : 0` bilan bir xil UX). */
export function useChangelogUnseenCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const read = () => {
      void loadChangelog().then(({ unseenChangelogCount }) => {
        if (alive) setCount(unseenChangelogCount(readSeenCount()));
      });
    };
    read();
    window.addEventListener(SEEN_EVENT, read); // shu tab (sahifa → sidebar)
    window.addEventListener("storage", read); // boshqa tablar
    return () => {
      alive = false;
      window.removeEventListener(SEEN_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return count;
}

/** Sahifa ochilganda chaqiriladi — hamma yozuv koʻrildi deb belgilanadi. */
export function markChangelogSeen() {
  void loadChangelog().then(({ CHANGELOG_ENTRIES }) => {
    window.localStorage.setItem(STORAGE_KEY, String(CHANGELOG_ENTRIES.length));
    window.dispatchEvent(new Event(SEEN_EVENT));
  });
}
