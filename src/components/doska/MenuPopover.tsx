"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Z_MENU } from "@/lib/doska/layers";
import { barIconButtonClass } from "./BarGroup";
import { ProBadge } from "./ProBadge";
import { ShortcutKeys } from "./ShortcutKeys";
import { IconArrowRight, IconMenu } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   ⋮ MENYULAR — Doskadagi hamma ochiladigan menyuning umumiy qolipi.

   Uchta joyda ishlatiladi: asosiy menyu (oʻng tepa, `DoskaMenu`), panel
   menyusi (vidjet panelining oʻng ustuni, `BarEndColumn`) va vidjetning
   «yana» menyusi (`WidgetToolbar`). Tugma, oyna materiali, z-qatlam va
   band koʻrinishi BIR joyda — biri oʻzgarsa qolgani ortda qolmaydi.

   ⚠️ Tugma `<BarIconButton>` ga OʻRALMAYDI: u `PopoverTrigger asChild`
   ning bolasi, zanjir esa `asChild` → `<Tooltip>` (DOM element emas)
   boʻlib uzilardi. Menyu tugmasiga tooltip kerak ham emas — bosilganda
   mazmuni oʻzini tanishtiradi.

   Oyna `body` ga chiqadi — kanvasdan tashqarida, shuning uchun bandlarga
   `data-doska-no-drag` kerak emas (kanvas dispatcheri uni koʻrmaydi).
   ════════════════════════════════════════════════════════════════════ */

export function MenuPopover({
  label,
  open,
  onOpenChange,
  side,
  align,
  sideOffset = 8,
  triggerProps,
  className,
  children,
}: {
  /** Tugmaning ekran oʻquvchi uchun nomi. */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "top" | "bottom" | "left" | "right";
  align: "start" | "center" | "end";
  sideOffset?: number;
  /** Tugmaga qoʻshimcha atributlar (masalan `data-doska-no-drag`). */
  triggerProps?: Omit<React.ComponentProps<"button">, "type" | "aria-label" | "className" | "children">;
  /** Oyna kengligi va boshqa joylashuv klasslari. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          {...triggerProps}
          className={cn(barIconButtonClass, "rounded-md", open && "bg-muted text-foreground")}
        >
          <IconMenu className="size-5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn("doska-bar doska-sheet p-0", className)}
        // Sozlama oynasi va burchak tugmalaridan ham yuqorida (`layers.ts`).
        style={{ zIndex: Z_MENU }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

const ITEM_CLASS =
  "hover:bg-muted flex min-h-11 w-full items-center gap-2 px-4 py-2 text-sm transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent";

/** Menyu bandi — ikona, nom, ixtiyoriy izoh, yorliq va «ichkariga» strelkasi. */
export function MenuItem({
  Icon,
  children,
  href,
  pro = false,
  shortcut,
  hint,
  next = false,
  ...props
}: React.ComponentProps<"button"> & {
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
  /** Pullik imkoniyat — yonida yulduzcha koʻrinadi. */
  pro?: boolean;
  /** Klaviatura yorligʻi — faqat koʻrsatish uchun. Massiv — `ShortcutKeys` (`["Mod", "Z"]`). */
  shortcut?: string | readonly string[];
  /** Band ostidagi izoh — masalan nega nofaol ekani. */
  hint?: string;
  /** Band menyu ichida yangi boʻlim ochadi — oʻngda strelka. */
  next?: boolean;
}) {
  const inner = (
    <>
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 text-left">
        {children}
        {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
      </span>
      {pro && <ProBadge />}
      {typeof shortcut === "string" ? (
        <kbd className="text-muted-foreground rounded border px-1.5 font-mono text-xs leading-5">{shortcut}</kbd>
      ) : shortcut ? (
        <ShortcutKeys keys={shortcut} />
      ) : null}
      {next && <IconArrowRight className="text-muted-foreground size-4 shrink-0" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={ITEM_CLASS}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={ITEM_CLASS} {...props}>
      {inner}
    </button>
  );
}
