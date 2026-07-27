"use client";

import type { HTMLAttributes, ReactNode, Ref } from "react";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   TIMEGRID — kun/hafta vaqt-toʻri karkasi (headless-ga yaqin).

   TimeGrid FAQAT geometriya va xrom beradi: sticky sarlavha qatori,
   chapdagi soat oʻqi, soat/yarim/chorak chiziqlar, "hozir" chizigʻi.
   Voqealar, overlay va DnD — isteʼmolchidan `renderColumn` orqali
   (ustun ichiga absolute joylashadi). Ustunlar sanali (planner) yoki
   sanasiz hafta-kunlari (jadval muharriri) boʻlishi mumkin — TimeGrid
   uchun farqi yoʻq.
   ════════════════════════════════════════════════════════════════════ */

/** div atributlari + data-* (tour nishonlari) ruxsati. */
export type TimeGridDivProps = HTMLAttributes<HTMLDivElement> & {
  [dataAttr: `data-${string}`]: string | undefined;
};

export type TimeGridColumn = {
  /** Barqaror kalit (dateKey yoki kun indeksi). */
  key: string;
  /** Sticky sarlavha katagi mazmuni. */
  header: ReactNode;
  /** Sarlavha katagiga qoʻshimcha atributlar (data-tour, className…). */
  headerProps?: TimeGridDivProps;
  /** Ustun konteyneriga atributlar (drop handlerlar, fon klasslari…). */
  columnProps?: TimeGridDivProps;
  /** true boʻlsa (va nowMin berilsa) — shu ustunda "hozir" chizigʻi. */
  isToday?: boolean;
};

export function TimeGrid({
  columns,
  startHour,
  endHour,
  pxPerHour,
  gutterWidth = 56,
  gutterHeader,
  gutterVariant = "axis",
  nowMin,
  lines = "half",
  renderColumn,
  scrollRef,
  className,
  ...rest
}: {
  columns: TimeGridColumn[];
  startHour: number;
  endHour: number;
  /** 1 soat balandligi px (planner/jadval 180, ixcham 60). */
  pxPerHour: number;
  gutterWidth?: number;
  /** Yuqori-chap sticky katak mazmuni (masalan "Vaqt" yorligʻi). */
  gutterHeader?: ReactNode;
  /** Soat yorliqlari uslubi: "axis" (oʻngga tekis, planner) yoki
      "centered" (chiziq ustida markazda, jadval muharriri). */
  gutterVariant?: "axis" | "centered";
  /** Daqiqalarda "hozir" — berilmasa chiziq chizilmaydi. */
  nowMin?: number | null;
  /** Yordamchi chiziqlar zichligi. */
  lines?: "hour" | "half" | "quarter";
  /** Ustun ichidagi (absolute) mazmun: voqealar, overlay, watermark. */
  renderColumn: (col: TimeGridColumn) => ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
} & TimeGridDivProps) {
  const hourCount = endHour - startHour;
  const hourIdx = Array.from({ length: hourCount }, (_, i) => i);
  const nowTop =
    nowMin == null ? null : (nowMin / 60 - startHour) * pxPerHour;
  const nowVisible = nowTop != null && nowTop >= 0 && nowTop <= hourCount * pxPerHour;

  const templateColumns = `${gutterWidth}px repeat(${columns.length}, minmax(0,1fr))`;

  return (
    <div {...rest} className={cn("relative flex h-full flex-col overflow-hidden", className)}>
      {/* Sarlavha — scroll konteynerNING ICHIDA, lekin soat/kun toʻridan TASHQARI
          alohida `sticky` blok. Shu sabab uning containing block'i butun scroll
          balandligi boʻladi (grid QATORI emas — eski bug aynan shundan edi:
          CSS Grid'da sticky oʻz grid-maydoni, yaʼni faqat sarlavha balandligi,
          bilan chegaralanardi). Shaffof-xira fon (backdrop-blur) — scroll
          boʻlganda ostidagi kontent xira koʻrinib turadi (frosted glass). */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin [scrollbar-gutter:stable]"
      >
        <div
          className="sticky top-0 z-20 grid border-b border-border/60 bg-background/70 backdrop-blur-md"
          style={{ gridTemplateColumns: templateColumns }}
        >
          <div>{gutterHeader}</div>
          {columns.map((c) => (
            <div
              key={c.key}
              {...c.headerProps}
              className={cn("border-l border-border", c.headerProps?.className)}
            >
              {c.header}
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: templateColumns }}>
        {/* Vaqt oʻqi */}
        <div className={cn(gutterVariant === "axis" ? "border-r border-border/40" : "border-r border-border")}>
          {hourIdx.map((h) =>
            gutterVariant === "axis" ? (
              <div
                key={h}
                className="border-t border-border/40 pr-2 pt-1 text-right text-xs font-medium tabular-nums text-muted-foreground"
                style={{ height: pxPerHour }}
              >
                {minToHHMM((startHour + h) * 60)}
              </div>
            ) : (
              <div key={h} className={cn("relative", h > 0 && "border-t border-border")} style={{ height: pxPerHour }}>
                <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {minToHHMM((startHour + h) * 60)}
                </span>
              </div>
            ),
          )}
        </div>

        {/* Ustunlar */}
        {columns.map((col) => (
          <div
            key={col.key}
            {...col.columnProps}
            className={cn("relative border-l border-border/40", col.columnProps?.className)}
          >
            {hourIdx.map((h) => (
              <div
                key={h}
                className={cn(
                  "relative",
                  // "quarter" (jadval muharriri): soat chizigʻi kuchli va birinchi katakda yoʻq;
                  // "half"/"hour" (planner): har katakda yumshoq chiziq.
                  lines === "quarter" ? h > 0 && "border-t border-border" : "border-t border-border/40",
                )}
                style={{ height: pxPerHour }}
              >
                {lines === "half" && (
                  <div
                    className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/40"
                    style={{ top: pxPerHour / 2 }}
                  />
                )}
                {lines === "quarter" &&
                  [1, 2, 3].map((q) => (
                    <div
                      key={q}
                      className={cn(
                        "pointer-events-none absolute inset-x-0 border-t",
                        q === 2 ? "border-border/50" : "border-border/25",
                      )}
                      style={{ top: (q * pxPerHour) / 4 }}
                    />
                  ))}
              </div>
            ))}

            {col.isToday && nowVisible && (
              <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: nowTop! }}>
                <div className="-ml-1.5 size-2.5 shrink-0 rounded-full bg-destructive" />
                <div className="h-px flex-1 bg-destructive" />
              </div>
            )}

            {renderColumn(col)}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
