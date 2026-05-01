"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Check, X, Clock, FileText, ChevronLeft, ChevronRight,
  Search, Funnel, ListChecks, Calendar, CalendarMinus, GraduationCap,
  Plus, ArrowUpRight, Pencil, Trash2, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AttendanceStatus, type AttendanceRecord,
  getOrCreateClassData, getStatus, getNote, studentStats,
  MONTH_NAMES,
} from "@/lib/attendance-data";
import { CLASSES, classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";

type SortDir = "asc" | "desc";

// ─── Status meta ─────────────────────────────────────────────────────────────

const STATUS_META: Record<AttendanceStatus, {
  icon: React.ReactNode;
  bg: string;
  text: string;
  label: string;
}> = {
  present: {
    icon: <Check className="size-4" strokeWidth={2.5} aria-hidden />,
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Keldi",
  },
  absent: {
    icon: <X className="size-4" strokeWidth={2.5} aria-hidden />,
    bg: "bg-red-100 dark:bg-red-900/50",
    text: "text-red-700 dark:text-red-300",
    label: "Kelmadi",
  },
  late: {
    icon: <Clock className="size-4" strokeWidth={2.5} aria-hidden />,
    bg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    label: "Kechikdi",
  },
  excused: {
    icon: <FileText className="size-4" strokeWidth={1.8} aria-hidden />,
    bg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    label: "Sababli",
  },
  unmarked: {
    icon: null,
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    label: "Belgilanmagan",
  },
};

const STATUS_CYCLE: AttendanceStatus[] = ["present", "absent", "late", "excused", "unmarked"];
function nextStatus(s: AttendanceStatus): AttendanceStatus {
  return STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];
}

// ─── Note modal ──────────────────────────────────────────────────────────────

