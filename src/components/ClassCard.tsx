"use client";

import * as React from "react";
import { classTints, autoClassColor, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   ClassCard — YAGONA sinf kartasi (butun ilova boʻylab)

   Bitta tizim, ikki zichlik:
   • variant="row"  — ixcham: rangli nuqta + nom. Hoverда oʻngga siljiydi,
        matn qalinlashadi/toʻqlashadi. → zich roʻyxat, dropdown, tanlovlar.
   • variant="card" — toʻliq: solid rangli chegara + och fon + ikona chip +
        nom + ostki matn; tanlanganда "spring" sakrash. → tanlangan/asosiy, grid.

   Rang faqat nuqta / chegara / ikona chipdan keladi; fon eng och, matn
   `foreground` — oʻqilishi uchun. Hammasi bizning tokenlar asosida.
   ════════════════════════════════════════════════════════════════════ */

export type ClassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  name: string;
  subtitle?: string;
  color?: ClassColor;
  variant?: "card" | "row";
  selected?: boolean;
  /** Ikona (standart — GraduationCap) */
  icon?: React.ReactNode;
  /** Oʻng tomondagi amallar (kebab va h.k.) */
  actions?: React.ReactNode;
  /** Qoʻshimcha meta qator (faqat "card") */
  meta?: React.ReactNode;
};

export const ClassCard = React.forwardRef<HTMLDivElement, ClassCardProps>(function ClassCard(
  { name, subtitle, color, variant = "card", selected = false, icon, actions, meta, className, style, ...rest },
  ref,
) {
  const tints = classTints(color ?? autoClassColor(name));

  if (variant === "row") {
    return (
      <div
        ref={ref}
        className={cn(
          "group/cc flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-2 border-transparent px-3 py-2 text-left transition-transform duration-200 ease-out hover:translate-x-1.5",
          selected && "ring-2 ring-inset ring-primary/40",
          className,
        )}
        style={style}
        {...rest}
      >
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tints.solid }} aria-hidden />
        <span className="flex-1 truncate text-sm text-foreground/70 transition-all duration-200 ease-out group-hover/cc:font-semibold group-hover/cc:text-foreground">{name}</span>
        {actions && <span className="ml-auto shrink-0">{actions}</span>}
      </div>
    );
  }

  // variant="card"
  // Tor konteynerda (@container <400px — masalan sidebar ochiq jadval paneli)
  // padding/ikona zichlashadi — matn oʻngdan siqilib qolmaydi.
  const bgHover = `color-mix(in oklch, ${tints.solid} 8%, var(--card))`;
  return (
    <div
      ref={ref}
      className={cn(
        "group/cc relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-4 text-left transition-[background-color,box-shadow] duration-200 ease-out [background-color:var(--cc-bg)] hover:[background-color:var(--cc-bg-h)] hover:shadow-md active:shadow-sm @max-[400px]:gap-2.5 @max-[400px]:p-3",
        selected && "ring-2 ring-inset ring-primary/40",
        className,
      )}
      style={{ borderColor: tints.solid, "--cc-bg": tints.surface.backgroundColor, "--cc-bg-h": bgHover, ...style } as React.CSSProperties}
      {...rest}
    >
      <div className="shrink-0 rounded-xl p-3.5 transition-transform duration-200 ease-out group-hover/cc:-rotate-3 group-hover/cc:scale-110 @max-[400px]:rounded-lg @max-[400px]:p-2.5" style={tints.iconBg}>
        {icon ?? <GraduationCap className="size-7 @max-[400px]:size-6" style={tints.iconText} />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight text-foreground">{name}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-muted-foreground/60">{subtitle}</span>}
        {meta}
      </div>
      {actions}
    </div>
  );
});
