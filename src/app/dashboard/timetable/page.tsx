"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable, type DropArg, type EventReceiveArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, EventContentArg } from "@fullcalendar/core";
import { autoClassColor, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";

/* ─── Types ─── */
type ClassItem = { 
  id: number; 
  name: string; 
  color?: ClassColor;
  students?: number;
  lessons?: number;
  assignments?: number;
  schedule?: string;
  initials?: string[];
};
type TimetableEvent = { id: string; classId: number; start: string; end: string };

/* ─── Same classes as classes page ─── */
const CLASSES: ClassItem[] = [
  { id: 1, name: "1-A", students: 24, lessons: 18, assignments: 2, schedule: "Du · 08:00", initials: ["AS", "DJ", "DE"] },
  { id: 2, name: "2-A", students: 18, lessons: 18, assignments: 2, schedule: "Se · 09:40", initials: ["AM", "AQ", "BJ"] },
  { id: 3, name: "3-A", students: 30, lessons: 18, assignments: 2, schedule: "Ch · 10:35", initials: ["AR", "BJ", "DO"] },
  { id: 4, name: "4-A", students: 22, lessons: 12, assignments: 3, schedule: "Pa · 11:30", initials: ["AC", "AA", "DA"] },
  { id: 5, name: "5-A", students: 25, lessons: 12, assignments: 3, schedule: "Ju · 14:40", initials: ["AA", "AM", "BC"] },
  { id: 6, name: "6-A", students: 15, lessons: 12, assignments: 3, schedule: "Sh · 15:30", initials: ["AB", "ET", "EE"] },
  { id: 7, name: "7-A", students: 28, lessons: 6, assignments: 3, schedule: "Du · 17:10", initials: ["AB", "AC", "AQ"] },
  { id: 8, name: "8-A", students: 12, lessons: 6, assignments: 1, schedule: "Se · 09:00", initials: ["JQ", "MS", "OR"] },
  { id: 9, name: "9-A", students: 19, lessons: 6, assignments: 2, schedule: "Ch · 10:00", initials: ["AS", "BN", "KM"] },
  { id: 10, name: "10-A", students: 27, lessons: 6, assignments: 2, schedule: "Pa · 11:00", initials: ["LT", "PR", "SW"] },
  { id: 11, name: "11-A", students: 21, lessons: 6, assignments: 2, schedule: "Ju · 12:00", initials: ["QW", "ER", "TY"] },
];

const STORAGE_KEY = "murabbiyona-timetable-v2";
const DAY_UZ = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function TimetablePage() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(true);
  const [editEvent, setEditEvent] = useState<TimetableEvent | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  useEffect(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) setEvents(JSON.parse(r)); } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaved(false);
    const t = setTimeout(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); setSaved(true); }, 600);
    return () => clearTimeout(t);
  }, [events, hydrated]);

  useEffect(() => {
    if (!listRef.current) return;
    draggableRef.current = new Draggable(listRef.current, {
      itemSelector: ".draggable-class",
      eventData: (el) => {
        const id = Number(el.getAttribute("data-class-id"));
        const cls = CLASSES.find(c => c.id === id);
        const hex = cls ? CLASS_COLOR_HEX[cls.color ?? autoClassColor(cls.id)] : "#888";
        return { title: cls?.name ?? "", duration: "00:45", backgroundColor: hex, borderColor: hex, textColor: "#2e3138", extendedProps: { classId: id } };
      },
    });
    return () => draggableRef.current?.destroy();
  }, []);

  const fcEvents = useMemo(() => events.map(ev => {
    const cls = CLASSES.find(c => c.id === ev.classId);
    const hex = cls ? CLASS_COLOR_HEX[cls.color ?? autoClassColor(cls.id)] : "#888";
    return { id: ev.id, title: cls?.name ?? "", start: ev.start, end: ev.end, backgroundColor: hex, borderColor: hex, textColor: "#2e3138", extendedProps: { classId: ev.classId } };
  }), [events]);

  const handleEventReceive = useCallback((info: EventReceiveArg) => {
    const classId = Number(info.event.extendedProps.classId);
    if (!classId) return;
    const startStr = info.event.startStr;
    const endStr = info.event.endStr || new Date(info.event.start!.getTime() + 45 * 60000).toISOString();
    setEvents(prev => [...prev, { id: uid(), classId, start: startStr, end: endStr }]);
    info.revert();
  }, []);

  const handleEventDrop = useCallback((info: EventDropArg) => {
    setEvents(prev => prev.map(ev => ev.id === info.event.id ? { ...ev, start: info.event.startStr, end: info.event.endStr } : ev));
  }, []);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const ev = events.find(e => e.id === info.event.id);
    if (ev) setEditEvent(ev);
  }, [events]);

  const removeEvent = useCallback((id: string) => setEvents(prev => prev.filter(e => e.id !== id)), []);

  // The classNextLesson variable is removed because we display students and lessons count instead

  if (!hydrated) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col px-4 py-2 md:p-8 lg:px-12">
      <div className="flex-1 min-h-0 grid p-3 -m-3" style={{ gridTemplateColumns: "25% 75%" }}>
        {/* ── Left: Sinflar ── */}
        <div className="min-w-0 min-h-0 pr-4 grid">
        <div className="bg-card rounded-xl border border-border card-elevation flex flex-col h-full overflow-hidden" data-tour="timetable-class-selector">
          {/* Header */}
          <div className="flex items-center px-5 pt-6 pb-4 gap-2.5 shrink-0 min-h-[4.5rem]">
            <div className="p-2 rounded-lg bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-foreground">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
              </svg>
            </div>
            <h2 className="heading-section">Sinflar</h2>
          </div>

          {/* Academic year button */}
          <div className="px-5 pb-4 shrink-0">
            <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground px-3 has-[>svg]:px-2.5 gap-1.5 bg-card border border-border shadow-xs hover:bg-muted !pl-4 !pr-3 w-full h-11 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground shrink-0">
                <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
              </svg>
              <span className="text-sm font-medium truncate">2025–2026-o&apos;quv yili</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground shrink-0 ml-auto">
                <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
              </svg>
            </button>
          </div>

          <p className="text-caption text-muted-foreground px-5 pb-3 text-center shrink-0">Sinflarni jadvalga sudrab tashlang</p>

          {/* Class list with fade gradient */}
          <div className="flex-1 min-h-0 relative overflow-hidden rounded-b-xl">
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <div className="h-full overflow-y-auto scrollbar-thin" ref={listRef}>
              <div className="px-5 pb-5 space-y-2">
                {CLASSES.map(cls => {
                  const hex = CLASS_COLOR_HEX[cls.color ?? autoClassColor(cls.id)];
                  const scheduledLessons = events.filter(e => e.classId === cls.id).length;
                  return (
                    <div
                      key={cls.id}
                      className="group draggable-class cursor-grab flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] relative"
                      data-class-id={cls.id}
                      style={{ borderColor: hex, backgroundColor: hex + "10" }}
                    >
                      <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: hex + "20" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6" style={{ color: hex }}>
                          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="heading-small truncate">{cls.name}</p>
                        <div className="text-[11px] text-muted-foreground/80 font-medium mt-0.5 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span>{cls.students} ta</span>
                          </div>
                          <span className="text-muted-foreground/40">•</span>
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
                            <span>{scheduledLessons} / {cls.lessons}</span>
                          </div>
                        </div>
                      </div>
                      {/* Hover actions */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-card/90 backdrop-blur-sm shadow-sm border border-border/50 p-0.5">
                        <button type="button" className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Tahrirlash">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground">
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" />
                          </svg>
                        </button>
                        <button type="button" className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors" title="O&apos;chirish">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-muted-foreground hover:text-red-500">
                            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Add Class button */}
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-border bg-card shadow-xs hover:bg-accent hover:text-accent-foreground px-4 py-2 has-[>svg]:px-3 w-full h-11 mt-3 rounded-xl border-dashed">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-2">
                    <path d="M5 12h14" /><path d="M12 5v14" />
                  </svg>
                  Sinf qo&apos;shish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Dars jadvali ── */}
      <div className="min-w-0 min-h-0 grid">
        <div className="bg-card rounded-xl border border-border card-elevation flex flex-col h-full overflow-hidden" data-tour="timetable-grid">
          {/* Header */}
          <div className="flex items-center px-5 pt-5 pb-3 gap-2.5 shrink-0 min-h-[4.5rem]">
            <div className="p-2 rounded-lg bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-foreground">
                <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
              </svg>
            </div>
            <h2 className="heading-section">Dars jadvali</h2>
            <div className="ml-auto flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-xs transition-all duration-200">
                {saved ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                )}
                <span className="text-muted-foreground">{saved ? "Saqlandi" : "Saqlanmoqda..."}</span>
              </span>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive py-2 has-[>svg]:px-3 h-11 px-4 rounded-xl font-semibold bg-foreground text-background hover:bg-foreground/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                </svg>
                Rotatsiyani sozlash
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div data-carousel-ignore="true" className="flex-1 min-h-0 overflow-hidden px-5 pb-5 timetable-editor">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              dayHeaderContent={(args) => {
                const dow = args.date.getDay();
                const dayNum = [0, 1, 2, 3, 4, 5, 6];
                const num = dayNum.indexOf(dow);
                const short = dow >= 1 && dow <= 6 ? DAY_UZ[dow - 1] : "";
                return (
                  <div className="fc-custom-header">
                    <span className="fc-header-weekday text-sm font-medium">{short}</span>
                  </div>
                );
              }}
              hiddenDays={[0]}
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              slotDuration="00:15:00"
              slotLabelInterval="01:00:00"
              slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
              height="100%"
              expandRows={true}
              editable={true}
              droppable={true}
              eventReceive={handleEventReceive}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              events={fcEvents}
              eventContent={(arg: EventContentArg) => <EventContent arg={arg} onRemove={removeEvent} />}
              nowIndicator={true}
              allDaySlot={false}
              scrollTime="07:00:00"
            />
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      {editEvent && (
        <EditDialog
          event={editEvent}
          onSave={(patch) => { setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...patch } : e)); setEditEvent(null); }}
          onDelete={() => { removeEvent(editEvent.id); setEditEvent(null); }}
          onClose={() => setEditEvent(null)}
        />
      )}
    </div>
    </div>
  );
}

