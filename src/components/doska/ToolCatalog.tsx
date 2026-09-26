"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore } from "@/lib/doska/store";
import { CATEGORY_ORDER, TOOL_ORDER, widgetMeta } from "@/lib/doska/registry";
import { MAX_PINNED_TOOLS, pinnedTools, useDoskaPrefs } from "@/lib/doska/prefs";
import { iconTintStyle } from "@/lib/doska/tint";
import type { WidgetKind } from "@/lib/doska/types";
import { BarButton } from "./BarButton";
import { useDockLayout } from "./dock";
import { IconCatalog, IconPin } from "./icons";
import { WIDGET_ICONS } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   «HAMMASI» — barcha vositalar oynasi (docs/doska-ux-tadqiqot.md §3
   «Topish», R132).

   Panelda ≤ 9 vosita turadi — koʻprogʻi 75″ doskada ham bir qarashda
   oʻqilmaydi. Qolgani shu oynada, toifalarga ajratilgan (Vaqt · Sinf ·
   Yozuv · Media). Vositalar koʻpaygani sayin panel emas, shu oyna oʻsadi.

   Har qatorda ikki amal:
     • qatorning oʻzi — vositani ekranga qoʻyadi (oyna yopiladi);
     • qadash belgisi — vositani panelga chiqaradi yoki olib tashlaydi.
       Panelni oʻqituvchi shu yerda tuzadi; tartib hammada bir xil
       (`TOOL_ORDER`), qadalgan vosita oʻz joyiga tushadi.

   Ikkalasi ≥ 44 px va hoverʼga bogʻliq emas (sensor birinchi, Q3).
   ════════════════════════════════════════════════════════════════════ */

export function ToolCatalog({ onScreen }: { onScreen: ReadonlySet<string> }) {
  const [open, setOpen] = React.useState(false);
  const { side } = useDockLayout();
  const tools = useDoskaPrefs((s) => s.tools);
  const togglePinned = useDoskaPrefs((s) => s.togglePinned);
  const addWidget = useDoskaStore((s) => s.addWidget);
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const t = useTranslations("Doska.catalog");
  const tWidget = useTranslations("Doska.widgets");

  const pinned = pinnedTools(tools);
  const full = pinned.length >= MAX_PINNED_TOOLS;
  // Ekranda paneldan tashqaridagi vosita bor — «Hammasi» tugmasi ham
  // «ekranda bor» belgisini oladi, aks holda u qayerdan kelgani yoʻqoladi.
  const hiddenOnScreen = TOOL_ORDER.some((k) => onScreen.has(k) && !pinned.includes(k));

  const add = (kind: WidgetKind) => {
    addWidget(kind);
    // Shakl panelda oʻz tanlash oynasi bilan qoʻyiladi. Bu yerdan esa
    // standart figura tushadi — figurani darhol tanlash uchun sozlama
    // kartasi ochiladi (§3 «Qoʻyish»: birinchi marta tez sozlash).
    if (kind === "shape.v1") {
      const id = useDoskaStore.getState().selectedId;
      if (id) toggleSettings(id);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <BarButton label={t("open")} Icon={IconCatalog} active={hiddenOnScreen} />
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align="center"
        sideOffset={12}
        collisionPadding={12}
        className="doska-bar doska-sheet flex max-h-[min(36rem,calc(100vh-2rem))] w-88 flex-col p-0"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        <div className="flex flex-col gap-1 border-b px-4 py-3">
          <h2 className="text-sm font-medium">{t("title")}</h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {full ? t("full", { max: MAX_PINNED_TOOLS }) : t("hint")}
          </p>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
          {CATEGORY_ORDER.map((category) => {
            const kinds = TOOL_ORDER.filter((k) => widgetMeta(k).category === category);
            if (kinds.length === 0) return null;
            return (
              <section key={category} className="pb-2">
                <h3 className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium tracking-wide uppercase">
                  {t(`categories.${category}`)}
                </h3>
                <ul className="flex flex-col gap-1">
                  {kinds.map((kind) => {
                    const meta = widgetMeta(kind);
                    const Icon = WIDGET_ICONS[kind];
                    const name = tWidget(meta.labelKey);
                    const isPinned = pinned.includes(kind);
                    return (
                      <li key={kind} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => add(kind)}
                          data-icon-tinted=""
                          style={iconTintStyle(meta.tint)}
                          className="hover:bg-muted focus-visible:ring-ring flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <span className="doska-tool-tile grid size-10 shrink-0 place-items-center rounded-xl">
                            <Icon className="size-7" />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">{name}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {t(`descriptions.${meta.labelKey}`)}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          aria-pressed={isPinned}
                          aria-label={isPinned ? t("unpin", { tool: name }) : t("pin", { tool: name })}
                          // Toʻla panelga yangi vosita qadalmaydi; sababi
                          // oyna sarlavhasida yozilgan (`full`).
                          disabled={!isPinned && full}
                          onClick={() => togglePinned(kind)}
                          className={cn(
                            "focus-visible:ring-ring grid size-11 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            "disabled:pointer-events-none disabled:opacity-30",
                            isPinned ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <IconPin className="size-5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
