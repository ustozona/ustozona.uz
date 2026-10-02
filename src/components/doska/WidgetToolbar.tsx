"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import type { DoskaWidget } from "@/lib/doska/types";
import { BarGroup, BarIconButton, barIconButtonClass } from "./BarGroup";
import { MenuItem } from "./DoskaMenu";
import { IconCopy, IconLock, IconMenu, IconPin, IconSettings, IconSpotlight, IconTrash, IconUnlock } from "./icons";
import { clamp, usePinnedPosition } from "./usePinnedPosition";
import { hasSettings } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   KONTEKST ASBOBLAR PANELI — tanlangan vidjet ustida suzadi.

   Oʻchirish · Sozlash · ⋮ (Nusxa, Qulflash, Barcha ekranlarda,
   Markazga) — docs/doska-referens-koriklari.md §4 (referens koʻrinishi).

   Ikonali tugmalar, nom tooltipʼda. Ilgari har tugmada nom yozilgan edi
   (`BarTextButton`, R322: sensorli doskada hover yoʻq); foydalanuvchi
   referens koʻrinishini tanladi (2026-10-02). Kam ishlatiladigan amallar
   ⋮ menyusida — u yerda ikona VA nom bor, sensorda ham tushunarli.

   «Oldinga chiqarish» tugmasi YOʻQ: vidjetni bosishning oʻzi uni oldinga
   chiqaradi (`InteractionLayer`), alohida tugma bir xil ishni ikkinchi
   marta qilardi va panelni kengaytirardi.

   Qulflangan vidjetda «Oʻchirish» yoʻq — qulf aynan shuning uchun
   (R311). Qulfni ochish shu paneldan, bir bosishda.

   ⚠️ Nega vidjetning USTIDA, ostida emas: vertikal doskada qoʻl pastdan
   keladi va bilak teginish nuqtasining pastini yopadi (R328). Ostidagi
   panel aynan qoʻl ostida qolardi.

   ⚠️ Panel tanlov ramkasining ICHIDA emas. Ramka `--z-doska-handles`
   da, panel esa `--z-doska-context` da (§5) — aks holda ustidan
   tushgan boshqa vidjet uni berkitib qoʻyardi.

   ⚠️ Har tugmada `data-doska-no-drag`: dispatcher hodisa nishoniga
   qarab ish koʻradi va busiz panelga bosish vidjetni sudrab yuborardi
   (`interaction.ts` dagi ATTR_NO_DRAG izohi).
   ════════════════════════════════════════════════════════════════════ */

/** Panel bilan vidjet orasidagi masofa (piksel). */
const GAP = 10;

/** Panel ekran chetiga shu masofadan yaqinlashmaydi (piksel). */
const EDGE = 8;

/**
 * Panelning taxminiy balandligi — tepada joy yetadimi degan hisob uchun.
 * Aniq oʻlchash (`getBoundingClientRect`) shart emas: xato qilsa ham
 * eng yomoni panel pastga tushadi, bu esa buzilish emas. 36 px tugma +
 * eng qalin uslub chegarasi (Oʻyinchoq, 2 × 3 px).
 */
const HEIGHT = 42;

