"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { type ClassColor } from "@/lib/class-colors";
import { iconTintStyle } from "@/lib/doska/tint";

/**
 * PANEL TUGMASI — 40×40, ichida 28px ikona, ostida 11px nom
 * (docs/doska-dizayn-tizimi.md §2).
 *
 * Panel FONI neytral (oq), ikonalar esa rangli: ikkala qatlam ham
 * vidjet tusida, farq faqat shaffoflikda (ierarxik rejim, tint.ts).
 * Shunda panel oʻziga eʼtibor tortmaydi, lekin har vidjet uzoqdan
 * tanilib turadi.
 *
 * Tepadagi 3px joy doim band (indikator koʻrinmasa ham), aks holda
 * vidjet ekranga qoʻyilganda qator sakraydi.
 *
 * Alohida faylda — `WidgetBar` ham, `BackgroundPicker` ham ishlatadi;
 * bitta faylda boʻlsa aylanma import chiqadi.
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
  /** Ikona oʻrniga oʻz mazmuni (masalan fon namunasi). */
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      className={cn("group flex w-[52px] shrink-0 flex-col items-center gap-1", className)}
      data-icon-tinted={tint ? "" : undefined}
      style={tint ? iconTintStyle(tint) : undefined}
      {...props}
    >
      <span
        className={cn(
          "h-[3px] w-7 rounded-full transition-colors",
          active ? "bg-primary" : "bg-transparent",
        )}
      />

      <span
        className={cn(
          "text-foreground/85 group-hover:bg-muted group-hover:text-foreground grid size-10 place-items-center rounded-lg transition-colors",
          "group-focus-visible:ring-ring group-focus-visible:ring-2 group-focus-visible:ring-offset-2",
        )}
      >
        {children ?? (Icon ? <Icon className="size-7" /> : null)}
      </span>

      <span className="text-muted-foreground group-hover:text-foreground w-full truncate text-center text-[11px] leading-tight font-medium transition-colors">
        {label}
      </span>
    </button>
  );
}
