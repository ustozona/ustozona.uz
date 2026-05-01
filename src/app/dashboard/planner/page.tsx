"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { autoClassColor, CLASS_COLOR_TOKENS, type ClassColor } from "@/lib/class-colors";
import { fmtMin, type Shift } from "@/lib/timetable";
import { cn } from "@/lib/utils";

type ClassItem = {
  id: number;
  name: string;
  subject: string;
  shift: Shift;
  color?: ClassColor;
};

const CLASSES: ClassItem[] = [
  { id: 1, name: "5-A",                subject: "Informatika",           shift: 1 },
  { id: 2, name: "5-B",                subject: "Informatika",           shift: 1 },
  { id: 3, name: "5-D",                subject: "Informatika",           shift: 1 },
  { id: 4, name: "6-A",                subject: "Informatika",           shift: 2 },
  { id: 5, name: "6-B",                subject: "Informatika",           shift: 2 },
  { id: 6, name: "6-D",                subject: "Informatika",           shift: 2 },
  { id: 7, name: "7-A",                subject: "Robototexnika",         shift: 2 },
  { id: 8, name: "To'garak (1-guruh)", subject: "Scratch & Algoritmika", shift: 2, color: "orange" as ClassColor },
];

const STORAGE_KEY  = "murabbiyona-timetable-events";
const BLOCKED_KEY  = "murabbiyona-blocked-days";
const LESSONS_KEY  = "murabbiyona-lessons";

type TimetableEvent = {
  id: string;
  classId: number;
  day: number;      // 1=Mon … 6=Sat
  startMin: number;
  endMin: number;
};

type Lesson = {
  id: string;
  classId: number;
  title: string;
  // linked placements
  placements: { date: string; startMin: number; endMin: number }[];
};

type BlockedDay = {
  date: string;  // "YYYY-MM-DD"
  label: string;
};

type CreateModal = {
  date: Date;
  startMin: number;
  endMin: number;
};

type LinkModal = {
  date: Date;
  startMin: number;
  endMin: number;
};

const DAY_LABELS_FULL  = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const DAY_LABELS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sha", "Yak"];
const MONTH_NAMES = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];

