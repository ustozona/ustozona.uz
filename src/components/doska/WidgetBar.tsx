"use client";

import * as React from "react";

import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import { WIDGET_BAR_ORDER, widgetMeta } from "@/lib/doska/registry";
import { BackgroundPicker } from "./BackgroundPicker";
import { BarButton } from "./BarButton";
import { ShapePicker } from "./ShapePicker";
import { IconTrash } from "./icons";
import { WIDGET_ICONS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   VIDJET PANELI — ekran pastida.

   Dizayn qoidalari: docs/doska-dizayn-tizimi.md §2.

   ⚠️ Panel NEYTRAL: oq fon, kulrang ikona. Butun rang doskaning oʻzida.
   Sabab jismoniy — sinf ekrani 5 metrdan koʻriladi va oʻquvchi
   kontentga qarashi kerak, boshqaruvga emas. Panel rangli boʻlsa u
   taymer bilan raqobatlashadi.

   Hozircha hamma vidjet koʻrinadi. Soni oshganda panel oʻqituvchi
   tanloviga koʻra filtrlanadi ("Edit widget bar", R132) — tartib
   `WIDGET_BAR_ORDER` da, shuning uchun bu komponent oʻzgarmaydi.
   ════════════════════════════════════════════════════════════════════ */

export function WidgetBar() {
  const addWidget = useDoskaStore((s) => s.addWidget);
  const clearScreen = useDoskaStore((s) => s.clearScreen);
  const screen = useActiveScreen();

  const widgets = screen?.widgets ?? [];
  /** Ekranda shu turdagi vidjet bormi — tugma tepasidagi 3px chiziq. */
  const onScreen = React.useMemo(() => {
    const set = new Set<string>();
    for (const w of widgets) set.add(w.kind);
    return set;
  }, [widgets]);

  return (
    <div
      className="doska-bar bg-background flex items-center gap-1 rounded-[var(--radius)] border p-2 shadow-lg"
      style={{ zIndex: "var(--z-doska-bar)" }}
    >
      {WIDGET_BAR_ORDER.map((kind) => (
        <BarButton
          key={kind}
          label={widgetMeta(kind).label}
          Icon={WIDGET_ICONS[kind]}
          tint={widgetMeta(kind).tint}
          active={onScreen.has(kind)}
          onClick={() => addWidget(kind)}
        />
      ))}

      {/* Shakl reyestr tartibida emas — u bitta emas, toʻqqiz figura
          qoʻyadi va shuning uchun oʻz tanlash paneliga ega. */}
      <ShapePicker />

      <span className="bg-border mx-1 h-10 w-px self-center" />

      <BackgroundPicker />

      {widgets.length > 0 && (
        <BarButton label="Tozalash" Icon={IconTrash} tint="rose" onClick={clearScreen} />
      )}
    </div>
  );
}
