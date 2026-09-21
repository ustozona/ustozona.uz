"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange, Map as MapIcon, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { ClassSwatch } from "@/components/ClassSwatch";
import { ClassChip } from "@/components/ClassChip";
import { LessonsViewSwitch } from "@/components/lessons/LessonsViewSwitch";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useLessonStore } from "@/store/useLessonStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { lessonClassIds } from "@/lib/lessons-data";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";
import { dominantOf, paceForClass, sessionsByDay, unitRowsForClass, type UnitRow } from "@/lib/curriculum-map";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI — Darslar sahifasining ikkinchi koʻrinishi.
   Hisob-kitob `@/lib/curriculum-map` da; bu yerda faqat chizish.
   Kun katagi: sinf rangida; toʻq — oʻtilgan, och — rejada.
   ════════════════════════════════════════════════════════════════════ */

const pad = (n: number) => String(n).padStart(2, "0");

/** Oʻquv yili oylari ("YYYY-MM-01"). Kalendar sozlanmagan boʻlsa — sentabrdan 12 oy. */
function monthsOf(start: string, end: string): string[] {
  const out: string[] = [];
  const s = dateKeyToDate(start), e = dateKeyToDate(end);
  for (let d = new Date(s.getFullYear(), s.getMonth(), 1); d <= e && out.length < 13; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    out.push(dateToKey(d));
  }
  return out;
}

