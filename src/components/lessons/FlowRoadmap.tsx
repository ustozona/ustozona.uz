"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { arrayMove } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { todayKey } from "@/lib/date-keys";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useFlowForecast, useLessonFlow } from "@/hooks/useLessonFlow";
import { ReorderList } from "@/components/ReorderList";
import {
  TimelineAxis, TimelineTrack, mergeRanges, timelinePeriods, type TimelineBar,
} from "@/components/ish-reja/YearTimeline";
import type { ForecastRow } from "@/lib/lesson-flow";
import type { Unit } from "@/lib/lessons-data";

/* ════════════════════════════════════════════════════════════════════
   YOʻL XARITASI — sinfning yillik vaqt oʻqi (Darslar sahifasidagi
   «Roʻyxat | Yoʻl xaritasi» ikkinchi koʻrinishi). Har boʻlim — qator:
   birinchi va oxirgi dars orasidagi polosa, ichida darslar nuqta
   (boʻshliqlar koʻrinadi), sigʻmaydigan qism — yil oxirigacha uzuq.
   Taʼtillar, baholash davrlari (boʻlsa) va bugun chizigʻi — umumiy
   `YearTimeline` qismlari.

   Qatorni sudrash — boʻlim tartibi: sudrash davomida polosalar
   `flowForecast` qoralamasi bilan jonli koʻchadi, tashlanganda
   `flow.run` + `reorderUnits` (roʻyxatdagi tartiblash bilan bir yoʻl).
   ════════════════════════════════════════════════════════════════════ */

const NONE = "__none__";

export function FlowRoadmap({ classId, units, titles }: {
  classId: string;
  /** Sinf boʻlimlari, tartib boʻyicha. */
  units: Unit[];
  titles: Map<string, string>;
}) {
  const t = useTranslations("LessonFlow");
  const tl = useTranslations("LessonsPage");
  const flow = useLessonFlow();
  const reorderUnits = useLessonStore((s) => s.reorderUnits);
  const calendar = useCalendarStore((s) => s.calendar);
  const [preview, setPreview] = useState<string[] | null>(null);
  const ids = useMemo(() => units.map((u) => u.id), [units]);
  const forecast = useFlowForecast(classId, preview ? { unitOrder: preview } : undefined);

  const start = calendar.range.start;
  const end = calendar.range.end;
  const holidays = useMemo(() => mergeRanges(calendar.holidays.map((h) => h.range)), [calendar.holidays]);
  const periods = useMemo(() => timelinePeriods(calendar.quarters), [calendar.quarters]);

  const bars = useMemo(() => {
    const byUnit = new Map<string, ForecastRow[]>();
    for (const r of forecast?.rows ?? []) {
      const k = r.unitId ?? NONE;
      byUnit.set(k, [...(byUnit.get(k) ?? []), r]);
    }
    const out = new Map<string, TimelineBar | null>();
    for (const [k, rows] of byUnit) {
      const dated = rows.filter((r) => r.projected);
      const overflow = rows.filter((r) => r.state === "overflow").length;
      if (!dated.length) { out.set(k, null); continue; }
      const startKey = dated.map((r) => r.projected!.date).sort()[0];
      const endKey = dated.map((r) => (r.projectedLast ?? r.projected)!.date).sort().at(-1)!;
      out.set(k, {
        key: k,
        label: "",
        start: startKey,
        end: endKey,
        overflow,
        dots: dated.map((r) => ({
          key: r.lessonId,
          date: r.projected!.date,
          tone: r.state === "taught" ? "done" : r.conflict || r.state === "past" ? "warn" : "flow",
        })),
      });
    }
    return out;
  }, [forecast]);

  if (!start || !end) {
    return <p className="py-16 text-center text-caption text-muted-foreground">{t("roadmapNoCalendar")}</p>;
  }

  const today = todayKey();
  const order = preview ?? ids;
  const unitById = new Map(units.map((u) => [u.id, u]));
  const hasNoUnit = forecast?.rows.some((r) => r.unitId === null) ?? false;
  const overflowLabel = (count: number) => t("overflowChip", { count });

  const lane = (key: string, moved = false) => {
    const bar = bars.get(key);
    return (
      <TimelineTrack
        start={start} end={end} today={today} holidays={holidays} periods={periods}
        bars={bar ? [{ ...bar, moved }] : []}
        overflowLabel={overflowLabel}
        className="min-w-0 flex-1"
      />
    );
  };

  const onMove = (from: number, to: number) => {
    if (from === to || to < 0 || to >= ids.length) return;
    const next = arrayMove(ids, from, to);
    flow.run({ classIds: [classId], decline: "keep", mutate: () => reorderUnits(next) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3">
        <span className="w-44 shrink-0 text-caption text-muted-foreground">{t("roadmapHint")}</span>
        <TimelineAxis start={start} end={end} periods={periods} className="min-w-0 flex-1" />
      </div>
      <ReorderList
        ids={ids}
        onMove={onMove}
        onPreview={setPreview}
        labels={{ drag: tl("reorderDrag"), up: tl("reorderUp"), down: tl("reorderDown") }}
      >
        {(id, i, h) => {
          const unit = unitById.get(id);
          const pos = order.indexOf(id);
          const moved = !!preview && pos !== i;
          return (
            <div className={cn("flex items-center gap-3 rounded-lg py-1", h.isDragging && "bg-muted")}>
              <div className="flex w-44 shrink-0 items-center gap-1.5 min-w-0">
                {h.handle}
                <span className="truncate text-caption text-foreground">
                  <span className="tabular-nums text-muted-foreground">{pos + 1}.</span> {unit?.title || titles.get(id) || t("untitled")}
                </span>
              </div>
              {lane(id, moved)}
            </div>
          );
        }}
      </ReorderList>
      {hasNoUnit && (
        <div className="flex items-center gap-3 py-1">
          <span className="w-44 shrink-0 truncate pl-7 text-caption text-muted-foreground">{t("noUnit")}</span>
          {lane(NONE)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-tag text-muted-foreground">
        <Legend className="bg-success" label={t("state.taught")} />
        <Legend className="bg-foreground/60" label={t("state.flow")} />
        <Legend className="bg-warning" label={t("legendConflict")} />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm border border-dashed border-destructive/70" />{t("state.overflow")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm bg-[repeating-linear-gradient(45deg,var(--color-destructive)_0_1px,transparent_1px_5px)] opacity-60" />{t("legendHoliday")}
        </span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-destructive" />{t("legendToday")}</span>
      </div>
      {flow.dialog}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />{label}
    </span>
  );
}
