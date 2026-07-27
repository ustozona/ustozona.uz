"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useMemo } from "react";
import { dateToKey, getMonthGrid } from "@/lib/calendar-core/date-math";
import { useCalendarFormat } from "@/components/calendar/format";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TypographyLabel } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   MONTHGRID — oy koʻrinishi karkasi: hafta-kuni sarlavhalari (message-
   asosli, Du-birinchi) + 7-ustunli katak toʻri. Katak MAZMUNI toʻliq
   isteʼmolchidan (`renderCell`), katakka atributlar (drop handlerlar,
   holat fonlari) — `getCellProps`. "+N ta" popover uchun umumiy
   MonthMorePopover shu fayldan eksport qilinadi.
   ════════════════════════════════════════════════════════════════════ */

export function MonthGrid({
  year,
  month,
  renderCell,
  getCellProps,
  className,
  ...rest
}: {
  year: number;
  /** JS oy indeksi 0..11. */
  month: number;
  /** Sana katagining TOʻLIQ mazmuni (kun raqami, pill'lar, badge'lar…). */
  renderCell: (date: Date, dateKey: string, idx: number) => ReactNode;
  /** Katak konteyneriga atributlar (onDrop, holat klasslari…). */
  getCellProps?: (date: Date, dateKey: string) => HTMLAttributes<HTMLDivElement>;
} & HTMLAttributes<HTMLDivElement>) {
  const fmt = useCalendarFormat();
  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    /* Kun nomlari qatori scroll konteyneridan TASHQARIDA — u qimirlamaydi,
       faqat kataklar toʻri scroll boʻladi. `scrollbar-gutter` ikkalasida ham
       bir xil joy qoldiradi, shunda ustunlar tekis turadi. */
    <div {...rest} className={cn("flex h-full flex-col overflow-hidden", className)}>
      <div
        className="grid shrink-0 overflow-hidden border-b border-border bg-muted scrollbar-thin [scrollbar-gutter:stable]"
        style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}
      >
        {[1, 2, 3, 4, 5, 6, 7].map((isoDay) => (
          <div key={isoDay} className="border-l border-border/40 py-3 text-center first:border-l-0">
            <TypographyLabel>{fmt.dayShort(isoDay)}</TypographyLabel>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin [scrollbar-gutter:stable]">
      <div className="grid min-h-full" style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
        {cells.map((date, idx) => {
          if (!date)
            return <div key={idx} className="min-h-[96px] border-l border-t border-border/40 bg-muted/10 first:border-l-0" />;
          const key = dateToKey(date);
          const cellProps = getCellProps?.(date, key);
          return (
            <div
              key={idx}
              {...cellProps}
              className={cn(
                "group/cell relative flex min-h-[104px] flex-col gap-1 border-l border-t border-border/40 p-2 text-left transition-colors first:border-l-0",
                cellProps?.className,
              )}
            >
              {renderCell(date, key, idx)}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/** "+N ta" tugma + roʻyxat popover — oy katagi toʻlib ketganda. */
export function MonthMorePopover({
  count,
  title,
  children,
}: {
  count: number;
  /** Popover sarlavhasi (masalan "15 Sentabr"). */
  title: ReactNode;
  children: ReactNode;
}) {
  const fmt = useCalendarFormat();
  if (count <= 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="self-start rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
        >
          {fmt.t("more", { count })}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <div className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">{title}</div>
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
