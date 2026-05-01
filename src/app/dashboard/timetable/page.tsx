"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { autoClassColor, classTokens, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import {
  DEFAULT_TIMETABLE_CONFIG,
  DAYS,
  buildSlots,
  fmtMin,
  defaultsForProfile,
  type TimetableConfig,
  type LessonSlot,
  type Shift,
  type SchoolProfile,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

type ClassItem = {
  id: number;
  name: string;
  subject: string;
  shift: Shift;
  color?: ClassColor;
};

const classes: ClassItem[] = [
  { id: 1, name: "5-A", subject: "Informatika", shift: 1 },
  { id: 2, name: "5-B", subject: "Informatika", shift: 1 },
  { id: 3, name: "5-D", subject: "Informatika", shift: 1 },
  { id: 4, name: "6-A", subject: "Informatika", shift: 2 },
  { id: 5, name: "6-B", subject: "Informatika", shift: 2 },
  { id: 6, name: "6-D", subject: "Informatika", shift: 2 },
  { id: 7, name: "7-A", subject: "Robototexnika", shift: 2 },
  { id: 8, name: "To'garak (1-guruh)", subject: "Scratch & Algoritmika", shift: 2, color: "orange" },
];

const STORAGE_KEY = "murabbiyona-timetable-events";
const CONFIG_KEY = "murabbiyona-timetable-config";
const PROFILE_KEY = "murabbiyona-timetable-profile";
const ONBOARDED_KEY = "murabbiyona-timetable-onboarded";

type TimetableEvent = {
  id: string;
  classId: number;
  day: number;
  startMin: number;
  endMin: number;
};

function uid() { return Math.random().toString(36).slice(2, 9); }

const SLOT_HEIGHT = 180; // px per hour
const TOTAL_HOURS = 24;


type EnrichedSlot = LessonSlot & { shift: Shift };

