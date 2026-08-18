"use client";

import { cn } from "@/lib/utils";
import { classTints } from "@/lib/class-colors";
import { MATERIAL_KINDS, type MaterialKind } from "@/lib/material-kinds";

/**
 * Material turining rangli plitkasi — kutubxona roʻyxati, «Yaratish»
 * menyusi va topshiriq muharriridagi shakl tanlovi UCHALASI shu
 * komponentni ishlatadi.
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
  /**
   * Hali tayyor boʻlmagan tur — plitka NEYTRAL chiziladi.
   *
   * Ilgari bu yerda rangli plitkaga `opacity` + `grayscale` berilardi;
   * natijada rang oʻchmasdi, kirlashardi. Toʻliq neytral yuza esa
   * «bu hali yoʻq» degan xabarni ikkilanmasdan beradi.
   */
  muted?: boolean;
}) {
  const meta = MATERIAL_KINDS[kind];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        muted && "bg-muted text-muted-foreground",
        className
      )}
      style={muted ? undefined : classTints(meta.color).gradientTile}
    >
      <Icon className={cn("size-[18px]", !muted && "text-white")} />
    </span>
  );
}
