"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* Oʻyin tugmasi — FAQAT `/play` (jonli kviz) sirti uchun.

   Dashboard'dagi `<Button>` bilan ATAYLAB aralashmaydi: u panel tili
   (36px, tekis, tez), bu esa barmoq tili (56px, qirrali, bosiladigan).
   Ikkalasini bitta komponentga siqish har ikkalasini buzardi — qoida
   docs/ost-loyihalar-arxitektura.md, C boʻlim: primitiv fork
   qilinmaydi, domen komponenti erkin yoziladi.

   Shakl `.push-btn` (src/styles/push-button.css) va `--push-*`
   tokenlaridan keladi, shuning uchun projektor sirtida qirra
   avtomatik kattalashadi.

   Rang MAJBURIY emas: berilmasa `primary` ishlatiladi. Javob
   variantlari uchun `surface` ga slot fon klassi beriladi
   (`bg-destructive` va h.k.) — qirra qora shaffof boʻlgani uchun
   har qanday rang bilan toʻgʻri ishlaydi. */

type Props = Omit<React.ComponentProps<"button">, "color"> & {
  /** Fon klassi, mas. `bg-destructive`. Boʻsh boʻlsa — `bg-primary`. */
  surface?: string;
  /** Tanlangan variant bosilganicha turadi (`:active` bilan bir xil holat). */
  pressed?: boolean;
  /** Telefonda toʻliq kenglik; projektorda mazmunga qarab. */
  block?: boolean;
};

export default function PushButton({
  surface,
  pressed,
  block = true,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      data-pressed={pressed ? "true" : undefined}
      aria-pressed={pressed}
      className={cn(
        "push-btn inline-flex min-h-14 items-center justify-center gap-2 px-5 py-3 text-base font-semibold",
        "outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        surface ?? "bg-primary text-primary-foreground",
        !surface && "text-primary-foreground",
        block && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