function NoteModal({ note, onSave, onClose }: { note: string; onSave: (v: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(note);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-xl p-5 w-72 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-semibold">Izoh qo'shish</p>
        <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)} rows={3}
          placeholder="Izoh yozing..."
          className="w-full text-sm bg-muted rounded-lg px-3 py-2 resize-none outline-none border border-transparent focus:border-border" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">Bekor qilish</button>
          <button onClick={() => { onSave(val); onClose(); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-foreground text-background font-semibold hover:opacity-80 transition-opacity">
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Column header (bulk set dropdown) ───────────────────────────────────────

function ColHeader({ date, isToday, onBulk }: { date: string; isToday: boolean; onBulk: (s: AttendanceStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [,, dd] = date.split("-");
  const dayOfWeek = new Date(date).getDay();
  const dayName = ["Yak","Du","Se","Cho","Pay","Ju","Sha"][dayOfWeek];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <th
      className="border-b border-r border-border p-2 w-[44px] min-w-[44px] text-center bg-muted relative cursor-pointer"
      style={{ width: 44, minWidth: 44 }}
      onClick={() => setOpen(v => !v)}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className={cn("text-[10px] font-bold uppercase", isToday ? "text-primary" : "text-muted-foreground")}>{dayName}</span>
        <span className={cn("text-sm font-bold", isToday ? "text-primary" : "")}>
          {parseInt(dd, 10)}
        </span>
      </div>
      {open && (
        <div ref={ref} className="absolute top-full left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-[130px] mt-1">
          {(["present","absent","late","excused"] as AttendanceStatus[]).map(s => {
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => { onBulk(s); setOpen(false); }}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors text-left", m.text)}>
                {m.icon}
                <span className="text-foreground">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </th>
  );
}

// ─── Attendance cell ──────────────────────────────────────────────────────────

function AttCell({ status, note, onClick, onNote }: {
  status: AttendanceStatus; note: string; onClick: () => void; onNote: () => void;
}) {
  const [hov, setHov] = useState(false);
  const m = STATUS_META[status];
  return (
    <div className="relative" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={onClick}
        title={`${m.label}`}
        className={cn(
          "w-full h-9 rounded-md flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-inset hover:ring-primary/30",
          status === "unmarked"
            ? "bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30"
            : cn(m.bg, m.text),
        )}
      >
        {status !== "unmarked" ? m.icon : null}
      </button>
      {note && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-violet-400 pointer-events-none" />}
      {hov && status !== "unmarked" && (
        <button
          onClick={e => { e.stopPropagation(); onNote(); }}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted z-10"
        >
          <Pencil className="size-2.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  selectedId, onSelect,
  present, absent, avgPct,
}: {
  selectedId: string; onSelect: (id: string) => void;
  present: number; absent: number; avgPct: number;
}) {
  const selected = CLASSES.find(c => c.id === selectedId);
  const hex = selected ? CLASS_COLOR_HEX[classColor(selected)] : undefined;

  return (
    <div className="min-w-0 min-h-0 pr-4" data-tour="attendance-class-selector">
      <div className="h-full grid min-h-0">
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 gap-3 min-h-[4.5rem]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted">
                <GraduationCap className="size-5 text-foreground" aria-hidden />
              </div>
              <h2 className="heading-section">Barcha sinflar</h2>
            </div>
            <button className="size-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Plus className="size-5" aria-hidden />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <div className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="px-5 pt-1 pb-5 space-y-1">
                {CLASSES.map(cls => {
                  const isSelected = cls.id === selectedId;
                  const colorHex = CLASS_COLOR_HEX[classColor(cls)];
                  if (isSelected) {
                    return (
                      <button key={cls.id} onClick={() => onSelect(cls.id)}
                        className="w-full flex items-center text-left gap-3 p-4 border-2 rounded-xl cursor-pointer animate-spring-bounce"
                        style={{ borderColor: colorHex, backgroundColor: `color-mix(in srgb, ${colorHex} 6.3%, transparent)` }}>
                        <div className="p-3.5 rounded-xl shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${colorHex} 12.5%, transparent)` }}>
                          <GraduationCap className="size-7" aria-hidden style={{ color: colorHex }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="heading-small leading-tight truncate block">{cls.name}</span>
                          {cls.time && <span className="text-xs text-muted-foreground/60 mt-0.5 block truncate">{cls.time}</span>}
                        </div>
                      </button>
                    );
                  }
                  const isNoClass = cls.id === "no-class";
                  return (
                    <button key={cls.id}
                      data-state="closed"
                      onClick={() => !isNoClass && onSelect(cls.id)}
                      className="group w-full flex items-center text-left gap-2.5 px-3 py-2 border-2 border-transparent rounded-lg cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1.5 data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-primary/40">
                      <div
                        className={cn("size-2.5 rounded-full shrink-0", isNoClass && "bg-muted-foreground/30")}
                        style={isNoClass ? undefined : { backgroundColor: colorHex }}
                      />
                      <span className="text-sm text-foreground/70 truncate flex-1 transition-all duration-200 ease-out group-hover:text-foreground group-hover:font-semibold">
                        {cls.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats */}
          {selected && hex && (
            <div className="group/stats border-t border-border px-5 py-5 space-y-4 shrink-0">
              <div className="flex items-center gap-3">
                <a className="relative group/icon p-3.5 rounded-xl shrink-0 block overflow-hidden"
                  title="Sinfni ochish"
                  href={`/dashboard/classes/${selected.id}`}
                  style={{ backgroundColor: `color-mix(in srgb, ${hex} 12.5%, transparent)` }}>
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200" style={{ backgroundColor: hex }} />
                  <GraduationCap className="relative size-7 transition-opacity duration-200 group-hover/icon:opacity-0" aria-hidden style={{ color: hex }} />
                  <ArrowUpRight className="size-7 absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover/icon:opacity-100 text-white" aria-hidden />
                </a>
                <div className="min-w-0 flex-1">
                  <h4 className="heading-small leading-tight truncate">{selected.name}</h4>
                  {selected.time && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{selected.time}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-200">
                  <button className="p-2 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-muted transition-colors" title="Sinfni tahrirlash">
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-muted transition-colors" title="Sinfni o'chirish">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="gap-2 text-center grid grid-cols-2">
                {[{ val: present, label: "Keldi" }, { val: absent, label: "Kelmadi" }].map(({ val, label }) => (
                  <div key={label} className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${hex} 8.2%, transparent)` }}>
                    <p className="text-lg font-bold">{val}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Davomat</span>
                  <span className="font-medium">{avgPct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(avgPct, 100)}%`, backgroundColor: hex }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState("9-a");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState({ year: 2026, month: 4 });
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [notePopup, setNotePopup] = useState<{ studentId: string; date: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const classData = getOrCreateClassData(selectedClassId);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setRecords(classData.records); }, [selectedClassId]);

  // Filtered lesson days for current month
  const lessonDays = classData.lessonDays.filter(d => {
    const [y, m] = d.date.split("-").map(Number);
    return y === month.year && m === month.month;
  });

  // Sorted + filtered students
  const students = [...classData.students]
    .filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  // Stats
  const allStats = classData.students.map(s => studentStats(records, s.id));
  const totalPresent = allStats.reduce((a, s) => a + s.present, 0);
  const totalAbsent = allStats.reduce((a, s) => a + s.absent, 0);
  const totalPossible = classData.students.length * classData.lessonDays.length;
  const avgPct = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

  const handleCell = useCallback((studentId: string, date: string) => {
    setRecords(prev => {
      const cur = prev.find(r => r.studentId === studentId && r.date === date);
      const curStatus: AttendanceStatus = cur?.status ?? "unmarked";
      const next = nextStatus(curStatus);
      if (next === "unmarked") return prev.filter(r => !(r.studentId === studentId && r.date === date));
      if (cur) return prev.map(r => r.studentId === studentId && r.date === date ? { ...r, status: next } : r);
      return [...prev, { studentId, date, status: next }];
    });
  }, []);

  const handleBulk = useCallback((date: string, status: AttendanceStatus) => {
    setRecords(prev => {
      const without = prev.filter(r => r.date !== date);
      return [...without, ...classData.students.map(s => ({ studentId: s.id, date, status }))];
    });
  }, [classData.students]);

  const handleNoteSave = useCallback((studentId: string, date: string, note: string) => {
    setRecords(prev => {
      const ex = prev.find(r => r.studentId === studentId && r.date === date);
      if (ex) return prev.map(r => r.studentId === studentId && r.date === date ? { ...r, note } : r);
      return [...prev, { studentId, date, status: "unmarked", note }];
    });
  }, []);

  const prevMonth = () => setMonth(({ year, month: m }) => m === 1 ? { year: year - 1, month: 12 } : { year, month: m - 1 });
  const nextMonth = () => setMonth(({ year, month: m }) => m === 12 ? { year: year + 1, month: 1 } : { year, month: m + 1 });
  const goToday = () => { const n = new Date(); setMonth({ year: n.getFullYear(), month: n.getMonth() + 1 }); };

  const noteRecord = notePopup ? records.find(r => r.studentId === notePopup.studentId && r.date === notePopup.date) : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.8rem)] gap-4 p-4 overflow-hidden">
    <div
      className="flex-1 min-h-0 grid p-3 -m-3"
      style={{
        gridTemplateColumns: "calc(25% + 0.25rem) calc(75% - 0.25rem)",
        gridTemplateRows: "1fr",
        transition: "grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        selectedId={selectedClassId}
        onSelect={id => { setSelectedClassId(id); setSearchQ(""); }}
        present={totalPresent}
        absent={totalAbsent}
        avgPct={avgPct}
      />

      {/* Main panel */}
      <div className="min-w-0 min-h-0 grid" data-tour="attendance-heatmap" style={{ minHeight: 0 }}>
        <div className="bg-card rounded-xl border border-border shadow-sm min-w-0 min-h-0 overflow-hidden flex flex-col" style={{ height: "100%" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0 gap-3 min-h-[4.5rem]">
            {/* Title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="size-5 text-foreground" aria-hidden />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="heading-section">{MONTH_NAMES[month.month - 1]}</span>
                <span className="text-xl text-muted-foreground">{month.year}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 md:gap-3">
              {/* Search */}
              {searchOpen && (
                <input
                  autoFocus
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onBlur={() => { if (!searchQ) setSearchOpen(false); }}
                  placeholder="O'quvchi qidirish..."
                  className="text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-transparent focus:border-border w-44 transition-all"
                />
              )}
              <button
                onClick={() => setSearchOpen(v => !v)}
                className={cn("inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all",
                  searchOpen && "ring-2 ring-primary ring-offset-2")}
              >
                <Search className="h-4 w-4" aria-hidden />
              </button>

              <button className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all ring-2 ring-primary ring-offset-2">
                <Funnel className="h-4 w-4" aria-hidden />
              </button>

              <button className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all" title="Davomat holatlari">
                <ListChecks className="h-4 w-4" aria-hidden />
              </button>

              {/* Month nav */}
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all">
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button onClick={goToday} className="inline-flex items-center justify-center h-11 px-4 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all text-sm font-semibold">
                  Bugun
                </button>
                <button onClick={nextMonth} className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all">
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <button className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all" title="Kunlik ko'rinish">
                <CalendarMinus className="h-4 w-4 text-muted-foreground" aria-hidden />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 relative overflow-auto">
            <table className="border-separate border-spacing-0 table-fixed border-border">
              <colgroup>
                <col style={{ width: 220 }} />
                {lessonDays.map(d => <col key={d.date} style={{ width: 44 }} />)}
              </colgroup>

              <thead className="bg-muted sticky top-0 z-30">
                <tr style={{ height: 57 }}>
                  {/* Student name header */}
                  <th className="sticky left-0 z-40 bg-muted border-b border-r border-border p-4 text-left align-middle whitespace-nowrap" style={{ width: 220 }}>
                    <button
                      onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      <span className="text-overline">O'quvchi ismi</span>
                      <div className="flex flex-col -space-y-1">
                        <ChevronUp className={cn("size-3", sortDir === "asc" ? "text-foreground" : "text-muted-foreground/40")} aria-hidden />
                        <ChevronDown className={cn("size-3", sortDir === "desc" ? "text-foreground" : "text-muted-foreground/40")} aria-hidden />
                      </div>
                    </button>
                  </th>

                  {/* Day columns */}
                  {lessonDays.map(d => (
                    <ColHeader key={d.date} date={d.date} isToday={d.date === today} onBulk={s => handleBulk(d.date, s)} />
                  ))}
                </tr>
              </thead>

              <tbody className="text-sm">
                {students.map(student => {
                  return (
                    <tr key={student.id} className="group hover:bg-muted/30 transition-colors">
                      {/* Student name */}
                      <td className="sticky left-0 z-10 bg-card group-hover:bg-muted border-b border-r border-border p-3 no-elevation">
                        <div className="flex items-center gap-3">
                          <a className="relative group/avatar rounded-full block shrink-0" href={`/dashboard/students/${student.id}`}
                            title={`${student.name} profilini ko'rish`}>
                            <div className="rounded-full flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden size-7 text-xs"
                              style={{ backgroundColor: CLASS_COLOR_HEX[classColor(CLASSES.find(c => c.id === selectedClassId) ?? CLASSES[0])] }}>
                              {student.initials}
                            </div>
                            <span className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                              style={{ backgroundColor: CLASS_COLOR_HEX[classColor(CLASSES.find(c => c.id === selectedClassId) ?? CLASSES[0])] }}>
                              <ArrowUpRight className="size-3.5 text-white" aria-hidden />
                            </span>
                          </a>
                          <div>
                            <span className="text-data-row whitespace-nowrap inline-block pt-px">{student.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Attendance cells */}
                      {lessonDays.map(d => {
                        const status = getStatus(records, student.id, d.date);
                        const note = getNote(records, student.id, d.date);
                        return (
                          <td key={d.date} className="border-b border-r border-border p-1 text-center min-w-[44px]">
                            <AttCell
                              status={status}
                              note={note}
                              onClick={() => handleCell(student.id, d.date)}
                              onNote={() => setNotePopup({ studentId: student.id, date: d.date })}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {students.length === 0 && (
                  <tr>
                    <td colSpan={lessonDays.length + 1} className="text-center py-12 text-muted-foreground text-sm">
                      O'quvchi topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-5 py-3 border-t shrink-0">
            {(["present","absent","late","excused"] as AttendanceStatus[]).map(s => {
              const m = STATUS_META[s];
              return (
                <div key={s} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={cn("flex", m.text)}>{m.icon}</span>
                  <span>{m.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="size-3 rounded border border-dashed border-muted-foreground/40" />
              <span>Belgilanmagan</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-1">
              <span className="size-2 rounded-full bg-violet-400 inline-block" />
              <span>Izoh bor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Note modal */}
      {notePopup && (
        <NoteModal
          note={noteRecord?.note ?? ""}
          onSave={v => handleNoteSave(notePopup.studentId, notePopup.date, v)}
          onClose={() => setNotePopup(null)}
        />
      )}
    </div>
    </div>
  );
}
