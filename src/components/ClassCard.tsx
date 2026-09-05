"use client";

import * as React from "react";
import { classTints, autoClassColor, type ClassColor } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   ClassCard — YAGONA sinf kartasi (butun ilova boʻylab)

   Karta pasporti v2 asosida:
   • variant="row"  — ixcham list-row: swatch + nom. Tanlovda tint+rail.
   • variant="card" — toʻliq list-card: neytral border + 44px gradient doira + oq glif + nom.
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
        className={cn("list-row group/cc", className)}
        data-active={selected || undefined}
        style={{ ["--card-accent" as string]: tints.solid, ...(selected ? tints.tint : {}), ...style }}
        {...rest}
      >
        <ClassSwatch hex={tints.solid} className="size-2.5" />
        <span className="flex-1 truncate text-sm text-foreground/70 transition-colors group-hover/cc:text-foreground group-[[data-active=true]]/cc:font-semibold group-[[data-active=true]]/cc:text-foreground">
          {name}
        </span>
        {actions && <span className="ml-auto shrink-0">{actions}</span>}
      </div>
    );
  }

  // variant="card"
  return (
    <div
      ref={ref}
      className={cn(
        "list-card group/cc flex w-full cursor-pointer items-center gap-3 p-4 text-left @max-[400px]:gap-2.5 @max-[400px]:p-3",
        className,
      )}
      data-active={selected || undefined}
      style={{
        ["--card-accent" as string]: tints.solid,
        ...(selected ? tints.tint : {}),
        ...style
      }}
      {...rest}
    >
      <div 
        className="list-card-icon size-11 shrink-0 rounded-full flex items-center justify-center text-white @max-[400px]:size-9" 
        style={tints.gradientTile}
      >
        {icon ?? <GraduationCap className="size-5 @max-[400px]:size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight text-foreground">{name}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>}
        {meta}
      </div>
      {actions}
    </div>
  );
});
