"use client";

import { type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classTints, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * MAVZU CHIPI — ulangan (filled) event kartasi ichidagi dars yorligʻi.
 * Bosh sahifadagi "Bugungi darslar" kartasi etalon; Planner ham SHU
 * komponentni ishlatadi, shuning uchun dizayn bitta joydan boshqariladi.
 *
 * Anatomiyasi: sinf doirasi (`ClassSwatch`, bajarilgan darsda ✓) → chapga
 * tekislangan `truncate` sarlavha → hoverda oʻngdan kirib keluvchi kvadrat
 * ikonboks. Hover'da toʻldirish YOʻQ — faqat sinf rangidagi ring
 * (`ring-[3px]`, 50% shaffof — `Button` ning focus-ring retsepti bilan bir
 * xil, [[design-system]]).
 *
 * Karta ostiga tekislash isteʼmolchida (`mt-auto`) — chunki ba'zi yuzalarda
 * bir slotda bir nechta chip boʻladi.
 */
export function LessonChip({
  color,
  title,
  done = false,
  trailing,
  onClick,
  className,
}: {
  color: ClassColor;
  title: string;
  /** Bajarilgan dars — doira oʻrniga ✓. */
  done?: boolean;
  /** Hoverda oʻngda chiqadigan element. Berilmasa — sinf rangidagi "→" boksi.
      Planner oʻzining `⋮` menyusini shu yerga uzatadi. */
  trailing?: ReactNode;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  className?: string;
}) {
  const tints = classTints(color);
  const hex = CLASS_COLOR_HEX[color];
  return (
    <div
      onClick={onClick}
      style={{ ["--chip-color"]: hex } as CSSProperties}
      className={cn(
        "group/chip relative flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border bg-card pl-3 pr-3 text-left shadow-xs transition-[padding-right,box-shadow,border-color] duration-200 ease-out hover:border-[var(--chip-color)] hover:pr-10 hover:ring-[3px] hover:ring-[var(--chip-color)]/50",
        className,
      )}
    >
      {done ? (
        <Check className="size-3 shrink-0" strokeWidth={3} style={{ color: hex }} />
      ) : (
        <ClassSwatch hex={hex} className="size-2 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</span>
      {/* Hover zonasi — ikkala variant ham AYNAN shu geometriyada VA AYNAN
          bir xil sinf-rangi toʻldirilgan ikonboks: default "→" ham,
          isteʼmolchi elementi (Planner `⋮` menyusi) ham. Ikkalasi ham shu
          chipga tegishli amal, shuning uchun bitta vizual til. */}
      <span
        style={{ backgroundColor: hex, color: tints.textOnSolid.color }}
        className={cn(
          "absolute inset-y-1 right-1 z-20 flex w-7 translate-x-2 items-center justify-center rounded-sm opacity-0 transition-all duration-200 ease-out group-hover/chip:translate-x-0 group-hover/chip:opacity-100",
          trailing &&
            "pointer-events-none group-hover/chip:pointer-events-auto focus-within:pointer-events-auto focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
        )}
      >
        {trailing ?? <ArrowRight className="size-3.5" />}
      </span>
    </div>
  );
}
