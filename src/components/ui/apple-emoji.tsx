"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Apple uslubidagi emoji — `emoji-datasource-apple` sprite CDN'idan bitta PNG.
 * Native emoji OS'ga qarab har xil koʻrinadi; bu esa hamma platformada bir xil
 * Apple renderini beradi. `code` — unified kod fayl nomi (mas. "2600-fe0f").
 *
 * MUHIM: bu versiya `package.json`dagi `emoji-datasource-apple` versiyasi
 * bilan MOS boʻlishi shart — src/lib/emoji-apple-data.ts shu paketning
 * `has_img_apple` maydoniga qarab roʻyxat tuzadi; versiyalar mos kelmasa,
 * yangi qoʻshilgan emojilar (mas. baʼzi bayroqlar) roʻyxatda bor-u, lekin
 * shu CDN'da sprite topilmay boʻsh koʻrinadi.
 */
export const EMOJI_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/";

/** Unicode belgidan sprite fayl nomi ("🔥" → "1f525"). `AppleEmojiSprite`
 *  ichidagi bilan bir xil — serializatsiya (Tiptap renderHTML) uchun ajratildi. */
export function emojiToUnified(char: string): string {
  return [...char].map((c) => c.codePointAt(0)!.toString(16)).join("-");
}

export function AppleEmoji({
  code,
  label,
  className,
}: {
  code: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={`${EMOJI_CDN}${code}.png`}
      alt={label}
      draggable={false}
      loading="lazy"
      className={cn("inline-block size-[1.1em] align-[-0.15em] select-none", className)}
      onError={() => setFailed(true)}
    />
  );
}

const toUnified = emojiToUnified;

/* Ayrim emoji (mas. ⭐ 2b50) sprite fayli VS16'siz, boshqalari (mas. ☀️
   2600-fe0f) VS16 bilan nomlangan — matnda yozilgan holat har doim toʻgʻri
   fayl nomiga mos kelmaydi. Shu sabab 404'da qarama-qarshi variant bilan
   bir marta qayta urinib koʻriladi. */
function toggleFe0f(unified: string): string {
  const parts = unified.split("-");
  const idx = parts.indexOf("fe0f");
  if (idx !== -1) return parts.filter((_, i) => i !== idx).join("-");
  return [parts[0], "fe0f", ...parts.slice(1)].join("-");
}

/**
 * Haqiqiy unicode belgidan (mas. "🔥") Apple sprite chizadi. Sprite
 * topilmasa (juda yangi/kam tarqalgan emoji) hujayra boʻsh qoladi —
 * native OS emoji shrifti HECH QACHON fallback sifatida koʻrinmaydi.
 */
export function AppleEmojiSprite({
  emoji,
  className,
}: {
  emoji: string;
  className?: string;
}) {
  const unified = toUnified(emoji);
  /* `retried`/`failed` — FAQAT joriy emoji uchun amal qiladigan holat. `emoji`
     propi oʻzgarganda ular tozalanishi SHART: aks holda eski sprite ekranda
     qolib ketadi va faqat komponent qayta yaratilganda (sahifadan chiqib-kirish)
     yangilanadi — bu klassik "props'dan olingan state eskirib qolishi" xatosi. */
  const [retried, setRetried] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setRetried(false);
    setFailed(false);
  }, [unified]);

  if (failed) return null;
  return (
    <img
      // `key` — emoji almashganda brauzer eski rasmni koʻrsatib turmasin
      key={unified}
      src={`${EMOJI_CDN}${retried ? toggleFe0f(unified) : unified}.png`}
      alt={emoji}
      draggable={false}
      loading="lazy"
      className={cn("inline-block object-contain", className)}
      onError={() => {
        if (retried) { setFailed(true); return; }
        setRetried(true);
      }}
    />
  );
}
