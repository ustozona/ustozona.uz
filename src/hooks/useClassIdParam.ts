"use client";

import { useCallback, useEffect, useState } from "react";
import { useClassStore } from "@/store/useClassStore";

/* ════════════════════════════════════════════════════════════════════
   SINF TANLOVI — `?classId=` URL param (deep-linkable + refresh-safe)

   Ilgari sinf tanlovi faqat `useClassStore.selectedClassId`da edi —
   refresh'da yoʻqolar, ulashib boʻlmasdi. Endi YAGONA HAQIQAT — URL query
   param'i `?classId=<id>`. Tanlangan sinf server-persisted default sifatida
   store'ga ham yoziladi (boshqa sahifalar oʻsha default'dan boshlanishi uchun).

   URL bilan ishlashda ataylab `useSearchParams`/`router.replace` EMAS, balki
   `window.location` + `history.replaceState` ishlatiladi (settings sahifasi
   naqshi): Suspense chegarasi talab qilmaydi va router.replace'ning remount
   gotcha'sidan xoli (feedback sahifasida qayd etilgan). URL mount'da oʻqiladi
   — dastlabki renderdan keyin bir kadr «tanlanmagan» chaqnashi mumkin (boshqa
   store'lardagi mount-gate kabi), bu maqbul.

   fallbackToStore:
     false (default) — URL boʻsh boʻlsa `null` (hech narsa tanlanmagan;
       grades/students/lessons/standards 50/50 boʻsh holatidan boshlanadi).
     true — URL boʻsh boʻlsa store default'iga qaytadi (attendance kabi doim
       bitta sinf ochiq turishi kerak boʻlgan sahifalar uchun).
   ════════════════════════════════════════════════════════════════════ */
export function useClassIdParam(
  { fallbackToStore = false }: { fallbackToStore?: boolean } = {}
): [string | null, (id: string | null) => void] {
  const setStoreClassId = useClassStore((s) => s.setSelectedClassId);
  const storeClassId = useClassStore((s) => s.selectedClassId);

  const [urlId, setUrlId] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("classId");
    if (p) setUrlId(p);
  }, []);

  const classId = urlId || (fallbackToStore ? storeClassId : null);

  const setClassId = useCallback(
    (id: string | null) => {
      setUrlId(id);
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("classId", id);
      else url.searchParams.delete("classId");
      window.history.replaceState(null, "", url);
      if (id) setStoreClassId(id);
    },
    [setStoreClassId]
  );

  return [classId, setClassId];
}
