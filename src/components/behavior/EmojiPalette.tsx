"use client";

import { cn } from "@/lib/utils";
import { EMOJI_PALETTE } from "@/lib/behavior-visual";
import { BehaviorEmoji } from "./BehaviorEmoji";

/* Koʻnikma/mukofot formalarida emoji tanlash palitrasi — kuratsiya
   qilingan unified kodlar (roʻyxat: src/lib/behavior-visual.ts).
   Erkin emoji kiritish YOʻQ: palitra yopiq boʻlgani uchun har kodda
   Fluent 3D asseti bor — "Ikonka uslubi" sozlamasi buzilmaydi. */

export function EmojiPalette({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  // Palitradan tashqari kod (eski/import qilingan) tanlangan boʻlsa —
  // roʻyxat boshida koʻrsatiladi, tanlov yoʻqolib qolmasin.
  const codes = EMOJI_PALETTE.includes(value)
    ? EMOJI_PALETTE
    : [value, ...EMOJI_PALETTE];

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
      {codes.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={value === code}
          className={cn(
            "flex aspect-square items-center justify-center rounded-lg border border-transparent",
            "cursor-pointer transition-colors hover:bg-muted",
            value === code && "border-primary bg-primary/10"
          )}
        >
          <BehaviorEmoji code={code} className="size-6" />
        </button>
      ))}
    </div>
  );
}
