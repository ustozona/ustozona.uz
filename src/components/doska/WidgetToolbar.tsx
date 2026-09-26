"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import type { DoskaWidget } from "@/lib/doska/types";
import { BarDivider, BarGroup, BarTextButton } from "./BarGroup";
import { IconCopy, IconLock, IconSettings, IconSpotlight, IconTrash, IconUnlock } from "./icons";
import { clamp, usePinnedPosition } from "./usePinnedPosition";
import { hasSettings } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   KONTEKST ASBOBLAR PANELI — tanlangan vidjet ustida suzadi.

   Sozlash · Nusxa · Qulflash · Markazga │ Oʻchirish
   (docs/doska-ux-tadqiqot.md R310–R311, Q2).

   Tugmalarda nom DOIM koʻrinadi (`BarTextButton`): sensorli doskada
   hover yoʻq va tooltip chiqmaydi (R322).

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
 * eng yomoni panel pastga tushadi, bu esa buzilish emas. 44 px tugma +
 * eng qalin uslub chegarasi (Oʻyinchoq, 2 × 3 px).
 */
const HEIGHT = 50;

export function WidgetToolbar({ widget }: { widget: DoskaWidget }) {
  const removeWidget = useDoskaStore((s) => s.removeWidget);
  const duplicateWidget = useDoskaStore((s) => s.duplicateWidget);
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const toggleLock = useDoskaStore((s) => s.toggleLock);
  const setSpotlight = useDoskaStore((s) => s.setSpotlight);
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
        {hasSettings(widget.kind) && (
          <BarTextButton
            label={t("settingsShort")}
            aria-label={t("settings", { widget: name })}
            aria-pressed={settingsOpen}
            icon={<IconSettings className="size-5" />}
            data-doska-no-drag=""
            onClick={() => toggleSettings(widget.id)}
            className={settingsOpen ? "bg-muted text-foreground" : undefined}
          />
        )}

        <BarTextButton
          label={t("duplicateShort")}
          aria-label={t("duplicate", { widget: name })}
          icon={<IconCopy className="size-5" />}
          data-doska-no-drag=""
          onClick={() => duplicateWidget(widget.id)}
        />

        <BarTextButton
          label={locked ? t("unlockShort") : t("lockShort")}
          aria-label={locked ? t("unlock", { widget: name }) : t("lock", { widget: name })}
          aria-pressed={locked}
          icon={locked ? <IconUnlock className="size-5" /> : <IconLock className="size-5" />}
          data-doska-no-drag=""
          onClick={() => toggleLock(widget.id)}
        />

        <BarTextButton
          label={t("spotlightShort")}
          aria-label={t("spotlight", { widget: name })}
          icon={<IconSpotlight className="size-5" />}
          data-doska-no-drag=""
          onClick={() => setSpotlight(widget.id)}
        />

        {!locked && (
          <>
            <BarDivider />
            <BarTextButton
              label={t("removeShort")}
              aria-label={t("remove", { widget: name })}
              icon={<IconTrash className="size-5" />}
              data-doska-no-drag=""
              onClick={() => removeWidget(widget.id)}
              className="hover:text-destructive"
            />
          </>
        )}
      </BarGroup>
    </div>
  );
}