export default function TimetablePage() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [config, setConfig] = useState<TimetableConfig>(DEFAULT_TIMETABLE_CONFIG);
  const [profile, setProfile] = useState<SchoolProfile>("double");
  const [hydrated, setHydrated] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [pendingNewEventId, setPendingNewEventId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragHover, setDragHover] = useState<{ day: number; key: string } | null>(null);
  const [saved, setSaved] = useState(true);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);

  // Hydrate
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem(STORAGE_KEY);
      if (savedEvents) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed: any[] = JSON.parse(savedEvents);
        // Migrate old durationMin → endMin
        const migrated: TimetableEvent[] = parsed.map((e) => ({
          id: e.id,
          classId: e.classId,
          day: e.day,
          startMin: e.startMin,
          endMin: e.endMin ?? (e.startMin + (e.durationMin ?? 60)),
        }));
        setEvents(migrated);
      }
      const savedCfg = localStorage.getItem(CONFIG_KEY);
      if (savedCfg) setConfig(JSON.parse(savedCfg));
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile === "single" || savedProfile === "double") setProfile(savedProfile);
      const onboarded = localStorage.getItem(ONBOARDED_KEY);
      if (onboarded !== "1") setOnboardingOpen(true);
    } catch {}
    setHydrated(true);
  }, []);

  // Persist events
  useEffect(() => {
    if (!hydrated) return;
    setSaved(false);
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [events, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PROFILE_KEY, profile);
  }, [profile, hydrated]);

  const classById = useMemo(() => {
    const m = new Map<number, ClassItem>();
    classes.forEach((c) => m.set(c.id, c));
    return m;
  }, []);

  // Slots: depend on profile
  const allSlots: EnrichedSlot[] = useMemo(() => {
    const s1 = buildSlots(config.shift1).map((s) => ({ ...s, shift: 1 as Shift }));
    if (profile === "single") return s1;
    const s2 = buildSlots(config.shift2).map((s) => ({ ...s, shift: 2 as Shift }));
    return [...s1, ...s2].sort((a, b) => a.startMin - b.startMin);
  }, [config, profile]);

  // Initial auto-scroll: to the earliest event or earliest slot
  useEffect(() => {
    if (!hydrated || didInitialScrollRef.current) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const earliestEventMin = events.length
      ? Math.min(...events.map((e) => e.startMin))
      : null;
    const earliestSlotMin = allSlots.length ? allSlots[0].startMin : null;
    const target =
      earliestEventMin !== null && earliestSlotMin !== null
        ? Math.min(earliestEventMin, earliestSlotMin)
        : earliestEventMin ?? earliestSlotMin ?? 8 * 60;
    const targetPx = (target / 60) * SLOT_HEIGHT - 20;
    scroller.scrollTop = Math.max(0, targetPx);
    didInitialScrollRef.current = true;
  }, [hydrated, allSlots, events]);

  const handleDragStart = (e: React.DragEvent, classId: number) => {
    e.dataTransfer.setData("application/x-class-id", String(classId));
    e.dataTransfer.effectAllowed = "copy";
    setDraggingId(classId);
  };
  const handleDragEnd = () => { setDraggingId(null); setDragHover(null); };
  const handleDragOver = (e: React.DragEvent, day: number, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (dragHover?.day !== day || dragHover?.key !== key) setDragHover({ day, key });
  };
  const handleDrop = (e: React.DragEvent, day: number, startMin: number, endMin: number) => {
    e.preventDefault();
    const classIdStr = e.dataTransfer.getData("application/x-class-id");
    const classId = parseInt(classIdStr, 10);
    if (!classId || isNaN(classId)) return;
    setSaved(false);
    setEvents((prev) => [...prev, { id: uid(), classId, day, startMin, endMin }]);
    setDragHover(null);
    setDraggingId(null);
  };
  const removeEvent = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const updateEvent = (id: string, patch: Partial<TimetableEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const editingEvent = useMemo(
    () => events.find((e) => e.id === editingEventId) ?? null,
    [events, editingEventId]
  );

  const completeOnboarding = (newProfile: SchoolProfile, newConfig: TimetableConfig) => {
    setProfile(newProfile);
    setConfig(newConfig);
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {}
    setOnboardingOpen(false);
  };

  return (
    <div className="grid gap-4 p-4 grid-cols-1 xl:grid-cols-[320px_1fr] h-full min-h-0">
      {/* Onboarding modal */}
      {onboardingOpen && (
        <OnboardingDialog
          initialProfile={profile}
          initialConfig={config}
          onComplete={completeOnboarding}
        />
      )}

      {/* Edit event modal */}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          isNew={pendingNewEventId === editingEvent.id}
          classes={classes}
          slots={allSlots}
          onSave={(patch) => {
            updateEvent(editingEvent.id, patch);
            setEditingEventId(null);
            setPendingNewEventId(null);
          }}
          onClose={() => {
            if (pendingNewEventId) removeEvent(pendingNewEventId);
            setEditingEventId(null);
            setPendingNewEventId(null);
          }}
          onDelete={() => {
            removeEvent(editingEvent.id);
            setEditingEventId(null);
            setPendingNewEventId(null);
          }}
        />
      )}

      {/* ── Left: Classes list ── */}
      <Card className="rounded-2xl shadow-none flex flex-col gap-0 py-0 min-w-0 xl:max-h-[calc(100dvh-var(--top-header-height)-2rem)]">
        <div className="px-5 py-5 shrink-0 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                <path d="M22 10v6"/>
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Sinflar</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Sinflarni jadvalga sudrab tashlang
          </p>
        </div>
        <CardContent className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-2">
          {classes.map((cls) => {
            // Compute next lessons label for this class
            const clsEvents = events
              .filter((ev) => ev.classId === cls.id)
              .sort((a, b) => a.day - b.day || a.startMin - b.startMin);
            const nextLessons = clsEvents.length > 0
              ? clsEvents
                  .slice(0, 2)
                  .map((ev) => {
                    const dayShort = DAYS.find((d) => d.idx === ev.day)?.short ?? "";
                    return `${dayShort} ${fmtMin(ev.startMin)}`;
                  })
                  .join(" · ")
              : null;
            return (
              <DraggableClassCard
                key={cls.id}
                cls={cls}
                dragging={draggingId === cls.id}
                nextLessons={nextLessons}
                onDragStart={(e) => handleDragStart(e, cls.id)}
                onDragEnd={handleDragEnd}
                onEdit={() => {
                  if (clsEvents[0]) {
                    setEditingEventId(clsEvents[0].id);
                  } else {
                    // Sinf jadvalsiz — yangi dars qo'shish uchun bo'sh event yaratamiz
                    const newId = uid();
                    const defaultSlot = allSlots[0];
                    setEvents((prev) => [...prev, {
                      id: newId,
                      classId: cls.id,
                      day: 1,
                      startMin: defaultSlot?.startMin ?? 480,
                      endMin: defaultSlot?.endMin ?? 525,
                    }]);
                    setPendingNewEventId(newId);
                    setEditingEventId(newId);
                  }
                }}
                onDelete={() => {}}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* ── Right: Calendar ── */}
      <Card className="rounded-2xl shadow-none flex flex-col gap-0 py-0 min-w-0 xl:max-h-[calc(100dvh-var(--top-header-height)-2rem)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 shrink-0 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Dars jadvali</h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Saved indicator */}
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-300",
              saved ? "text-emerald-600" : "text-muted-foreground"
            )}>
              {saved ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )}
              {saved ? "Saqlandi" : "Saqlanmoqda..."}
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {profile === "single" ? "1-smenali maktab" : "2-smenali maktab"}
            </span>
            <Tooltip>
              <TooltipTrigger
                onClick={() => setOnboardingOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Sozlash"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </TooltipTrigger>
              <TooltipContent>Sozlash</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <CardContent
          ref={scrollerRef}
          className="flex-1 overflow-auto scrollbar-thin p-0 min-h-0"
        >
          <CalendarGrid
            slots={allSlots}
            events={events}
            classById={classById}
            dragHover={dragHover}
            draggingId={draggingId}
            onDragOver={handleDragOver}
            onDropSlot={(e, day, slot) =>
              handleDrop(e, day, slot.startMin, slot.endMin)
            }
            onDropFree={(e, day, hour) => handleDrop(e, day, hour * 60, hour * 60 + 60)}
            onRemove={removeEvent}
            onEdit={setEditingEventId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────── Calendar grid ─────────────────────────── */

function CalendarGrid({
  slots,
  events,
  classById,
  dragHover,
  draggingId,
  onDragOver,
  onDropSlot,
  onDropFree,
  onRemove,
  onEdit,
}: {
  slots: EnrichedSlot[];
  events: TimetableEvent[];
  classById: Map<number, ClassItem>;
  dragHover: { day: number; key: string } | null;
  draggingId: number | null;
  onDragOver: (e: React.DragEvent, day: number, key: string) => void;
  onDropSlot: (e: React.DragEvent, day: number, slot: EnrichedSlot) => void;
  onDropFree: (e: React.DragEvent, day: number, hour: number) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const minToTop = (min: number) => (min / 60) * SLOT_HEIGHT;
  const totalHeight = TOTAL_HOURS * SLOT_HEIGHT;

  // Compute lesson index within each shift
  const slotIndex = useMemo(() => {
    const map = new Map<number, number>();
    const s1 = slots.filter((s) => s.shift === 1);
    const s2 = slots.filter((s) => s.shift === 2);
    s1.forEach((s, i) => map.set(s.startMin, i + 1));
    s2.forEach((s, i) => map.set(s.startMin, i + 1));
    return map;
  }, [slots]);

  return (
    <div className="min-w-[820px]">
      {/* Header */}
      <div
        className="grid sticky top-0 z-20 bg-card border-b border-border"
        style={{ gridTemplateColumns: "70px repeat(6, minmax(0, 1fr))" }}
      >
        <div />
        {DAYS.map((d) => (
          <div key={d.idx} className="px-3 py-3 text-center border-l border-border/60">
            <p className="text-sm font-bold text-foreground">
              {d.label}
            </p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        className="grid relative"
        style={{ gridTemplateColumns: "70px repeat(6, minmax(0, 1fr))", height: totalHeight }}
      >
        {/* Time gutter */}
        <div className="border-r border-border/60 relative">
          {Array.from({ length: TOTAL_HOURS }, (_, h) => (
            <div
              key={h}
              className="text-xs text-muted-foreground font-semibold pl-3 pt-1.5 absolute left-0 right-0"
              style={{ top: h * SLOT_HEIGHT, height: SLOT_HEIGHT }}
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((d) => (
          <div key={d.idx} className="relative border-l border-border/60">
            {/* Hour rows with 15-min sub-gridlines + free-drop targets */}
            {Array.from({ length: TOTAL_HOURS }, (_, h) => {
              const key = `h-${h}`;
              const isHover = dragHover?.day === d.idx && dragHover?.key === key;
              return (
                <div
                  key={h}
                  onDragOver={(e) => onDragOver(e, d.idx, key)}
                  onDrop={(e) => onDropFree(e, d.idx, h)}
                  className={cn(
                    "relative border-t border-border/60 transition-colors",
                    isHover && draggingId !== null
                      ? "bg-foreground/5"
                      : ""
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {/* 5-daqiqalik chiziqlar */}
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{
                        top: ((i + 1) / 12) * SLOT_HEIGHT,
                        borderTop: (i + 1) % 6 === 0
                          ? "1px dashed rgba(0,0,0,0.08)"
                          : "1px solid rgba(0,0,0,0.03)",
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {/* Lesson slots — invisible drop targets + hover highlight only */}
            {slots.map((slot) => {
              const top = minToTop(slot.startMin);
              const height = ((slot.endMin - slot.startMin) / 60) * SLOT_HEIGHT;
              const key = `slot-${slot.startMin}`;
              const isHover = dragHover?.day === d.idx && dragHover?.key === key;
              return (
                <div
                  key={slot.startMin}
                  onDragOver={(e) => onDragOver(e, d.idx, key)}
                  onDrop={(e) => onDropSlot(e, d.idx, slot)}
                  className={cn(
                    "absolute left-0 right-0 rounded transition-colors",
                    isHover && "bg-foreground/5"
                  )}
                  style={{ top, height }}
                />
              );
            })}

            {/* Events on top */}
            {events
              .filter((ev) => ev.day === d.idx)
              .map((ev) => {
                const cls = classById.get(ev.classId);
                if (!cls) return null;
                const top = minToTop(ev.startMin);
                const height = ((ev.endMin - ev.startMin) / 60) * SLOT_HEIGHT;
                return (
                  <EventBlock
                    key={ev.id}
                    event={ev}
                    cls={cls}
                    top={top}
                    height={height}
                    onRemove={() => onRemove(ev.id)}
                    onEdit={() => onEdit(ev.id)}
                  />
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventBlock({
  event,
  cls,
  top,
  height,
  onRemove,
  onEdit,
}: {
  event: TimetableEvent;
  cls: ClassItem;
  top: number;
  height: number;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const color = cls.color ?? autoClassColor(cls.id);
  const hex = CLASS_COLOR_HEX[color];
  // Dark text on light solid color bg
  return (
    <div
      className="absolute left-1.5 right-1.5 rounded-xl p-2.5 group cursor-pointer overflow-hidden shadow-sm z-10"
      style={{
        top: top + 3,
        height: Math.max(height - 6, 36),
        backgroundColor: hex + "22",  /* ~13% opacity bg */
        borderLeft: `3px solid ${hex}`,
      }}
      onClick={onEdit}
    >
      <p className="text-[11px] font-semibold leading-tight" style={{ color: hex }}>
        {fmtMin(event.startMin)} – {fmtMin(event.endMin)}
      </p>
      <p className="text-sm font-bold leading-tight mt-0.5 truncate text-foreground">
        {cls.name}
      </p>

      {/* X delete button — top-right, visible on hover */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70"
        aria-label="O'chirish"
        style={{ color: hex }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
    </div>
  );
}

/* ─────────────────────────── Edit event dialog ─────────────────────────── */

function EditEventDialog({
  event,
  isNew = false,
  classes,
  slots,
  onSave,
  onClose,
  onDelete,
}: {
  event: TimetableEvent;
  isNew?: boolean;
  classes: ClassItem[];
  slots: EnrichedSlot[];
  onSave: (patch: Partial<TimetableEvent>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [classId, setClassId] = useState(event.classId);
  const [day, setDay] = useState(event.day);
  const [startMin, setStartMin] = useState(event.startMin);
  const [endMin, setEndMin] = useState(event.endMin);

  const startH = Math.floor(startMin / 60);
  const startM = startMin % 60;
  const endH = Math.floor(endMin / 60);
  const endMn = endMin % 60;
  const durationMin = endMin - startMin;

  // Quick presets — match onto existing slots
  const matchingSlot = slots.find((s) => s.startMin === startMin && s.endMin === endMin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto scrollbar-thin">
        <div className="px-6 pt-6 pb-4 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{isNew ? "Yangi dars qo'shish" : "Darsni tahrirlash"}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
            aria-label="Yopish"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Sinf</label>
            <select
              value={classId}
              onChange={(e) => setClassId(parseInt(e.target.value))}
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-foreground/40"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Kun</label>
            <select
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value))}
              className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-foreground/40"
            >
              {DAYS.map((d) => (
                <option key={d.idx} value={d.idx}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Time: Start + End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Boshlanish</label>
              <input
                type="time"
                value={`${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  const newStart = h * 60 + m;
                  setStartMin(newStart);
                  // Keep same duration when start changes
                  setEndMin(newStart + durationMin);
                }}
                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-foreground/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Tugash</label>
              <input
                type="time"
                value={`${endH.toString().padStart(2, "0")}:${endMn.toString().padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setEndMin(h * 60 + m);
                }}
                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-foreground/40"
              />
            </div>
          </div>

          {/* Duration badge */}
          {durationMin > 0 && (
            <p className="text-xs text-muted-foreground -mt-2">
              Davomiyligi: <span className="font-semibold text-foreground">{durationMin} daqiqa</span>
            </p>
          )}

          {/* Quick slot picker */}
          {slots.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Tayyor soat</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto scrollbar-thin">
                {slots.map((s, i) => {
                  const idxInShift =
                    s.shift === 1
                      ? slots.filter((x) => x.shift === 1).findIndex((x) => x.startMin === s.startMin) + 1
                      : slots.filter((x) => x.shift === 2).findIndex((x) => x.startMin === s.startMin) + 1;
                  const isActive = matchingSlot?.startMin === s.startMin;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setStartMin(s.startMin);
                        setEndMin(s.endMin);
                      }}
                      className={cn(
                        "text-left px-2 py-1.5 rounded-md border text-[11px] transition-colors",
                        isActive
                          ? "border-foreground bg-foreground/5 text-foreground"
                          : "border-border bg-card hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <span className="font-semibold">{s.shift}-smena {idxInShift}-soat</span>
                      <span className="block text-[10px] opacity-70">
                        {fmtMin(s.startMin)} – {fmtMin(s.endMin)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between gap-2">
          <button
            onClick={onDelete}
            className="h-9 px-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            O'chirish
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={() => onSave({ classId, day, startMin, endMin })}
              disabled={endMin <= startMin}
              className="h-9 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Onboarding dialog ─────────────────────────── */

function OnboardingDialog({
  initialProfile,
  initialConfig,
  onComplete,
}: {
  initialProfile: SchoolProfile;
  initialConfig: TimetableConfig;
  onComplete: (profile: SchoolProfile, config: TimetableConfig) => void;
}) {
  const [profile, setProfile] = useState<SchoolProfile>(initialProfile);
  const [config, setConfig] = useState<TimetableConfig>(initialConfig);

  // When profile changes, prefill defaults — but keep user edits if they came back to a previously chosen profile
  const handleProfileChange = (next: SchoolProfile) => {
    setProfile(next);
    setConfig(defaultsForProfile(next));
  };

  const updateShift = (s: 1 | 2, key: keyof TimetableConfig["shift1"], value: number) => {
    setConfig((prev) => ({
      ...prev,
      [s === 1 ? "shift1" : "shift2"]: {
        ...(s === 1 ? prev.shift1 : prev.shift2),
        [key]: value,
      },
    }));
  };

  const previewSlots = useMemo(() => {
    const s1 = buildSlots(config.shift1).map((s) => ({ ...s, shift: 1 as const }));
    if (profile === "single") return s1;
    const s2 = buildSlots(config.shift2).map((s) => ({ ...s, shift: 2 as const }));
    return [...s1, ...s2];
  }, [config, profile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto scrollbar-thin">
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <h2 className="text-xl font-bold text-foreground">Maktab tizimini sozlang</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bu sozlamalar dars jadvali uchun ishlatiladi. Keyin ham o'zgartirishingiz mumkin.
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Profile */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              1. Sizning maktabingizda dars qanday tashkil etilgan?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ProfileOption
                active={profile === "single"}
                onClick={() => handleProfileChange("single")}
                title="Faqat 1-smenali"
                subtitle="Ertalab. Tanaffus 10 daq, katta tanaffus 15 daq."
              />
              <ProfileOption
                active={profile === "double"}
                onClick={() => handleProfileChange("double")}
                title="2-smenali"
                subtitle="Ertalab va kunduz. Tanaffus 5 daq, katta tanaffus 10 daq."
              />
            </div>
          </div>

          {/* Step 2: Shift settings */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              2. Smena vaqtlarini tasdiqlang
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ShiftCard
                label="1-smena"
                cfg={config.shift1}
                onChange={(k, v) => updateShift(1, k, v)}
              />
              {profile === "double" && (
                <ShiftCard
                  label="2-smena"
                  cfg={config.shift2}
                  onChange={(k, v) => updateShift(2, k, v)}
                />
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">3. Ko'rinishi</p>
            <div className="rounded-lg border border-border bg-muted/20 p-3 max-h-48 overflow-y-auto scrollbar-thin">
              <div className="space-y-1">
                {previewSlots.map((s) => {
                  const idx =
                    s.shift === 1
                      ? buildSlots(config.shift1).findIndex((x) => x.startMin === s.startMin) + 1
                      : buildSlots(config.shift2).findIndex((x) => x.startMin === s.startMin) + 1;
                  return (
                    <div
                      key={`${s.shift}-${s.startMin}`}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span className="text-muted-foreground w-16 shrink-0">
                        {s.shift}-smena
                      </span>
                      <span className="font-semibold text-foreground w-14 shrink-0">{idx}-soat</span>
                      <span className="text-muted-foreground tabular-nums">
                        {fmtMin(s.startMin)} – {fmtMin(s.endMin)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end gap-2">
          <button
            onClick={() => onComplete(profile, config)}
            className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            Saqlash va davom etish
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileOption({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg border-2 transition-all",
        active
          ? "border-foreground bg-foreground/5"
          : "border-border bg-card hover:border-foreground/30"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center",
            active ? "border-foreground" : "border-border"
          )}
        >
          {active && <span className="h-2 w-2 rounded-full bg-foreground" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function ShiftCard({
  label,
  cfg,
  onChange,
}: {
  label: string;
  cfg: TimetableConfig["shift1"];
  onChange: (key: keyof TimetableConfig["shift1"], value: number) => void;
}) {
  const startH = Math.floor(cfg.startMin / 60);
  const startM = cfg.startMin % 60;
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <FieldRow label="Boshlanish vaqti">
        <input
          type="time"
          value={`${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`}
          onChange={(e) => {
            const [h, m] = e.target.value.split(":").map(Number);
            onChange("startMin", h * 60 + m);
          }}
          className="text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:border-foreground/40"
        />
      </FieldRow>
      <FieldRow label="Soatlar soni">
        <select
          value={cfg.lessonCount}
          onChange={(e) => onChange("lessonCount", parseInt(e.target.value))}
          className="text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:border-foreground/40"
        >
          {[4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>{n} ta</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Tanaffus">
        <select
          value={cfg.breakMin}
          onChange={(e) => onChange("breakMin", parseInt(e.target.value))}
          className="text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:border-foreground/40"
        >
          {[5, 10, 15].map((n) => (
            <option key={n} value={n}>{n} daqiqa</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="Katta tanaffus (qo'shimcha)">
        <select
          value={cfg.longBreakExtraMin}
          onChange={(e) => onChange("longBreakExtraMin", parseInt(e.target.value))}
          className="text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:border-foreground/40"
        >
          <option value={0}>Yo'q</option>
          <option value={5}>+5 daqiqa</option>
          <option value={10}>+10 daqiqa</option>
        </select>
      </FieldRow>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/* ─────────────────────────── Draggable class card ─────────────────────────── */

function DraggableClassCard({
  cls,
  dragging,
  nextLessons,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  cls: ClassItem;
  dragging: boolean;
  nextLessons: string | null;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = cls.color ?? autoClassColor(cls.id);
  const hex = CLASS_COLOR_HEX[color];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all relative",
        dragging ? "opacity-40" : "hover:shadow-sm"
      )}
      style={{
        borderColor: hex,
        backgroundColor: hex + "14",  /* ~8% opacity */
      }}
    >
      {/* Icon */}
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: hex + "28" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: hex }}>
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
          <path d="M22 10v6"/>
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-foreground truncate leading-tight">{cls.name}</p>
        <p className="text-[11px] truncate mt-0.5" style={{ color: hex + "cc" }}>
          {nextLessons ?? `${cls.subject} · ${cls.shift}-smena`}
        </p>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-card/90 backdrop-blur-sm shadow-sm border border-border/50 p-0.5">
        <button
          type="button"
          draggable={false}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="Tahrirlash"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>
        <button
          type="button"
          draggable={false}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
          aria-label="O'chirish"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hover:text-red-500">
            <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
