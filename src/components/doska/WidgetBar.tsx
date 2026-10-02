"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore, useActiveWidgets } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import { pinnedTools, useDoskaPrefs } from "@/lib/doska/prefs";
import { useInkTool } from "@/lib/doska/ink-tool";
import { BackgroundPicker } from "./BackgroundPicker";
import { BarButton } from "./BarButton";
import { BarGroup, BarIconButton, barIconButtonClass } from "./BarGroup";
import { MenuItem } from "./DoskaMenu";
import { useDockLayout } from "./dock";
import { ShapePicker } from "./ShapePicker";
import { IconCatalog, IconChevronDown, IconCursor, IconMenu, IconPen, IconRedo, IconUndo } from "./icons";
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
     tahrirlash) va yigʻish (`B`).

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
  const tBar = useTranslations("Doska.bar");
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
        <BarIconButton
          label={tInk("pen")}
          shortcut={["P"]}
          onClick={() => setInkMode(useInkTool.getState().lastTool)}
          className="rounded-md"
        >
          <IconPen className="size-5" />
        </BarIconButton>
        {/* Tanlash — shu panel koʻrinib turgan paytdagi holat. */}
        <BarIconButton
          label={tInk("select")}
          aria-pressed
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

      <BarColumn vertical={vertical} className={vertical ? "pt-0" : "pl-0"}>
        <BarMenu onEditBar={() => setCatalogOpen(true)} />
        <BarIconButton label={tBar("hideControls")} shortcut={["B"]} onClick={onHide} className="rounded-md">
          <IconChevronDown className={cn("size-5", vertical && "-rotate-90")} />
        </BarIconButton>
      </BarColumn>
    </BarGroup>
  );
}

/** Panelning chekka ustuni — rejim tugmalari yoki menyu va yigʻish. */
function BarColumn({
  vertical,
  className,
  children,
}: {
  vertical: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 justify-between gap-2 p-2",
        vertical ? "flex-row" : "flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Panel menyusi (⋮) — bekor qilish, qaytadan bajarish, panelni tahrirlash.
 *
 * Bekor qilish shu yerda va `Ctrl+Z` da; har oʻchirishdan keyin pastda
 * «Qaytarish» xabari ham chiqadi (`DoskaNotice`) — shuning uchun alohida
 * doimiy tugma kerak emas.
 *
 * ⚠️ Tugma `<BarIconButton>` ga OʻRALMAYDI — u `PopoverTrigger asChild`
 * ning bolasi, zanjir esa `asChild` → `<Tooltip>` (DOM element emas)
 * boʻlib uzilardi (`DoskaMenu` dagi bilan bir xil sabab).
 */
function BarMenu({ onEditBar }: { onEditBar: () => void }) {
  const undo = useDoskaStore((s) => s.undo);
  const redo = useDoskaStore((s) => s.redo);
  const canUndo = useDoskaStore((s) => s.past.length > 0);
  const canRedo = useDoskaStore((s) => s.future.length > 0);
  const { side } = useDockLayout();
  const t = useTranslations("Doska.bar");
  const [open, setOpen] = React.useState(false);

  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t("barMenu")} className={cn(barIconButtonClass, "rounded-md")}>
          <IconMenu className="size-5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align="end"
        sideOffset={12}
        collisionPadding={12}
        className="doska-bar doska-sheet w-60 p-0 py-1"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        {/* Menyu ochiq qoladi: oʻqituvchi bir necha qadam orqaga qaytishi mumkin. */}
        <MenuItem Icon={IconUndo} shortcut={["Mod", "Z"]} disabled={!canUndo} onClick={undo}>
          {t("undo")}
        </MenuItem>
        <MenuItem Icon={IconRedo} shortcut={["Mod", "Y"]} disabled={!canRedo} onClick={redo}>
          {t("redo")}
        </MenuItem>
        <hr className="mx-4 my-1" />
        <MenuItem Icon={IconCatalog} onClick={run(onEditBar)}>
          {t("editBar")}
        </MenuItem>
      </PopoverContent>
    </Popover>
  );
}
