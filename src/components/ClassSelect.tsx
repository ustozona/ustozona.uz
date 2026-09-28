"use client";

import { createElement } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { SelectContent } from "@/components/ui/select";
import { classTints } from "@/lib/class-colors";
import { classIcon } from "@/lib/class-icons";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { cn } from "@/lib/utils";

/**
 * SINF TANLAGICH — bir nechta sinfdan BITTASINI tanlash (ochiladigan roʻyxat).
 *
 * Qayerda: oʻquvchi profili — bola bir nechta sinfda turadi, profil esa bir
 * paytda bitta sinf kontekstida koʻrsatiladi (baho, davomat, topshiriq).
 * Sinf BITTA boʻlsa ham tanlagich chiqadi: kontekst har doim bir joyda va
 * bir shaklda turadi, roʻyxat ochilsa esa «boshqa sinf yoʻq» degani koʻrinadi.
 *
 * Anatomiya Sinflar paneli tilidan (`ClassListPanel`, DESIGN.md §2 va §8
 * deviatsiyalari):
 *   glif      — oʻsha `[data-slot="class-glyph"]` (36px tint doira, 18px
 *               ikonka, rang `--card-accent` dan) — ikkinchi nusxa yoʻq;
 *   trigger   — `.list-row--glyph` qatori: tanlangan sinf 7% tint fon + 1px
 *               chegara TOʻLIQ sinf rangida. Glif ataylab toʻyinmagan: profilda
 *               tepada toʻyingan avatar doirasi turadi. Hover-harakat — panel
 *               bilan bir xil yagona `scale(1.08)` (CSS, reduced-motion'da oʻchadi);
 *   roʻyxat   — oddiy `SelectContent` (popper, trigger enida); qator 44px.
 *               Tanlangan qator — doimiy yengil fon + oʻngda sinf rangidagi
 *               doira, belgi siyohi `textOnSolid` (palitra ranglari yorugʻ,
 *               oq belgi ularda oʻqilmaydi).
 *
 * Semantika — Radix Select: trigger `combobox`, roʻyxat `listbox`, yuqori/
 * pastki strelka, harf bilan qidirish, Esc.
 */
export function ClassSelect({
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
  const selected = classes.find((c) => c.id === value);
  if (!selected) return null;
  const tints = classTints(classColor(selected));

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        data-slot="class-select"
        aria-label={`${ariaLabel}: ${selected.name}`}
        title={selected.name}
        style={{
          ["--card-accent" as string]: tints.solid,
          ...tints.tint,
          borderColor: tints.solid,
        }}
        className={cn(
          "list-row--glyph group/class-select flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-md border px-3 text-left outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className
        )}
      >
        <ClassGlyph icon={selected.icon} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {selected.name}
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-fast ease-standard group-data-[state=open]/class-select:rotate-180"
            aria-hidden="true"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectContent position="popper" sideOffset={4}>
        {classes.map((c) => {
          const itemTints = classTints(classColor(c));
          return (
            <SelectPrimitive.Item
              key={c.id}
              value={c.id}
              title={c.name}
              style={{ ["--card-accent" as string]: itemTints.solid }}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sm px-2 py-1 text-sm outline-hidden select-none data-[state=checked]:bg-muted/60 data-[highlighted]:bg-muted"
            >
              <ClassGlyph icon={c.icon} />
              <SelectPrimitive.ItemText asChild>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{c.name}</span>
              </SelectPrimitive.ItemText>
              <SelectPrimitive.ItemIndicator
                className="flex size-5 shrink-0 items-center justify-center rounded-full"
                style={{ ...itemTints.solidSurface, ...itemTints.textOnSolid }}
              >
                <Check className="size-3" strokeWidth={3} aria-hidden="true" />
              </SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>
          );
        })}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}

/** Sinf ikonkasi tint doirada — Sinflar panelidagi `class-glyph` bilan bir
    xil; rang ota elementdagi `--card-accent` dan. */
function ClassGlyph({ icon }: { icon?: string }) {
  return (
    <span data-slot="class-glyph" aria-hidden="true">
      {/* `classIcon` modul darajasidagi barqaror lucide komponentini qaytaradi;
          `createElement` — render ichida komponent «yaratilmaydi» (lint). */}
      {createElement(classIcon(icon))}
    </span>
  );
}