/* ─── Event content ─── */
function EventContent({ arg, onRemove }: { arg: EventContentArg; onRemove: (id: string) => void }) {
  const fmt = (d: Date | null) => d ? `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}` : "";
  return (
    <div className="fc-event-main-custom group/event relative w-full h-full overflow-hidden p-1.5 flex flex-col">
      <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(arg.event.id); }}
        className="absolute top-0.5 right-0.5 size-5 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover/event:opacity-100 transition-opacity z-10 cursor-pointer hover:opacity-70">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2e3138" }}>
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>
      <div className="fc-event-time text-[10px] opacity-80 font-medium leading-none mb-1">{fmt(arg.event.start)} - {fmt(arg.event.end)}</div>
      <div className="fc-event-title text-xs font-bold leading-tight">{arg.event.title}</div>
    </div>
  );
}

/* ─── Edit dialog ─── */
function EditDialog({ event, onSave, onDelete, onClose }: {
  event: TimetableEvent;
  onSave: (p: Partial<TimetableEvent>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState(event.classId);
  const sd = new Date(event.start), ed = new Date(event.end);
  const [st, setSt] = useState(`${sd.getHours().toString().padStart(2, "0")}:${sd.getMinutes().toString().padStart(2, "0")}`);
  const [et, setEt] = useState(`${ed.getHours().toString().padStart(2, "0")}:${ed.getMinutes().toString().padStart(2, "0")}`);
  const base = event.start.split("T")[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 pt-6 pb-4 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-lg font-bold">Darsni tahrirlash</h2>
          <button onClick={onClose} className="size-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Sinf</label>
            <select value={classId} onChange={e => setClassId(Number(e.target.value))} className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none">
              {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold mb-1.5">Boshlanish</label><input type="time" value={st} onChange={e => setSt(e.target.value)} className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none" /></div>
            <div><label className="block text-xs font-semibold mb-1.5">Tugash</label><input type="time" value={et} onChange={e => setEt(e.target.value)} className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 outline-none" /></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between gap-2">
          <button onClick={onDelete} className="h-9 px-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">O&apos;chirish</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-semibold hover:bg-muted transition-colors">Bekor</button>
            <button onClick={() => onSave({ classId, start: `${base}T${st}:00`, end: `${base}T${et}:00` })} className="h-9 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors">Saqlash</button>
          </div>
        </div>
      </div>
    </div>
  );
}
