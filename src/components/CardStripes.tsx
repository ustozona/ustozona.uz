import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * Jadval kartalari diagonal-chiziqli bezagi (umumiy).
 * Sinf rangidan hosil qilingan. Karta `relative` + `overflow-hidden` boʻlishi kerak.
 * - `bottom` (default): karta pastidagi ingichka shtrix chizigʻi.
 * - `cover`: butun yuza boʻylab nozik shtrix; karta stacking context (`isolate`
 *   yoki `z-*`) hosil qilishi shart — shtrix `-z-10` bilan kontent ostida yotadi.
 */
export function CardStripes({
  color,
  className,
  variant = "bottom",
}: {
  color: ClassColor;
  className?: string;
  variant?: "bottom" | "cover";
}) {
  const hex = CLASS_COLOR_HEX[color];
  if (variant === "cover") {
    return (
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 -z-10", className)}
        style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${hex}14 0, ${hex}14 6px, transparent 6px, transparent 16px)` }}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-2.5", className)}
      style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${hex}59 0, ${hex}59 3px, transparent 3px, transparent 7px)` }}
    />
  );
}
