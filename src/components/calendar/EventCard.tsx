"use client";

import { forwardRef, type CSSProperties, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/** Kunning oqimiga nisbatan holat (TodayRail semantikasi):
    past = oʻtib boʻlgan (xira), current = hozir ketyapti (rang halqa),
    next = navbatdagi (yumshoq halqa). */
export type EventCardTemporal = "past" | "current" | "next";

/** Ikki qatlamli tekstura — nuqta qatlami nur qatlamining ustida, shunda
    yorugʻ burchakda ham nuqtalar yoʻqolmaydi. Qadam 8px, nur doim yuqori-chapda. */
const FILLED_TEXTURE: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.09) 1px, transparent 1.4px)," +
    "radial-gradient(130% 90% at 25% 0%, rgb(255 255 255 / 0.42), transparent 62%)",
  backgroundSize: "8px 8px, auto",
};
const EMPTY_TEXTURE: CSSProperties = {
  backgroundImage: "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.04) 1px, transparent 1.4px)",
  backgroundSize: "8px 8px",
};

type EventCardOwnProps = {
  color: ClassColor;
  title: string;
  /** Sarlavha ostidagi qator (vaqt, ikona bilan). */
  subtitle?: ReactNode;
  /** Sarlavha oldidagi ikona (masalan bajarilgan/qoralama belgisi). */
  leading?: ReactNode;
  /** Sarlavha qatoridagi oxirgi belgi (masalan "Nazorat" badge). */
  trailing?: ReactNode;
  /** Absolute oʻng-yuqoridagi amal(lar) — hover'da chiqadi. */
  actions?: ReactNode;
  /** Pastki CTA zonasi (masalan boʻsh slotdagi "+ Dars" menyusi). */
  footer?: ReactNode;
  /** dizayn grammatikasi: ulangan (filled) vs boʻsh (empty) slot */
  state?: "filled" | "empty";
  density?: "cozy" | "compact" | "micro";
  temporal?: EventCardTemporal;
  interactive?: boolean;
  titleRowClassName?: string;
};

type EventCardDivProps = EventCardOwnProps & { as?: "div" } & HTMLAttributes<HTMLDivElement>;
type EventCardButtonProps = EventCardOwnProps & { as: "button" } & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * EVENT KARTASI — barcha kalendar yuzalari uchun yagona retsept.
 * Ikki holat: `filled` (dars ulangan — toʻyingan sinf rangi) va
 * `empty` (boʻsh slot — sinf rangining xira "arvohi"). [[color-system-layers]]
 * Geometriya (absolute top/height) isteʼmolchidan `style` orqali keladi;
 * DnD/klik atributlari `...rest` bilan oʻtadi.
 */
export const EventCard = forwardRef<HTMLDivElement | HTMLButtonElement, EventCardDivProps | EventCardButtonProps>(
  function EventCard(
    {
      color,
      title,
      subtitle,
      leading,
      trailing,
      actions,
      footer,
      state = "filled",
      density = "cozy",
      temporal,
      interactive = false,
      titleRowClassName,
      className,
      style,
      children,
      as = "div",
      ...rest
    },
    ref,
  ) {
    const tints = classTints(color);
    const filled = state === "filled";
    const ringStyle: CSSProperties =
      temporal === "current"
        ? { boxShadow: `0 0 0 2px color-mix(in oklch, ${tints.solid} 55%, transparent)` }
        : temporal === "next"
          ? { boxShadow: `0 0 0 1px color-mix(in oklch, ${tints.solid} 35%, transparent)` }
          : {};

    const Comp = as as "div";
    return (
      <Comp
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        ref={ref as never}
        style={{
          ...(filled ? tints.solidSurface : tints.tint),
          ...ringStyle,
          ...style,
        }}
        className={cn(
          "group/ev relative flex flex-col overflow-hidden rounded-lg p-2 text-left",
          density === "micro" ? "gap-0" : "gap-0.5",
          temporal === "past" && "grayscale-[0.4] opacity-70",
          interactive && "cursor-pointer transition hover:brightness-[0.97]",
          as === "button" && "w-full",
          className,
        )}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0" style={filled ? FILLED_TEXTURE : EMPTY_TEXTURE} />
        <span className={cn("relative flex min-w-0 items-center gap-1.5", density === "compact" && "items-baseline", titleRowClassName)}>
          {leading}
          <span
            style={filled ? tints.textOnSolid : undefined}
            className={cn(
              "min-w-0 truncate font-bold leading-tight",
              filled ? undefined : "text-muted-foreground",
              density === "micro" ? "text-[11px]" : "text-xs",
            )}
          >
            {title}
          </span>
          {trailing}
          {density === "compact" && subtitle != null && (
            <span
              style={filled ? tints.textOnSolid : undefined}
              className={cn("shrink-0 truncate text-[10px] opacity-70", filled ? undefined : "text-muted-foreground")}
            >
              {subtitle}
            </span>
          )}
        </span>
        {density === "cozy" && subtitle != null && (
          <span
            style={filled ? tints.textOnSolid : undefined}
            className={cn("relative flex min-w-0 items-center gap-1.5 truncate text-[10px] opacity-70", filled ? undefined : "text-muted-foreground")}
          >
            {subtitle}
          </span>
        )}
        {children}
        {actions != null && (
          <div className="absolute right-1 top-1 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover/ev:opacity-100 [@media(hover:none)]:opacity-100">
            {actions}
          </div>
        )}
        {footer != null && <div className="relative mt-auto pt-1.5">{footer}</div>}
      </Comp>
    );
  },
);
