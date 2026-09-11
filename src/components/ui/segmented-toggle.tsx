"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type SegmentedToggleOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
};

/**
 * Icon+matn segmentli toggle.
 *
 * Faol fon `layoutId` orqali tanlangan variantga SIRPANADI — oniy
 * almashinuvda koʻz oʻzgarishni sezmay qolardi, sirpanish esa qaysi
 * tomonga oʻtganini koʻrsatadi. Bu ikkala variantda ham bir xil; `variant`
 * faqat JOYLASHUVni belgilaydi:
 *
 * - `grid` (boshlangʻich) — butun enni egallaydi, variantlar teng ustunlarda.
 * - `pill` — kompakt, `w-fit`. Yorliq bilan bir qatorda turadigan kichik
 *   boshqaruvlar uchun.
 */
export function SegmentedToggle<T extends string>({
  value,
  onValueChange,
  options,
  variant = "grid",
  iconOnly = false,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  variant?: "grid" | "pill";
  /** Yorliq faqat ekran oʻquvchisi uchun (`sr-only`) — icon-only tugmalar uchun. */
  iconOnly?: boolean;
  className?: string;
  /** Guruh nomi ekran oʻquvchisi uchun (koʻrinadigan yorliq yoʻq boʻlsa). */
  "aria-label"?: string;
}) {
  /* Har bir nusxaga oʻz layoutId'si. Bitta sahifada ikkita toggle boʻlsa
     va id umumiy boʻlsa, fon ular ORASIDA sirpanib ketardi. */
  const pillId = React.useId();
  const isPill = variant === "pill";

  return (
    <ToggleGroup
      type="single"
      variant={isPill ? undefined : "outline"}
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={ariaLabel}
      className={cn(
        /* Pill — toolbar boshqaruvi: 36px (`h-9`) va boshqaruv radiusi
           (`rounded-lg`), yonidagi `size-9` tugmalar bilan bir qatorda. */
        isPill
          ? "h-9 w-fit gap-0.5 rounded-lg border border-border p-0.5"
          : "grid w-full gap-1 rounded-lg data-[variant=outline]:h-auto",
        className,
      )}
      style={
        isPill
          ? undefined
          : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }
      }
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className={cn(
            "relative gap-1.5 text-sm text-muted-foreground",
            /* Faol fonni `motion` beradi — primitivning oʻz foni boʻshatiladi.
               twMerge `data-[state=on]:bg-*` ni shu bilan almashtiradi,
               `!important` kerak emas. */
            "data-[state=on]:bg-transparent data-[state=on]:text-background",
            isPill
              ? "h-full rounded-md px-3 py-0"
              : cn(
                  "px-3 py-2 font-medium data-[variant=outline]:h-auto",
                  opt.hint
                    ? "flex-col items-start text-left"
                    : "flex-row items-center justify-center",
                ),
          )}
        >
          {value === opt.value && (
            <motion.span
              layoutId={pillId}
              className={cn(
                "absolute inset-0 z-0 rounded-md bg-foreground",
              )}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {opt.icon}
            <span className={iconOnly ? "sr-only" : undefined}>{opt.label}</span>
          </span>
          {opt.hint && (
            <span className="relative z-10 text-[11px] opacity-75">
              {opt.hint}
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
