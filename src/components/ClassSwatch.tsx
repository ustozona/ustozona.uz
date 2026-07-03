import { cn } from "@/lib/utils";

/**
 * Sinf rangi indikatori — YAGONA standart shakl: **radiusli kvadrat**
 * (`rounded-[4px]`), dumaloq emas. Sinf roʻyxati yoki tanlovchi qayerda
 * boʻlsa shu ishlatiladi — shakl butun loyiha boʻylab bir xil.
 *
 * Kanonik manba: `ClassListPanel` kompakt nav-row swatch'i
 * (`size-3 rounded-[4px]` + sinf rangi). Oʻlcham `className` orqali
 * kontekstga moslanadi (default `size-3`); shakl oʻzgarmaydi.
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
      className={cn("size-3 shrink-0 rounded-[4px]", className)}
      style={{ backgroundColor: hex, ...style }}
    />
  );
}
