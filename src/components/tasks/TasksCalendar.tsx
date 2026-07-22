"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Check, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { panelCardClass, panelCardHeaderClass } from "@/components/DashboardPage";
import { TimeGrid, type TimeGridColumn } from "@/components/calendar/TimeGrid";
import { MonthGrid, MonthMorePopover } from "@/components/calendar/MonthGrid";
import { EventCard } from "@/components/calendar/EventCard";
import { EventPill } from "@/components/calendar/EventPill";
import { useCalendarFormat } from "@/components/calendar/format";
import {
  addDaysKey, dateKeyToDate, dateToKey, todayKey, getWeekKeys, getMonthGrid, isoDayOfKey,
} from "@/lib/calendar-core/date-math";
import { spanToBox, packColumns } from "@/lib/calendar-core/layout";
import { resolveOccurrences, type BlockedDayLike } from "@/lib/calendar-core/resolve";
import type { CalendarOccurrence } from "@/lib/calendar-core/occurrence";
import { getHolidayForDate, getQuarterForDate } from "@/lib/academic-calendar";
import { classColor } from "@/lib/grades-data";
import { autoClassColor, type ClassColor } from "@/lib/class-colors";
import { useTaskStore } from "@/store/useTaskStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useFilteredTasks } from "@/hooks/useFilteredTasks";
import type { TaskFilter } from "@/components/tasks/TasksSidebar";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR KALENDARI — butun loyihaning umumiy kalendar koʻrinishi.

   FEDERATSIYA: bu sahifa hech narsa SAQLAMAYDI — resolveOccurrences()
   darslar (sessiya+jadval sloti), taʼtillar, blok kunlar, vazifa
   muddatlari va tugʻilgan kunlarni bitta vaqt oʻqiga proyeksiya qiladi.
   Chip bosilsa egasi-modul ochiladi: vazifa → TaskDetail (selectedTaskId),
   dars → Rejalashtiruvchi, oʻquvchi → profil.

   Koʻrinishlar: kun/hafta (TimeGrid) · oy (MonthGrid) · chorak/yil
   (mini-oylar, read-only obzor; kun bosilsa kun koʻrinishiga sakraydi).
   URL: ?calView= & ?calDate= (replaceState — [[class-id-url-param]] naqshi).
   ════════════════════════════════════════════════════════════════════ */

const BLOCKED_KEY = "murabbiyona-blocked-days";
const VIEWS = ["day", "week", "month", "quarter", "year"] as const;
type CalView = (typeof VIEWS)[number];

const SLOT_HEIGHT = 120; // px / soat (kun/hafta)
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;

