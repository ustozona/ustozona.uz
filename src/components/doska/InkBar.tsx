"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useActiveScreen, useDoskaStore } from "@/lib/doska/store";
import { backgroundById } from "@/lib/doska/backgrounds";
import { currentSize, useInkTool, type InkMode } from "@/lib/doska/ink-tool";
import { INK_SIZES, MARKER_COLORS, PEN_COLORS, inkColorVar, visibleInk, type InkSize } from "@/lib/doska/ink";
import { BarButton } from "./BarButton";
import { BarGroup, BarSeparator, BarTextButton } from "./BarGroup";
import { useDockLayout } from "./dock";
import { IconCheck, IconCursor, IconEraser, IconLaser, IconMarker, IconPen, IconTrash } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   QOʻLYOZMA PANELI — yozish rejimida vidjet paneli OʻRNIDA turadi.

   Tuzilma: Tanlash │ Qalam · Marker · Oʻchirgʻich · Lazer │ ranglar │
   qalinlik [· Qisman] │ Tozalash [│ Faqat qalam].

   «Faqat qalam» faqat qalam yozgandan keyin chiqadi (`penSeen`,
   lib/doska/ink-tool.ts): qalami yoʻq qurilmada u keraksiz shovqin.
   «Qisman» — faqat oʻchirgʻichda: tekkan joyni kesadi, butun chiziqni
   emas (R334). Lazerda rang va qalinlik yoʻq — u bitta, yorqin qizil.

   ⚠️ Vidjet paneli bilan BIR JOYDA, yonida emas: ikkalasi birga 75″
   doskada ham bir qatorga sigʻmaydi, oʻqituvchi esa bir vaqtda yo yozadi,
   yo vidjet qoʻyadi. «Tanlash» — birinchi tugma: rejimdan chiqish doim
   bir xil joyda (qoʻl yopmaydigan pastki chetda — R339, R319).

   Rang namunalari `data-bg-tone` ichida chiziladi — kanvasdagi bilan
   AYNAN bir token: toʻq doskada «Qora» oʻrniga «Oq» (boʻr) koʻrinadi
   va rangli qalamlar ham ochroq tusda (src/styles/doska.css).

   Nishonlar ≥ 44 px (R321) — rang va qalinlik tugmalari ham.
   ════════════════════════════════════════════════════════════════════ */

const SIZE_KEYS = { 1: "thin", 2: "medium", 3: "thick" } as const;
/** Qalinlik tugmasidagi nuqta diametri (px) — daraja koʻzga koʻrinsin. */
const SIZE_DOTS = { 1: 6, 2: 11, 3: 18 } as const;

