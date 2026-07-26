import { cn } from "@/lib/utils";

/**
 * Sinf rangi indikatori — YAGONA standart shakl: **doira** (`rounded-full`).
 * Sinf roʻyxati yoki tanlovchi qayerda boʻlsa shu ishlatiladi — shakl
 * butun loyiha boʻylab bir xil.
 *
 * Oʻlcham `className` orqali kontekstga moslanadi (default `size-3`);
 * shakl oʻzgarmaydi.
 */
export function ClassSwatch({
  hex,
  className,
  style,
}: {
  hex: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("size-3 shrink-0 rounded-full", className)}
      style={{ backgroundColor: hex, ...style }}
    />
  );
}
