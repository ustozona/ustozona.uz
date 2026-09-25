"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { Z_SPOTLIGHT_WIDGET } from "@/lib/doska/layers";
import type { DoskaWidget } from "@/lib/doska/types";

/* ════════════════════════════════════════════════════════════════════
   VIDJET RAMKASI — faqat OʻRIN va OʻLCHAM.

   Ramka hech narsa eshitmaydi: sudrash, oʻlchash va tanlash kanvasdagi
   yagona dispatcher'da (`InteractionLayer`, R135), tanlov chegarasi va
   tutqichlar esa `SelectionOverlay` da. Bu yerda qolgani — vidjetni
   ekranning toʻgʻri nuqtasiga qoʻyish va unga «men shu vidjetman» degan
   atributni yozish.

   Shuning uchun yangi vidjet qoʻshish bu faylga TEGMAYDI.

   «MARKAZGA» (spotlight, docs/doska-ux-tadqiqot.md R311): vidjet ekran
   oʻrtasida, nisbati saqlangan holda kattalashadi, qolgani parda ostida
   (`DoskaCanvas`). Nusxa emas, AYNAN SHU vidjet kattalashadi — aks holda
   taymer ikki joyda sanab, har soniya ikki marta kamayardi. Ichi `cqw`
   bilan oʻlchangani uchun raqam ham u bilan oʻsadi. Saqlangan oʻrni
   (`x/y/w/h`) oʻzgarmaydi — chiqqach vidjet joyiga qaytadi.
   ════════════════════════════════════════════════════════════════════ */

/** Markazdagi vidjet ekranning shuncha qismiga sigʻdiriladi. */
const SPOTLIGHT_W = 0.9;
const SPOTLIGHT_H = 0.8;

function spotlightRect(w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min((vw * SPOTLIGHT_W) / w, (vh * SPOTLIGHT_H) / h);
  const width = w * scale;
  const height = h * scale;
  // Sal yuqoriroq — pastda «Kichraytirish» tugmasi turadi.
  return { left: (vw - width) / 2, top: (vh * 0.94 - height) / 2, width, height };
}
export function WidgetFrame({
  widget,
  children,
}: {
  widget: DoskaWidget;
  children: React.ReactNode;
}) {
  const spotlight = useDoskaStore((s) => s.spotlightId === widget.id);

  return (
    <div
      data-doska-widget={widget.id}
      // `touch-none` — planshetda vidjetni sudraganda sahifa
      // aylanmasligi uchun; `touch-action` sudrash BOSHLANGAN
      // elementdan olinadi, shuning uchun u aynan shu yerda turadi.
      className="absolute touch-none select-none"
      style={
        spotlight
          ? { ...spotlightRect(widget.w, widget.h), zIndex: Z_SPOTLIGHT_WIDGET }
          : { left: widget.x, top: widget.y, width: widget.w, height: widget.h, zIndex: widget.z }
      }
    >
      {/*
        `@container` — vidjetlar oʻz kengligiga qarab matn oʻlchamini
        tanlaydi (`cqw`). Sinf ekranida bitta taymer yarim ekranni
        egallashi ham, kichkina burchakda turishi ham mumkin.
      */}
      <div
        className={cn(
          "@container size-full rounded-[var(--radius)]",
          // Qulflangan va markazdagi vidjet sudralmaydi — kursor ham shuni aytsin.
          spotlight || widget.locked ? "cursor-default" : "cursor-move",
        )}
      >
        {children}
      </div>
    </div>
  );
}
