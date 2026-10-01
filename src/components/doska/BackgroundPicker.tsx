"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore, useActiveBackground } from "@/lib/doska/store";
import { DOSKA_BACKGROUNDS, backgroundById, inSeason, type DoskaBackground } from "@/lib/doska/backgrounds";
import { BarButton } from "./BarButton";
import { useDockLayout } from "./dock";
import { IconBackground, IconCheck } from "./icons";

/**
 * FON TANLASH — panel tugmasi.
 *
 * Namunalar fonning oʻzi bilan chiziladi (`style`), yaʼni katalogda
 * alohida «preview» rasm saqlanmaydi — koʻrgan narsangiz aynan oʻsha
 * CSS. Panel tugmasida esa ikona turadi — ochiq fonlar 28px kvadratda
 * deyarli oq boʻlib qoladi va tugma boʻsh koʻrinardi.
 */
export function BackgroundPicker() {
  const backgroundId = useActiveBackground();
  const setBackground = useDoskaStore((s) => s.setBackground);
  const current = backgroundById(backgroundId);
  const { side } = useDockLayout();
  const t = useTranslations("Doska");

  // Popover ochilgandagina chiziladi — sana serverda hisoblanmaydi.
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
    <Popover>
      <PopoverTrigger asChild>
        {/* Ikona, joriy fon namunasi EMAS: ochiq fonlar (katak, nuqta,
            oq taxta) 28px kvadratda deyarli oq boʻlib qoladi va tugma
            boʻsh koʻrinadi. Joriy tanlov popover ichida belgilanadi. */}
        <BarButton label={t("bar.background")} Icon={IconBackground} tint="violet" />
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align="center"
        sideOffset={12}
        collisionPadding={12}
        className="doska-bar doska-sheet w-72 p-2"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        {today.length > 0 && (
          <div className="mb-2 flex flex-col gap-1.5 border-b pb-2">
            <span className="text-muted-foreground text-tag px-0.5">{t("bar.backgroundToday")}</span>
            <div className="grid grid-cols-3 gap-2">{today.slice(0, 3).map(swatch)}</div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">{DOSKA_BACKGROUNDS.map(swatch)}</div>
      </PopoverContent>
    </Popover>
  );
}

/** Oraliq uzunligi (kun, taxminan) — qisqasi (bayram) birinchi. */
function span(bg: DoskaBackground): number {
  if (!bg.dates) return 999;
  const n = (md: string) => Number(md.slice(0, 2)) * 31 + Number(md.slice(3));
  const [a, b] = bg.dates.map(n);
  return b >= a ? b - a : b + 372 - a;
}
