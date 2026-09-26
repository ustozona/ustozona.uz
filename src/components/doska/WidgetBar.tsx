"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore, useActiveScreen } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import { pinnedTools, useDoskaPrefs } from "@/lib/doska/prefs";
import { useInkTool } from "@/lib/doska/ink-tool";
import { BackgroundPicker } from "./BackgroundPicker";
import { BarButton } from "./BarButton";
import { BarGroup, BarSeparator } from "./BarGroup";
import { useDockLayout } from "./dock";
import { ShapePicker } from "./ShapePicker";
import { IconPen } from "./icons";
import { ToolCatalog } from "./ToolCatalog";
import { WIDGET_ICONS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   VIDJET PANELI — pastda yoki yon relsada («Panel joyi», `dock.ts`).

   Dizayn qoidalari: docs/doska-dizayn-tizimi.md §2.

   Tuzilma: Qalam │ oʻqituvchi qadagan vositalar │ «Hammasi» · «Fon».

   «Qalam» — vidjet emas, REJIM: bosilganda panel oʻrnini qoʻlyozma paneli
   (`InkBar`) egallaydi. U doim birinchi va panel tuzilmasiga kirmaydi —
   yashirib boʻlmaydi: yozish doskaning asosiy vazifasi
   (docs/doska-qolyozma-tadqiqot.md §1, §6).
   Qaysi vosita panelda turishini oʻqituvchi «Hammasi» oynasida tanlaydi
   (`lib/doska/prefs.ts`, R132); tartib esa doim `TOOL_ORDER`. Tuzmagan
   oʻqituvchi standart panelni koʻradi.

   Koʻrinish uslubdan (`.doska-ctl`, `.doska-tool`): Sokin va Doskada
   material jim, rang faqat ikonada; Oʻyinchoqda plitkalar rangli —
   oʻqituvchi buni ongli tanlagan (Q1).

   «Tozalash» bu yerda YOʻQ — u menyuda (`DoskaMenu`). Qoʻshish
   tugmalari qatorida turgan buzuvchi tugma bir notoʻgʻri bosishda butun
   ekranni boʻshatardi (docs/doska-ux-tadqiqot.md A2).
   ════════════════════════════════════════════════════════════════════ */

export function WidgetBar() {
  const addWidget = useDoskaStore((s) => s.addWidget);
  const tools = useDoskaPrefs((s) => s.tools);
  const screen = useActiveScreen();
  const { orientation } = useDockLayout();
  const t = useTranslations("Doska.widgets");
  const tInk = useTranslations("Doska.ink");
  const setInkMode = useInkTool((s) => s.setMode);

  // ⚠️ `?? []` bu yerda EMAS: har renderda yangi massiv yaratilib,
  // quyidagi `useMemo` ni har safar qayta hisoblatardi.
  const widgets = screen?.widgets;

  /** Ekranda shu turdagi vidjet bormi — tugma tepasidagi 3 px belgi. */
  const onScreen = React.useMemo(() => {
    const set = new Set<string>();
    for (const w of widgets ?? []) set.add(w.kind);
    return set;
  }, [widgets]);

  const vertical = orientation === "vertical";
  const pinned = pinnedTools(tools);

  return (
    <BarGroup
      variant="padded"
      layer="bar"
      orientation={orientation}
      // ⚠️ Panel oʻqituvchining planshetida ham ochiladi. Sigʻmasa u oʻz
      // ustunidan oshmaydi (`max-w-full` / `max-h-full`, ota `min-w-0` /
      // `min-h-0` — DoskaShell) va ichida aylanadi. Busiz sigʻmagan
      // tugmalar kanvasdan chiqib ketardi va ularga yetish yoʻli yoʻq edi.
      //
      // `overscroll-contain` — aylantirish oxiriga yetganda brauzerning
      // «orqaga» ishorasiga yoki sahifa aylanishiga oʻtib ketmasin.
      className={cn(
        vertical
          ? "max-h-full min-h-0 overflow-y-auto overscroll-y-contain"
          : "max-w-full overflow-x-auto overscroll-x-contain",
      )}
    >
      <BarButton
        label={tInk("pen")}
        Icon={IconPen}
        onClick={() => setInkMode(useInkTool.getState().lastTool)}
      />

      <BarSeparator vertical={vertical} />

      {pinned.map((kind) =>
        // Shakl bitta emas, toʻqqiz figura qoʻyadi — oʻz tanlash paneli bor.
        kind === "shape.v1" ? (
          <ShapePicker key={kind} active={onScreen.has(kind)} />
        ) : (
          <BarButton
            key={kind}
            label={t(widgetMeta(kind).labelKey)}
            Icon={WIDGET_ICONS[kind]}
            tint={widgetMeta(kind).tint}
            active={onScreen.has(kind)}
            onClick={() => addWidget(kind)}
          />
        ),
      )}

      {/* Hammasi olib tashlangan panelda ajratgich yolgʻiz osilib qolmasin. */}
      {pinned.length > 0 && <BarSeparator vertical={vertical} />}

      <ToolCatalog onScreen={onScreen} />
      <BackgroundPicker />
    </BarGroup>
  );
}
