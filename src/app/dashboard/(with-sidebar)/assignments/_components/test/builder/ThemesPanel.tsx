"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  onClose: () => void;
};

export default function ThemesPanel({ value, onChange, onClose }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <h2 className="text-sm font-semibold">Mavzu</h2>
        <Button variant="ghost" size="icon" aria-label="Panelni yopish" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 scrollbar-hover overflow-y-auto p-4">
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
                      "relative z-[1] block truncate px-1.5 py-1 text-center text-[11px] font-bold",
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
