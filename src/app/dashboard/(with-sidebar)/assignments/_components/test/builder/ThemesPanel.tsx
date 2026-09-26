"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STAGE_FONTS, stageFontVars, type StageFontId } from "@/lib/stage-fonts";
import { STAGE_FONT_CLASS } from "@/components/stage/stage-font-faces";
import { STAGE_STYLES, type StageStyleId } from "@/lib/stage-styles";
import { choiceVars } from "@/components/stage/StageParts";
import { STAGE_THEMES } from "./types";

/* Mavzu paneli — oʻng ustunning ikkinchi rejimi ("Mavzular").

   Nega popover emas, PANEL: mavzu tanlash — koʻrish ishi. Foydalanuvchi
   variantni bosadi, 16:9 sahnada natijani koʻradi, keyin boshqasini
   bosadi. Popover har bosishda yopilib qolsa, taqqoslash imkonsiz.
   Shu sababli u xossalar paneli bilan bir xil ustunda, bir xil kenglikda
   yashaydi va reyl ikkalasini almashtiradi.

   Guruh sarlavhasi/yigʻish yoʻq — faqat bitta guruh ("Gradient") qoldi,
   "Sodda" (juda yassi) va "Toʻq" (matn kontrasti past) olib tashlangan. */

type Props = {
  value: string;
  onChange: (id: string) => void;
  /** Sahna shrifti — tekshirilgan roʻyxatdan (lib/stage-fonts.ts). */
  font: StageFontId;
  onFontChange: (id: StageFontId) => void;
  /** Sahna uslubi — tayyor koʻrinish (lib/stage-styles.ts). */
  stageStyle: StageStyleId;
  onStageStyleChange: (id: StageStyleId) => void;
  onClose: () => void;
};

export default function ThemesPanel({
  value,
  onChange,
  font,
  onFontChange,
  stageStyle,
  onStageStyleChange,
  onClose,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <h2 className="text-sm font-semibold">Mavzu</h2>
        <Button variant="ghost" size="icon" aria-label="Panelni yopish" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 scrollbar-hover overflow-y-auto p-4">
        {/* Uslub — kichik eskiz: klassikda 2×2 tor, zamonaviyda bir qator
            baland plitkalar. Farq faqat koʻrinishda, savollar oʻzgarmaydi. */}
        <h3 className="mb-2 text-caption font-semibold text-muted-foreground">Sahna uslubi</h3>
        <ul className="mb-6 grid grid-cols-2 gap-2">
          {STAGE_STYLES.map((st) => {
            const isActive = st.id === stageStyle;
            return (
              <li key={st.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  title={st.note}
                  onClick={() => onStageStyleChange(st.id)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-md border p-2 text-left transition-colors",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid aspect-[16/9] w-full gap-1 rounded-sm p-2",
                      st.id === "modern" ? "grid-cols-4 grid-rows-[2fr_3fr]" : "grid-cols-2 grid-rows-[1fr_1fr_1fr]",
                    )}
                    style={{ background: "var(--stage-neutral)" }}
                  >
                    <span
                      className={cn(
                        "rounded-[3px]",
                        st.id === "modern" ? "col-span-4 bg-black/35" : "col-span-2 bg-white/90",
                      )}
                    />
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="rounded-[3px]" style={{ ...choiceVars(i), background: "var(--choice)" }} />
                    ))}
                  </span>
                  <span className="text-sm font-semibold">{st.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Shrift — namunasi oʻsha shriftning oʻzida (sarlavha qalinligida),
            kirill harflari bilan: oʻqituvchi tanlashdan oldin koʻradi. */}
        <h3 className="mb-2 text-caption font-semibold text-muted-foreground">Shrift</h3>
        <ul className={cn("mb-6 flex flex-col gap-2", STAGE_FONT_CLASS)}>
          {STAGE_FONTS.map((f) => {
            const isActive = f.id === font;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onFontChange(f.id)}
                  className={cn(
                    "stage-font flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                  style={stageFontVars(f.id)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base" style={{ fontWeight: f.heading }}>
                      {f.label}
                    </span>
                    <span className="block truncate text-caption text-muted-foreground" style={{ fontWeight: f.text }}>
                      {f.note}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg" style={{ fontWeight: f.heading }}>
                    Аа Ққ Ўў
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <h3 className="mb-2 text-caption font-semibold text-muted-foreground">Fon</h3>
        <ul className="grid grid-cols-2 gap-2">
          {STAGE_THEMES.map((theme) => {
            const isActive = theme.id === value;
            return (
              <li key={theme.id}>
                {/* Joriy mavzu — bosilmaydi (viktorina-uslub platformalarda ham qoʻllanilgan
                    karta `disabled`). Nom karta USTIDA, pastki
                    lentada — koʻrinish butun kartani egallaydi. */}
                <button
                  type="button"
                  disabled={isActive}
                  onClick={() => onChange(theme.id)}
                  className={cn(
                    "theme-card-preview flex aspect-[4/3] w-full flex-col justify-end rounded-md transition-shadow",
                    isActive
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "cursor-pointer hover:ring-2 hover:ring-primary/40"
                  )}
                  style={{ background: theme.bg }}
                >
                  <span
                    className={cn(
                      "relative z-[1] block truncate px-1.5 py-1 text-center text-tag font-bold",
                      theme.onBand === "light" ? "text-white" : "text-black/80"
                    )}
                    style={{ background: theme.band }}
                  >
                    {theme.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
