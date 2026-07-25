"use client";

import { useEffect, useState } from "react";

/* A4 (96dpi, 210×297mm) — @page va .a4-sheet bilan bir xil oʻlchamlar
   (globals.css). 16mm — chop marginiga teng, shu bilan ekranda koʻrgan
   sahifa chegarasi chop etilgandagi bilan piksel-aniq mos keladi. */
const A4_HEIGHT_PX = 1123;
const A4_MARGIN_PX = 16 * (96 / 25.4); // 16mm @ 96dpi ≈ 60.47px
export const PAGE_CONTENT_HEIGHT = A4_HEIGHT_PX - A4_MARGIN_PX * 2; // ≈ 1002px

/**
 * "Chegara koʻrsatkichi" — haqiqiy sahifalash EMAS (Tiptap buni pullik
 * "Pages" kengaytmasida sotadi, jadval/formula/callout bilan mos ishlash
 * uchun katta ish talab qiladi). Tahrir maydoni uzluksiz qoladi, faqat
 * chop etilganda qayerda yangi varaq boshlanishini chiziqcha + yorliq bilan
 * koʻrsatadi. `measureEl` — balandligi kuzatiladigan konteyner (a4-sheet).
 */
export function PageBreakMarkers({
  measureEl,
  label,
}: {
  measureEl: HTMLElement | null;
  label: (page: number) => string;
}) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!measureEl) return;
    const update = () => setPageCount(Math.max(1, Math.ceil(measureEl.scrollHeight / PAGE_CONTENT_HEIGHT)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(measureEl);
    return () => ro.disconnect();
  }, [measureEl]);

  if (pageCount <= 1) return null;

  return (
    <div className="no-print pointer-events-none absolute inset-x-0 top-0" aria-hidden>
      {Array.from({ length: pageCount - 1 }, (_, i) => i + 1).map((n) => (
        <div key={n} className="absolute inset-x-0 border-t border-dashed border-border/70" style={{ top: n * PAGE_CONTENT_HEIGHT }}>
          <span className="absolute right-0 top-1 -translate-y-full rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
            {label(n + 1)}
          </span>
        </div>
      ))}
    </div>
  );
}
