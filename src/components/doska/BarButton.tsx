"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { type ClassColor } from "@/lib/class-colors";
import { iconTintStyle } from "@/lib/doska/tint";

/**
 * PANEL TUGMASI (vosita) — 64 px ustun: tepada ekrandagi nusxalar
 * nuqtalari, oʻrtada 52 px plitka (ikona), ostida 11 px nom
 * (docs/doska-dizayn-tizimi.md §2, docs/doska-referens-koriklari.md §4).
 *
 * BUTUN ustun bosiladi — ikona ham, nom ham: sensorli doskada nishon
 * ≥ 56 px boʻlishi kerak (docs/doska-ux-tadqiqot.md §3, R321). Yorishish
 * esa faqat plitkada — nom ostida «tugma» chegarasi koʻrinmaydi.
 *
 * Koʻrinish uslubdan (`.doska-tool`, `.doska-tool-tile` — doska.css):
 * standart uslubda ikona oʻz tusida (ikki qatlam, bitta tus — ierarxik,
 * tint.ts); Oʻyinchoqda plitka tusda toʻladi, ikona siyohda. Komponent
 * qaysi biri ekanini bilmaydi.
 *
 * Nuqtalar qatori joyi doim band (koʻrinmasa ham), aks holda vidjet
 * ekranga qoʻyilganda qator sakraydi.
 *
 * Alohida faylda — `WidgetBar`, `ShapePicker`, `BackgroundPicker`,
 * «Hammasi» va qoʻlyozma paneli ishlatadi; bitta faylda boʻlsa aylanma
 * import chiqadi.
 */

/** Nuqtalar shu songa yetgach koʻpaymaydi — panelda joy cheklangan. */
const MAX_DOTS = 3;

export function BarButton({
  label,
  Icon,
  active = false,
  count,
  tint,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  /** Bitta nuqta — «yoqilgan» (qoʻlyozma panelidagi tanlangan asbob). */
  active?: boolean;
  /** Ekranda shu turdagi nechta vidjet bor — shuncha nuqta (≤ 3). */
  count?: number;
  /**
   * Ikona tusi (class-colors palitrasidan). Berilsa ikona shu tusda
   * boʻladi — massa qatlami shaffofroq, detal qatlami toʻliq.
   * Berilmasa ikona matn rangida qoladi.
   */
  tint?: ClassColor;
  /** Ikona oʻrniga oʻz mazmuni. */
  children?: React.ReactNode;
}) {
  const dots = Math.min(count ?? (active ? 1 : 0), MAX_DOTS);

  return (
    <button
      type="button"
      // ⚠️ `title` YOʻQ — yorliq allaqachon tugmaning ostida koʻrinib
      // turibdi, brauzer tooltipʼi esa oʻsha soʻzni ikkinchi marta,
      // bir soniya kechikib takrorlardi. Nom kesilgan boʻlsa (`truncate`)
      // toʻliq matnni `aria-label` tashiydi.
      aria-label={label}
      className={cn(
        "doska-tool group relative flex w-16 shrink-0 flex-col items-center rounded-lg pb-0.5 outline-none",
        "disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
      data-icon-tinted={tint ? "" : undefined}
      style={tint ? iconTintStyle(tint) : undefined}
      {...props}
    >
      <span aria-hidden="true" className="flex h-[3px] items-center justify-center gap-0.5">
        {Array.from({ length: dots }, (_, i) => (
          <span key={i} className="bg-muted-foreground size-[3px] rounded-full" />
        ))}
      </span>

      <span
        className={cn(
          "doska-tool-tile text-foreground grid size-[52px] place-items-center rounded-lg transition-colors",
          "group-hover:bg-muted group-focus-visible:ring-ring group-focus-visible:ring-2",
          "my-1",
        )}
      >
        {children ?? (Icon ? <Icon className="size-9" /> : null)}
      </span>

      <span className="text-foreground text-tag w-full max-w-[52px] truncate text-center leading-tight font-semibold">
        {label}
      </span>
    </button>
  );
}
