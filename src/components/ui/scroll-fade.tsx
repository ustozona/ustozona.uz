import { cn } from "@/lib/utils";

/**
 * Yengil scroll-fade overlay — border oʻrniga: kontent yuzasi rangidan
 * shaffofga eruvchi gradient, "pastda/tepada yana kontent bor" signalini
 * beradi. Blur yoʻq (progressive-blur'dan farqli) — fon rasm emas, oddiy
 * yuza rangi, shuning uchun mask/blur ortiqcha ogʻirlik boʻlardi.
 */
export function ScrollFade({
  position = "bottom",
  className,
}: {
  position?: "top" | "bottom";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 h-5",
        position === "top"
          ? "top-0 bg-linear-to-b from-card to-transparent"
          : "bottom-0 bg-linear-to-t from-card to-transparent",
        className
      )}
    />
  );
}
