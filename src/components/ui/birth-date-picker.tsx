"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MONTHS_UZ } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   TAVALLUD SANA TANLAGICH — yil/kun/oy uchta alohida dropdown.

   Kalendar-popover tavallud sana uchun yomon amaliyot: foydalanuvchi
   30-40 yil orqaga oyma-oy bosib borishga majbur boʻladi. Google/Apple/
   Facebook uslubidagi 3 dropdown — bir necha bosishda toʻliq sana.

   Qiymat "YYYY-MM-DD" kaliti (boʻsh — "").
   ════════════════════════════════════════════════════════════════════ */

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function parseKey(key: string): { y?: number; m?: number; d?: number } {
  if (!key) return {};
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function buildKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function BirthDatePicker({
  value,
  onChange,
  className,
  ariaLabel = "Tavallud sana",
  yearsBack = 100,
}: {
  value: string;
  onChange: (key: string) => void;
  className?: string;
  ariaLabel?: string;
  /** Joriy yildan orqaga necha yilgacha tanlash mumkin. */
  yearsBack?: number;
}) {
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(
    () => Array.from({ length: yearsBack + 1 }, (_, i) => currentYear - i),
    [currentYear, yearsBack]
  );

  // Yil/kun/oy alohida onChange'lar bilan tanlanadi, lekin `onChange` faqat
  // uchalasi ham toʻlgandan keyin chaqiriladi — shu oraliqda tashqi `value`
  // hali eski (yoki boʻsh) qoladi. Shuning uchun qisman tanlovlarni lokal
  // holatda saqlaymiz, aks holda har bosishda `value`dan qayta parse qilinib
  // avvalgi tanlovlar yoʻqolib ketardi (saqlash tugmasi hech faollashmasdi).
  const [pending, setPending] = React.useState<{ y?: number; m?: number; d?: number }>({});
  React.useEffect(() => setPending({}), [value]);

  const parsed = parseKey(value);
  const y = pending.y ?? parsed.y;
  const m = pending.m ?? parsed.m;
  const d = pending.d ?? parsed.d;

  const setPart = (next: { y?: number; m?: number; d?: number }) => {
    const ny = next.y ?? y;
    const nm = next.m ?? m;
    let nd = next.d ?? d;
    setPending({ y: ny, m: nm, d: nd });
    if (ny && nm && nd) {
      const max = daysInMonth(ny, nm);
      if (nd > max) nd = max; // masalan 31-fevral → 28/29ga qisqartiriladi
      onChange(buildKey(ny, nm, nd));
    }
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)} role="group" aria-label={ariaLabel}>
      <Select value={y ? String(y) : undefined} onValueChange={(v) => setPart({ y: Number(v) })}>
        <SelectTrigger className="w-full tabular-nums" aria-label="Yil">
          <SelectValue placeholder="Yil" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)} className="tabular-nums">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={d ? String(d) : undefined} onValueChange={(v) => setPart({ d: Number(v) })}>
        <SelectTrigger className="w-full" aria-label="Kun">
          <SelectValue placeholder="Kun" />
        </SelectTrigger>
        <SelectContent>
          {DAYS.map((day) => (
            <SelectItem key={day} value={String(day)}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={m ? String(m) : undefined} onValueChange={(v) => setPart({ m: Number(v) })}>
        <SelectTrigger className="w-full" aria-label="Oy">
          <SelectValue placeholder="Oy" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS_UZ.map((label, i) => (
            <SelectItem key={label} value={String(i + 1)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