export function WidgetToolbar({ widget }: { widget: DoskaWidget }) {
  const removeWidget = useDoskaStore((s) => s.removeWidget);
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const settingsOpen = useDoskaStore((s) => s.settingsId === widget.id);

  const tWidget = useTranslations("Doska.widgets");
  const t = useTranslations("Doska.toolbar");
  const name = tWidget(widgetMeta(widget.kind).labelKey);
  const locked = widget.locked === true;

  // Vidjet ekranning tepasiga yopishganda panel yuqorida joy topolmaydi
  // va kanvasdan chiqib ketardi — bunday holatda pastga tushadi.
  const above = widget.y >= HEIGHT + GAP;
  const center = widget.x + widget.w / 2;

  /**
   * Yon chetga qisish. Panel yozuvli boʻlgani uchun vidjetdan keng: chap
   * yoki oʻng chetdagi kichik vidjetda markazlangan panelning yarmi
   * ekrandan chiqib ketardi. Kenglik render paytida nomaʼlum — joy
   * `usePinnedPosition` bilan, faqat vidjet koʻchganda yoki panel
   * oʻlchami oʻzgarganda hisoblanadi.
   */
  const ref = React.useRef<HTMLDivElement>(null);
  usePinnedPosition(ref, `${widget.x},${widget.w}`, (el) => {
    const half = el.offsetWidth / 2;
    el.style.left = `${clamp(center, half + EDGE, window.innerWidth - half - EDGE)}px`;
  });

  return (
    <div
      ref={ref}
      // Sozlama kartasi shu panelni chetlab oʻtadi (`WidgetSettingsCard`).
      data-doska-toolbar=""
      className="pointer-events-none absolute"
      style={{
        top: above ? widget.y - GAP : widget.y + widget.h + GAP,
        transform: `translate(-50%, ${above ? "-100%" : "0"})`,
        zIndex: "var(--z-doska-context)",
      }}
    >
      <BarGroup layer="context">
        {!locked && (
          <BarIconButton
            label={t("removeShort")}
            aria-label={t("remove", { widget: name })}
            data-doska-no-drag=""
            onClick={() => removeWidget(widget.id)}
            className="hover:text-destructive"
          >
            <IconTrash className="size-5" />
          </BarIconButton>
        )}

        {hasSettings(widget.kind) && (
          <BarIconButton
            label={t("settingsShort")}
            aria-label={t("settings", { widget: name })}
            aria-pressed={settingsOpen}
            data-doska-no-drag=""
            onClick={() => toggleSettings(widget.id)}
            className={settingsOpen ? "bg-muted text-foreground" : undefined}
          >
            <IconSettings className="size-5" />
          </BarIconButton>
        )}

        <MoreMenu widget={widget} name={name} />
      </BarGroup>
    </div>
  );
}

/**
 * ⋮ — kam ishlatiladigan amallar: nusxa, qulf, barcha ekranlarda, markazga.
 *
 * ⚠️ Tugma `<BarIconButton>` ga OʻRALMAYDI — `PopoverTrigger asChild`
 * zanjiri `<Tooltip>` da uzilardi (`DoskaMenu` dagi bilan bir xil sabab).
 * Menyu `body` ga chiqadi — kanvasdan tashqarida, shuning uchun uning
 * bandlariga `data-doska-no-drag` kerak emas.
 */
function MoreMenu({ widget, name }: { widget: DoskaWidget; name: string }) {
  const duplicateWidget = useDoskaStore((s) => s.duplicateWidget);
  const toggleLock = useDoskaStore((s) => s.toggleLock);
  const togglePin = useDoskaStore((s) => s.togglePin);
  const setSpotlight = useDoskaStore((s) => s.setSpotlight);
  const t = useTranslations("Doska.toolbar");
  const [open, setOpen] = React.useState(false);
  const locked = widget.locked === true;
  const pinned = widget.pinned === true;

  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("more", { widget: name })}
          data-doska-no-drag=""
          className={cn(barIconButtonClass, open && "bg-muted text-foreground")}
        >
          <IconMenu className="size-5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="doska-bar doska-sheet w-60 p-0 py-1"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        <MenuItem Icon={IconCopy} shortcut={["Mod", "D"]} onClick={run(() => duplicateWidget(widget.id))}>
          {t("duplicateShort")}
        </MenuItem>
        <MenuItem Icon={locked ? IconUnlock : IconLock} onClick={run(() => toggleLock(widget.id))}>
          {locked ? t("unlockShort") : t("lockShort")}
        </MenuItem>
        {/* Barcha ekranlarda (R398) — taymer va jadval ekran almashganda qoladi. */}
        <MenuItem Icon={IconPin} onClick={run(() => togglePin(widget.id))}>
          {pinned ? t("unpinShort") : t("pinShort")}
        </MenuItem>
        <MenuItem Icon={IconSpotlight} onClick={run(() => setSpotlight(widget.id))}>
          {t("spotlightShort")}
        </MenuItem>
      </PopoverContent>
    </Popover>
  );
}