const SLOT_HEIGHT   = 150;
const START_HOUR    = 0;
const END_HOUR      = 24;
const VISIBLE_HOURS = END_HOUR - START_HOUR;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function minToHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function HHMMToMin(s: string) {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getWeekDates(anchor: Date): Date[] {
  const dow    = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function dateToTimetableDay(d: Date): number {
  const dow = d.getDay();
  return dow === 0 ? 7 : dow;
}

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset   = (firstDow + 6) % 7;
  const days     = getDaysInMonth(year, month);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function classColor(cls: ClassItem) {
  return cls.color ?? autoClassColor(cls.id);
}

export default function PlannerPage() {
  const [view,       setView]       = useState<"week" | "month">("week");
  const [anchor,     setAnchor]     = useState(() => new Date());
  const [events,     setEvents]     = useState<TimetableEvent[]>([]);
  const [lessons,    setLessons]    = useState<Lesson[]>([]);
  const [blocked,    setBlocked]    = useState<BlockedDay[]>([]);
  const [hydrated,   setHydrated]   = useState(false);
  const [nowMin,     setNowMin]     = useState(0);
  const [blockModal, setBlockModal] = useState<{ date: Date } | null>(null);
  const [blockLabel, setBlockLabel] = useState("");
  const [createModal, setCreateModal] = useState<CreateModal | null>(null);
  const [linkModal,   setLinkModal]   = useState<LinkModal | null>(null);

  // create modal form state
  const [cmClassId,   setCmClassId]   = useState<number>(CLASSES[0].id);
  const [cmTitle,     setCmTitle]     = useState("");
  const [cmStartStr,  setCmStartStr]  = useState("08:00");
  const [cmEndStr,    setCmEndStr]    = useState("08:45");

  // link modal state
  const [lmClassId,   setLmClassId]   = useState<number>(CLASSES[0].id);
  const [lmLessonId,  setLmLessonId]  = useState<string>("");
  const [lmStartStr,  setLmStartStr]  = useState("08:00");
  const [lmEndStr,    setLmEndStr]    = useState("08:45");

  const scrollerRef = useRef<HTMLDivElement>(null);

  // ── Hydrate ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setEvents(parsed.map((e: TimetableEvent & { durationMin?: number }) => ({
          id: e.id, classId: e.classId, day: e.day, startMin: e.startMin,
          endMin: e.endMin ?? (e.startMin + (e.durationMin ?? 60)),
        })));
      }
      const rawB = localStorage.getItem(BLOCKED_KEY);
      if (rawB) setBlocked(JSON.parse(rawB));
      const rawL = localStorage.getItem(LESSONS_KEY);
      if (rawL) setLessons(JSON.parse(rawL));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked)); } catch {}
  }, [blocked, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons)); } catch {}
  }, [lessons, hydrated]);

  // ── Live clock ──
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hydrated || !scrollerRef.current) return;
    const top = (nowMin / 60 - START_HOUR) * SLOT_HEIGHT - 120;
    scrollerRef.current.scrollTop = Math.max(0, top);
  }, [hydrated]);

  const classById  = useMemo(() => new Map(CLASSES.map((c) => [c.id, c])), []);
  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.date)), [blocked]);
  const blockedMap = useMemo(() => new Map(blocked.map((b) => [b.date, b.label])), [blocked]);

  const today     = new Date();
  const weekDates = useMemo(() => getWeekDates(anchor), [anchor]);
  const monthGrid = useMemo(() => getMonthGrid(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  // lessons placed on a specific date key
  const placedByDate = useMemo(() => {
    const map = new Map<string, { lesson: Lesson; startMin: number; endMin: number }[]>();
    for (const lesson of lessons) {
      for (const p of lesson.placements) {
        const arr = map.get(p.date) ?? [];
        arr.push({ lesson, startMin: p.startMin, endMin: p.endMin });
        map.set(p.date, arr);
      }
    }
    return map;
  }, [lessons]);

  function prevPeriod() {
    const d = new Date(anchor);
    if (view === "week") d.setDate(d.getDate() - 7); else d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  }
  function nextPeriod() {
    const d = new Date(anchor);
    if (view === "week") d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  }

  function saveBlock() {
    if (!blockModal) return;
    const key = toDateKey(blockModal.date);
    setBlocked((prev) => {
      const without = prev.filter((b) => b.date !== key);
      if (!blockLabel.trim()) return without;
      return [...without, { date: key, label: blockLabel.trim() }];
    });
    setBlockModal(null);
    setBlockLabel("");
  }

  function openBlockModal(date: Date) {
    const key = toDateKey(date);
    setBlockLabel(blockedMap.get(key) ?? "");
    setBlockModal({ date });
  }

  // ── Open "Yaratish" modal ──
  function openCreateModal(date: Date, hour: number) {
    const startMin = hour * 60;
    const endMin   = startMin + 45;
    setCmClassId(CLASSES[0].id);
    setCmTitle("");
    setCmStartStr(minToHHMM(startMin));
    setCmEndStr(minToHHMM(endMin));
    setCreateModal({ date, startMin, endMin });
  }

  function saveCreate() {
    if (!createModal || !cmTitle.trim()) return;
    const startMin = HHMMToMin(cmStartStr);
    const endMin   = HHMMToMin(cmEndStr);
    const dateKey  = toDateKey(createModal.date);
    const newLesson: Lesson = {
      id: uid(),
      classId: cmClassId,
      title: cmTitle.trim(),
      placements: [{ date: dateKey, startMin, endMin }],
    };
    setLessons((prev) => [...prev, newLesson]);
    setCreateModal(null);
  }

  // ── Open "Ulash" modal ──
  function openLinkModal(date: Date, hour: number) {
    const startMin = hour * 60;
    const endMin   = startMin + 45;
    setLmClassId(CLASSES[0].id);
    setLmLessonId("");
    setLmStartStr(minToHHMM(startMin));
    setLmEndStr(minToHHMM(endMin));
    setLinkModal({ date, startMin, endMin });
  }

  function saveLink() {
    if (!linkModal || !lmLessonId) return;
    const startMin = HHMMToMin(lmStartStr);
    const endMin   = HHMMToMin(lmEndStr);
    const dateKey  = toDateKey(linkModal.date);
    setLessons((prev) => prev.map((l) => {
      if (l.id !== lmLessonId) return l;
      const without = l.placements.filter((p) => p.date !== dateKey);
      return { ...l, placements: [...without, { date: dateKey, startMin, endMin }] };
    }));
    setLinkModal(null);
  }

  const headerLabel = `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;

  // ── Lessons filtered by classId (for link modal list) ──
  const lessonsForClass = useMemo(
    () => lessons.filter((l) => l.classId === lmClassId),
    [lessons, lmClassId]
  );

  // ── EventPill (month view) ──
  function EventPill({ ev, compact = false }: { ev: TimetableEvent; compact?: boolean }) {
    const cls = classById.get(ev.classId);
    if (!cls) return null;
    const tokens = CLASS_COLOR_TOKENS[classColor(cls)];
    return (
      <div className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity truncate",
        tokens.badgeBg
      )}>
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tokens.dot)} />
        <span className={cn("truncate font-medium", tokens.badgeText, compact ? "text-[10px]" : "text-[11px]")}>
          {cls.name}
        </span>
        {!compact && (
          <span className={cn("text-[10px] opacity-60 shrink-0", tokens.badgeText)}>
            {fmtMin(ev.startMin)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-4">
      <div className="bg-card rounded-2xl shadow-none border border-border/60 flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Toolbar ── */}
        <div className="grid shrink-0 border-b border-border/60 px-5 py-3.5"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">{headerLabel}</h2>
          </div>

          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 self-center">
            {(["week", "month"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn(
                  "px-5 py-1.5 rounded-md text-sm font-semibold transition-colors",
                  view === v ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {v === "week" ? "Hafta" : "Oy"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 justify-end">
            <button onClick={prevPeriod} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onClick={() => setAnchor(new Date())}
              className="h-8 px-3 rounded-lg text-sm font-semibold hover:bg-muted transition-colors border border-border">
              Bugun
            </button>
            <button onClick={nextPeriod} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* ── Week view ── */}
        {view === "week" && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin" ref={scrollerRef}>
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, minmax(0,1fr))" }}>

              {/* Sticky header row */}
              <div className="border-r border-border/40 sticky top-0 z-30 bg-card border-b border-border" />
              {weekDates.map((d, i) => {
                const isToday   = isSameDay(d, today);
                const key       = toDateKey(d);
                const isBlocked = blockedSet.has(key);
                return (
                  <div key={i}
                    className={cn(
                      "sticky top-0 z-30 px-2 py-2 text-center border-l border-border/40 cursor-pointer group bg-card border-b border-border",
                      isToday && "bg-primary/5"
                    )}
                    onClick={() => openBlockModal(d)}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {DAY_LABELS_FULL[i]}
                    </p>
                    <div className="flex items-center justify-center mt-0.5 gap-1">
                      <span className={cn(
                        "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                        isToday ? "bg-foreground text-background" : "text-foreground group-hover:bg-muted"
                      )}>{d.getDate()}</span>
                      {isBlocked && (
                        <span className="text-[9px] bg-red-100 text-red-600 rounded px-1 font-semibold truncate max-w-[60px]">
                          {blockedMap.get(key)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Time gutter */}
              <div className="border-r border-border/40">
                {Array.from({ length: VISIBLE_HOURS }, (_, h) => (
                  <div key={h}
                    className="border-t border-border/40 text-[11px] text-muted-foreground font-medium text-right pr-2 pt-1"
                    style={{ height: SLOT_HEIGHT }}>
                    {String(START_HOUR + h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date, colIdx) => {
                const tDay      = dateToTimetableDay(date);
                const dayEvents = events.filter((ev) => ev.day === tDay);
                const isToday   = isSameDay(date, today);
                const isBlocked = blockedSet.has(toDateKey(date));
                const nowTop    = (nowMin / 60 - START_HOUR) * SLOT_HEIGHT;
                const dateKey   = toDateKey(date);
                const placed    = placedByDate.get(dateKey) ?? [];

                return (
                  <div key={colIdx}
                    className={cn(
                      "relative border-l border-border/40",
                      isToday   && "bg-primary/[0.03]",
                      isBlocked && "bg-red-50/60 dark:bg-red-950/20"
                    )}
                    >

                    {isBlocked && (
                      <div className="absolute inset-0 flex items-start justify-center pt-3 pointer-events-none z-10">
                        <span className="text-[11px] font-semibold text-red-400/60 rotate-[-45deg] select-none">
                          {blockedMap.get(toDateKey(date))}
                        </span>
                      </div>
                    )}

                    {/* Hour rows */}
                    {Array.from({ length: VISIBLE_HOURS }, (_, h) => {
                      return (
                        <div key={h}
                          className="border-t border-border/40 relative"
                          style={{ height: SLOT_HEIGHT }}>
                          {/* 30-min line */}
                          <div className="absolute left-0 right-0 pointer-events-none"
                            style={{ top: SLOT_HEIGHT / 2, borderTop: "1px dashed rgba(0,0,0,0.06)" }} />
                        </div>
                      );
                    })}

                    {/* Current time line */}
                    {isToday && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: nowTop }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                        <div className="flex-1 h-px bg-red-500" />
                      </div>
                    )}

                    {/* Timetable event cards */}
                    {!isBlocked && dayEvents.map((ev) => {
                      const cls = classById.get(ev.classId);
                      if (!cls) return null;
                      const topH   = ev.startMin / 60 - START_HOUR;
                      const durH   = (ev.endMin - ev.startMin) / 60;
                      if (topH + durH < 0 || topH > VISIBLE_HOURS) return null;
                      const tokens = CLASS_COLOR_TOKENS[classColor(cls)];
                      const evHour = Math.floor(ev.startMin / 60) - START_HOUR;
                      return (
                        <div key={ev.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-xl px-2 py-1.5 z-10 overflow-hidden cursor-pointer transition-all group/evcard",
                            tokens.badgeBg
                          )}
                          style={{ top: topH * SLOT_HEIGHT + 2, height: Math.max(durH * SLOT_HEIGHT - 4, 24) }}>
                          <p className={cn("text-[11px] font-bold truncate leading-tight", tokens.badgeText)}>
                            {cls.name}
                          </p>
                          <p className={cn("text-[10px] truncate leading-tight opacity-75", tokens.badgeText)}>
                            {fmtMin(ev.startMin)} – {fmtMin(ev.endMin)}
                          </p>
                          <div className="absolute inset-x-1 bottom-1 hidden group-hover/evcard:flex gap-1">
                            <button
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-background/90 border border-border shadow-sm text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                              onMouseDown={(e) => { e.stopPropagation(); openCreateModal(date, evHour); }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                              Yaratish
                            </button>
                            <button
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-background/90 border border-border shadow-sm text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                              onMouseDown={(e) => { e.stopPropagation(); openLinkModal(date, evHour); }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                              Ulash
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Placed lesson cards */}
                    {!isBlocked && placed.map(({ lesson, startMin, endMin }, pi) => {
                      const cls = classById.get(lesson.classId);
                      if (!cls) return null;
                      const topH = startMin / 60 - START_HOUR;
                      const durH = (endMin - startMin) / 60;
                      if (topH + durH < 0 || topH > VISIBLE_HOURS) return null;
                      const tokens = CLASS_COLOR_TOKENS[classColor(cls)];
                      return (
                        <div key={pi}
                          className={cn(
                            "absolute left-1 right-1 rounded-xl px-2 py-1.5 z-11 overflow-hidden cursor-pointer hover:brightness-95 transition-all border border-dashed",
                            tokens.badgeBg,
                            tokens.ring
                          )}
                          style={{ top: topH * SLOT_HEIGHT + 2, height: Math.max(durH * SLOT_HEIGHT - 4, 24) }}>
                          <p className={cn("text-[11px] font-bold truncate leading-tight", tokens.badgeText)}>
                            {cls.name}
                          </p>
                          <p className={cn("text-[10px] truncate leading-tight", tokens.badgeText)}>
                            {lesson.title}
                          </p>
                          <p className={cn("text-[10px] opacity-60 truncate leading-tight", tokens.badgeText)}>
                            {minToHHMM(startMin)} – {minToHHMM(endMin)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* ── Month view ── */}
        {view === "month" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-auto scrollbar-thin">
            <div className="grid border-b border-border shrink-0"
              style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
              {DAY_LABELS_SHORT.map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-l first:border-l-0 border-border/40">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid flex-1" style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
              {monthGrid.map((date, idx) => {
                if (!date) return (
                  <div key={idx} className="border-l first:border-l-0 border-t border-border/40 bg-muted/10 min-h-[90px]" />
                );
                const isToday        = isSameDay(date, today);
                const tDay           = dateToTimetableDay(date);
                const dayEvents      = events.filter((ev) => ev.day === tDay && tDay <= 6);
                const isCurrentMonth = date.getMonth() === anchor.getMonth();
                const key            = toDateKey(date);
                const isBlocked      = blockedSet.has(key);
                const blockLbl       = blockedMap.get(key);
                const placed         = placedByDate.get(key) ?? [];

                return (
                  <div key={idx}
                    onClick={() => openBlockModal(date)}
                    className={cn(
                      "border-l first:border-l-0 border-t border-border/40 min-h-[90px] p-1.5 flex flex-col gap-0.5 cursor-pointer group",
                      !isCurrentMonth && "bg-muted/10",
                      isBlocked        && "bg-red-50/50 dark:bg-red-950/15",
                      isToday          && !isBlocked && "bg-primary/[0.04]"
                    )}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                        isToday           ? "bg-foreground text-background"
                        : !isCurrentMonth ? "text-muted-foreground/40"
                        : "text-foreground group-hover:bg-muted"
                      )}>{date.getDate()}</span>
                      {isBlocked && blockLbl && (
                        <span className="text-[9px] bg-red-100 text-red-600 rounded px-1 font-semibold truncate max-w-[70px]">
                          {blockLbl}
                        </span>
                      )}
                    </div>
                    {!isBlocked && dayEvents.slice(0, 2).map((ev) => (
                      <EventPill key={ev.id} ev={ev} compact />
                    ))}
                    {!isBlocked && placed.slice(0, 2).map(({ lesson, startMin }, pi) => {
                      const cls = classById.get(lesson.classId);
                      if (!cls) return null;
                      const tokens = CLASS_COLOR_TOKENS[classColor(cls)];
                      return (
                        <div key={pi} className={cn(
                          "flex items-center gap-1 rounded px-1.5 py-0.5 truncate border border-dashed",
                          tokens.badgeBg, tokens.ring
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tokens.dot)} />
                          <span className={cn("truncate font-medium text-[10px]", tokens.badgeText)}>
                            {lesson.title}
                          </span>
                          <span className={cn("text-[9px] opacity-60 shrink-0", tokens.badgeText)}>
                            {minToHHMM(startMin)}
                          </span>
                        </div>
                      );
                    })}
                    {!isBlocked && (dayEvents.length + placed.length) > 4 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length + placed.length - 4}</p>
                    )}
                    {isBlocked && (
                      <p className="text-[10px] text-red-400/70 font-medium pl-0.5">Bloklangan kun</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Block modal ── */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setBlockModal(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Kunni bloklash</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {blockModal.date.getDate()} {MONTH_NAMES[blockModal.date.getMonth()]} {blockModal.date.getFullYear()}
            </p>
            <input autoFocus type="text"
              placeholder="Sabab (masalan: Bayram, Ta'til...)"
              value={blockLabel}
              onChange={(e) => setBlockLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveBlock()}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40 mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              {blockedSet.has(toDateKey(blockModal.date)) && (
                <button
                  onClick={() => {
                    const k = toDateKey(blockModal.date);
                    setBlocked((p) => p.filter((b) => b.date !== k));
                    setBlockModal(null);
                  }}
                  className="h-9 px-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mr-auto">
                  Blokni olib tashlash
                </button>
              )}
              <button onClick={() => setBlockModal(null)}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Bekor
              </button>
              <button onClick={saveBlock}
                className="h-9 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yaratish modal ── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setCreateModal(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Dars yaratish</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {createModal.date.getDate()} {MONTH_NAMES[createModal.date.getMonth()]} {createModal.date.getFullYear()}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sinf</label>
                <select
                  value={cmClassId}
                  onChange={(e) => setCmClassId(Number(e.target.value))}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40">
                  {CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mavzu nomi</label>
                <input autoFocus type="text"
                  placeholder="Mavzu nomini kiriting..."
                  value={cmTitle}
                  onChange={(e) => setCmTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCreate()}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Boshlanish</label>
                  <input type="time" value={cmStartStr}
                    onChange={(e) => setCmStartStr(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tugash</label>
                  <input type="time" value={cmEndStr}
                    onChange={(e) => setCmEndStr(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end mt-5">
              <button onClick={() => setCreateModal(null)}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Bekor
              </button>
              <button onClick={saveCreate} disabled={!cmTitle.trim()}
                className="h-9 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ulash modal ── */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setLinkModal(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Mavzuni ulash</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {linkModal.date.getDate()} {MONTH_NAMES[linkModal.date.getMonth()]} {linkModal.date.getFullYear()}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sinf</label>
                <select
                  value={lmClassId}
                  onChange={(e) => { setLmClassId(Number(e.target.value)); setLmLessonId(""); }}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40">
                  {CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mavzu</label>
                {lessonsForClass.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 px-3 bg-muted/30 rounded-lg">
                    Bu sinf uchun mavzular yo'q. Avval yarating.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-border rounded-lg p-1">
                    {lessonsForClass.map((l) => (
                      <button key={l.id}
                        onClick={() => setLmLessonId(l.id)}
                        className={cn(
                          "text-left text-sm px-3 py-2 rounded-md transition-colors",
                          lmLessonId === l.id
                            ? "bg-foreground text-background"
                            : "hover:bg-muted text-foreground"
                        )}>
                        {l.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Boshlanish</label>
                  <input type="time" value={lmStartStr}
                    onChange={(e) => setLmStartStr(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tugash</label>
                  <input type="time" value={lmEndStr}
                    onChange={(e) => setLmEndStr(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end mt-5">
              <button onClick={() => setLinkModal(null)}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Bekor
              </button>
              <button onClick={saveLink} disabled={!lmLessonId}
                className="h-9 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40">
                Ulash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
