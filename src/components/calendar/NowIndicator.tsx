import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   «HOZIR» indikatori boʻlaklari — vaqt oʻqidagi qizil pill va jonli
   (nafas oluvchi) nuqta. Joylashuv (top, chiziq) isteʼmolchida qoladi:
   TimeGrid (planner, jadval) va bosh sahifadagi TodayRail.
   ════════════════════════════════════════════════════════════════════ */

/** Hozirgi vaqt yozilgan qizil kapsula. */
export function NowTimePill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md bg-destructive px-1.5 py-px text-tag font-medium tabular-nums text-destructive-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** «Nafas oluvchi» nuqta — jonli vaqt belgisi; reduced-motion'da toʻxtaydi. */
export function NowPulseDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative size-2 shrink-0", className)}>
      <span className="absolute inset-0 rounded-full bg-destructive/60 motion-safe:animate-ping" />
      <span className="absolute inset-0 rounded-full bg-destructive" />
    </span>
  );
}
