"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   VIDJET ICHIDAGI TUGMA — taymer, gʻildirak va keyingi vidjetlar uchun
   BITTA komponent.

   Nega `<Button>` primitivi emas: vidjet ichida oʻlcham konteyner
   kengligiga bogʻlangan (`cqw`), rang esa kartaning oʻz rangidan
   (`currentColor`) keladi. Primitiv bu kontekstni bilmaydi. Lekin har
   vidjet oʻz tugmasini yozsa, ular asta farqlanib ketadi — shuning uchun
   ular shu yerda bitta.

   `data-doska-no-drag` shu yerda, chaqiruvda emas: vidjet tugmasini
   bosish hech qachon sudrash boʻlmasligi kerak. (`stopPropagation` bu
   ish uchun yaramaydi — sabab `lib/doska/interaction.ts` dagi
   `ATTR_NO_DRAG` izohida.)
   ════════════════════════════════════════════════════════════════════ */

export function WidgetButton({
  shape = "pill",
  tone = "neutral",
  label,
  className,
  style,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "type"> & {
  /** `round` — faqat ikona; `pill` — ikona va/yoki matn. */
  shape?: "pill" | "round";
  /**
   * `primary` — asosiy amal, brend rangida: Doskada u harakat va faol
   * holat uchun ajratilgan (docs/doska-dizayn-tizimi.md §3).
   */
  tone?: "neutral" | "primary";
  /** Ekran oʻquvchi uchun nom — ikonali tugmada majburiy. */
  label?: string;
}) {
  return (
    <button
      type="button"
      data-doska-no-drag=""
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center gap-1 rounded-full leading-none font-medium transition-opacity hover:opacity-80 disabled:opacity-40",
        tone === "primary" ? "bg-primary text-primary-foreground" : "bg-current/15",
        shape === "round"
          ? "size-[clamp(2rem,9cqw,2.75rem)] [&_svg]:size-[55%]"
          : "px-[4cqw] py-[2.5cqw]",
        className,
      )}
      style={{ gridAutoFlow: "column", ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
