"use client";

import type { ReactNode } from "react";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * EVENT CHIPI — oy-koʻrinish katakchalari uchun ixcham pill.
 *
 * Ikki variant bor va ular MAʼNO tashiydi (bezak emas):
 *   • `tint` — hali dars biriktirilmagan boʻsh jadval sloti. Xira rangli yuza
 *     (7% mix), rangni asosan CHAP CHETDAGI NUQTA tashiydi. Koʻz charchamaydi:
 *     bir oyda yuzlab slot boʻlishi mumkin.
 *   • `fill` — darsi bor slot. Toʻyingan yuza (chipFill, 55% mix) — bir qarashda
 *     "bu kun tayyor" degan signal.
 *
 * Ilgari ikkalasi ham `solidSurface` (100%) edi — oy koʻrinishi rang devoriga
 * aylanib, tayyor/tayyor emas farqi yoʻqolgan edi.
 */
export function EventPill({
  color,
  label,
  variant = "tint",
  trailing,
  onClick,
  className,
  title,
}: {
  color: ClassColor;
  label: string;
  /** `tint` = boʻsh slot (xira), `fill` = darsi bor slot (toʻyingan). */
  variant?: "tint" | "fill";
  /** Oʻng chetdagi belgi (status ikonkasi va h.k.). */
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  const tints = classTints(color);
  const filled = variant === "fill";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      style={filled ? tints.chipFill : tints.tint}
      className={cn(
        "flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-left transition-[filter,box-shadow] hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        className,
      )}
    >
      {/* Rang tashuvchi nuqta — xira yuzada ham sinf rangi aniq oʻqiladi. */}
      <span style={tints.dot} className="size-1.5 shrink-0 rounded-full" />
      <span
        style={filled ? tints.textStrong : tints.textOnTint}
        className={cn("min-w-0 truncate text-xs", filled ? "font-semibold" : "font-medium")}
      >
        {label}
      </span>
      {trailing != null && <span className="ml-auto flex shrink-0 items-center">{trailing}</span>}
    </button>
  );
}
