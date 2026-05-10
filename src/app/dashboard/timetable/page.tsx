"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable, type DropArg, type EventReceiveArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, EventContentArg } from "@fullcalendar/core";
import { autoClassColor, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Clock2Icon, ChevronDownIcon, XIcon, TrashIcon, SaveIcon, PlusIcon, PaletteIcon } from "lucide-react";

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
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
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

  const handleSaveClassSlots = useCallback((classId: number, slots: {day:string, start:string, end:string}[]) => {
    setEvents(prev => {
      const next = prev.filter(e => e.classId !== classId);
      
      // Find the Monday of the week currently shown in the calendar.
      // FullCalendar shows the week that contains "today" but starts on Monday.
      // If today is Sunday (0), the calendar shows NEXT week (Mon of next week).
      const now = new Date();
      const todayDow = now.getDay(); // 0=Sun, 1=Mon...6=Sat
      // Days to add to reach this week's Monday
      // If Sunday: jump to next Monday (+1), else go back to Monday of current week
      const mondayOffset = todayDow === 0 ? 1 : 1 - todayDow;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      
      slots.forEach(slot => {
        // DAY_UZ: 0=Dushanba(Mon)...5=Shanba(Sat)
        const dayIndex = DAY_UZ.indexOf(slot.day); // 0-5
        if (dayIndex < 0) return;
        const d = new Date(monday);
        d.setDate(monday.getDate() + dayIndex);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        next.push({
          id: Math.random().toString(36).slice(2, 9),
          classId,
          start: `${yyyy}-${mm}-${dd}T${slot.start}:00`,
          end: `${yyyy}-${mm}-${dd}T${slot.end}:00`,
        });
      });
      return next;
    });
  }, []);

  if (!hydrated) return null;

  return (
    <div className="absolute inset-0 flex flex-col px-4 py-2 md:p-8 lg:px-12">
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
                        <button type="button" className="p-1.5 rounded-md hover:bg-accent transition-colors" title="Tahrirlash" onClick={() => setEditingClass(cls)}>
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
      {editingClass && (
        <EditClassModal
          cls={editingClass}
          existingEvents={events.filter(e => e.classId === editingClass.id)}
          onSave={(slots) => { handleSaveClassSlots(editingClass.id, slots); setEditingClass(null); }}
          onClose={() => setEditingClass(null)}
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
  const classId = event.classId;
  const sd = new Date(event.start), ed = new Date(event.end);
  const [st, setSt] = useState(`${sd.getHours().toString().padStart(2, "0")}:${sd.getMinutes().toString().padStart(2, "0")}`);
  const [et, setEt] = useState(`${ed.getHours().toString().padStart(2, "0")}:${ed.getMinutes().toString().padStart(2, "0")}`);
  const base = event.start.split("T")[0];
  
  const selectedCls = CLASSES.find(c => c.id === classId);
  const hex = selectedCls ? CLASS_COLOR_HEX[selectedCls.color ?? autoClassColor(selectedCls.id)] : "#888";

  const dow = sd.getDay();
  const dayShort = dow >= 1 && dow <= 6 ? DAY_UZ[dow - 1] : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-[340px] rounded-2xl shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-lg font-semibold text-foreground">Dars vaqtini tahrirlash</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer">
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="p-6 pt-3 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-muted-foreground">Sinf</label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-muted/30">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hex }} />
              <span className="font-semibold text-foreground">{selectedCls?.name}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-muted-foreground">{dayShort} kuni vaqti</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Kirish</span>
                <div className="relative">
                  <input
                    type="time"
                    value={st}
                    onChange={e => setSt(e.target.value)}
                    className="flex w-full h-11 rounded-xl border border-input bg-card pl-3 pr-9 py-2 text-[15px] font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <Clock2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <span className="text-muted-foreground font-medium mt-6">—</span>
              <div className="relative flex-1 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Chiqish</span>
                <div className="relative">
                  <input
                    type="time"
                    value={et}
                    onChange={e => setEt(e.target.value)}
                    className="flex w-full h-11 rounded-xl border border-input bg-card pl-3 pr-9 py-2 text-[15px] font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <Clock2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 grid grid-cols-2 gap-3">
          <Button className="from-destructive via-destructive/60 to-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-gradient-to-r [background-size:200%_auto] text-white hover:bg-transparent hover:bg-[99%_center] h-11 rounded-xl gap-2 font-semibold shadow-none transition-all duration-300" onClick={onDelete}>
            <TrashIcon className="size-[18px]" />
            O'chirish
          </Button>
          <Button className="bg-sky-600/10 text-sky-600 hover:bg-sky-600/20 focus-visible:ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:hover:bg-sky-400/20 dark:focus-visible:ring-sky-400/40 h-11 rounded-xl gap-2 font-semibold shadow-none transition-colors" onClick={() => onSave({ start: `${base}T${st}:00`, end: `${base}T${et}:00` })}>
            <SaveIcon className="size-[18px]" />
            Saqlash
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Class Edit Modal ─────────────────────────── */
function EditClassModal({ cls, existingEvents, onSave, onClose }: { 
  cls: ClassItem; 
  existingEvents: TimetableEvent[];
  onSave: (slots: { day: string; start: string; end: string }[]) => void; 
  onClose: () => void; 
}) {
  const presetHexes = Object.entries(CLASS_COLOR_HEX)
    .filter(([name]) => name !== "gray")
    .map(([, hex]) => hex);
  const initialHex = cls.color ? CLASS_COLOR_HEX[cls.color] : CLASS_COLOR_HEX[autoClassColor(cls.id)];
  const [selectedColorHex, setSelectedColorHex] = useState<string>(initialHex);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [description, setDescription] = useState("");

  type TimeSlot = { id: string; day: string; start: string; end: string };
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    return existingEvents.map(ev => {
      const d = new Date(ev.start);
      const dow = d.getDay();
      const dayName = dow >= 1 && dow <= 6 ? DAY_UZ[dow - 1] : 'Dushanba';
      const start = ev.start.split('T')[1].substring(0, 5);
      const end = ev.end.split('T')[1].substring(0, 5);
      return { id: Math.random().toString(36).slice(2, 9), day: dayName, start, end };
    });
  });

  const addTimeSlot = () => setTimeSlots([...timeSlots, { id: Math.random().toString(), day: "Dushanba", start: "09:00", end: "10:00" }]);
  const removeTimeSlot = (id: string) => setTimeSlots(timeSlots.filter(s => s.id !== id));
  const updateTimeSlotDay = (id: string, day: string) => setTimeSlots(timeSlots.map(s => s.id === id ? { ...s, day } : s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-[540px] rounded-lg border shadow-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-2 p-6 pb-0 text-center sm:text-left relative">
          <h2 className="text-lg leading-none font-semibold text-foreground">Sinfni tahrirlash: {cls.name}</h2>
          <button onClick={onClose} className="absolute top-4 right-4 cursor-pointer opacity-70 transition-opacity hover:opacity-100 outline-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          <Field>
            <FieldLabel htmlFor="cls-name">Sinf nomi</FieldLabel>
            <div className="flex gap-2 relative">
              <input
                id="cls-name"
                value={cls.name}
                readOnly
                className="flex h-9 w-full flex-1 rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-none text-foreground/70 cursor-not-allowed"
              />
              <button
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] size-9 shrink-0 relative border border-border shadow-sm hover:opacity-90"
                style={{ background: `conic-gradient(${presetHexes.join(", ")}, ${presetHexes[0]})` }}
              >
                <PaletteIcon className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              </button>

              {isColorPickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsColorPickerOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-[260px] p-3 bg-card border border-border rounded-xl shadow-xl flex flex-wrap gap-2 justify-center">
                    {presetHexes.map(hex => (
                      <button
                        key={hex}
                        onClick={() => { setSelectedColorHex(hex); setIsColorPickerOpen(false); }}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-border ring-offset-2 ring-offset-card shadow-sm"
                        style={{ backgroundColor: hex, outline: hex === selectedColorHex ? `3px solid ${hex}` : undefined, outlineOffset: "2px" }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="cls-desc">Tavsif</FieldLabel>
            <input
              id="cls-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masalan, 10-sinflar uchun chuqurlashtirilgan matematika"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">O&apos;quv yili:</span>
            <span className="font-medium bg-muted px-2 py-0.5 rounded-full text-foreground">2025-2026-o&apos;quv yili</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm leading-none font-medium select-none">Haftalik jadval</label>
              <Button variant="ghost" size="sm" onClick={addTimeSlot} className="h-8 rounded-md gap-1.5 px-3">
                <PlusIcon className="h-4 w-4 mr-1" /> Vaqt oralig&apos;ini qo&apos;shish
              </Button>
            </div>

            <div className="pr-1">
              <div className="space-y-3">
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                    Muntazam jadval yo&apos;q. Vaqt qo&apos;shish.
                  </p>
                ) : (
                  timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[130px] h-9 shrink-0 bg-card shadow-none">
                          <span className="truncate">{slot.day}</span>
                          <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[130px]">
                          <DropdownMenuRadioGroup value={slot.day} onValueChange={(val) => updateTimeSlotDay(slot.id, val)}>
                            <DropdownMenuRadioItem value="Dushanba">Dushanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Seshanba">Seshanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Chorshanba">Chorshanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Payshanba">Payshanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Juma">Juma</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Shanba">Shanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Yakshanba">Yakshanba</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="time"
                            lang="en-GB"
                            step="60"
                            value={slot.start}
                            onChange={(e) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, start: e.target.value } : s))}
                            className="flex h-9 w-[78px] rounded-md border border-input bg-card pl-2 pr-6 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:p-0"
                          />
                          <Clock2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                        
                        <span className="text-muted-foreground text-xs shrink-0 font-medium">dan</span>
                        
                        <div className="relative">
                          <input
                            type="time"
                            lang="en-GB"
                            step="60"
                            value={slot.end}
                            onChange={(e) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, end: e.target.value } : s))}
                            className="flex h-9 w-[78px] rounded-md border border-input bg-card pl-2 pr-6 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:p-0"
                          />
                          <Clock2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        <span className="text-muted-foreground text-xs shrink-0 font-medium">gacha</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(slot.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end p-6 pt-2 border-t mt-auto">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 py-2">Bekor qilish</Button>
          <Button variant="default" className="h-9 px-4 py-2" onClick={() => onSave(timeSlots)}>Saqlash</Button>
        </div>
      </div>
    </div>
  );
}
