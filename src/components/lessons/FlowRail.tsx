"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, CalendarX2, ListMinus, Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateKeyToDate } from "@/lib/date-keys";
import { useCalendarFormat } from "@/components/calendar/format";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { FlowForecast, ForecastRow } from "@/lib/lesson-flow";

/* ════════════════════════════════════════════════════════════════════
   ZANJIR — Darslar roʻyxatining chap tomonidagi vertikal chiziq: har dars
   nuqta, holati rang/shakl bilan. Hisob `flowForecast` da (sof funksiya),
   bu yer faqat chizadi.

   Holatlar: oʻtilgan — toʻla yashil nuqta; qadalgan — 📌; oqimda — sinf
   rangidagi halqa; zaxira — uzuq halqa; ziddiyat (taʼtil / jadvalda yoʻq
   vaqt) va oʻtmishda qolgan — ogohlantirish rangi; sanasiz — xira;
   sigʻmaydi — qizil uzuq halqa, chiziq ham uzuq.
   ════════════════════════════════════════════════════════════════════ */

export function useFlowDateLabel() {
  const { monthShort } = useCalendarFormat();
  return (key: string) => {
    const d = dateKeyToDate(key);
    return `${d.getDate()} ${monthShort(d.getMonth())}`;
  };
}

function useStateLabel() {
  const t = useTranslations("LessonFlow");
  return (row: ForecastRow) => [
    t(`state.${row.state}`),
    row.reserve ? t("reserveBadge") : null,
    row.conflict ? t(`conflict.${row.conflict}`) : null,
  ].filter(Boolean).join(" · ");
}

/** Qator chapidagi zanjir boʻlagi: chiziq + holat nuqtasi. Ota element `relative`. */
export function FlowNode({ row, hex, first, last, className }: {
  row: ForecastRow;
  /** Sinf rangi (oqimdagi dars halqasi). */
  hex: string;
  first: boolean;
  last: boolean;
  className?: string;
}) {
  const label = useStateLabel()(row);
  const broken = row.state === "overflow";
  const warn = !!row.conflict || row.state === "past";
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-0 w-6", className)}>
      <span
        className={cn(
          "absolute left-1/2 -translate-x-1/2 border-l-2",
          broken ? "border-dashed border-destructive/50" : "border-border",
          first ? "top-1/2" : "-top-1.5",
          last ? "bottom-1/2" : "-bottom-1.5",
        )}
      />
      <span
        title={label}
        className={cn(
          "pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card",
          row.state === "pinned" ? "size-4" : "size-3",
          row.state === "taught" && "bg-success",
          row.state === "flow" && !warn && "border-2",
          row.state === "flow" && row.reserve && "border-dashed",
          warn && "border-2 border-warning bg-warning/30",
          row.state === "unscheduled" && "border-2 border-dashed border-muted-foreground/40",
          broken && "border-2 border-dashed border-destructive",
        )}
        style={row.state === "flow" && !warn ? { borderColor: hex } : undefined}
      >
        {row.state === "pinned" && <Pin className="size-3 text-foreground" />}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Sana chipi. `changed` — qoralamada sana oʻzgaradi: eski → yangi. */
export function FlowDate({ row, draft }: { row: ForecastRow; draft: boolean }) {
  const t = useTranslations("LessonFlow");
  const fmt = useFlowDateLabel();
  if (row.state === "overflow") {
    return <span className="shrink-0 rounded-full border border-dashed border-destructive/60 px-2 text-tag font-semibold text-destructive">{t("state.overflow")}</span>;
  }
  const now = row.current?.date ?? null;
  const next = row.projected?.date ?? null;
  if (!now && !next) return <span className="shrink-0 text-tag text-muted-foreground">{t("state.unscheduled")}</span>;
  const changed = draft && !!next && next !== now && row.state === "flow";
  return (
    <span className={cn("shrink-0 inline-flex items-center gap-1 rounded-full px-2 text-tag font-semibold tabular-nums", changed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
      {changed && now && <span className="font-normal line-through opacity-60">{fmt(now)}</span>}
      {changed && now && <ArrowRight className="size-3" />}
      {fmt((changed ? next : now ?? next)!)}
    </span>
  );
}

/* ── «Yil oxirigacha N dars sigʻmaydi» chipi (hujjat 3.6) ──
   Yechimlar boʻshagan slotni birinchi sigʻmagan darsga beradi (`fillOverflow`). */
export function OverflowChip({ forecast, titles, onRemoveReserve, onShorten }: {
  forecast: FlowForecast;
  titles: Map<string, string>;
  onRemoveReserve: (lessonId: string) => void;
  onShorten: (lessonId: string) => void;
}) {
  const t = useTranslations("LessonFlow");
  const count = forecast.overflow.length;
  if (!count) return null;
  const byId = new Map(forecast.rows.map((r) => [r.lessonId, r]));
  const reserves = forecast.rows.filter((r) => r.reserve && r.state === "flow");
  const multi = forecast.rows.filter((r) => r.state === "flow" && !!r.projectedLast && !!r.projected
    && (r.projectedLast.date !== r.projected.date || r.projectedLast.startMin !== r.projected.startMin));
  const name = (id: string) => `${byId.get(id)?.index}. ${titles.get(id) || t("untitled")}`;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-caption">
      <CalendarX2 className="size-4 shrink-0 text-destructive" />
      <span className="min-w-0 flex-1 font-medium text-foreground">{t("overflowChip", { count })}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 bg-card text-foreground">{t("overflowShow")}</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-3">
          <PopoverHeader>
            <PopoverTitle>{t("overflowTitle")}</PopoverTitle>
            <PopoverDescription>{t("overflowHint")}</PopoverDescription>
          </PopoverHeader>
          <ul className="space-y-1">
            {forecast.overflow.map((id) => (
              <li key={id} className="flex items-center gap-2 text-caption">
                <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                <span className="truncate">{name(id)}</span>
              </li>
            ))}
          </ul>
          {(reserves.length > 0 || multi.length > 0) && (
            <div className="space-y-1 border-t border-border pt-3">
              {reserves.map((r) => (
                <button key={r.lessonId} type="button" onClick={() => onRemoveReserve(r.lessonId)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-caption hover:bg-muted">
                  <Trash2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{t("fixReserve", { lesson: name(r.lessonId) })}</span>
                </button>
              ))}
              {multi.map((r) => (
                <button key={r.lessonId} type="button" onClick={() => onShorten(r.lessonId)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-caption hover:bg-muted">
                  <ListMinus className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{t("fixShorten", { lesson: name(r.lessonId) })}</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-tag text-muted-foreground">{t("fixExcludeHint")}</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
