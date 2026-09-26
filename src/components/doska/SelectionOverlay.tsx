"use client";

import { cn } from "@/lib/utils";
import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import type { ResizeHandle } from "@/lib/doska/interaction";
import { IconLock } from "./icons";
import { WidgetSettingsCard } from "./WidgetSettingsCard";
import { WidgetToolbar } from "./WidgetToolbar";
import { WIDGET_SETTINGS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   TANLOV QATLAMI — chegara, 4 tutqich va kontekst paneli.

   ⚠️ Nega ramkaning ICHIDA emas: ramka `z-index` bilan chiziladi va
   shu bilan oʻz stacking-kontekstini yaratadi. Tutqich oʻsha kontekst
   ichida qolsa, ustidan tushgan boshqa vidjet uni BERKITADI —
   oʻqituvchi tanlagan vidjetini oʻlchay olmaydi.

   Shuning uchun tanlov hamma vidjetdan keyin, alohida qatlamda
   chiziladi (R136 jadvalidagi «tanlov» qatori) va u `--z-doska-handles`
   ni oladi — vidjetlardan tepada, panelning ostida.

   Qatlamning oʻzi bosishni OʻTKAZADI (`pointer-events-none`): aks
   holda tanlangan vidjetning tanasini sudrab boʻlmay qolardi. Faqat
   tutqich va kontekst paneli bosishni ushlaydi.

   Qulflangan vidjetda tutqichlar YOʻQ (u oʻlchanmaydi) — oʻrnida
   qulf belgisi turadi, shunda oʻqituvchi nega choʻzilmayotganini
   koʻradi. Sozlama kartasi ham shu yerdan chiziladi — u tanlovga
   bogʻlangan (store: `settingsId`).

   «Markazga» rejimida tanlov qatlami umuman chizilmaydi — sinf faqat
   vidjetni koʻradi.

   Amallar (sozlash, nusxa, qulf, oʻchirish) shu yerda emas —
   `WidgetToolbar` da, vidjetning ustida. Sabab: burchakdagi yakka
   tugma faqat bitta amalga joy beradi, ikkinchisi qoʻshilganda esa
   burchaklar tutqichlar bilan urishib ketadi.

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
  const settingsOpen = useDoskaStore((s) => s.settingsId !== null && s.settingsId === s.selectedId);
  const spotlight = useDoskaStore((s) => s.spotlightId !== null);

  const widget = screen?.widgets.find((w) => w.id === selectedId);
  if (!widget || spotlight) return null;
  const locked = widget.locked === true;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: "var(--z-doska-handles)" }}
      >
        <div
          // Dispatcher tutqichdan vidjetni shu atribut orqali topadi —
          // tutqich endi ramkaning ichida emas.
          data-doska-widget={widget.id}
          // Chegara koʻrinishi uslubdan (`.doska-selection`): Sokinda
          // yaxlit, Oʻyinchoq va Doskada uzuq chiziq.
          className="doska-selection absolute"
          style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h }}
        >
          {locked && (
            <span
              className="bg-primary text-primary-foreground absolute -top-3 -right-3 grid size-7 place-items-center rounded-full shadow-md"
              aria-hidden="true"
            >
              <IconLock className="size-4" />
            </span>
          )}

          {!locked && HANDLES.map((h) => (
            <span
              key={h.id}
              role="presentation"
              data-doska-handle={h.id}
              style={{ cursor: h.cursor }}
              // Koʻrinishi 16px, bosish maydoni esa 44px (`before:`):
              // 16px planshetda ≈ 4,4 mm, 4K panelda ≈ 8 mm — barmoq
              // uchun 10 mm dan kam (docs/doska-ux-tadqiqot.md R321).
              // Psevdo-element tutqichning oʻzi hisoblanadi, shuning
              // uchun dispatcher `data-doska-handle` ni topaveradi.
              className={cn(
                "doska-handle pointer-events-auto absolute size-4 touch-none",
                "before:absolute before:-inset-3.5 before:rounded-full before:content-['']",
                h.className,
              )}
            />
          ))}
        </div>
      </div>

      {/* ⚠️ Tutqich qatlamining ICHIDA emas, YONIDA. Tutqich qatlami
          `z-index` bilan oʻz stacking-kontekstini yaratadi; panel oʻsha
          ichida qolsa `--z-doska-context` (1000105) global tartibda
          hisobga olinmaydi va pastdagi vidjetning paneli vidjet
          panelining (1000100) ostida qolib ketardi. */}
      <WidgetToolbar widget={widget} />

      {settingsOpen && WIDGET_SETTINGS[widget.kind] && <WidgetSettingsCard widget={widget} />}
    </>
  );
}
