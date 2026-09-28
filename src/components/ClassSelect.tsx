"use client";

import { ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { CLASS_ROW_CLASS, ClassRowGlyph, classRowNameClass, classRowStyle } from "@/components/ClassRow";
import { SelectContent } from "@/components/ui/select";
import { classTints } from "@/lib/class-colors";
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
 * Til — Sinflar panelining qatori AYNAN: trigger ham, roʻyxat qatorlari ham
 * `ClassRow` yordamchilaridan (`ClassListPanel` bilan umumiy manba).
 * Tanlangan sinf (trigger va roʻyxatdagi joriy qator) — tint fon + sinf
 * rangidagi chegara + toʻyingan glif + qalin matn; ✓ belgisi yoʻq, tanlov
 * glifning oʻzida. Hover — sinf rangining 5% tinti + glif `scale(1.08)`;
 * klaviatura — `.list-row:focus-visible` halqasi.
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
        data-active
        aria-label={`${ariaLabel}: ${selected.name}`}
        title={selected.name}
        style={classRowStyle(tints, true)}
        className={cn(CLASS_ROW_CLASS, "group/class-select min-w-0", className)}
      >
        <ClassRowGlyph icon={selected.icon} tints={tints} active />
        <span className={classRowNameClass(true)}>{selected.name}</span>
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
          const isSelected = c.id === value;
          return (
            <SelectPrimitive.Item
              key={c.id}
              value={c.id}
              title={c.name}
              data-active={isSelected || undefined}
              style={classRowStyle(itemTints, isSelected)}
              className={cn(CLASS_ROW_CLASS, "select-none")}
            >
              <ClassRowGlyph icon={c.icon} tints={itemTints} active={isSelected} />
              <SelectPrimitive.ItemText asChild>
                <span className={classRowNameClass(isSelected)}>{c.name}</span>
              </SelectPrimitive.ItemText>
            </SelectPrimitive.Item>
          );
        })}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}
