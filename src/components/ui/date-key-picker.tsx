"use client";

import * as React from "react";
import { uz } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateKeyToDate, dateToKey } from "@/lib/date-keys";
import { MONTHS_UZ, DAYS_UZ_SUN_SHORT } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   SANA TANLAGICH — shadcn Popover + Calendar (native <input type="date"> oʻrnini bosadi)

   Qiymat "YYYY-MM-DD" kaliti ("date-keys" — UTC off-by-one xavfsiz).
   Oʻzbekcha oy/hafta nomlari, dropdown caption. Oʻquv yili sozlamalari va
   boshqa sana maydonlari uchun yagona komponent.
   ════════════════════════════════════════════════════════════════════ */

/** "2025-09-16" → "16.09.2025". Boʻsh boʻlsa placeholder. */
export function fmtKey(key: string): string {
  if (!key) return "Sana tanlang";
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

export function DateKeyPicker({
  value,
  onChange,
  className,
  ariaLabel,
  formatLabel,
}: {
  value: string;
  onChange: (key: string) => void;
  className?: string;
  ariaLabel?: string;
  /** Standart "kun.oy.yil" oʻrniga tugmada koʻrsatiladigan matnni moslashtirish (mas. "Bugun"/"Ertaga"). */
  formatLabel?: (key: string) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? dateKeyToDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "justify-start gap-2 px-3 font-normal tabular-nums",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          {formatLabel ? formatLabel(value) : fmtKey(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={uz}
          formatters={{
            formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
            formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
          }}
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(dateToKey(d));
              setOpen(false);
            }
          }}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2035, 11)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** Sana oralig'i tanlagich — bitta tugma ikkala chegarani ochadi, bitta
    kalendarda ikki oy koʻrsatiladi (react-day-picker "range" rejimi).
    "O'quv yili davomiyligi" kabi bitta jozibali diapazon uchun; alohida
    boshlanish/tugash inputlari kerak boʻlgan joylarda (chorak, taʼtil
    qatorlari) ikkita DateKeyPicker ishlatilaveradi. */
export function DateKeyRangePicker({
  range,
  onChange,
  className,
  ariaLabel,
}: {
  range: { start: string; end: string };
  onChange: (r: { start: string; end: string }) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = {
    from: range.start ? dateKeyToDate(range.start) : undefined,
    to: range.end ? dateKeyToDate(range.end) : undefined,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "justify-start gap-2 px-3 font-normal tabular-nums",
            !range.start && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          {range.start ? fmtKey(range.start) : "Sana tanlang"}
          <span className="text-muted-foreground">—</span>
          {range.end ? fmtKey(range.end) : "Sana tanlang"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          locale={uz}
          formatters={{
            formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
            formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
          }}
          selected={selected}
          onSelect={(r) => {
            onChange({
              start: r?.from ? dateToKey(r.from) : "",
              end: r?.to ? dateToKey(r.to) : "",
            });
            if (r?.from && r?.to) setOpen(false);
          }}
          defaultMonth={selected.from}
          numberOfMonths={2}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2035, 11)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
