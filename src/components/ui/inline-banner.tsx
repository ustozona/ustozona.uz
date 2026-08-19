"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionIcon } from "@/components/ui/section-icon";

/* ════════════════════════════════════════════════════════════════════
   INLINE BANNER — sahifa yuqorisidagi to'liq kenglikdagi xabar tasmasi
   (shadcn `Alert` emas — bu joylashgan quti emas, `border-b` bilan
   ajratilgan "strip", masalan Linear/Vercel/GitHub demo yoki ogohlantirish
   bannerlariga o'xshash). Har bir variant: rangli fon + rangli icon-box.
   ════════════════════════════════════════════════════════════════════ */

export type InlineBannerVariant = "info" | "success" | "warning" | "danger" | "neutral";

const VARIANT_STYLES: Record<InlineBannerVariant, { wrap: string; iconBox: string; dismiss: string }> = {
  info: {
    wrap: "bg-blue-500/8 border-blue-500/20 text-blue-700 dark:text-blue-300",
    iconBox: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    dismiss: "text-blue-600/70 hover:bg-blue-500/15 hover:text-blue-700 dark:text-blue-400/70 dark:hover:text-blue-300",
  },
  success: {
    wrap: "bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    iconBox: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    dismiss: "text-emerald-600/70 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-400/70 dark:hover:text-emerald-300",
  },
  warning: {
    wrap: "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-300",
    iconBox: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    dismiss: "text-amber-600/70 hover:bg-amber-500/15 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-300",
  },
  danger: {
    wrap: "bg-rose-500/8 border-rose-500/20 text-rose-700 dark:text-rose-300",
    iconBox: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    dismiss: "text-rose-600/70 hover:bg-rose-500/15 hover:text-rose-700 dark:text-rose-400/70 dark:hover:text-rose-300",
  },
  neutral: {
    wrap: "bg-muted/60 border-border text-foreground",
    iconBox: "bg-foreground/10 text-foreground/70",
    dismiss: "text-foreground/50 hover:bg-foreground/10 hover:text-foreground",
  },
};

export function InlineBanner({
  variant = "info",
  icon: Icon,
  children,
  onDismiss,
  dismissLabel = "Yopish",
  className,
}: {
  variant?: InlineBannerVariant;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "flex w-full items-start gap-3 border-b px-5 py-3 text-sm shrink-0",
        styles.wrap,
        className,
      )}
    >
      <SectionIcon size="sm" className={styles.iconBox}>
        <Icon />
      </SectionIcon>
      <div className="flex-1 min-w-0 pt-1 font-medium leading-snug">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn("shrink-0 rounded-md p-1.5", styles.dismiss)}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
