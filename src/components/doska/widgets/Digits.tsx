import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * RAQAMLAR — taymer va soat vaqti, uslub shriftida (`.doska-digits`).
 *
 * Nega har raqam alohida: uslub shriftlari (Onest, Nunito, Rubik)
 * proporsional — «1» «0» dan tor. Butun satr bitta matn boʻlsa vaqt har
 * soniya chapga-oʻngga chayqalardi, bu esa sinf ekranida koʻzni tortadi.
 * Har raqam `1ch` (shriftning «0» kengligi) qutida markazlanadi — qaysi
 * uslub boʻlmasin, satr kengligi oʻzgarmaydi. `tabular-nums` ham qoʻyilgan,
 * lekin har shriftda ham bu imkoniyat yoʻq — quti kafolat beradi.
 *
 * Ekran oʻquvchisi satrni bir butun oʻqisin: boʻlaklar `aria-hidden`,
 * toʻliq matn — `sr-only`.
 */
export function Digits({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={cn("doska-digits", className)} style={style}>
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) =>
          ch >= "0" && ch <= "9" ? (
            <span key={i} data-digit="">
              {ch}
            </span>
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