export function InkBar() {
  const t = useTranslations("Doska.ink");
  const { orientation } = useDockLayout();
  const vertical = orientation === "vertical";

  const mode = useInkTool((s) => s.mode);
  const lastTool = useInkTool((s) => s.lastTool);
  const penColor = useInkTool((s) => s.penColor);
  const markerColor = useInkTool((s) => s.markerColor);
  const size = useInkTool(currentSize);
  const setMode = useInkTool((s) => s.setMode);
  const setColor = useInkTool((s) => s.setColor);
  const setSize = useInkTool((s) => s.setSize);

  const penSeen = useInkTool((s) => s.penSeen);
  const penOnly = useInkTool((s) => s.penOnly);
  const togglePenOnly = useInkTool((s) => s.togglePenOnly);
  const eraserPartial = useInkTool((s) => s.eraserPartial);
  const toggleEraserPartial = useInkTool((s) => s.toggleEraserPartial);

  const clearInk = useDoskaStore((s) => s.clearInk);
  const screen = useActiveScreen();
  // Koʻrinib turgan yozuv: taqdimotning boshqa slaydidagi belgi «Tozalash» ga kirmaydi.
  const hasInk = React.useMemo(() => visibleInk(screen).length > 0, [screen]);
  const tone = backgroundById(screen?.background).tone;

  // Oʻchirgichda ham oxirgi asbobning palitrasi koʻrinadi: rang bosilsa
  // oʻsha asbobga qaytiladi (`setColor`) — panel eni sakramaydi.
  const tool = mode === "pen" || mode === "marker" ? mode : lastTool;
  const palette = tool === "marker" ? MARKER_COLORS : PEN_COLORS;
  const color = tool === "marker" ? markerColor : penColor;
  const erasing = mode === "eraser";
  // Lazerda rang va qalinlik yoʻq — guruhlar yashiriladi.
  const laser = mode === "laser";

  const colorLabel = (key: string) =>
    key === "auto" ? t(tone === "dark" ? "colors.autoDark" : "colors.autoLight") : t(`colors.${key}`);

  const divider = <BarSeparator vertical={vertical} />;

  const toolButton = (m: InkMode, label: string, Icon: React.ComponentType<{ className?: string }>) => (
    <BarButton
      label={label}
      Icon={Icon}
      active={mode === m}
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      className="aria-pressed:bg-muted w-20"
    />
  );

  return (
    <BarGroup
      variant="padded"
      layer="bar"
      orientation={orientation}
      role="toolbar"
      aria-label={t("toolbar")}
      // Tor ekranda panel oʻz ustunidan oshmaydi va ichida aylanadi —
      // `WidgetBar` dagi bilan bir xil sabab.
      className={cn(
        vertical
          ? "max-h-full min-h-0 overflow-y-auto overscroll-y-contain"
          : "max-w-full overflow-x-auto overscroll-x-contain",
      )}
    >
      <BarButton label={t("select")} Icon={IconCursor} onClick={() => setMode(null)} />

      {divider}

      {toolButton("pen", t("pen"), IconPen)}
      {toolButton("marker", t("marker"), IconMarker)}
      {toolButton("eraser", t("eraser"), IconEraser)}
      {toolButton("laser", t("laser"), IconLaser)}

      {!laser && divider}

      <div
        role="group"
        aria-label={t("color")}
        data-bg-tone={tone}
        className={cn("grid shrink-0", vertical ? "grid-cols-2" : "grid-flow-col", laser && "hidden")}
      >
        {palette.map((key) => {
          const selected = !erasing && key === color;
          return (
            <button
              key={key}
              type="button"
              aria-label={colorLabel(key)}
              aria-pressed={selected}
              onClick={() => setColor(key)}
              className="hover:bg-muted focus-visible:ring-ring grid size-11 place-items-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-7 rounded-full transition-transform",
                  selected
                    ? "ring-primary ring-offset-background scale-110 ring-2 ring-offset-2"
                    : // Ingichka halqa — toʻq siyoh namunasi grafit panelda ham ajralsin.
                      "ring-foreground/25 ring-1 ring-inset",
                )}
                style={{ background: `var(${inkColorVar(tool, key)})` }}
              />
            </button>
          );
        })}
      </div>

      {!laser && divider}

      <div
        role="group"
        aria-label={t("size")}
        data-bg-tone={tone}
        className={cn("flex shrink-0", vertical && "flex-col", laser && "hidden")}
      >
        {INK_SIZES.map((s: InkSize) => (
          <button
            key={s}
            type="button"
            aria-label={t(`sizes.${SIZE_KEYS[s]}`)}
            aria-pressed={size === s}
            onClick={() => setSize(s)}
            className="hover:bg-muted aria-pressed:bg-muted focus-visible:ring-ring grid size-11 place-items-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={cn("rounded-full", erasing ? "border-foreground border-2" : "ring-foreground/25 ring-1")}
              style={{
                width: SIZE_DOTS[s],
                height: SIZE_DOTS[s],
                background: erasing ? undefined : `var(${inkColorVar(tool, color)})`,
              }}
            />
          </button>
        ))}
      </div>

      {erasing && (
        <BarTextButton
          label={t("erasePartial")}
          aria-pressed={eraserPartial}
          onClick={toggleEraserPartial}
          className="aria-pressed:bg-muted shrink-0 rounded-xl"
          icon={
            <IconCheck className={cn("size-5 transition-opacity", eraserPartial ? "opacity-100" : "opacity-25")} />
          }
        />
      )}

      {divider}

      <BarButton
        label={t("clear")}
        aria-label={t("clearLabel")}
        Icon={IconTrash}
        disabled={!hasInk}
        onClick={clearInk}
        className="disabled:pointer-events-none disabled:opacity-30"
      />

      {penSeen && (
        <>
          {divider}
          <BarTextButton
            label={t("penOnly")}
            aria-pressed={penOnly}
            onClick={togglePenOnly}
            className="aria-pressed:bg-muted shrink-0 rounded-xl"
            icon={
              <IconCheck className={cn("size-5 transition-opacity", penOnly ? "opacity-100" : "opacity-25")} />
            }
          />
        </>
      )}
    </BarGroup>
  );
}
