"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { CLASS_CHIP_SHELL, classChipStyle } from "@/components/ClassChip";
import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { cn } from "@/lib/utils";

/**
 * SINF CHIPLARI GURUHI — bir nechta sinfdan BITTASINI tanlash.
 *
 * Qayerda: oʻquvchi profili — bola bir nechta sinfda turadi, profil esa bir
 * paytda bitta sinf kontekstida koʻrsatiladi (baho, davomat, topshiriq).
 * Sinf BITTA boʻlsa ham chip chiqadi: kontekst har doim bir xil joyda va
 * bir xil shaklda koʻrinsin — ikkinchi sinf qoʻshilganda interfeys
 * «sakramasin».
 *
 * `ClassChip` bilan farqi: u — bitta tanlangan sinfni koʻrsatadi (krestcha
 * bilan olib tashlanadi); bu — bir nechta variantdan biri TANLANADI.
 * Qobiq va rang `ClassChip` dan olinadi (`CLASS_CHIP_SHELL`,
 * `classChipStyle`) — tanlangan chip aynan `ClassChip` koʻrinishida va
 * u oʻzgarsa, bu ham birga oʻzgaradi.
 *
 * Holatlar faqat rang bilan emas, SHAKL bilan ham farqlanadi (WCAG 1.4.1):
 *   tanlangan   — sinf tinti bilan toʻldirilgan, chegarasiz;
 *   tanlanmagan — shaffof fon + 1px `--border` konturi, muted matn.
 * Ikkalasida ham 1px chegara bor (tanlanganda shaffof) — holat almashganda
 * oʻlcham oʻzgarmaydi. Doira (`ClassSwatch`) har doim sinf rangida.
 * Hover — yagona harakat: fon/matn rangi (`--muted`), transform yoʻq.
 *
 * Semantika — Radix RadioGroup: `role="radiogroup"` + `role="radio"`,
 * strelkalar bilan harakat, Tab bilan guruhga bitta toʻxtash.
 */
export function ClassChipGroup({
  classes,
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel,
}: {
  classes: ClassInfo[];
  value: string;
  onValueChange: (classId: string) => void;
  className?: string;
  "aria-label": string;
}) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="class-chip-group"
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      aria-label={ariaLabel}
      className={cn("flex min-w-0 flex-wrap gap-2", className)}
    >
      {classes.map((c) => {
        const color = classColor(c);
        const checked = c.id === value;
        return (
          <RadioGroupPrimitive.Item
            key={c.id}
            value={c.id}
            title={c.name}
            style={checked ? classChipStyle(color) : undefined}
            className={cn(
              CLASS_CHIP_SHELL,
              "max-w-full border px-2 outline-none",
              "transition-colors duration-fast ease-standard focus-visible:ring-[3px] focus-visible:ring-ring/50",
              checked
                ? "cursor-default border-transparent"
                : "cursor-pointer border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ClassSwatch hex={CLASS_COLOR_HEX[color]} />
            <span className="min-w-0 truncate">{c.name}</span>
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}
