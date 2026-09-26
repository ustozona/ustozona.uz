"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { type ClassColor } from "@/lib/class-colors";
import { iconTintStyle } from "@/lib/doska/tint";

/**
 * PANEL TUGMASI (vosita) — 64 px keng, ichida 28 px ikona, ostida nom
 * (docs/doska-dizayn-tizimi.md §2).
 *
 * BUTUN tugma bosiladi — ikona ham, nom ham: sensorli doskada nishon
 * ≥ 56 px boʻlishi kerak (docs/doska-ux-tadqiqot.md §3, R321). Ilgari
 * faqat 40 px ikona qutisi yorishardi va nom ustiga bosish «ishlamagan»
 * boʻlib koʻrinardi.
 *
 * Koʻrinish uslubdan (`.doska-tool`, `.doska-tool-tile` — doska.css):
 * Sokin va Doskada ikona oʻz tusida (ikki qatlam, bitta tus — ierarxik,
 * tint.ts); Oʻyinchoqda plitka tusda toʻladi, ikona siyohda. Komponent
 * qaysi biri ekanini bilmaydi.
 *
 * Tepadagi 3 px belgi joyi doim band (koʻrinmasa ham), aks holda vidjet
 * ekranga qoʻyilganda qator sakraydi.
 *
 * Alohida faylda — `WidgetBar`, `ShapePicker`, `BackgroundPicker` va
 * «Hammasi» ishlatadi; bitta faylda boʻlsa aylanma import chiqadi.
 */
export function BarButton({
  label,
  Icon,
  active = false,
  tint,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  /**
   * Ikona tusi (class-colors palitrasidan). Berilsa ikona shu tusda
   * boʻladi — massa qatlami shaffofroq, detal qatlami toʻliq.
   * Berilmasa ikona matn rangida qoladi.
   */
  tint?: ClassColor;
  /** Ikona oʻrniga oʻz mazmuni. */
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // ⚠️ `title` YOʻQ — yorliq allaqachon tugmaning ostida koʻrinib
      // turibdi, brauzer tooltipʼi esa oʻsha soʻzni ikkinchi marta,
      // bir soniya kechikib takrorlardi. Nom kesilgan boʻlsa (`truncate`)
      // toʻliq matnni `aria-label` tashiydi.
      aria-label={label}
      className={cn(
        "doska-tool group hover:bg-muted relative flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-1 pt-2 pb-1 transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
      data-icon-tinted={tint ? "" : undefined}
      style={tint ? iconTintStyle(tint) : undefined}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0.5 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full transition-colors",
          active ? "bg-primary" : "bg-transparent",
        )}
      />

      <span className="doska-tool-tile text-foreground/85 group-hover:text-foreground grid size-10 place-items-center rounded-xl">
        {children ?? (Icon ? <Icon className="size-7" /> : null)}
      </span>

      <span className="text-muted-foreground group-hover:text-foreground w-full truncate text-center text-xs leading-tight transition-colors">
        {label}
      </span>
    </button>
  );
}
