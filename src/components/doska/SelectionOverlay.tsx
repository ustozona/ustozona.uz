"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import type { ResizeHandle } from "@/lib/doska/interaction";

/* ════════════════════════════════════════════════════════════════════
   TANLOV QATLAMI — chegara, oʻchirish tugmasi va 4 tutqich.

   ⚠️ Nega ramkaning ICHIDA emas: ramka `z-index` bilan chiziladi va
   shu bilan oʻz stacking-kontekstini yaratadi. Tutqich oʻsha kontekst
   ichida qolsa, ustidan tushgan boshqa vidjet uni BERKITADI —
   oʻqituvchi tanlagan vidjetini oʻlchay olmaydi.

   Shuning uchun tanlov hamma vidjetdan keyin, alohida qatlamda
   chiziladi (R136 jadvalidagi «tanlov» qatori) va u `--z-doska-handles`
   ni oladi — vidjetlardan tepada, panelning ostida.

   Qatlamning oʻzi bosishni OʻTKAZADI (`pointer-events-none`): aks
   holda tanlangan vidjetning tanasini sudrab boʻlmay qolardi. Faqat
   tutqich va oʻchirish tugmasi bosishni ushlaydi.

   Harakat bu yerda ham YOʻQ — tutqichlar dispatcher'ga (R135) faqat
   `data-doska-handle` deb aytadi.
   ════════════════════════════════════════════════════════════════════ */

const HANDLES: { id: ResizeHandle; className: string; cursor: string }[] = [
  { id: "nw", className: "-top-2 -left-2", cursor: "nwse-resize" },
  { id: "ne", className: "-top-2 -right-2", cursor: "nesw-resize" },
  { id: "sw", className: "-bottom-2 -left-2", cursor: "nesw-resize" },
  { id: "se", className: "-bottom-2 -right-2", cursor: "nwse-resize" },
];

export function SelectionOverlay() {
  const screen = useActiveScreen();
  const selectedId = useDoskaStore((s) => s.selectedId);
  const removeWidget = useDoskaStore((s) => s.removeWidget);

  const widget = screen?.widgets.find((w) => w.id === selectedId);
  if (!widget) return null;

  const meta = widgetMeta(widget.kind);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: "var(--z-doska-handles)" }}
    >
      <div
        // Dispatcher tutqichdan vidjetni shu atribut orqali topadi —
        // tutqich endi ramkaning ichida emas.
        data-doska-widget={widget.id}
        className="ring-primary/70 absolute rounded-[var(--radius)] ring-2 ring-offset-2 ring-offset-transparent"
        style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h }}
      >
        <button
          type="button"
          data-doska-no-drag=""
          aria-label={`${meta.label} vidjetini oʻchirish`}
          onClick={() => removeWidget(widget.id)}
          className="bg-background text-muted-foreground hover:text-foreground pointer-events-auto absolute -top-3 -right-3 grid size-7 place-items-center rounded-full border shadow-sm"
        >
          <X className="size-4" />
        </button>

        {HANDLES.map((h) => (
          <span
            key={h.id}
            role="presentation"
            data-doska-handle={h.id}
            style={{ cursor: h.cursor }}
            className={cn(
              "border-primary bg-background pointer-events-auto absolute size-4 touch-none rounded-full border-2",
              h.className,
            )}
          />
        ))}
      </div>
    </div>
  );
}
