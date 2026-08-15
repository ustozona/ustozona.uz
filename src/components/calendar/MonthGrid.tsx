"use client";

import type { HTMLAttributes, ReactNode, Ref } from "react";
import { useMemo } from "react";
import { dateToKey, getMonthGridFilled } from "@/lib/calendar-core/date-math";
import { useCalendarFormat } from "@/components/calendar/format";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   MONTHGRID — oy koʻrinishi karkasi: hafta-kuni sarlavhalari (message-
   asosli, Du-birinchi) + 6×7 katak toʻri. Katak MAZMUNI toʻliq
   isteʼmolchidan (`renderCell`), katakka atributlar (drop handlerlar,
   holat fonlari) — `getCellProps`.

   TOʻR KONVENSIYASI (Google/Apple/Outlook oy koʻrinishi):
    • DOIM 6 qator × 7 ustun = 42 katak. Oy 5 haftaga tushsa ham qator
      soni oʻzgarmaydi — oydan oyga oʻtganda toʻr balandligi sakramaydi.
    • Boʻsh katak yoʻq: chetdagi joylar qoʻshni oylarning HAQIQIY kunlari
      bilan toʻladi (`getMonthGridFilled`). Ular "boshqa oy" ekani faqat
      kun raqamining xiraligi bilan beriladi — katak foni bilan EMAS,
      chunki 42 katakning 10 tasi tuslangan boʻlsa toʻr gʻij-gʻij koʻrinadi.
    • Hafta-kuni sarlavhasi — `bg-muted/50` band: toʻrni sarlavhadan
      ajratib turadigan yagona yuza (chegara yetarli emas, chunki katak
      chegaralari ham xuddi shunday).
    • Tashqi scroll YOʻQ — konteyner balandligi fiksirlangan, qatorlar
      `1fr` bilan boʻlinadi. Katakka sigʻmagan kontent KATAK ICHIDA
      scroll boʻladi (isteʼmolchi hal qiladi).
    • Ustun soni oʻzgaruvchan (`visibleIsoDays`) — dam kunini yashirish
      oy toʻrida BUTUN USTUNNI olib tashlaydi, alohida kunni emas.
   ════════════════════════════════════════════════════════════════════ */

const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Sanadan ISO hafta kuni (1=Dushanba .. 7=Yakshanba). */
const isoDayOf = (d: Date) => ((d.getDay() + 6) % 7) + 1;

/** Katak konteyneri atributlari — `ref` bilan (drop-zona uchun). */
export type MonthCellProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export function MonthGrid({
  year,
  month,
  renderCell,
  getCellProps,
  visibleIsoDays,
  className,
  ...rest
}: {
  year: number;
  /** JS oy indeksi 0..11. */
  month: number;
  /** Koʻrsatiladigan hafta kunlari (ISO: 1=Du..7=Ya). Berilmasa — hammasi.
      Masalan `[1,2,3,4,5,6]` yakshanba ustunini butunlay olib tashlaydi. */
  visibleIsoDays?: number[];
  /** Sana katagining TOʻLIQ mazmuni (kun raqami, pill'lar, badge'lar…). */
  renderCell: (date: Date, dateKey: string, idx: number) => ReactNode;
  /** Katak konteyneriga atributlar (onDrop, holat klasslari…). `ref` ham
      uzatilishi mumkin — @dnd-kit `setNodeRef` katakni drop-zonaga aylantiradi
      (React 19'da `ref` oddiy prop). */
  getCellProps?: (date: Date, dateKey: string) => MonthCellProps;
} & HTMLAttributes<HTMLDivElement>) {
  const fmt = useCalendarFormat();
  const days = visibleIsoDays ?? ISO_DAYS;
  const cells = useMemo(() => {
    const all = getMonthGridFilled(year, month);
    return days.length === ISO_DAYS.length ? all : all.filter((d) => days.includes(isoDayOf(d)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, days.join(",")]);

  // Ustun soni oʻzgaruvchan — `grid-cols-N` Tailwind klassi dinamik yozilsa
  // CSS chiqmaydi ([[tailwind-variant-class-gaps]]), shuning uchun inline style.
  const cols = days.length;
  const gridCols = { gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` };

  return (
    <div {...rest} className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      {/* Hafta kunlari — tuslangan band, katak toʻridan aniq ajralib turadi. */}
      <div className="grid shrink-0 bg-muted/50" style={gridCols}>
        {days.map((isoDay) => (
          <div
            key={isoDay}
            className="flex h-9 items-center justify-center truncate border-b border-r border-border px-2 text-sm font-medium text-foreground last:border-r-0"
          >
            {fmt.dayName(isoDay)}
          </div>
        ))}
      </div>

      {/* 6 hafta × N kun. Qatorlar teng — `grid-rows-6` + `1fr`. */}
      <div className="grid min-h-0 flex-1 grid-rows-6" style={gridCols}>
        {cells.map((date, idx) => {
          const key = dateToKey(date);
          const cellProps = getCellProps?.(date, key);
          // Oxirgi ustun/qatorning tashqi chegarasi olib tashlanadi — kartaning
          // oʻz chegarasi bilan ikkilanmasin. Ustun soni oʻzgargani uchun bu
          // `nth-child` variantida emas, indeksdan hisoblanadi.
          const isLastCol = idx % cols === cols - 1;
          const isLastRow = idx >= cells.length - cols;
          return (
            <div
              key={key}
              {...cellProps}
              className={cn(
                "group/cell relative flex min-h-0 flex-col overflow-hidden border-b border-r border-border p-1 text-left transition-colors",
                isLastCol && "border-r-0",
                isLastRow && "border-b-0",
                cellProps?.className,
              )}
            >
              {renderCell(date, key, idx)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
