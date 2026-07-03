import { cn } from "@/lib/utils";

/**
 * Landing dizayn qatlamining gradient-porlash primitivi.
 *
 * Mahsulot UI'sidan ALOHIDA: bu yerda atayin xom Tailwind ranglari ishlatiladi
 * (sky/amber/white) — landing marketing uslubi, `theme-landing-mono` tokenlari emas.
 * Joylashuv/oʻlcham `className` orqali beriladi (mas. `left-1/2 top-24 -translate-x-1/2 w-[70%] h-[40%]`).
 * Ota element `relative` boʻlishi kerak.
 */
export function LandingGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-3xl",
        "bg-linear-to-r from-sky-100 via-white to-amber-100 opacity-50",
        "dark:from-slate-800 dark:via-black dark:to-stone-700 dark:opacity-30",
        className
      )}
    />
  );
}

export default LandingGlow;
