"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import { DOSKA_BACKGROUNDS, backgroundById } from "@/lib/doska/backgrounds";
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
  const screen = useActiveScreen();
  const setBackground = useDoskaStore((s) => s.setBackground);
  const current = backgroundById(screen?.background);
  const { side } = useDockLayout();
  const t = useTranslations("Doska");

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
        <div className="grid grid-cols-3 gap-2">
          {DOSKA_BACKGROUNDS.map((bg) => {
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
                    active
                      ? "ring-primary ring-2 ring-offset-1"
                      : "group-hover:border-foreground/30",
                    bg.grain && "doska-grain",
                  )}
                  style={bg.style}
                >
                  {active && (
                    <span
                      className="relative"
                      style={{
                        color: bg.tone === "dark" ? "oklch(0.97 0 0)" : "oklch(0.3 0 0)",
                      }}
                    >
                      <IconCheck className="size-5" />
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground text-tag leading-tight">
                  {t(`backgrounds.${bg.id}`)}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