export function TasksCalendar({
  activeFilter,
  viewToggle,
}: {
  activeFilter: TaskFilter;
  /** Roʻyxat ⇄ Kalendar almashtirgich (sahifadan keladi). */
  viewToggle?: ReactNode;
}) {
  const fmt = useCalendarFormat();
  const router = useRouter();

  const [view, setView] = useState<CalView>("month");
  const [anchorKey, setAnchorKey] = useState<string>(() => todayKey());
  const [blocked, setBlocked] = useState<BlockedDayLike[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [nowMin, setNowMin] = useState(0);

  // ── URL + localStorage hydratsiya (mount gate) ──
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("calView");
    if (v && (VIEWS as readonly string[]).includes(v)) setView(v as CalView);
    const dt = sp.get("calDate");
    if (dt && /^\d{4}-\d{2}-\d{2}$/.test(dt)) setAnchorKey(dt);
    try {
      const raw = localStorage.getItem(BLOCKED_KEY);
      if (raw) setBlocked(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    url.searchParams.set("calView", view);
    url.searchParams.set("calDate", anchorKey);
    window.history.replaceState(null, "", url.toString());
  }, [view, anchorKey, hydrated]);

  useEffect(() => {
    const tick = () => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Manbalar ──
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const lessons = useLessonStore((s) => s.lessons);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const tasks = useTaskStore((s) => s.tasks);
  const setSelectedTaskId = useTaskStore((s) => s.setSelectedTaskId);
  // Chap paneldagi filtr kalendarga ham taʼsir qiladi (bajarilganlar ham koʻrinadi).
  const { tasksList } = useFilteredTasks(tasks, activeFilter, "none", "default", true);

  const students = useMemo(
    () => Object.values(classDataMap).flatMap((cd) => cd?.students ?? []),
    [classDataMap],
  );

  const colorFor = (classId?: string): ClassColor => {
    if (!classId) return "gray";
    const info = classDataMap[classId]?.info;
    return info ? classColor(info) : autoClassColor(classId);
  };

  // ── Koʻrinish diapazoni ──
  const anchor = dateKeyToDate(anchorKey);
  const range = useMemo((): { startKey: string; endKey: string } => {
    if (view === "day") return { startKey: anchorKey, endKey: anchorKey };
    if (view === "week") {
      const ks = getWeekKeys(anchorKey);
      return { startKey: ks[0], endKey: ks[6] };
    }
    if (view === "month") {
      const cells = getMonthGrid(anchor.getFullYear(), anchor.getMonth()).filter((d): d is Date => d !== null);
      return { startKey: dateToKey(cells[0]), endKey: dateToKey(cells[cells.length - 1]) };
    }
    if (view === "quarter") {
      const q = getQuarterForDate(calendar, anchorKey);
      if (q) return { startKey: q.range.start, endKey: q.range.end };
      const qStartMonth = Math.floor(anchor.getMonth() / 3) * 3;
      return {
        startKey: dateToKey(new Date(anchor.getFullYear(), qStartMonth, 1)),
        endKey: dateToKey(new Date(anchor.getFullYear(), qStartMonth + 3, 0)),
      };
    }
    return { startKey: `${anchor.getFullYear()}-01-01`, endKey: `${anchor.getFullYear()}-12-31` };
  }, [view, anchorKey, anchor, calendar]);

  const occByDay = useMemo(() => {
    if (!hydrated) return new Map<string, CalendarOccurrence[]>();
    return resolveOccurrences(range.startKey, range.endKey, {
      versions, lessons, calendar, blockedDays: blocked, tasks: tasksList, students,
    });
  }, [hydrated, range, versions, lessons, calendar, blocked, tasksList, students]);

  const occFor = (key: string) => occByDay.get(key) ?? [];

  // ── Navigatsiya ──
  function shift(dir: 1 | -1) {
    if (view === "day") setAnchorKey(addDaysKey(anchorKey, dir));
    else if (view === "week") setAnchorKey(addDaysKey(anchorKey, 7 * dir));
    else {
      const months = view === "month" ? 1 : view === "quarter" ? 3 : 12;
      const d = new Date(anchor);
      d.setDate(1);
      d.setMonth(d.getMonth() + months * dir);
      setAnchorKey(dateToKey(d));
    }
  }

  const title = useMemo(() => {
    if (view === "day") return `${anchor.getDate()} ${fmt.monthName(anchor.getMonth())}, ${fmt.dayName(isoDayOfKey(anchorKey))}`;
    if (view === "week") {
      const ks = getWeekKeys(anchorKey);
      const a = dateKeyToDate(ks[0]), b = dateKeyToDate(ks[6]);
      return a.getMonth() === b.getMonth()
        ? `${a.getDate()}–${b.getDate()} ${fmt.monthName(a.getMonth())}`
        : `${a.getDate()} ${fmt.monthShort(a.getMonth())} – ${b.getDate()} ${fmt.monthShort(b.getMonth())}`;
    }
    if (view === "month") return `${fmt.monthName(anchor.getMonth())} ${anchor.getFullYear()}`;
    if (view === "quarter") {
      const q = getQuarterForDate(calendar, anchorKey);
      if (q) return q.name;
      const s = dateKeyToDate(range.startKey), e = dateKeyToDate(range.endKey);
      return `${fmt.monthShort(s.getMonth())} – ${fmt.monthShort(e.getMonth())} ${e.getFullYear()}`;
    }
    return String(anchor.getFullYear());
  }, [view, anchor, anchorKey, calendar, fmt, range]);

  // ── Chip navigatsiyasi (deep-link) ──
  function openOccurrence(o: CalendarOccurrence) {
    if (o.source === "task-due") setSelectedTaskId(o.masterId);
    else if (o.source === "lesson-session" || o.source === "timetable-slot") router.push("/dashboard/planner");
    else if (o.source === "birthday") router.push(`/dashboard/students/${o.masterId}`);
  }

  function pillLabel(o: CalendarOccurrence): string {
    if (o.source === "birthday") return `🎂 ${o.title}`;
    if (o.source === "timetable-slot") return classDataMap[o.classId ?? ""]?.info.name ?? o.classId ?? "";
    return o.title;
  }

  function OccPill({ o }: { o: CalendarOccurrence }) {
    return (
      <EventPill
        color={colorFor(o.classId)}
        label={pillLabel(o)}
        onClick={() => openOccurrence(o)}
        trailing={o.source === "task-due" ? <Flag className="size-3 opacity-60" /> : undefined}
      />
    );
  }

  /** Kun katagi/ustunidagi pill sifatida koʻrsatiladigan occurrence'lar
      (taʼtil/blok kun — fon+yorliq, pill emas). */
  const pillable = (key: string) =>
    occFor(key).filter((o) => o.source !== "holiday" && o.source !== "blocked-day");

  const blockedMap = useMemo(() => new Map(blocked.map((b) => [b.date, b.label])), [blocked]);
  const tKey = todayKey();

  // ── Kun/hafta ustuni ──
  function timeColumn(key: string): TimeGridColumn {
    const allDay = pillable(key).filter((o) => o.allDay);
    const holiday = getHolidayForDate(calendar, key);
    const blockLbl = blockedMap.get(key);
    const d = dateKeyToDate(key);
    return {
      key,
      isToday: key === tKey,
      columnProps: {
        className: cn(key === tKey && "bg-muted/50", blockLbl && "bg-destructive/5", !blockLbl && holiday && "bg-muted/40"),
      },
      header: (
        <div className="flex flex-col gap-1 px-1.5 py-2">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-label">{fmt.dayShort(isoDayOfKey(key))}</span>
            {key === tKey ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">{d.getDate()}</span>
            ) : (
              <span className="text-sm font-bold text-foreground">{d.getDate()}</span>
            )}
          </div>
          {(blockLbl || holiday) && (
            <span className="mx-auto max-w-full truncate rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {blockLbl ?? holiday!.name}
            </span>
          )}
          {allDay.slice(0, 2).map((o) => <OccPill key={o.id} o={o} />)}
          {allDay.length > 2 && (
            <MonthMorePopover count={allDay.length - 2} title={`${d.getDate()} ${fmt.monthName(d.getMonth())}`}>
              {allDay.map((o) => <OccPill key={o.id} o={o} />)}
            </MonthMorePopover>
          )}
        </div>
      ),
    };
  }

  function renderTimeColumn(col: TimeGridColumn) {
    const timed = pillable(col.key).filter((o) => o.startMin != null && o.endMin != null);
    const packed = packColumns(timed, (o) => ({ startMin: o.startMin!, endMin: o.endMin! }));
    return (
      <>
        {packed.map(({ item: o, col: c, cols }) => {
          const box = spanToBox(o.startMin!, o.endMin!, DAY_START_HOUR * 60, SLOT_HEIGHT / 60, 26);
          const done = o.source === "task-due" && tasks.find((t) => t.id === o.masterId)?.status === "done";
          return (
            <EventCard
              key={o.id}
              color={colorFor(o.classId)}
              title={pillLabel(o)}
              subtitle={`${String(Math.floor(o.startMin! / 60)).padStart(2, "0")}:${String(o.startMin! % 60).padStart(2, "0")}`}
              compact={box.height < 56}
              muted={done}
              interactive
              corner={false}
              badges={o.source === "task-due" ? (done ? <Check className="size-3.5 shrink-0 opacity-70" /> : <Flag className="size-3.5 shrink-0 opacity-60" />) : undefined}
              onClick={() => openOccurrence(o)}
              className="absolute z-10"
              style={{
                top: box.top + 1,
                height: box.height - 2,
                left: `calc(${(c / cols) * 100}% + 3px)`,
                width: `calc(${(1 / cols) * 100}% - 6px)`,
              }}
            />
          );
        })}
      </>
    );
  }

  // ── Mini-oy (chorak/yil) ──
  function MiniMonth({ year, month }: { year: number; month: number }) {
    const cells = getMonthGrid(year, month);
    return (
      <div className="rounded-xl border border-border/60 p-3">
        <div className="mb-2 text-sm font-semibold text-foreground">
          {fmt.monthName(month)}{view === "year" ? "" : ` ${year}`}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5 text-center">
          {[1, 2, 3, 4, 5, 6, 7].map((iso) => (
            <span key={iso} className="pb-1 text-[10px] font-medium text-muted-foreground">{fmt.dayShort(iso)}</span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const key = dateToKey(d);
            const holiday = getHolidayForDate(calendar, key);
            const busy = pillable(key).length > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => { setAnchorKey(key); setView("day"); }}
                className={cn(
                  "relative mx-auto flex size-7 items-center justify-center rounded-md text-xs tabular-nums transition-colors hover:bg-muted",
                  key === tKey && "bg-foreground font-bold text-background hover:bg-foreground",
                  key !== tKey && holiday && "bg-muted/70 text-muted-foreground",
                )}
              >
                {d.getDate()}
                {busy && (
                  <span className={cn("absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full", key === tKey ? "bg-background" : "bg-primary")} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const overviewMonths = useMemo((): { year: number; month: number }[] => {
    if (view === "quarter") {
      const out: { year: number; month: number }[] = [];
      const d = dateKeyToDate(range.startKey);
      d.setDate(1);
      const end = dateKeyToDate(range.endKey);
      while (d.getFullYear() < end.getFullYear() || d.getMonth() <= end.getMonth() && d.getFullYear() === end.getFullYear()) {
        out.push({ year: d.getFullYear(), month: d.getMonth() });
        d.setMonth(d.getMonth() + 1);
        if (out.length >= 4) break;
      }
      return out;
    }
    return Array.from({ length: 12 }, (_, m) => ({ year: anchor.getFullYear(), month: m }));
  }, [view, range, anchor]);

  if (!hydrated) return null;

  return (
    <Card className={cn("flex h-full min-h-0 flex-1 flex-col rounded-2xl border-border shadow-sm", panelCardClass)}>
      {/* ── Toolbar ── */}
      <CardHeader
        className={cn(panelCardHeaderClass, "grid items-center gap-2 space-y-0 border-b-0 min-h-16 px-5 pt-4! pb-4!")}
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <SectionIcon><CalendarDays /></SectionIcon>
          <CardTitle className="truncate text-xl">{title}</CardTitle>
        </div>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => { if (v) setView(v as CalView); }}
          variant="outline"
          size="sm"
          className="justify-self-center"
        >
          <ToggleGroupItem value="day" className="px-3">{fmt.t("viewDay")}</ToggleGroupItem>
          <ToggleGroupItem value="week" className="px-3">{fmt.t("viewWeek")}</ToggleGroupItem>
          <ToggleGroupItem value="month" className="px-3">{fmt.t("viewMonth")}</ToggleGroupItem>
          <ToggleGroupItem value="quarter" className="px-3">{fmt.t("viewQuarter")}</ToggleGroupItem>
          <ToggleGroupItem value="year" className="px-3">{fmt.t("viewYear")}</ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="‹">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="font-semibold" onClick={() => setAnchorKey(todayKey())}>
            {fmt.t("today")}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} aria-label="›">
            <ChevronRight className="size-4" />
          </Button>
          <DateKeyPicker value={anchorKey} onChange={setAnchorKey} ariaLabel={fmt.t("today")} />
          {viewToggle}
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        {view === "month" && (
          <MonthGrid
            year={anchor.getFullYear()}
            month={anchor.getMonth()}
            getCellProps={(date, key) => {
              const holiday = getHolidayForDate(calendar, key);
              const blockLbl = blockedMap.get(key);
              return {
                className: cn(
                  date.getMonth() !== anchor.getMonth() && "bg-muted/10",
                  blockLbl && "bg-destructive/5",
                  !blockLbl && holiday && "bg-muted/40",
                  key === tKey && !blockLbl && "bg-muted/50",
                ),
              };
            }}
            renderCell={(date, key) => {
              const items = pillable(key);
              const holiday = getHolidayForDate(calendar, key);
              const blockLbl = blockedMap.get(key);
              const shown = items.slice(0, 3);
              return (
                <>
                  <div className="mb-0.5 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => { setAnchorKey(key); setView("day"); }}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-bold outline-none transition-colors hover:ring-2 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                        key === tKey ? "bg-foreground text-background"
                          : date.getMonth() !== anchor.getMonth() ? "text-muted-foreground/40 hover:text-foreground"
                            : "text-foreground hover:bg-muted",
                      )}
                    >
                      {date.getDate()}
                    </button>
                    {(blockLbl || holiday) && (
                      <span className="max-w-[90px] truncate rounded bg-foreground/5 px-1 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {blockLbl ?? holiday!.name}
                      </span>
                    )}
                  </div>
                  {shown.map((o) => <OccPill key={o.id} o={o} />)}
                  <MonthMorePopover count={items.length - shown.length} title={`${date.getDate()} ${fmt.monthName(date.getMonth())}`}>
                    {items.map((o) => <OccPill key={o.id} o={o} />)}
                  </MonthMorePopover>
                </>
              );
            }}
          />
        )}

        {(view === "week" || view === "day") && (
          <TimeGrid
            startHour={DAY_START_HOUR}
            endHour={DAY_END_HOUR}
            pxPerHour={SLOT_HEIGHT}
            nowMin={nowMin}
            lines="half"
            columns={(view === "week" ? getWeekKeys(anchorKey) : [anchorKey]).map(timeColumn)}
            renderColumn={renderTimeColumn}
          />
        )}

        {(view === "quarter" || view === "year") && (
          <div className="h-full overflow-y-auto scrollbar-thin p-5">
            <div className={cn("grid gap-4", view === "quarter" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
              {overviewMonths.map(({ year, month }) => <MiniMonth key={`${year}-${month}`} year={year} month={month} />)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
