"use client";

import { useState } from "react";
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
const EMOJI_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/";

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

function toUnified(char: string): string {
  return [...char].map((c) => c.codePointAt(0)!.toString(16)).join("-");
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
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={`${EMOJI_CDN}${toUnified(emoji)}.png`}
      alt={emoji}
      draggable={false}
      loading="lazy"
      className={cn("inline-block object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
