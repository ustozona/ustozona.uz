"use client";

import { useEffect, useState } from "react";

/* Yozuvlar maʼlumoti (~50 kB) sidebar orqali har sahifaga tushmasligi
   uchun talabga koʻra yuklanadi — badge baribir mount'gacha 0. */
const loadChangelog = () => import("@/lib/changelog-data");

/* Yangilanishlar "koʻrilmagan" hisoblagichi. localStorage'da oxirgi koʻrilgan
   yozuvning ID'si saqlanadi (sana emas — bir kunlik ikki reliz tirqishi yoʻq;
   son emas — yozuvlar birlashtirilsa hisob buzilmaydi). Son ham yoniga
   yoziladi: ID topilmay qolsa zaxira.
   Gotcha: "storage" eventi yozgan tabning OʻZIDA otilmaydi — sahifa ochilganda
   sidebar badge darhol oʻchishi uchun custom event majburiy. */

const STORAGE_KEY = "ustozona-changelog-seen-count";
const SEEN_ID_KEY = "ustozona-changelog-seen-id";
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
      void loadChangelog().then(({ unseenChangelogCount, CHANGELOG_ENTRIES }) => {
        if (!alive) return;
        const seenId = window.localStorage.getItem(SEEN_ID_KEY);
        const unseen = unseenChangelogCount(seenId, readSeenCount());
        // Faqat son saqlangan eski holat: hammasi koʻrilgan boʻlsa ID'ga
        // koʻchiramiz — aks holda massiv qisqargach keyingi yozuvlar
        // eski son yetguncha «koʻrilgan» boʻlib qolardi.
        if (unseen === 0 && CHANGELOG_ENTRIES[0] && seenId !== CHANGELOG_ENTRIES[0].id) {
          window.localStorage.setItem(SEEN_ID_KEY, CHANGELOG_ENTRIES[0].id);
        }
        setCount(unseen);
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
    if (CHANGELOG_ENTRIES[0]) window.localStorage.setItem(SEEN_ID_KEY, CHANGELOG_ENTRIES[0].id);
    window.dispatchEvent(new Event(SEEN_EVENT));
  });
}
