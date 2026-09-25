"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/* ════════════════════════════════════════════════════════════════════
   SOZLAMA KARTASI MAYDONLARI — har vidjet oʻz sozlamasini SHULAR bilan
   quradi (docs/doska-ux-tadqiqot.md Q2).

   Nega umumiy qismlar: vidjetlar 20 taga oʻsadi. Har biri oʻz tugmasini
   yozsa, bir kartada 44 px, boshqasida 32 px chiqadi va oʻqituvchi har
   vidjetni qaytadan oʻrganadi. Bu yerda uch qoida bir marta
   qulflangan:

     • bosish maydoni ≥ 44 px (`h-11`) — sensorli doska birinchi;
     • KLAVIATURA KERAK EMAS — qiymat tayyor variantlar va ± bilan
       tanlanadi. Doskada matn maydoni ekran klaviaturasini ochadi va u
       ekranning yarmini yopadi;
     • tanlangan holat rangdan tashqari shakl bilan ham ajraladi
       (`aria-pressed` + toʻldirilgan fon), faqat rang emas.
   ════════════════════════════════════════════════════════════════════ */

/** Sarlavhali boʻlim: Vaqt · Koʻrinish · Tugaganda … */
export function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</h3>
      {children}
    </section>
  );
}

/**
 * Tayyor variantlar — bir qatorda teng kataklar.
 *
 * Segment emas, alohida tugmalar: variantlar soni 5–9 gacha boradi
 * (daqiqalar, shakllar) va ular qatorga sigʻmasa oʻraladi.
 */
export function SettingsChoices<T extends string | number>({
  value,
  options,
  onChange,
  columns,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (value: T) => void;
  /** Ustunlar soni; berilmasa variantlar soniga teng. */
  columns?: number;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={on}
            aria-label={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              "grid min-h-11 place-items-center rounded-md border px-1 text-sm font-medium tabular-nums transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              on
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** − qiymat + — qadamli oʻzgartirish (masalan ±1 daqiqa). */
export function SettingsStepper({
  value,
  onMinus,
  onPlus,
  minusLabel,
  plusLabel,
  minusDisabled,
  plusDisabled,
}: {
  value: React.ReactNode;
  onMinus: () => void;
  onPlus: () => void;
  minusLabel: string;
  plusLabel: string;
  minusDisabled?: boolean;
  plusDisabled?: boolean;
}) {
  const btn =
    "hover:bg-muted grid size-11 shrink-0 place-items-center rounded-md text-xl font-medium transition-colors " +
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex items-center justify-between rounded-lg border p-1">
      <button type="button" aria-label={minusLabel} disabled={minusDisabled} onClick={onMinus} className={btn}>
        −
      </button>
      <span className="font-mono text-2xl font-medium tabular-nums">{value}</span>
      <button type="button" aria-label={plusLabel} disabled={plusDisabled} onClick={onPlus} className={btn}>
        +
      </button>
    </div>
  );
}

/** Yoqish/oʻchirish — butun qator bosiladi, faqat kichik tumbler emas. */
export function SettingsSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Label className="hover:bg-muted -mx-2 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-2 font-normal">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </Label>
  );
}
