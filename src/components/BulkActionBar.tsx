"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/**
 * Belgilash orqali ishga tushadigan guruhaviy amallar uchun suzuvchi panel —
 * roʻyxat ustiga (pastki markazga) chiqadi, header/toolbar bilan joy talashmaydi.
 * Gmail/Linear/Notion'dagi "contextual action bar" naqshi.
 *
 * Vizual uslub — SectionIcon'ning "inverted" variantidagi bg-foreground/
 * text-background juftligi (loyihaning yagona yuqori-kontrast belgisi):
 * yorugʻ mavzuda qora, qorongʻu mavzuda oq pill, mavzuga qarab avtomatik
 * moslashadi (qattiq #000 emas).
 */
export function BulkActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4",
        className
      )}
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-0.5 rounded-full bg-foreground py-1.5 pl-3.5 pr-1.5 text-background shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-fast">
        {children}
      </div>
    </div>
  );
}

/** "5 ta tanlandi" — pill boshida, xira rangda. */
export function BulkActionCount({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap pr-2 text-sm font-medium text-background/60">{children}</span>;
}

/** Guruhlar orasidagi ingichka ajratuvchi chiziq. */
export function BulkActionDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-background/15" aria-hidden />;
}

/** Icon + label tugma; `variant="destructive"` — Oʻchirish kabi xavfli amallar uchun. */
export function BulkActionButton({
  icon,
  children,
  variant = "default",
  hasChevron,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  hasChevron?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-background/10",
        variant === "destructive" ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" : "text-background",
        className
      )}
      {...props}
    >
      {icon}
      {children}
      {hasChevron && <ChevronDown className="size-3.5 opacity-60" />}
    </button>
  );
}
