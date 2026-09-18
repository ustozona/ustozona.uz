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
/** `history.replaceState` Next router'dan oʻtmaydi — `useSearchParams()`
    buni sezmaydi. Boshqa daraxtdagi (masalan header breadcrumb) tinglovchilar
    uchun xom DOM event chiqaramiz. */
const CLASS_ID_PARAM_EVENT = "classid-param-change";

/** `?classId=` yozish — komponent holatidan mustaqil (breadcrumb kabi
    boshqa daraxtdagi yozuvchilar uchun ham ishlatiladi). `useClassIdParam`
    hook'i shu funksiyani chaqiradi, faqat ustiga React holatini qoʻshadi. */
export function setUrlParam(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(CLASS_ID_PARAM_EVENT));
}

export function setClassIdParam(id: string | null) {
  setUrlParam("classId", id);
}

/** Ixtiyoriy query param'ni React holati sifatida oʻqish/yozish —
    `useClassIdParam` bilan bir xil mexanizm (replaceState + umumiy event),
    lekin sinfga bogʻlanmagan. Sahifa ichidagi «ikkinchi daraja» tanlovlar
    (boʻlim, tab, davr) shu orqali URL'da yashaydi va sahifa unmount boʻlib
    qayta ochilganda tiklanadi.

    ⚠️ Mount'da URL bir kadr kechikib oʻqiladi (`useClassIdParam` kabi) —
    dastlabki renderda qiymat `null` boʻladi. Shuning uchun mount'da
    ishlaydigan tozalash effektlari «tanlanmagan» holatni haqiqiy deb
    bilmasligi kerak, aks holda URL'dan endi kelayotgan qiymatni oʻchirib
    yuboradi (darslar sahifasidagi `prevClassIdRef` naqshiga qarang).

    `watchKey` — Next router orqali sahifa almashganda qayta oʻqish uchun
    (masalan `usePathname()` natijasi). Hech qachon qayta mount boʻlmaydigan
    komponentlarga kerak: router navigatsiyasi na `popstate`, na bizning
    umumiy event'imizni chiqaradi. */
export function useUrlParam(
  key: string,
  watchKey?: string
): [string | null, (value: string | null) => void] {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setValue(new URLSearchParams(window.location.search).get(key));
    read();
    window.addEventListener(CLASS_ID_PARAM_EVENT, read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener(CLASS_ID_PARAM_EVENT, read);
      window.removeEventListener("popstate", read);
    };
  }, [key, watchKey]);

  const set = useCallback(
    (next: string | null) => {
      setValue(next);
      setUrlParam(key, next);
    },
    [key]
  );

  return [value, set];
}

export function useClassIdParam(
  { fallbackToStore = false }: { fallbackToStore?: boolean } = {}
): [string | null, (id: string | null) => void] {
  const setStoreClassId = useClassStore((s) => s.setSelectedClassId);
  const storeClassId = useClassStore((s) => s.selectedClassId);

  const [urlId, setUrlId] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setUrlId(new URLSearchParams(window.location.search).get("classId"));
    read();
    // Boshqa daraxtdagi yozuvchi (masalan header breadcrumb switcher) shu
    // sahifa qayta mount boʻlmasdan URL'ni oʻzgartirishi mumkin — shuni ushlab
    // qolamiz, aks holda ikki manba (URL va bu holat) sinxrondan chiqadi.
    window.addEventListener(CLASS_ID_PARAM_EVENT, read);
    return () => window.removeEventListener(CLASS_ID_PARAM_EVENT, read);
  }, []);

  const classId = urlId || (fallbackToStore ? storeClassId : null);

  const setClassId = useCallback(
    (id: string | null) => {
      setUrlId(id);
      setClassIdParam(id);
      if (id) setStoreClassId(id);
    },
    [setStoreClassId]
  );

  return [classId, setClassId];
}

/** Faqat oʻqish uchun — `?classId=` qiymatini boshqa komponent daraxtidan
    (masalan header breadcrumb) jonli kuzatish. `useClassIdParam` bilan bir
    xil sahifada EMAS joylarda ishlatiladi (aks holda ikkita mustaqil holat
    manbai paydo boʻladi). `watchKey` — Next router orqali sahifa almashganda
    ham qayta oʻqilishi uchun (masalan `usePathname()` natijasi) — chunki bu
    komponent layout darajasida doimiy, hech qachon qayta mount boʻlmaydi. */
export function useClassIdParamValue(watchKey?: string): string | null {
  return useUrlParam("classId", watchKey)[0];
}
