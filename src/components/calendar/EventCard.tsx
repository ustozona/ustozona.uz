"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { CardStripes } from "@/components/CardStripes";
import { CardCorner } from "@/components/CardCorner";
import { cn } from "@/lib/utils";

/** Kunning oqimiga nisbatan holat (TodayRail semantikasi):
    past = oʻtib boʻlgan (xira), current = hozir ketyapti (rang halqa),
    next = navbatdagi (yumshoq halqa). */
export type EventCardTemporal = "past" | "current" | "next";

/**
 * EVENT KARTASI — barcha kalendar yuzalari uchun yagona "Variant B"
 * retsepti ([[color-system-layers]]): surfaceStrong yuza + borderMedium
 * chegara + CardStripes cover + chap urgʻu chizigʻi (solid) + textStrong
 * sarlavha. Geometriya (absolute top/height) isteʼmolchidan `style`
 * orqali keladi; DnD/klik atributlari `...rest` bilan oʻtadi.
 */
export function EventCard({
  color,
  title,
  subtitle,
  temporal,
  compact = false,
  muted = false,
  interactive = false,
  corner = true,
  className,
  style,
  children,
  ...rest
}: {
  color: ClassColor;
  title: string;
  /** Sarlavha ostidagi qator (vaqt, ikona bilan). */
  subtitle?: ReactNode;
  temporal?: EventCardTemporal;
  compact?: boolean;
  muted?: boolean;
  interactive?: boolean;
  corner?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  const tints = classTints(color);
  const ringStyle: CSSProperties =
    temporal === "current"
      ? { boxShadow: `0 0 0 2px ${tints.solid}` }
      : temporal === "next"
        ? { boxShadow: `0 0 0 1px color-mix(in oklch, ${tints.solid} 45%, transparent)` }
        : {};
  return (
    <div
      {...rest}
      style={{ ...tints.surfaceStrong, ...tints.borderMedium, ...ringStyle, ...style }}
      className={cn(
        "group/ev relative flex flex-col overflow-hidden rounded-xl border",
        compact ? "px-2.5 pb-2 pt-2.5" : "px-3 pb-2.5 pt-3.5",
        temporal === "past" && "opacity-55",
        muted && "opacity-75",
        interactive && "cursor-pointer transition hover:brightness-[0.97]",
        className,
      )}
    >
      <CardStripes color={color} variant="cover" />
      {corner && <CardCorner color={color} className="-right-5 -top-5 size-16" />}
      <span className="relative flex items-center gap-1.5">
        <span style={{ backgroundColor: tints.solid }} className="h-3.5 w-0.5 shrink-0 rounded-full" aria-hidden />
        <span
          style={tints.textStrong}
          className={cn("min-w-0 truncate font-bold leading-tight", compact ? "text-[13px]" : "text-[15px]")}
        >
          {title}
        </span>
      </span>
      {subtitle != null && (
        <span
          style={tints.textStrong}
          className={cn(
            "relative mt-1 flex min-w-0 items-center gap-1.5 truncate leading-snug opacity-80",
            compact ? "text-[12px]" : "text-[13px]",
          )}
        >
          {subtitle}
        </span>
      )}
      {children}
    </div>
  );
}
