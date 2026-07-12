"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypographyMuted } from "@/components/ui/typography";
import {
  BEHAVIOR_PERIODS,
  eventStats,
  filterEventsByPeriod,
  skillBreakdown,
  type BehaviorEvent,
  type BehaviorPeriod,
} from "@/lib/behavior-data";
import { BehaviorDonut } from "./BehaviorDonut";
import { EventTimeline } from "./EventTimeline";

/* Ballar hisoboti paneli — davr filtri + donut + timeline. Bitta-oʻquvchi
   modali (StudentDialog) ham, sinf-darajali hisobot (ClassReportDialog)
   ham shu panelni ishlatadi: farqi faqat berilgan eventlar toʻplami va
   nameById (butun sinf lentasida oʻquvchi ismi ham chiqadi). */

export function ReportPanel({
  events,
  period,
  onPeriodChange,
  onDelete,
  onSaveNote,
  nameById,
}: {
  events: BehaviorEvent[];
  period: BehaviorPeriod;
  onPeriodChange: (p: BehaviorPeriod) => void;
  onDelete: (event: BehaviorEvent) => void;
  onSaveNote: (event: BehaviorEvent, note: string) => void;
  /** Berilsa — timeline yozuvlarida oʻquvchi ismi ham chiqadi. */
  nameById?: Map<string, string>;
}) {
  const filtered = React.useMemo(
    () => filterEventsByPeriod(events, period),
    [events, period]
  );
  const slices = React.useMemo(() => skillBreakdown(filtered), [filtered]);
  const stats = React.useMemo(() => eventStats(filtered), [filtered]);

  return (
    <div className="space-y-4">
      <Select value={period} onValueChange={(v) => onPeriodChange(v as BehaviorPeriod)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BEHAVIOR_PERIODS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <TypographyMuted className="py-8 text-center text-sm">
          Bu davrda yozuv yoʻq.
        </TypographyMuted>
      ) : (
        <>
          <BehaviorDonut slices={slices} positivePct={stats.positivePct} />

          <div className="flex items-center justify-center gap-2">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-success">
              +{stats.earned} ijobiy
            </span>
            <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-destructive">
              −{stats.lost} salbiy
            </span>
          </div>

          <EventTimeline
            className="border-t border-border pt-4"
            events={filtered}
            nameById={nameById}
            onDelete={onDelete}
            onSaveNote={onSaveNote}
          />
        </>
      )}
    </div>
  );
}
