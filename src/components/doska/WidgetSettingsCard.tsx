"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import type { DoskaWidget } from "@/lib/doska/types";
import { barIconButtonClass } from "./BarGroup";
import { IconClose } from "./icons";
import { clamp, usePinnedPosition } from "./usePinnedPosition";
import { WIDGET_SETTINGS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   SOZLAMA KARTASI — vidjet YONIDA (docs/doska-ux-tadqiqot.md Q2).

   Hamma vidjetning sozlamasi SHU yerda ochiladi: kontekst paneldagi
   «Sozlash» yoki `S` tugmasi. Vidjet faqat ichki mazmunni beradi
   (`WIDGET_SETTINGS`), idish, sarlavha, yopish va joylashuv — umumiy.

   Nega yonida (aylanadigan orqa tomon yoki pastki varaq emas):
     • koʻz va qoʻl allaqachon vidjet oldida — 75″ doskada pastki varaq
       vidjetdan bir metrgacha uzoqda boʻlardi;
     • vidjet ochiq qoladi — oʻzgarish darhol koʻrinadi;
     • karta oʻlchami vidjetga bogʻliq emas — kichik taymerda ham sigʻadi.

   JOYLASHUV QOIDALARI:
     1. Ikkala yonda joy bor: sensorli ekranda CHAPGA (oʻng qoʻl oʻng-pastni
        yopadi, R328), sichqonchada — joy koʻproq tomonga.
     2. Faqat bir yonda joy bor — oʻsha tomonga.
     3. Hech qayerda sigʻmaydi — joy koʻproq tomonga, ekranga qisilib.
     4. Tepasi vidjet tepasi bilan bir chiziqda; vidjetdan YUQORIGA faqat
        pastda joy qolmaganda chiqadi (vidjet qoʻl yetgan joyda, R319).
     5. Kontekst panelni YOPMAYDI: vidjet ekran tepasiga yaqin boʻlsa panel
        vidjet ostiga tushadi va vidjetdan keng boʻlgani uchun karta
        tomonga chiqadi — unda karta panel ostiga (kerak boʻlsa yoniga)
        suriladi. Aks holda karta panelning «Oʻchirish» tugmasini yopardi.
     6. Ekran 640 px dan tor (telefon) — pastki varaq, mazmun oʻsha.

   Oʻzgarish darhol qoʻllanadi, «Saqlash» yoʻq. Boʻsh kanvas yoki boshqa
   vidjet bosilsa karta yopiladi (store: `select`).
   ════════════════════════════════════════════════════════════════════ */

/** Vidjet bilan karta orasidagi masofa (piksel). */
const GAP = 14;
/** Ekran chetidan masofa (piksel). */
const EDGE = 8;
/** Shundan tor ekranda karta pastki varaqqa aylanadi (piksel). */
const SHEET_BELOW = 640;

/** Ikki toʻrtburchak kesishadimi. */
function overlaps(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

export function WidgetSettingsCard({ widget }: { widget: DoskaWidget }) {
  const Settings = WIDGET_SETTINGS[widget.kind];
  const close = useDoskaStore((s) => s.closeSettings);
  const t = useTranslations("Doska.settings");
  const tWidget = useTranslations("Doska.widgets");
  const title = t("title", { widget: tWidget(widgetMeta(widget.kind).labelKey) });

  /**
   * Joy DOMʼda hisoblanadi: karta balandligi mazmunga bogʻliq va render
   * paytida nomaʼlum. `usePinnedPosition` uni vidjet koʻchganda, karta
   * oʻlchami yoki oyna oʻzgarganda qayta hisoblaydi — har renderda emas.
   */
  const ref = React.useRef<HTMLDivElement>(null);
  usePinnedPosition(ref, `${widget.x},${widget.y},${widget.w},${widget.h}`, (el) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < SHEET_BELOW) {
      el.dataset.sheet = "";
      el.style.width = `${vw}px`;
      el.style.left = "0px";
      el.style.top = `${vh - el.offsetHeight}px`;
      return;
    }
    delete el.dataset.sheet;
    el.style.width = "";

    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    const spaceLeft = widget.x - GAP - EDGE;
    const spaceRight = vw - (widget.x + widget.w) - GAP - EDGE;
    const fitsLeft = spaceLeft >= cw;
    const fitsRight = spaceRight >= cw;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const right =
      fitsLeft && fitsRight
        ? !coarse && spaceRight > spaceLeft
        : fitsRight || (!fitsLeft && spaceRight > spaceLeft);

    let left = clamp(right ? widget.x + widget.w + GAP : widget.x - GAP - cw, EDGE, vw - cw - EDGE);
    let top = clamp(widget.y, EDGE, vh - ch - EDGE);

    // Kontekst panelni chetlab oʻtish (5-qoida). Panel shu tanlov bilan
    // bir vaqtda chiziladi va uning joyi karta hisoblanishidan OLDIN
    // qoʻyilgan (u DOM'da oldinroq).
    const bar = document.querySelector<HTMLElement>("[data-doska-toolbar]")?.getBoundingClientRect();
    const box = () => ({ left, top, right: left + cw, bottom: top + ch });
    if (bar && overlaps(box(), bar)) {
      top = clamp(bar.bottom + GAP, EDGE, vh - ch - EDGE);
      if (overlaps(box(), bar)) {
        // Pastda joy yetmadi — yon tomonga, panel chetidan nariga.
        left = clamp(right ? bar.right + GAP : bar.left - GAP - cw, EDGE, vw - cw - EDGE);
      }
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });

  if (!Settings) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        close();
      }}
      className={cn(
        "doska-bar bg-popover text-popover-foreground pointer-events-auto absolute flex max-h-[calc(100vh-1rem)] w-80 flex-col overflow-y-auto overscroll-contain rounded-[var(--radius)] border shadow-lg",
        "data-[sheet]:max-h-[60vh] data-[sheet]:rounded-b-none",
      )}
      style={{ left: 0, top: 0, zIndex: "var(--z-doska-context)" }}
    >
      <div className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-4">
        <h2 className="text-sm font-medium">{title}</h2>
        <button
          type="button"
          aria-label={t("close")}
          onClick={close}
          className={cn(barIconButtonClass, "size-11 rounded-md")}
        >
          <IconClose className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 text-sm">
        <Settings widget={widget} />
      </div>

      <p className="text-muted-foreground border-t px-4 py-2 text-xs">{t("instant")}</p>
    </div>
  );
}
