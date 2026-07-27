"use client";

import type { ReactNode } from "react";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * EVENT CHIPI — oy-koʻrinish katakchalari uchun ixcham pill.
 * Fon = tints.chipFill (55% OKLCH mix), matn = textStrong.
 */
export function EventPill({
  color,
  label,
  trailing,
  onClick,
  className,
  title,
}: {
  color: ClassColor;
  label: string;
  /** Oʻng chetdagi belgi (status ikonkasi va h.k.). */
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  const tints = classTints(color);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={tints.solidSurface}
      className={cn(
        "flex w-full items-center gap-1.5 truncate rounded-lg px-2 py-1.5 text-left transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        className,
      )}
    >
      <span style={tints.textOnSolid} className="min-w-0 truncate text-xs font-bold">{label}</span>
      {trailing != null && <span className="ml-auto flex shrink-0 items-center">{trailing}</span>}
    </button>
  );
}
