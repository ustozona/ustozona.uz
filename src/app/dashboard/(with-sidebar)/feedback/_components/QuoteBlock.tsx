"use client";

import { cn } from "@/lib/utils";
import type { ReplyQuote } from "@/store/useFeedbackStore";

/** Iqtibos matni uchun qisqartma (quote excerpt). */
export function excerptOf(text: string, max = 120) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Xabar ustidagi quote (belgilangan xabar koʻrsatkichi). */
export function QuoteBlock({
  quote, className, onJump,
}: {
  quote: ReplyQuote;
  className?: string;
  onJump?: (targetId?: string) => void;
}) {
  const inner = (
    <>
      <p className="text-[11px] font-semibold text-primary/90">{quote.author}</p>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{quote.excerpt}</p>
    </>
  );

  if (quote.targetId && onJump) {
    return (
      <button
        type="button"
        onClick={() => onJump(quote.targetId)}
        title="Belgilangan xabarga oʻtish"
        className={cn(
          "block w-full rounded-r-md border-l-2 border-primary/45 pl-2 text-left transition-colors hover:border-primary hover:bg-primary/5",
          className
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={cn("border-l-2 border-primary/45 pl-2", className)}>
      {inner}
    </div>
  );
}
