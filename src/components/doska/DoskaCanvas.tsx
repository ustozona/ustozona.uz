"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useActiveScreen, useDoskaStore } from "@/lib/doska/store";
import { backgroundById } from "@/lib/doska/backgrounds";
import { Z_SPOTLIGHT_EXIT, Z_SPOTLIGHT_SCRIM } from "@/lib/doska/layers";
import { IconSpotlightExit } from "./icons";
import { useDoskaInteraction } from "./InteractionLayer";
import { SelectionOverlay } from "./SelectionOverlay";
import { WidgetFrame } from "./WidgetFrame";
import { WIDGET_COMPONENTS } from "./widgets";

/**
 * KANVAS — ekran maydoni.
 *
 * Kanvasning oʻzi hodisa ushlamaydi: butun sudrash/tanlash mantigʻi
 * `useDoskaInteraction` ichidagi YAGONA dispatcher'da (R135). Shu bois
 * vidjetlar soni ortganda bu fayl oʻzgarmaydi.
 *
 * Vidjetlar `z` boʻyicha emas, DOM tartibida chiziladi — ustma-ustlikni
 * `zIndex` hal qiladi (WidgetFrame'da), shuning uchun qayta tartiblash
 * render sabab boʻlmaydi.
 *
 * `data-bg-tone` — toʻq fonda vidjet tuslarini «bo'r rejimi»ga
 * oʻtkazadi (globals.css). Vidjetlar bu haqda bilmaydi.
 */
export function DoskaCanvas() {
  const screen = useActiveScreen();
  const hydrated = useDoskaStore((s) => s.hydrated);

  const rootRef = React.useRef<HTMLDivElement>(null);
  useDoskaInteraction(rootRef);

  const background = backgroundById(screen?.background);

  // localStorage oʻqilmaguncha vidjet chizilmaydi — aks holda server
  // boʻsh ekran, brauzer esa toʻla ekran qaytarib hydration buziladi.
  // Fon esa darhol chiziladi: u standart qiymatdan keladi, yaʼni
  // ikkala tomonda bir xil va koʻz oldida oq lahza qolmaydi.
  return (
    <div
      ref={rootRef}
      className={cn("relative size-full overflow-hidden", background.grain && "doska-grain")}
      style={background.style}
      data-bg-tone={background.tone}
    >
      {hydrated && (
        <>
          {screen?.widgets.map((widget) => {
            const Component = WIDGET_COMPONENTS[widget.kind];
            if (!Component) return null; // notanish `kind` — eski/kelgusi versiya
            return (
              <WidgetFrame key={widget.id} widget={widget}>
                <Component widget={widget} />
              </WidgetFrame>
            );
          })}

          <SelectionOverlay />
          <SpotlightScrim />
        </>
      )}
    </div>
  );
}

/**
 * «MARKAZGA» PARDASI — markazdagi vidjetdan boshqa hamma narsani yopadi
 * (docs/doska-ux-tadqiqot.md R311, R323: sinf faqat bitta narsaga qarasin).
 *
 * Parda bosilsa yoki `Esc` — chiqish. Tugma pastda, qoʻl yetadigan joyda
 * (R319); u sensorli doska uchun, `Esc` — klaviatura uchun.
 */
function SpotlightScrim() {
  const active = useDoskaStore((s) => s.spotlightId !== null);
  const setSpotlight = useDoskaStore((s) => s.setSpotlight);
  const t = useTranslations("Doska.spotlight");
  if (!active) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setSpotlight(null)}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        style={{ zIndex: Z_SPOTLIGHT_SCRIM }}
      />
      <button
        type="button"
        onClick={() => setSpotlight(null)}
        className="doska-bar bg-background text-foreground hover:bg-muted absolute bottom-4 left-1/2 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full border px-5 text-sm font-medium shadow-md transition-colors"
        style={{ zIndex: Z_SPOTLIGHT_EXIT }}
      >
        <IconSpotlightExit className="size-5" />
        {t("exit")}
      </button>
    </>
  );
}
