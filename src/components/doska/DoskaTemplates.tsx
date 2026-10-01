"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import { backgroundById } from "@/lib/doska/backgrounds";
import { DOSKA_TEMPLATES } from "@/lib/doska/templates";
import { WIDGET_ICONS } from "./widgets";
import { IconArrowLeft } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   TAYYOR EKRANLAR — menyu ichidagi boʻlim (R423).

   Har karta: fon namunasi ustida shablon vidjetlarining ikonkalari, ostida
   nomi va bir jumlalik izoh. Bosilganda yangi ekran ochiladi va menyu
   yopiladi — oʻqituvchi natijani darhol koʻradi; «Qaytarish» uni olib
   tashlaydi.
   ════════════════════════════════════════════════════════════════════ */

export function DoskaTemplates({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const addTemplateScreen = useDoskaStore((s) => s.addTemplateScreen);
  const t = useTranslations("Doska.templates");

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 border-b py-1 pr-4 pl-1">
        <button
          type="button"
          aria-label={t("back")}
          onClick={onBack}
          className="hover:bg-muted focus-visible:ring-ring grid size-11 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconArrowLeft className="size-5" />
        </button>
        <h2 className="text-sm font-medium">{t("title")}</h2>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="text-muted-foreground px-1 text-xs leading-snug">{t("hint")}</p>
        {DOSKA_TEMPLATES.map((tpl) => {
          const bg = backgroundById(tpl.background);
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                addTemplateScreen(tpl);
                onDone();
              }}
              className="hover:bg-muted focus-visible:ring-ring flex items-center gap-3 rounded-lg border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-24 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border"
                style={{ ...bg.style, color: bg.tone === "dark" ? "oklch(0.97 0 0)" : "oklch(0.3 0 0)" }}
              >
                {/* Har tur bir marta — toʻrtta karta toʻrtta bir xil ikona boʻlib namunaga sigʻmaydi. */}
                {[...new Set(tpl.widgets.map((w) => w.kind))].map((kind) => {
                  const Icon = WIDGET_ICONS[kind];
                  return <Icon key={kind} className="size-5 shrink-0" />;
                })}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{t(`items.${tpl.id}.name`)}</span>
                <span className="text-muted-foreground text-xs leading-snug">{t(`items.${tpl.id}.desc`)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
