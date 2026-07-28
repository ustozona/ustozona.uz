"use client";

import { useMemo } from "react";
import { sanitizeQuoteHtml } from "@/lib/quote-html";
import type { Quote } from "@/lib/quotes";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   IQTIBOS MATNI — formatlangan (html) yoki formatsiz (text) variantni
   bitta joyda render qiladi. HTML har doim sanitizatsiya qilinadi.

   `<mark>` uchun rang bu yerda beriladi (muharrirda atributlar
   saqlanmaydi) — shu sabab highlight ilova mavzusiga mos boʻlib qoladi.
   ════════════════════════════════════════════════════════════════════ */

const MARK_CLASS =
  "[&_mark]:rounded-[3px] [&_mark]:bg-warning/25 [&_mark]:px-0.5 [&_mark]:text-inherit";

export function QuoteText({ quote, className }: { quote: Quote; className?: string }) {
  const html = useMemo(
    () => (quote.html ? sanitizeQuoteHtml(quote.html) : null),
    [quote.html]
  );

  if (html) {
    return (
      <span
        className={cn(MARK_CLASS, className)}
        // Sanitizatsiya yuqorida — allowlist: b/strong/i/em/u/s/mark/br.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span className={className}>{quote.text}</span>;
}
