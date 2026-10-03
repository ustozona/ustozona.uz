"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore, useActiveBackground } from "@/lib/doska/store";
import { DOSKA_BACKGROUNDS, backgroundById, inSeason, type DoskaBackground } from "@/lib/doska/backgrounds";
import { IconArrowLeft, IconCheck } from "./icons";

/**
 * FON TANLASH — menyu ichidagi boʻlim (`DoskaMenu`).
 *
 * Ilgari vidjet panelida tugma edi. Fon vidjet qoʻymaydi, ekranni
 * oʻzgartiradi, lekin tugmasi vositalar bilan bir xil koʻrinardi va dars
 * davomida kam bosiladi — shuning uchun panel vositalarga qoldi, fon esa
 * menyuga olindi («Koʻrinish» yonida).
 *
 * Namunalar fonning oʻzi bilan chiziladi (`style`), yaʼni katalogda
 * alohida «preview» rasm saqlanmaydi — koʻrgan narsangiz aynan oʻsha CSS.
 * Tanlov darhol qoʻllanadi va menyu ochiq qoladi: oʻqituvchi natijani
 * orqadagi doskada koʻradi.
 */
export function DoskaBackgrounds({ onBack }: { onBack: () => void }) {
  const backgroundId = useActiveBackground();
  const setBackground = useDoskaStore((s) => s.setBackground);
  const current = backgroundById(backgroundId);
  const t = useTranslations("Doska");

  // Boʻlim ochilgandagina chiziladi — sana serverda hisoblanmaydi.
  // Bayram (qisqa oraliq) mavsumdan oldin turadi.
  const d = new Date();
  const monthDay = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = DOSKA_BACKGROUNDS.filter((bg) => inSeason(bg, monthDay)).sort(
    (a, b) => span(a) - span(b),
  );

  const swatch = (bg: DoskaBackground) => {
    const active = bg.id === current.id;
    return (
      <button
        key={bg.id}
        type="button"
        onClick={() => setBackground(bg.id)}
        className="group flex flex-col gap-1.5"
        aria-pressed={active}
      >
        <span
          className={cn(
            "relative grid h-12 w-full place-items-center overflow-hidden rounded-md border transition-all",
            active ? "ring-primary ring-2 ring-offset-1" : "group-hover:border-foreground/30",
            bg.grain && "doska-grain",
          )}
          style={bg.style}
        >
          {active && (
            <span
              className="relative"
              style={{ color: bg.tone === "dark" ? "oklch(0.97 0 0)" : "oklch(0.3 0 0)" }}
            >
              <IconCheck className="size-5" />
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-tag leading-tight">{t(`backgrounds.${bg.id}`)}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 border-b py-1 pr-4 pl-1">
        <button
          type="button"
          aria-label={t("appearance.back")}
          onClick={onBack}
          className="hover:bg-muted focus-visible:ring-ring grid size-11 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconArrowLeft className="size-5" />
        </button>
        <h2 className="text-sm font-medium">{t("bar.background")}</h2>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {today.length > 0 && (
          <div className="mb-1 flex flex-col gap-1.5 border-b pb-3">
            <span className="text-muted-foreground text-tag px-0.5">{t("bar.backgroundToday")}</span>
            <div className="grid grid-cols-3 gap-2">{today.slice(0, 3).map(swatch)}</div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">{DOSKA_BACKGROUNDS.map(swatch)}</div>
      </div>
    </div>
  );
}

/** Oraliq uzunligi (kun, taxminan) — qisqasi (bayram) birinchi. */
function span(bg: DoskaBackground): number {
  if (!bg.dates) return 999;
  const n = (md: string) => Number(md.slice(0, 2)) * 31 + Number(md.slice(3));
  const [a, b] = bg.dates.map(n);
  return b >= a ? b - a : b + 372 - a;
}
