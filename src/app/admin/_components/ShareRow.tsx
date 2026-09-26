import { cn } from "@/lib/utils";

/* Bitta ulush qatori: nom (+ izoh), foiz, son va chiziq. Grafik
   kutubxonasi bitta koʻrsatkich uchun ortiqcha — bosh sahifadagi
   Telegram va voronka panellari shu qatordan quriladi. */
export function ShareRow({
  label,
  hint,
  value,
  share,
  barClassName,
}: {
  label: string;
  hint?: string;
  value: number;
  /** Foizda, butun songa yaxlitlangan. */
  share: number;
  /** Chiziq rangi — standart `bg-primary`. */
  barClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0">
          {label}
          {hint && <span className="block text-caption text-muted-foreground">{hint}</span>}
        </span>
        <span className="shrink-0 font-medium tabular-nums">
          {share}%
          <span className="ml-2 font-normal text-muted-foreground">{value}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-primary", barClassName)}
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}
