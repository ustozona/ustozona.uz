import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * Jadval kartasi burchagidagi bezak doira (namunadagi xira aylana / "watermark").
 * Sinf rangidan hosil qilingan, past shaffoflikda. Karta `relative` +
 * `overflow-hidden` boʻlishi kerak — doira burchakda qirqiladi va yoy koʻrinadi.
 */
export function CardCorner({ color, className }: { color: ClassColor; className?: string }) {
  const hex = CLASS_COLOR_HEX[color];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute -right-8 -top-8 size-24 rounded-full", className)}
      style={{ backgroundColor: `${hex}24` }}
    />
  );
}
