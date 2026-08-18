"use client";

import { cn } from "@/lib/utils";
import { classTints } from "@/lib/class-colors";
import { MATERIAL_KINDS, type MaterialKind } from "@/lib/material-kinds";

/**
 * Material turining rangli plitkasi — kutubxona roʻyxati, «Yaratish»
 * menyusi va topshiriq muharriri UCHALASI shu komponentni ishlatadi.
 *
 * Nega yagona komponent: oʻqituvchi menyuda koʻrgan yashil belgisini
 * roʻyxatda ham, muharrirda ham darhol tanishi kerak. Uch joyda uch xil
 * chizilsa, rang tili maʼnosini yoʻqotadi.
 */
export function MaterialKindTile({
  kind,
  className,
  muted = false,
}: {
  kind: MaterialKind;
  className?: string;
  /** Hali tayyor boʻlmagan tur — rang soʻniq, ammo shakl saqlanadi. */
  muted?: boolean;
}) {
  const meta = MATERIAL_KINDS[kind];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        muted && "opacity-40 grayscale",
        className
      )}
      style={classTints(meta.color).gradientTile}
    >
      <Icon className="size-[18px] text-white" />
    </span>
  );
}
