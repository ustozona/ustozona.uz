"use client";

import * as React from "react";
import { create } from "zustand";
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
          <h3 className="text-label font-semibold uppercase text-muted-foreground">{title}</h3>
          {description && <p className="text-caption">{description}</p>}
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
        {description && <span className="text-caption">{description}</span>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/**
 * Global "saqlandi" pulsi — boʻlimlardagi har bir SavedIndicator yonganida
 * +1 boʻladi; sozlamalar sahifasi headeridagi umumiy indikator shunga ulanadi.
 */
export const useSaveSignal = create<{ n: number; ping: () => void }>((set) => ({
  n: 0,
  ping: () => set((s) => ({ n: s.n + 1 })),
}));

/**
 * Koʻrinmas pinger — `signal` oʻzgarganda (dastlabki mount tashqari) faqat
 * global pulsga uzatadi. Sozlamalar boʻlimlari lokal chip oʻrniga shuni
 * ishlatadi; koʻrsatish sahifa headeridagi yagona SavedIndicator'da.
 */
export function SaveSignalPing({ signal }: { signal: unknown }) {
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    useSaveSignal.getState().ping();
  }, [signal]);
  return null;
}

/**
 * Avtomatik saqlash indikatori. `signal` oʻzgarganda (dastlabki mount tashqari)
 * qisqa vaqt "Saqlandi" chipini koʻrsatadi. Har oʻzgarish darhol saqlanadigan
 * (store'ga yoziladigan) maydonlar uchun feedback beradi.
 * `bubble=false` — global pulsga uzatmaydi (headerdagi indikatorning oʻzi
 * pulsni tinglaydi, aks holda cheksiz halqa boʻlardi).
 */
export function SavedIndicator({ signal, bubble = true }: { signal: unknown; bubble?: boolean }) {
  const [visible, setVisible] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setVisible(true);
    if (bubble) useSaveSignal.getState().ping();
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
  footer,
  className,
}: {
  /** Roʻyxat ostidagi xulosa qatori — modal-footer uslubida (border-t + muted fon). */
  footer?: React.ReactNode;
  items: {
    key: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
    /** Oʻchirilgan/passiv qator — kontent xiralashadi (controllar emas). */
    dimmed?: boolean;
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
          {item.leading && (
            <span className={cn("flex shrink-0 items-center", item.dimmed && "opacity-50 grayscale")}>
              {item.leading}
            </span>
          )}
          <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", item.dimmed && "opacity-60")}>
            <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
            {item.description && (
              <span className="truncate text-caption">{item.description}</span>
            )}
          </div>
          {item.trailing && <div className="flex shrink-0 items-center gap-2">{item.trailing}</div>}
        </div>
      ))}
      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5">
          {footer}
        </div>
      )}
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
        {description && <span className="text-caption">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}
