"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import type { DoskaWidget } from "@/lib/doska/types";

/* ════════════════════════════════════════════════════════════════════
   VIDJET RAMKASI — koʻchirish, oʻlchash, tanlash.

   Vidjetning oʻzi "soqov": faqat chizadi, sichqonchani bilmaydi.
   Butun harakat shu ramkada (R135 naqshi). Hozircha har ramka oʻz
   pointer listenerini qoʻyadi; vidjetlar soni oshganda bu bitta
   global dispatcher'ga (`InteractionLayer`) koʻchiriladi — oʻshanda
   vidjet komponentlari umuman oʻzgarmaydi.
   ════════════════════════════════════════════════════════════════════ */

type Handle = "nw" | "ne" | "sw" | "se";

const HANDLES: { id: Handle; className: string; cursor: string }[] = [
  { id: "nw", className: "-left-2 -top-2", cursor: "nwse-resize" },
  { id: "ne", className: "-right-2 -top-2", cursor: "nesw-resize" },
  { id: "sw", className: "-bottom-2 -left-2", cursor: "nesw-resize" },
  { id: "se", className: "-bottom-2 -right-2", cursor: "nwse-resize" },
];

export function WidgetFrame({
  widget,
  children,
}: {
  widget: DoskaWidget;
  children: React.ReactNode;
}) {
  const selected = useDoskaStore((s) => s.selectedId === widget.id);
  const select = useDoskaStore((s) => s.select);
  const moveWidget = useDoskaStore((s) => s.moveWidget);
  const resizeWidget = useDoskaStore((s) => s.resizeWidget);
  const removeWidget = useDoskaStore((s) => s.removeWidget);
  const bringToFront = useDoskaStore((s) => s.bringToFront);

  const meta = widgetMeta(widget.kind);

  /**
   * Sudrash paytidagi oʻzgaruvchan qiymatlar. `useRef` — chunki har
   * pointermove'da render qilish shart emas; oxirgi holat store'ga
   * yoziladi va u renderni boshqaradi.
   */
  const drag = React.useRef<{
    mode: "move" | Handle;
    startX: number;
    startY: number;
    origin: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const onPointerDownMove = (e: React.PointerEvent) => {
    // Faqat asosiy tugma; oʻng tugma kontekst menyusiga tegmaymiz.
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    select(widget.id);
    bringToFront(widget.id);
    drag.current = {
      mode: "move",
      startX: e.clientX,
      startY: e.clientY,
      origin: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
    };
  };

  const onPointerDownResize = (e: React.PointerEvent, handle: Handle) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    select(widget.id);
    drag.current = {
      mode: handle,
      startX: e.clientX,
      startY: e.clientY,
      origin: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.mode === "move") {
      moveWidget(widget.id, Math.max(0, d.origin.x + dx), Math.max(0, d.origin.y + dy));
      return;
    }

    // Burchakdan tortilganda qarama-qarshi burchak qimirlamasligi kerak:
    // shuning uchun gʻarbiy/shimoliy tutqichlarda x/y ham suriladi.
    const west = d.mode === "nw" || d.mode === "sw";
    const north = d.mode === "nw" || d.mode === "ne";

    let w = west ? d.origin.w - dx : d.origin.w + dx;
    let h = north ? d.origin.h - dy : d.origin.h + dy;

    w = Math.max(meta.minSize.w, w);
    h = Math.max(meta.minSize.h, h);

    // Minimumga urilganda surilish ham toʻxtasin — aks holda vidjet
    // oʻlchami oʻzgarmay turib joyidan siljib ketadi.
    const x = west ? d.origin.x + (d.origin.w - w) : d.origin.x;
    const y = north ? d.origin.y + (d.origin.h - h) : d.origin.y;

    resizeWidget(widget.id, w, h, Math.max(0, x), Math.max(0, y));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  };

  return (
    <div
      className="absolute touch-none select-none"
      style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h, zIndex: widget.z }}
      onPointerDown={onPointerDownMove}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className={cn(
          // `@container` — vidjetlar oʻz kengligiga qarab matn oʻlchamini
          // tanlaydi (`cqw`). Sinf ekranida bitta taymer yarim ekranni
          // egallashi ham, kichkina burchakda turishi ham mumkin.
          "@container size-full cursor-move rounded-[var(--radius)] transition-shadow",
          selected && "ring-primary/70 ring-2 ring-offset-2 ring-offset-transparent",
        )}
      >
        {children}
      </div>

      {selected && (
        <>
          <button
            type="button"
            aria-label={`${meta.label} vidjetini oʻchirish`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => removeWidget(widget.id)}
            className="bg-background text-muted-foreground hover:text-foreground absolute -top-3 -right-3 grid size-7 place-items-center rounded-full border shadow-sm"
          >
            <X className="size-4" />
          </button>

          {HANDLES.map((h) => (
            <span
              key={h.id}
              role="presentation"
              onPointerDown={(e) => onPointerDownResize(e, h.id)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ cursor: h.cursor }}
              className={cn(
                "border-primary bg-background absolute size-4 rounded-full border-2",
                h.className,
              )}
            />
          ))}
        </>
      )}
    </div>
  );
}
