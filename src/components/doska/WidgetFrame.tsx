"use client";

import * as React from "react";

import type { DoskaWidget } from "@/lib/doska/types";

/* ════════════════════════════════════════════════════════════════════
   VIDJET RAMKASI — faqat OʻRIN va OʻLCHAM.

   Ramka hech narsa eshitmaydi: sudrash, oʻlchash va tanlash kanvasdagi
   yagona dispatcher'da (`InteractionLayer`, R135), tanlov chegarasi va
   tutqichlar esa `SelectionOverlay` da. Bu yerda qolgani — vidjetni
   ekranning toʻgʻri nuqtasiga qoʻyish va unga «men shu vidjetman» degan
   atributni yozish.

   Shuning uchun yangi vidjet qoʻshish bu faylga TEGMAYDI.
   ════════════════════════════════════════════════════════════════════ */
export function WidgetFrame({
  widget,
  children,
}: {
  widget: DoskaWidget;
  children: React.ReactNode;
}) {
  return (
    <div
      data-doska-widget={widget.id}
      // `touch-none` — planshetda vidjetni sudraganda sahifa
      // aylanmasligi uchun; `touch-action` sudrash BOSHLANGAN
      // elementdan olinadi, shuning uchun u aynan shu yerda turadi.
      className="absolute touch-none select-none"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        zIndex: widget.z,
      }}
    >
      {/*
        `@container` — vidjetlar oʻz kengligiga qarab matn oʻlchamini
        tanlaydi (`cqw`). Sinf ekranida bitta taymer yarim ekranni
        egallashi ham, kichkina burchakda turishi ham mumkin.
      */}
      <div className="@container size-full cursor-move rounded-[var(--radius)]">
        {children}
      </div>
    </div>
  );
}
