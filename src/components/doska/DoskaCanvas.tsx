"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import { backgroundById } from "@/lib/doska/backgrounds";
import { WidgetFrame } from "./WidgetFrame";
import { WIDGET_COMPONENTS } from "./widgets";

/**
 * KANVAS — ekran maydoni.
 *
 * Boʻsh joyga bosilsa tanlov bekor qilinadi. Vidjetlar `z` boʻyicha
 * emas, DOM tartibida chiziladi — ustma-ustlikni `zIndex` hal qiladi
 * (WidgetFrame'da), shuning uchun qayta tartiblash render sabab
 * boʻlmaydi.
 *
 * `data-bg-tone` — toʻq fonda vidjet tuslarini «bo'r rejimi»ga
 * oʻtkazadi (globals.css). Vidjetlar bu haqda bilmaydi.
 */
export function DoskaCanvas() {
  const screen = useActiveScreen();
  const select = useDoskaStore((s) => s.select);
  const hydrated = useDoskaStore((s) => s.hydrated);

  const background = backgroundById(screen?.background);

  // localStorage oʻqilmaguncha vidjet chizilmaydi — aks holda server
  // boʻsh ekran, brauzer esa toʻla ekran qaytarib hydration buziladi.
  // Fon esa darhol chiziladi: u standart qiymatdan keladi, yaʼni
  // ikkala tomonda bir xil va koʻz oldida oq lahza qolmaydi.
  return (
    <div
      className={cn("relative size-full overflow-hidden", background.grain && "doska-grain")}
      style={background.style}
      data-bg-tone={background.tone}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) select(null);
      }}
    >
      {hydrated &&
        screen?.widgets.map((widget) => {
          const Component = WIDGET_COMPONENTS[widget.kind];
          if (!Component) return null; // notanish `kind` — eski/kelgusi versiya
          return (
            <WidgetFrame key={widget.id} widget={widget}>
              <Component widget={widget} />
            </WidgetFrame>
          );
        })}
    </div>
  );
}
