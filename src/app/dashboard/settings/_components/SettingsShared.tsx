"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

/* Sozlamalar sahifasi uchun umumiy qurilish bloklari — GradesSettingsModal
   patterniga mos (boʻlim sarlavhasi + toggle/qator). Barcha rang/tipografiya
   tokenlardan; hech qanday hardcoded hex. */

export function SettingsGroup({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  /** Sarlavha oʻngida ixtiyoriy slot — masalan saqlash indikatori. */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
            {title}
          </h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0 pt-0.5">{action}</div>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

/** Chapda label + tavsif, oʻngda ixtiyoriy control. */
export function SettingRow({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/**
 * Avtomatik saqlash indikatori. `signal` oʻzgarganda (dastlabki mount tashqari)
 * qisqa vaqt "Saqlandi" chipini koʻrsatadi. Har oʻzgarish darhol saqlanadigan
 * (store'ga yoziladigan) maydonlar uchun feedback beradi.
 */
export function SavedIndicator({ signal }: { signal: unknown }) {
  const [visible, setVisible] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, [signal]);

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-success transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <Check className="size-3.5" strokeWidth={2.5} />
      Saqlandi
    </span>
  );
}

/**
 * Guruhlangan roʻyxat — bitta rounded konteyner, divider bilan ajratilgan
 * qatorlar (avval Attendance/Data har biri oʻzicha qayta yozgan pattern —
 * endi yagona manba). Har bir item ixtiyoriy leading (ikonka/dot) va
 * trailing (control) slotlariga ega.
 */
export function SettingsList({
  items,
  className,
}: {
  items: {
    key: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
  }[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      {items.map((item, i) => (
        <div
          key={item.key}
          className={cn(
            "flex items-center gap-3 bg-card px-4 py-3",
            i !== 0 && "border-t border-border"
          )}
        >
          {item.leading}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
            {item.description && (
              <span className="truncate text-xs text-muted-foreground">{item.description}</span>
            )}
          </div>
          {item.trailing && <div className="flex shrink-0 items-center gap-2">{item.trailing}</div>}
        </div>
      ))}
    </div>
  );
}

/** Toggle qatori — SettingRow ustida Switch. */
export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}
