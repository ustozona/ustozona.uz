"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore, useActiveWidgets } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import { pinnedTools, useDoskaPrefs } from "@/lib/doska/prefs";
import { useInkTool } from "@/lib/doska/ink-tool";
import { BackgroundPicker } from "./BackgroundPicker";
import { BarButton } from "./BarButton";
import { BarColumn, BarEndColumn } from "./BarEndColumn";
import { BarGroup, BarIconButton } from "./BarGroup";
import { useDockLayout } from "./dock";
import { ShapePicker } from "./ShapePicker";
import { IconCursor, IconPen } from "./icons";
import { ToolCatalog } from "./ToolCatalog";
import { WIDGET_ICONS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   VIDJET PANELI — pastda yoki yon relsada («Panel joyi», `dock.ts`).

   Dizayn: docs/doska-dizayn-tizimi.md §2, docs/doska-referens-koriklari.md
   §4 (referens koʻrinishi).

   Tuzilma — uch ustun, bitta oq idishda:

     ┌────┬──────────────────────────────────────────────┬───┐
     │ ✎  │ Fon · oʻqituvchi qadagan vositalar · Hammasi │ ⋮ │
     │ ➤  │                                              │ ⌄ │
     └────┴──────────────────────────────────────────────┴───┘

   • Chap ustun — REJIM: qalam yoki tanlash. Qalam bosilganda panel
     oʻrnini qoʻlyozma paneli (`InkBar`) egallaydi; tanlash — oddiy
     holat, shuning uchun bu panelda doim faol. Qalam vidjet emas va
     yashirib boʻlmaydi: yozish doskaning asosiy vazifasi
     (docs/doska-qolyozma-tadqiqot.md §1, §6).
   • Oʻrta — vositalar. Qaysi biri turishini oʻqituvchi «Hammasi» da
     tanlaydi (`lib/doska/prefs.ts`, R132); tartib doim `TOOL_ORDER`.
     Har plitka tepasida ekrandagi nusxalar soni (nuqtalar).
   • Oʻng ustun — panel menyusi (bekor qilish, qaytadan bajarish, panelni
     tahrirlash) va yigʻish (`B`) — `BarEndColumn`, qoʻlyozma panelida ham.

   «Tozalash» bu yerda YOʻQ — u asosiy menyuda (`DoskaMenu`). Qoʻshish
   tugmalari qatorida turgan buzuvchi tugma bir notoʻgʻri bosishda butun
   ekranni boʻshatardi (docs/doska-ux-tadqiqot.md A2).
   ════════════════════════════════════════════════════════════════════ */

export function WidgetBar({ onHide }: { onHide: () => void }) {
  const addWidget = useDoskaStore((s) => s.addWidget);
  const tools = useDoskaPrefs((s) => s.tools);
  const widgets = useActiveWidgets();
  const { orientation } = useDockLayout();
  const t = useTranslations("Doska.widgets");
  const tInk = useTranslations("Doska.ink");
  const setInkMode = useInkTool((s) => s.setMode);
  const [catalogOpen, setCatalogOpen] = React.useState(false);

  // ⚠️ `widgets` ga `?? []` qoʻyilmaydi: har renderda yangi massiv
  // yaratilib, quyidagi `useMemo` ni har safar qayta hisoblatardi.

  /** Ekranda shu turdagi nechta vidjet bor — plitka tepasidagi nuqtalar. */
  const onScreen = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of widgets ?? []) counts.set(w.kind, (counts.get(w.kind) ?? 0) + 1);
    return counts;
  }, [widgets]);

  const vertical = orientation === "vertical";
  const pinned = pinnedTools(tools);

  return (
    <BarGroup
      variant="padded"
      layer="bar"
      orientation={orientation}
      className={cn(
        "items-stretch gap-0 p-0",
        vertical ? "max-h-full min-h-0" : "max-w-full min-w-0",
      )}
    >
      <BarColumn vertical={vertical}>
        {/* Rejim almashtirgich — ikki tugma, bittasi bosilgan. Bu panel
            koʻrinib turgan paytda rejim doim «tanlash»: qalam bosilsa panel
            oʻrnini qoʻlyozma paneli egallaydi. */}
        <BarIconButton
          label={tInk("pen")}
          shortcut={["P"]}
          aria-pressed={false}
          onClick={() => setInkMode(useInkTool.getState().lastTool)}
          className="rounded-md"
        >
          <IconPen className="size-5" />
        </BarIconButton>
        <BarIconButton
          label={tInk("select")}
          aria-pressed
          onClick={() => setInkMode(null)}
          className="text-primary hover:text-primary rounded-md bg-[var(--doska-ctl-active)] hover:bg-[var(--doska-ctl-active)]"
        >
          <IconCursor className="size-5" />
        </BarIconButton>
      </BarColumn>

      {/* ⚠️ Panel oʻqituvchining planshetida ham ochiladi. Sigʻmasa u oʻz
          ustunidan oshmaydi (`max-w-full` / `max-h-full`, ota `min-w-0` /
          `min-h-0` — DoskaShell) va ichida aylanadi. Busiz sigʻmagan
          tugmalar kanvasdan chiqib ketardi va ularga yetish yoʻli yoʻq edi.

          `overscroll-contain` — aylantirish oxiriga yetganda brauzerning
          «orqaga» ishorasiga yoki sahifa aylanishiga oʻtib ketmasin. */}
      <div
        className={cn(
          "flex",
          vertical
            ? "min-h-0 flex-col items-center overflow-y-auto overscroll-y-contain px-1"
            : "min-w-0 items-center overflow-x-auto overscroll-x-contain py-1.5",
        )}
      >
        {/* «Fon» vosita emas, ekran sozlamasi — u doim panelda, birinchi. */}
        <BackgroundPicker />

        {pinned.map((kind) =>
          // Shakl bitta emas, toʻqqiz figura qoʻyadi — oʻz tanlash paneli bor.
          kind === "shape.v1" ? (
            <ShapePicker key={kind} count={onScreen.get(kind) ?? 0} />
          ) : (
            <BarButton
              key={kind}
              label={t(widgetMeta(kind).labelKey)}
              Icon={WIDGET_ICONS[kind]}
              tint={widgetMeta(kind).tint}
              count={onScreen.get(kind) ?? 0}
              onClick={() => addWidget(kind)}
            />
          ),
        )}

        <ToolCatalog onScreen={onScreen} open={catalogOpen} onOpenChange={setCatalogOpen} />
      </div>

      <BarEndColumn vertical={vertical} onHide={onHide} onEditBar={() => setCatalogOpen(true)} />
    </BarGroup>
  );
}