export default function LessonsYearPage() {
  const t = useTranslations("LessonsYear");
  const locale = useLocale();
  const classes = useLiveClasses();
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const calendar = useCalendarStore((s) => s.calendar);
  const today = todayKey();

  const range = useMemo(() => {
    if (calendar.range.start && calendar.range.end) return calendar.range;
    const now = dateKeyToDate(today);
    const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return { start: `${y}-09-01`, end: `${y + 1}-08-31` };
  }, [calendar.range, today]);

  const hexOf = useMemo(() => new Map(classes.map((c) => [c.id, CLASS_COLOR_HEX[classColor(c)]])), [classes]);
  const byDay = useMemo(() => sessionsByDay(lessons, new Set(classes.map((c) => c.id))), [lessons, classes]);
  const months = useMemo(() => monthsOf(range.start, range.end), [range]);

  const fmtMonth = new Intl.DateTimeFormat(locale, { month: "long" });
  const fmtShort = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i))
  );

  const lessonsOf = useMemo(() => {
    const m = new Map<string, typeof lessons>();
    for (const c of classes) m.set(c.id, lessons.filter((l) => lessonClassIds(l).includes(c.id)));
    return m;
  }, [classes, lessons]);

  const [mapClassId, setMapClassId] = useState<string | null>(null);
  const mapClass = classes.find((c) => c.id === mapClassId) ?? classes[0];
  const rows: UnitRow[] = useMemo(
    () => (mapClass ? unitRowsForClass(units, lessonsOf.get(mapClass.id) ?? [], mapClass.id, today) : []),
    [mapClass, units, lessonsOf, today]
  );

  if (classes.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6">
        <div className="flex justify-end"><LessonsViewSwitch active="year" /></div>
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const stateClass: Record<UnitRow["state"], string> = {
    done: "bg-success/10 text-success",
    behind: "bg-warning/10 text-warning",
    active: "bg-info/10 text-info",
    upcoming: "bg-muted text-muted-foreground",
    unscheduled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="flex items-center justify-end">
        <LessonsViewSwitch active="year" />
      </div>

      {/* ── Qamrov va surʼat ── */}
      <Panel>
        <PanelHeader icon={<Gauge />} title={t("paceTitle")} />
        <PanelBody inset className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const p = paceForClass(lessonsOf.get(c.id) ?? [], c.id, today);
            const pct = p.total ? Math.round((p.taught / p.total) * 100) : 0;
            const behind = p.expected - p.taught;
            const hex = hexOf.get(c.id)!;
            return (
              <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <ClassSwatch hex={hex} />
                  <span className="text-title-sm truncate flex-1">{c.name}</span>
                  <span className="text-caption text-muted-foreground tabular-nums">{t("taughtOf", { taught: p.taught, total: p.total })}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: hex }} />
                </div>
                <span className={cn("text-caption", behind > 0 ? "text-warning" : "text-success")}>
                  {p.total === 0 ? t("paceNoLessons") : behind > 0 ? t("paceBehind", { count: behind }) : t("paceOnTrack")}
                </span>
              </div>
            );
          })}
        </PanelBody>
      </Panel>

      {/* ── Yil kalendari ── */}
      <Panel>
        <PanelHeader
          icon={<CalendarRange />}
          title={t("yearTitle")}
          count={`${fmtShort.format(dateKeyToDate(range.start))} – ${fmtShort.format(dateKeyToDate(range.end))}`}
          actions={
            <div className="hidden md:flex flex-wrap items-center gap-3">
              {classes.map((c) => (
                <span key={c.id} className="flex items-center gap-1.5 text-caption text-muted-foreground">
                  <ClassSwatch hex={hexOf.get(c.id)!} />
                  {c.name}
                </span>
              ))}
            </div>
          }
        />
        <PanelBody inset className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {months.map((mKey) => {
            const first = dateKeyToDate(mKey);
            const lead = (first.getDay() + 6) % 7; // dushanbadan boshlanadi
            const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
            let count = 0;
            const cells: ReactNode[] = [];
            for (let i = 0; i < lead; i++) cells.push(<span key={`l${i}`} />);
            for (let d = 1; d <= daysIn; d++) {
              const key = addDaysKey(mKey, d - 1);
              const inYear = key >= range.start && key <= range.end;
              const holiday = inYear ? getHolidayForDate(calendar, key) : null;
              const entries = byDay.get(key);
              count += entries?.length ?? 0;
              let style: CSSProperties | undefined;
              let title = fmtShort.format(dateKeyToDate(key));
              if (entries?.length) {
                const dom = dominantOf(entries);
                const hex = hexOf.get(dom.classId)!;
                style = { backgroundColor: dom.taught ? hex : `color-mix(in oklch, ${hex} 35%, transparent)` };
                title += ` · ${t("dayLessons", { count: entries.length })}`;
              } else if (holiday) {
                title += ` · ${holiday.name}`;
              }
              cells.push(
                <span
                  key={key}
                  title={title}
                  style={style}
                  className={cn(
                    "aspect-square rounded-sm",
                    !entries?.length && (holiday ? "bg-muted" : inYear ? "bg-muted/40" : ""),
                    key === today && "ring-2 ring-foreground/60"
                  )}
                />
              );
            }
            const off = count === 0;
            return (
              <div key={mKey} className="flex flex-col gap-2 rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-label">{fmtMonth.format(first)}</span>
                  <span className="text-caption text-muted-foreground tabular-nums">{off ? t("off") : count}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weekdays.map((w, i) => (
                    <span key={`w${i}`} className="text-micro text-center text-muted-foreground">{w}</span>
                  ))}
                  {cells}
                </div>
              </div>
            );
          })}
        </PanelBody>
      </Panel>

      {/* ── Xarita: boʻlimlar boʻyicha ── */}
      <Panel>
        <PanelHeader
          icon={<MapIcon />}
          title={t("mapTitle")}
          actions={
            <div className="flex flex-wrap items-center gap-1">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setMapClassId(c.id)}
                  aria-pressed={mapClass?.id === c.id}
                  className={cn("rounded-full transition-opacity duration-fast", mapClass?.id === c.id ? "opacity-100" : "opacity-50 hover:opacity-80")}
                >
                  <ClassChip color={classColor(c)} name={c.name} />
                </button>
              ))}
            </div>
          }
        />
        <PanelBody className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-body text-muted-foreground text-center">{t("mapEmpty")}</p>
          ) : (
            <table className="w-full min-w-[640px] text-body">
              <thead>
                <tr className="text-left text-caption text-muted-foreground border-b border-border">
                  <th className="px-5 py-3 font-medium">{t("colUnit")}</th>
                  <th className="px-3 py-3 font-medium">{t("colDates")}</th>
                  <th className="px-3 py-3 font-medium w-48">{t("colCoverage")}</th>
                  <th className="px-3 py-3 font-medium text-right">{t("colStandards")}</th>
                  <th className="px-5 py-3 font-medium text-right">{t("colState")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pct = r.total ? Math.round((r.taught / r.total) * 100) : 0;
                  const hex = mapClass ? CLASS_COLOR_HEX[classColor(mapClass)] : undefined;
                  return (
                    <tr key={r.unit.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium text-foreground">{pad(r.ordinal)}. {r.unit.title}</td>
                      <td className="px-3 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                        {r.start ? `${fmtShort.format(dateKeyToDate(r.start))} – ${fmtShort.format(dateKeyToDate(r.end!))}` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: hex }} />
                          </div>
                          <span className="text-caption text-muted-foreground tabular-nums w-12 text-right">{r.taught}/{r.total}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{r.standards || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-tag font-semibold", stateClass[r.state])}>
                          {t(`state_${r.state}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
