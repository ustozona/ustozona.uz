"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import { iconTintStyle } from "@/lib/doska/tint";
import type { DoskaWidget } from "@/lib/doska/types";
import { Z_SETTINGS } from "@/lib/doska/layers";
import { IconClose } from "./icons";
import { WIDGET_ICONS, WIDGET_SETTINGS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   SOZLAMA OYNASI — oʻngdan, butun balandlikda
   (docs/doska-referens-koriklari.md §4 — referens koʻrinishi).

   Hamma vidjetning sozlamasi SHU yerda ochiladi: kontekst paneldagi
   «Sozlash» yoki `S` tugmasi. Vidjet faqat ichki mazmunni beradi
   (`WIDGET_SETTINGS`); idish, sarlavha, yopish va joylashuv — umumiy.

   Tuzilma:
     ┌──────────────────────────────┐
     │ ikona     Taymer          ✕  │  ← kulrang sarlavha qismi
     ├──────────────────────────────┤
     │ boʻlimlar (SettingsFields)   │  ← oʻzi aylanadi
     ├──────────────────────────────┤
     │ Oʻzgarish darhol qoʻllanadi  │
     └──────────────────────────────┘

   ⚠️ Ilgari karta vidjet YONIDA ochilardi (docs/doska-ux-tadqiqot.md Q2:
   75″ doskada koʻz va qoʻl vidjet oldida). Foydalanuvchi referens
   joylashuvini tanladi (2026-10-02). Oyna har doim bir joyda — oʻqituvchi
   uni qidirmaydi; vidjet oyna ostida qolsa, uni chetga surish mumkin.

   Ekran 640 px dan tor (telefon) — pastki varaq, mazmun oʻsha.

   Oʻzgarish darhol qoʻllanadi, «Saqlash» yoʻq. Boʻsh kanvas yoki boshqa
   vidjet bosilsa oyna yopiladi (store: `select`).
   ════════════════════════════════════════════════════════════════════ */

export function WidgetSettingsCard({ widget }: { widget: DoskaWidget }) {
  const Settings = WIDGET_SETTINGS[widget.kind];
  const close = useDoskaStore((s) => s.closeSettings);
  const t = useTranslations("Doska.settings");
  const tWidget = useTranslations("Doska.widgets");
  const meta = widgetMeta(widget.kind);
  const name = tWidget(meta.labelKey);
  const Icon = WIDGET_ICONS[widget.kind];

  if (!Settings) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title", { widget: name })}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        close();
      }}
      data-drawer=""
      className={cn(
        // Idish (fon, chegara, soya) — uslubdan: `.doska-sheet[data-drawer]`.
        "doska-bar doska-sheet pointer-events-auto absolute flex flex-col",
        "inset-y-0 right-0 w-md max-w-full",
        "max-sm:inset-x-0 max-sm:top-auto max-sm:max-h-[60vh] max-sm:w-full",
      )}
      style={{ zIndex: Z_SETTINGS }}
    >
      <div className="bg-muted grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-4 py-4">
        <span
          className="grid size-10 place-items-center"
          data-icon-tinted=""
          style={iconTintStyle(meta.tint)}
          aria-hidden="true"
        >
          {Icon && <Icon className="size-8" />}
        </span>
        <h2 className="heading-page truncate text-center">{name}</h2>
        <button
          type="button"
          aria-label={t("close")}
          onClick={close}
          className={cn(
            "bg-background text-muted-foreground hover:text-foreground grid size-10 place-items-center rounded-full border transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          )}
        >
          <IconClose className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-6 text-sm">
        <Settings widget={widget} />
      </div>

      <p className="text-muted-foreground shrink-0 border-t px-6 py-3 text-center text-xs">{t("instant")}</p>
    </div>
  );
}
