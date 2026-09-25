"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import { WIDGET_BAR_ORDER, widgetMeta } from "@/lib/doska/registry";
import { BackgroundPicker } from "./BackgroundPicker";
import { BarButton } from "./BarButton";
import { BarGroup } from "./BarGroup";
import { ShapePicker } from "./ShapePicker";
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

   «Tozalash» bu yerda YOʻQ — u menyuda (`DoskaMenu`). Qoʻshish
   tugmalari qatorida turgan buzuvchi tugma bir notoʻgʻri bosishda butun
   ekranni boʻshatardi (docs/doska-ux-tadqiqot.md A2).
   ════════════════════════════════════════════════════════════════════ */

export function WidgetBar() {
  const addWidget = useDoskaStore((s) => s.addWidget);
  const screen = useActiveScreen();
  const t = useTranslations("Doska.widgets");

  // ⚠️ `?? []` bu yerda EMAS: har renderda yangi massiv yaratilib,
  // quyidagi `useMemo` ni har safar qayta hisoblatardi.
  const widgets = screen?.widgets;

  /** Ekranda shu turdagi vidjet bormi — tugma tepasidagi 3px chiziq. */
  const onScreen = React.useMemo(() => {
    const set = new Set<string>();
    for (const w of widgets ?? []) set.add(w.kind);
    return set;
  }, [widgets]);

  return (
    <BarGroup
      variant="padded"
      layer="bar"
      // ⚠️ Panel oʻqituvchining planshetida ham ochiladi. Ilgari u
      // sigʻmagan tugmalarni kanvasdan tashqariga chiqarib yuborardi:
      // ekran 640px boʻlsa «Fon» koʻrinmay qolardi va unga yetishning
      // yoʻli yoʻq edi. Endi panel oʻz ustunidan oshmaydi (`max-w-full`,
      // ota ustun `min-w-0` — DoskaShell) va ichida gorizontal aylanadi.
      //
      // `overscroll-x-contain` — aylantirish panel oxiriga yetganda
      // brauzerning «orqaga» ishorasiga oʻtib ketmasin.
      className="max-w-full overflow-x-auto overscroll-x-contain"
    >
      {WIDGET_BAR_ORDER.map((kind) => (
        <BarButton
          key={kind}
          label={t(widgetMeta(kind).labelKey)}
          Icon={WIDGET_ICONS[kind]}
          tint={widgetMeta(kind).tint}
          active={onScreen.has(kind)}
          onClick={() => addWidget(kind)}
        />
      ))}

      {/* Shakl reyestr tartibida emas — u bitta emas, toʻqqiz figura
          qoʻyadi va shuning uchun oʻz tanlash paneliga ega. */}
      <ShapePicker />

      <span className="bg-border mx-1 h-10 w-px shrink-0 self-center" />

      <BackgroundPicker />
    </BarGroup>
  );
}
