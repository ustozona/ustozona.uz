"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Check, X, Clock, FileText, ChevronLeft, ChevronRight,
  Search, Funnel, ListChecks, Calendar, CalendarRange, CalendarDays,
  ArrowUpRight, ArrowRight, Pencil, ChevronUp, ChevronDown,
  AlertTriangle, MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS_UZ_SUN } from "@/lib/localization";
import {
  type AttendanceStatus, type AttendanceStatusDef, type AttendanceRecord,
  deriveLessonDays, getStatus, getNote, allDaysInMonth,
  weightedRate, percentile, statusWeights,
  MONTH_NAMES,
} from "@/lib/attendance-data";
import { statusVisual } from "@/components/attendance/status-visual";
import AttendanceSettingsModal from "@/components/attendance/AttendanceSettingsModal";
import { getQuarterForMonth, inRange, isCalendarConfigured } from "@/lib/academic-calendar";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import TimetableCoverageBanner from "@/components/timetable/TimetableCoverageBanner";
import Link from "next/link";
import { todayKey } from "@/lib/date-keys";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useMounted } from "@/lib/use-mounted";
import { classColor, type ClassInfo, type Student } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { makeAttendanceTourDemoLessonDays, makeAttendanceTourDemoRecords } from "@/components/tour/attendance-tour-demo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { SectionIcon } from "@/components/ui/section-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AttendanceDonut, ATT_COLORS } from "@/app/dashboard/(with-sidebar)/students/[id]/_components/charts";
import type { AttendanceWindow } from "@/lib/student-profile";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  panelCardClass, panelCardContentClass, panelCardFooterClass, panelCardHeaderClass,
} from "@/components/DashboardPage";

type SortDir = "asc" | "desc";
type SortField = "firstName" | "lastName";
type StudentStatusFilter = "all" | "active" | "away" | "archived";
const UNMARKED = "unmarked";

// Oʻquvchi holati filtri yorliqlari (students sahifasi bilan bir xil)
const STUDENT_STATUS_LABELS: [StudentStatusFilter, string][] = [
  ["all", "Hammasi"],
  ["active", "Oʻqimoqda"],
  ["away", "Taʼtilda"],
  ["archived", "Chiqib ketgan"],
];

// Sarlavha qatori foni — muted'dan sal ochroq (card tomon aralashtirilgan, lekin opaque)
const HEADER_BG = "color-mix(in srgb, var(--muted) 55%, var(--card))";
// Rangli status chip tugmasi — ghost variant'siz (hover'da rang yoʻqolmasin)
const CHIP_BTN =
  "flex items-center justify-center rounded-md cursor-pointer transition-all hover:ring-2 hover:ring-inset hover:ring-primary/30";

const UZ_COLLATOR = new Intl.Collator("uz", { sensitivity: "base" });
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? { first: parts[0], last: parts.slice(1).join(" ") }
    : { first: parts[0] ?? "", last: "" };
}

// ─── Oʻquvchi preview (hover-card ichida) ────────────────────────────────────

// Davomat legendasi — profil sahifasidagi chart bilan bir xil rang+ikona.
const PREVIEW_LEGEND: { key: keyof AttendanceWindow; label: string; Icon: typeof Check; color: string }[] = [
  { key: "present", label: "Keldi",    Icon: Check,    color: ATT_COLORS.present },
  { key: "absent",  label: "Kelmadi",  Icon: X,        color: ATT_COLORS.absent },
  { key: "late",    label: "Kechikdi", Icon: Clock,    color: ATT_COLORS.late },
  { key: "excused", label: "Sababli",  Icon: FileText, color: ATT_COLORS.excused },
];

/** Avatar + ism + sinf + profildagi davomat charti (donut + holatlar) + profil tugmasi. */
function AttendancePreview({
  student, classLabel, classHex, summary,
}: {
  student: { id: string; name: string; initials: string };
  classLabel: string;
  classHex: string;
  summary: AttendanceWindow;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-11" style={{ "--avatar-bg": classHex } as React.CSSProperties}>
          <AvatarFallback className="bg-[var(--avatar-bg)] font-semibold text-white">
            {student.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
          <Badge variant="secondary" className="mt-1 text-[10px]">{classLabel}</Badge>
        </div>
      </div>
      <Separator />
      <div className="mx-auto w-full max-w-[150px]">
        <AttendanceDonut summary={summary} />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {PREVIEW_LEGEND.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `color-mix(in srgb, ${s.color} 18%, transparent)` }}>
              <s.Icon className="size-3.5" strokeWidth={2.5} style={{ color: s.color }} />
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {summary[s.key]}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">marta</span>
            </span>
          </div>
        ))}
      </div>
      <Button asChild size="sm" className="w-full font-semibold">
        <a href={`/dashboard/students/${student.id}`}>
          Profilni ochish
          <ArrowRight className="size-4" />
        </a>
      </Button>
    </div>
  );
}

// ─── Note modal ──────────────────────────────────────────────────────────────

function NoteModal({
  note, studentName, date, onSave, onClose,
}: {
  note: string; studentName: string; date: string;
  onSave: (v: string) => void; onClose: () => void;
}) {
  const [val, setVal] = useState(note);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const [, mm, dd] = date.split("-");
  const dateLabel = `${parseInt(dd, 10)}-${MONTH_NAMES[parseInt(mm, 10) - 1].toLowerCase()}, ${DAYS_UZ_SUN[new Date(date).getDay()]}`;

  const save = () => { onSave(val); onClose(); };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-md gap-0 overflow-hidden p-0 bg-card">
        {/* Header — ikona + sarlavha + kontekst + size-9 yopish tugmasi */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <SectionIcon><MessageSquareText /></SectionIcon>
            <div className="flex flex-col">
              <DialogTitle asChild>
                <CardTitle>Izoh</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                {studentName} · {dateLabel}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">Yopish</span>
          </DialogClose>
        </div>

        <div className="p-6">
          <Textarea
            ref={ref} value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); }}
            rows={4} placeholder="Bu kun haqida izoh yozing…" className="resize-none"
          />
          <p className="mt-2 inline-flex items-center gap-1.5 text-caption">
            Saqlash uchun
            <KbdGroup>
              <Kbd>⌘/Ctrl</Kbd>
              <Kbd>Enter</Kbd>
            </KbdGroup>
          </p>
        </div>

        <DialogFooter className="items-center border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
          {note
            ? <Button variant="ghost" size="sm" onClick={() => { onSave(""); onClose(); }} className="text-destructive hover:text-destructive hover:bg-destructive/10">Oʻchirish</Button>
            : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Bekor qilish</Button>
            <Button size="sm" onClick={save}>Saqlash</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ustun sarlavhasi (bulk set popover) ─────────────────────────────────────

function ColHeader({
  date, isToday, statuses, onBulk, dimmed,
}: { date: string; isToday: boolean; statuses: AttendanceStatusDef[]; onBulk: (s: AttendanceStatus) => void; dimmed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [, , dd] = date.split("-");
  const dayName = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"][new Date(date).getDay()];
  return (
    <th className={cn("border-b border-r border-border p-0 w-[44px] min-w-[44px] text-center relative")} style={{ width: 44, minWidth: 44, background: HEADER_BG }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex flex-col items-center justify-center h-full w-full gap-0.5 cursor-pointer py-2 hover:bg-muted/80 transition-colors">
            <span className={cn("text-xs font-bold uppercase", isToday ? "text-primary" : dimmed ? "text-muted-foreground/40" : "text-muted-foreground")}>{dayName}</span>
            <span className={cn("text-sm font-bold", isToday && "text-primary", dimmed && "text-muted-foreground/40")}>{parseInt(dd, 10)}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5 flex items-center gap-1 rounded-xl shadow-xl">
          {statuses.map((s) => {
            const v = statusVisual(s);
            return (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => { onBulk(s.key); setOpen(false); }}
                    className={cn(CHIP_BTN, "size-9 rounded-lg", v.cellClass)}>
                    <v.Icon className="size-4" strokeWidth={2.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{s.label}</TooltipContent>
              </Tooltip>
            );
          })}
          <div className="mx-0.5 h-6 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={() => { onBulk(UNMARKED); setOpen(false); }}
                className={cn(CHIP_BTN, "size-9 rounded-lg text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted/60")}>
                <X className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Tozalash</TooltipContent>
          </Tooltip>
        </PopoverContent>
      </Popover>
    </th>
  );
}

// ─── Davomat katagi ──────────────────────────────────────────────────────────

function AttCell({
  def, note, onClick, onNote, faded,
}: { def: AttendanceStatusDef | null; note: string; onClick: () => void; onNote: () => void; faded?: boolean }) {
  const [hov, setHov] = useState(false);
  const v = def ? statusVisual(def) : null;
  return (
    <div className="relative flex justify-center" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button" onClick={onClick}
            className={cn(
              CHIP_BTN, "size-9",
              faded && "opacity-50",
              v ? v.cellClass : "bg-muted/40 text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted/60",
            )}
           
          >
            {v ? <v.Icon className="size-4" strokeWidth={2.5} /> : null}
          </button>
        </TooltipTrigger>
        <TooltipContent>{def?.label ?? "Belgilanmagan"}</TooltipContent>
      </Tooltip>
      {note && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-info pointer-events-none" />}
      {hov && def && (
        <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onNote(); }}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted z-10 p-0 min-h-0">
          <Pencil className="size-2.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

// ─── Davomat jurnali — sinf boʻyicha parametrlangan umumiy koʻrinish ──────────
// Standalone /attendance (ClassListPanel bilan) va sinf-detali AttendanceSection
// ikkalasi shu komponentni ishlatadi (DRY). `classId` qaysi sinf koʻrsatilishini
// belgilaydi; roster — useGradesStore, yozuvlar — useAttendanceStore, dars
// kunlari jadval+kalendar store'laridan hisoblanadi (hammasi server-backed).

export default function AttendanceView({
  classId,
  demoMode,
  demoRoster,
  demoClassInfo,
}: {
  classId: string;
  /** Tur demo rejimida haqiqiy roster/yozuvlar oʻrniga koʻrsatiladigan namunaviy davomat. */
  demoMode?: boolean;
  demoRoster?: Student[];
  demoClassInfo?: ClassInfo;
}) {
  const mounted = useMounted();
  const storedRecords = useAttendanceStore((s) => s.recordsByClass[classId]);
  // Oʻquv yili kalendari — "Choraklik %" akademik chorak diapazonidan hisoblanadi.
  const calendar = useCalendarStore((s) => s.calendar);
  const statuses = useAttendanceStore((s) => s.statuses);
  const setRecordsRaw = useAttendanceStore((s) => s.setRecords);
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  // Demo yozuvlar faqat mahalliy holatda — real store'ga hech narsa yozilmaydi.
  const [demoRecords, setDemoRecords] = useState<AttendanceRecord[] | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sortField, setSortField] = useState<SortField>("firstName");
  const [notePopup, setNotePopup] = useState<{ studentId: string; date: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [view, setView] = useState<"scheduled" | "all" | "day">("scheduled");
  const [studentStatus, setStudentStatus] = useState<StudentStatusFilter>("all");
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Roster va sinf nomi — baholar jurnali bilan bitta manba (server-backed).
  const gradesClass = useGradesStore((s) => s.classDataMap[classId]);
  const versions = useTimetableStore((s) => s.versions);
  const roster = demoMode ? (demoRoster ?? []) : (gradesClass?.students ?? []);
  const className = demoMode ? (demoClassInfo?.name ?? classId) : (gradesClass?.info.name ?? classId);
  const today = todayKey();

  // Dars kunlari — oʻsha sanada amalda boʻlgan jadval versiyasi + kalendar.
  const realLessonDays = useMemo(() => {
    const end = today < calendar.range.end ? today : calendar.range.end;
    return deriveLessonDays(classId, { start: calendar.range.start, end }, calendar, versions);
  }, [classId, calendar, versions, today]);
  // Demo rejimda kalendar/jadval store'lariga bogʻliq boʻlmaslik uchun — joriy
  // oyning ish kunlari (Dush–Juma) "dars kuni" sifatida ishlatiladi.
  const demoLessonDays = useMemo(
    () => makeAttendanceTourDemoLessonDays(month.year, month.month),
    [month.year, month.month]
  );
  const lessonDays = demoMode ? demoLessonDays : realLessonDays;
  // Bugun faol o‘quv yili kalendaridan tashqarida bo‘lsa — sabab tushunarsiz
  // bo‘sh holat o‘rniga aniq banner ko‘rsatiladi (yil almashtirilmaydi).
  const todayOutsideCalendar =
    !demoMode &&
    isCalendarConfigured(calendar) &&
    (today < calendar.range.start || today > calendar.range.end);
  // Jadval faol yil boshini qoplamaydimi (eng erta versiya yil boshidan keyin)?
  // Shu holatda yil boshidagi dars kunlari boʻsh koʻrinadi — banner tuzatish taklif qiladi.
  const scheduleGapAtStart =
    !demoMode &&
    isCalendarConfigured(calendar) &&
    versions.length > 0 &&
    !resolveVersionForDate(versions, calendar.range.start);
  const showBanners = todayOutsideCalendar || scheduleGapAtStart;

  useEffect(() => {
    if (!demoMode) return;
    setDemoRecords(makeAttendanceTourDemoRecords(demoRoster ?? [], demoLessonDays, today));
  }, [demoMode, demoLessonDays, today, demoRoster]);

  const records = demoMode ? (demoRecords ?? []) : (storedRecords ?? []);
  const setRecords = (
    next: typeof records | ((prev: typeof records) => typeof records)
  ) => (demoMode
    ? setDemoRecords((prev) => (typeof next === "function" ? next(prev ?? []) : next))
    : setRecordsRaw(classId, next));

  useEffect(() => { setSearchQ(""); setStudentStatus("all"); setOnlyAttention(false); }, [classId]);

  // Persist store tiklanmaguncha SSR seed bilan mos placeholder.
  if (!mounted) return <div className="flex-1 min-w-0 min-h-0" />;

  const activeStatuses = statuses.filter((s) => s.active);
  const statusByKey = (k: AttendanceStatus): AttendanceStatusDef | null =>
    statuses.find((s) => s.key === k && s.active) ?? null;

  const cycle = [...activeStatuses.map((s) => s.key), UNMARKED];
  const nextKey = (cur: AttendanceStatus) => {
    const i = cycle.indexOf(cur);
    return cycle[(i + 1) % cycle.length];
  };

  // Koʻrsatiladigan kunlar — faqat bugun / dars kunlari / butun oy
  const monthDays = view === "day"
    ? allDaysInMonth(month.year, month.month).filter((d) => d.date === today)
    : (view === "all" ? allDaysInMonth(month.year, month.month) : lessonDays)
        .filter((d) => {
          const [y, m] = d.date.split("-").map(Number);
          return y === month.year && m === month.month;
        });

  // "Barcha kunlar" rejimida faqat yakshanbalarni xiralashtirish
  const isDimmed = (date: string) => view === "all" && new Date(date).getDay() === 0;

  // Oʻquvchilar — qidiruv + status filtri + tartiblash
  const baseStudents = [...roster]
    .filter((s) => s.name.toLowerCase().includes(searchQ.toLowerCase()))
    .filter((s) => studentStatus === "all" || (s.status ?? "active") === studentStatus)
    .sort((a, b) => {
      const na = splitName(a.name);
      const nb = splitName(b.name);
      const ka = sortField === "lastName" ? na.last || na.first : na.first;
      const kb = sortField === "lastName" ? nb.last || nb.first : nb.first;
      const cmp = UZ_COLLATOR.compare(ka, kb);
      return sortDir === "asc" ? cmp : -cmp;
    });

  // Davomat foizi — dars kunlari boʻyicha (koʻrinishdan mustaqil; docs/attendance-model.md)
  const lessonDatesIn = (year: number, months: number[]) =>
    new Set(lessonDays.filter((d) => {
      const [y, m] = d.date.split("-").map(Number);
      return y === year && months.includes(m);
    }).map((d) => d.date));

  const monthLessonDates = lessonDatesIn(month.year, [month.month]);
  // "Choraklik %" — AKADEMIK chorak (kalendar-yil choragi emas): koʻrilayotgan oy
  // tegishli chorak diapazonidagi dars sanalari. Oy hech bir chorakka tushmasa
  // (taʼtil oyi / yil tashqarisi) — oylik toʻplamning oʻzi ishlatiladi.
  const viewedQuarter = getQuarterForMonth(calendar, month.year, month.month);
  const quarterLessonDates = viewedQuarter
    ? new Set(lessonDays.filter((d) => inRange(d.date, viewedQuarter.range)).map((d) => d.date))
    : monthLessonDates;

  // Vaznlar — holat sozlamalaridan (Sozlamalar > Davomat); yagona manba.
  const weights = statusWeights(statuses);
  const monthRateOf = (id: string) => weightedRate(records, id, weights, monthLessonDates);
  const quarterRateOf = (id: string) => weightedRate(records, id, weights, quarterLessonDates);
  const periodRateOf = quarterRateOf;

  // Hover-card chart uchun — choraklik holat taqsimoti (profil chart formati)
  const quarterSummaryOf = (id: string): AttendanceWindow => {
    let present = 0, absent = 0, late = 0, excused = 0;
    for (const r of records) {
      if (r.studentId !== id || !quarterLessonDates.has(r.date)) continue;
      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else if (r.status === "late") late++;
      else if (r.status === "excused") excused++;
    }
    return { total: present + absent + late + excused, present, absent, late, excused, pct: quarterRateOf(id)?.pct ?? 0 };
  };

  // Avatar/preview rangi — joriy sinf palitrasidan (jonli info; yoʻq boʻlsa id boʻyicha avto)
  const classHex = CLASS_COLOR_HEX[classColor(
    demoMode ? (demoClassInfo ?? { id: classId, name: classId }) : (gradesClass?.info ?? { id: classId, name: classId })
  )];

  // "Xavfli" — gibrid: <75% (absolyut floor) YOKI sinfning eng past 25% (pertsentil)
  const periodPcts = baseStudents.map((s) => periodRateOf(s.id)?.pct).filter((p): p is number => p != null);
  const p25 = percentile(periodPcts, 25);
  const isChronic = (id: string) => (monthRateOf(id)?.absents ?? 0) >= 3; // oyiga ≥3 Kelmadi
  const isDanger = (id: string) => {
    const r = periodRateOf(id);
    if (!r) return false;
    return r.pct < 75 || (p25 != null && r.pct <= p25);
  };
  const needsAttention = (id: string) => isChronic(id) || isDanger(id);
  const attentionCount = baseStudents.filter((s) => needsAttention(s.id)).length;

  const students = onlyAttention ? baseStudents.filter((s) => needsAttention(s.id)) : baseStudents;

  // Jonli xulosa — koʻrinayotgan oy × oʻquvchilar boʻyicha holat sonlari
  const monthDateSet = new Set(monthDays.map((d) => d.date));
  const studentIdSet = new Set(students.map((s) => s.id));
  const scopeRecords = records.filter((r) => studentIdSet.has(r.studentId) && monthDateSet.has(r.date));
  const countByKey = (key: string) => scopeRecords.filter((r) => r.status === key).length;
  const noteCount = scopeRecords.filter((r) => r.note).length;
  const totalCells = students.length * monthDays.length;
  const markedCount = scopeRecords.filter((r) => r.status !== UNMARKED).length;
  const unmarkedCount = Math.max(0, totalCells - markedCount);

  const handleCell = (studentId: string, date: string) => {
    setRecords((prev) => {
      const cur = prev.find((r) => r.studentId === studentId && r.date === date);
      const next = nextKey(cur?.status ?? UNMARKED);
      if (next === UNMARKED) return prev.filter((r) => !(r.studentId === studentId && r.date === date));
      if (cur) return prev.map((r) => (r.studentId === studentId && r.date === date ? { ...r, status: next } : r));
      return [...prev, { studentId, date, status: next }];
    });
  };

  const setCell = (studentId: string, date: string, status: AttendanceStatus) => {
    setRecords((prev) => {
      const ex = prev.find((r) => r.studentId === studentId && r.date === date);
      const without = prev.filter((r) => !(r.studentId === studentId && r.date === date));
      if (status === UNMARKED) return ex?.note ? [...without, { studentId, date, status: UNMARKED, note: ex.note }] : without;
      return [...without, { studentId, date, status, note: ex?.note }];
    });
  };

  const handleBulk = (date: string, status: AttendanceStatus) => {
    setRecords((prev) => {
      const without = prev.filter((r) => r.date !== date);
      if (status === UNMARKED) return without;
      return [...without, ...roster.map((s) => ({ studentId: s.id, date, status }))];
    });
  };

  const handleNoteSave = (studentId: string, date: string, note: string) => {
    setRecords((prev) => {
      const ex = prev.find((r) => r.studentId === studentId && r.date === date);
      if (ex) return prev.map((r) => (r.studentId === studentId && r.date === date ? { ...r, note } : r));
      return [...prev, { studentId, date, status: UNMARKED, note }];
    });
  };

  const prevMonth = () => setMonth(({ year, month: m }) => (m === 1 ? { year: year - 1, month: 12 } : { year, month: m - 1 }));
  const nextMonth = () => setMonth(({ year, month: m }) => (m === 12 ? { year: year + 1, month: 1 } : { year, month: m + 1 }));
  const goToday = () => { const n = new Date(); setMonth({ year: n.getFullYear(), month: n.getMonth() + 1 }); };

  const noteRecord = notePopup ? records.find((r) => r.studentId === notePopup.studentId && r.date === notePopup.date) : null;
  const noteStudent = notePopup ? roster.find((s) => s.id === notePopup.studentId) : null;

  const ctrlBtn = "size-9 rounded-md bg-card border-border shadow-none";

  return (
    <>
      {/* Main panel */}
      <div className="flex-1 min-w-0 min-h-0 grid gap-3" data-tour="attendance-heatmap" style={{ minHeight: 0, gridTemplateRows: showBanners ? "auto 1fr" : "1fr" }}>
        {showBanners && (
          <div className="grid gap-3">
            {todayOutsideCalendar && (
              <Alert variant="info">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>Bugun tanlangan oʻquv yildan tashqarida</AlertTitle>
                <AlertDescription>
                  Bugungi sana ({today}) faol kalendar ({calendar.yearLabel || "joriy yil"}) diapazonidan
                  tashqarida — shuning uchun ayrim oylarda dars kuni koʻrinmasligi mumkin.{" "}
                  <Link href="/dashboard/settings?section=oquv-yili" className="font-medium underline underline-offset-2">
                    Oʻquv yili sozlamalariga oʻtish
                  </Link>
                </AlertDescription>
              </Alert>
            )}
            {scheduleGapAtStart && <TimetableCoverageBanner />}
          </div>
        )}
        <Card className={cn("min-w-0", panelCardClass)} style={{ height: "100%" }}>
          {/* Header */}
          <CardHeader className={cn(panelCardHeaderClass, "justify-between gap-3 min-h-[4.5rem] px-5 py-5!")}>
            <div className="flex items-center gap-3 shrink-0">
              <SectionIcon><Calendar /></SectionIcon>
              <CardTitle className="flex items-baseline gap-1.5">
                {MONTH_NAMES[month.month - 1]}
                <span className="font-normal text-foreground/50">({month.year})</span>
              </CardTitle>
            </div>

            <div className="flex items-center gap-1.5 md:gap-3">
              {searchOpen && (
                <Input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  onBlur={() => { if (!searchQ) setSearchOpen(false); }}
                  placeholder="Oʻquvchi qidirish..."
                  className="text-sm bg-muted rounded-md px-3 outline-none border border-transparent focus:border-border w-44 transition-all h-9" />
              )}
              <Button variant="outline" size="icon" onClick={() => setSearchOpen((v) => !v)}
                className={cn(ctrlBtn, searchOpen && "ring-2 ring-primary ring-offset-2")}>
                <Search className="h-4 w-4" aria-hidden />
              </Button>

              {/* Filter — status boʻyicha */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon"
                    className={cn(ctrlBtn, (studentStatus !== "all" || onlyAttention) && "ring-2 ring-primary ring-offset-2")}>
                    <Funnel className="h-4 w-4" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2 rounded-xl">
                  {/* Diqqat talab qiladiganlar (termostat) */}
                  <button type="button" onClick={() => setOnlyAttention((v) => !v)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors text-left",
                      onlyAttention ? "bg-destructive/10 font-medium text-destructive" : "hover:bg-muted",
                    )}>
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="size-4" />
                      Diqqat talab qiladiganlar
                    </span>
                    <span className={cn("tabular-nums", onlyAttention ? "text-destructive" : "text-muted-foreground")}>{attentionCount}</span>
                  </button>

                  <div className="my-2 h-px bg-border" />

                  {/* Oʻquvchi holati boʻyicha */}
                  <p className="text-label px-2 pb-2">Oʻquvchi holati</p>
                  <div className="flex flex-col gap-0.5">
                    {STUDENT_STATUS_LABELS.map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setStudentStatus(val)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors text-left",
                          studentStatus === val ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                        )}>
                        {label}
                        {studentStatus === val && <span className="size-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <AttendanceSettingsModal
                      trigger={
                        <Button
                          data-tour="attendance-config"
                          variant="outline"
                          size="icon"
                          className={ctrlBtn}
                          aria-label="Davomat sozlamalari"
                        >
                          <ListChecks className="h-4 w-4" aria-hidden />
                        </Button>
                      }
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Davomat sozlamalari</TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth} className={ctrlBtn}>
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </Button>
                <Button variant="outline" onClick={goToday} className="h-9 rounded-md bg-card border-border shadow-none font-semibold px-4">
                  Bugun
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className={ctrlBtn}>
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </Button>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon"
                    onClick={() => setView((v) => {
                      const next = v === "scheduled" ? "day" : v === "day" ? "all" : "scheduled";
                      if (next === "day") goToday();
                      return next;
                    })}
                    className={cn(ctrlBtn, view !== "scheduled" && "ring-2 ring-primary ring-offset-2")}>
                    {view === "all" ? <CalendarRange className="h-4 w-4" aria-hidden />
                      : view === "day" ? <CalendarDays className="h-4 w-4" aria-hidden />
                      : <Calendar className="h-4 w-4" aria-hidden />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {view === "scheduled" ? "Kun koʻrinishi" : view === "day" ? "Barcha kunlar" : "Faqat dars kunlari"}
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          {/* Table */}
          <CardContent className={cn(panelCardContentClass, "overflow-auto [&_div[data-slot=table-container]]:overflow-visible [&_div[data-slot=table-container]]:h-full")}>
            {monthDays.length === 0 ? (
              <Empty className="h-full w-full">
                <EmptyHeader>
                  <EmptyMedia><Illustration name="22" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>Bu oyda dars kuni yoʻq</EmptyTitle>
                  <EmptyDescription>
                    Bu sinf uchun {MONTH_NAMES[month.month - 1]} oyida rejalashtirilgan dars yoʻq. Barcha kalendar kunlarini koʻrsating yoki boshqa oyga oʻting.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setView("all")} className="gap-1.5">
                      <CalendarRange className="size-4" /> Barcha kunlar
                    </Button>
                    <Button variant="outline" onClick={goToday} className="bg-card">
                      Bugunga oʻtish
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
            ) : (
              <Table className="w-auto border-separate border-spacing-0 table-fixed border-border">
                <colgroup>
                  <col style={{ width: 220 }} />
                  {monthDays.map((d) => <col key={d.date} style={{ width: 44 }} />)}
                  {view === "day" && <col />}
                  <col style={{ width: 120 }} />
                </colgroup>

                <TableHeader className="sticky top-0 z-30" style={{ background: HEADER_BG }}>
                  <TableRow style={{ height: 57 }}>
                    <TableHead className="sticky left-0 z-40 border-b border-r border-border p-4 text-center align-middle whitespace-nowrap" style={{ width: 220, background: HEADER_BG }}>
                      <div className="flex items-center justify-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost"
                              onClick={() => setSortField((f) => (f === "firstName" ? "lastName" : "firstName"))}
                              className="text-label hover:text-foreground transition-colors cursor-pointer h-auto min-h-0 p-0 hover:bg-transparent">
                              Oʻquvchilar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{sortField === "firstName" ? "Familiya boʻyicha tartiblash" : "Ism boʻyicha tartiblash"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost"
                              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                              className="flex flex-col -space-y-1 h-auto min-h-0 w-auto p-0 hover:bg-transparent">
                              <ChevronUp className={cn("size-3", sortDir === "asc" ? "text-foreground" : "text-muted-foreground/40")} aria-hidden />
                              <ChevronDown className={cn("size-3", sortDir === "desc" ? "text-foreground" : "text-muted-foreground/40")} aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{sortDir === "asc" ? "Z→A tartibga oʻtish" : "A→Z tartibga oʻtish"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>

                    {monthDays.map((d) => (
                      <ColHeader key={d.date} date={d.date} isToday={d.date === today} statuses={activeStatuses} onBulk={(s) => handleBulk(d.date, s)} dimmed={isDimmed(d.date)} />
                    ))}

                    {view === "day" && (
                      <th className="border-b border-r border-border px-3 align-middle" style={{ background: HEADER_BG }}>
                        <div className="flex items-center gap-1">
                          {activeStatuses.map((s) => {
                            const v = statusVisual(s);
                            return (
                              <Tooltip key={s.key}>
                                <TooltipTrigger asChild>
                                  <button type="button" onClick={() => handleBulk(today, s.key)}
                                    className={cn(CHIP_BTN, "size-8", v.cellClass)}>
                                    <v.Icon className="size-4" strokeWidth={2.5} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Hammasi: {s.label}</TooltipContent>
                              </Tooltip>
                            );
                          })}
                          <div className="mx-0.5 h-6 w-px bg-border" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={() => handleBulk(today, UNMARKED)}
                                className={cn(CHIP_BTN, "size-8 text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted/60")}>
                                <X className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Tozalash</TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    )}

                    {/* Davomat % — akademik chorak boʻyicha */}
                    <TableHead className="sticky right-0 z-40 border-b border-l border-border px-2 text-center align-middle text-label whitespace-nowrap" style={{ width: 120, background: HEADER_BG }}>
                      {viewedQuarter ? `${viewedQuarter.name} %` : "Choraklik %"}
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="text-sm">
                  {students.map((student) => {
                    const pr = periodRateOf(student.id);
                    const chronic = isChronic(student.id);
                    const danger = isDanger(student.id);
                    const attention = chronic || danger;
                    const attReasons = [
                      danger && "Past davomat",
                      chronic && `Oyiga ${monthRateOf(student.id)?.absents ?? 0} marta kelmagan`,
                    ].filter(Boolean).join(" · ");
                    return (
                      <TableRow key={student.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="sticky left-0 z-10 bg-card group-hover:bg-muted border-b border-r border-border p-3 no-elevation">
                          <div className="flex items-center gap-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a className="relative group/avatar rounded-full block shrink-0" href={`/dashboard/students/${student.id}`}>
                                  <Avatar size="default" style={{ "--avatar-bg": classHex } as React.CSSProperties}>
                                    <AvatarFallback className="bg-[var(--avatar-bg)] font-semibold text-white">
                                      {student.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center bg-[var(--avatar-bg)]"
                                    style={{ "--avatar-bg": classHex } as React.CSSProperties}>
                                    <ArrowUpRight className="size-3.5 text-white" aria-hidden />
                                  </span>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>{student.name} profilini koʻrish</TooltipContent>
                            </Tooltip>
                            <span className="text-data-row whitespace-nowrap inline-block pt-px">{student.name}</span>
                            {attention && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60"><AlertTriangle className="size-4" /></span>
                                </TooltipTrigger>
                                <TooltipContent>{attReasons}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>

                        {monthDays.map((d) => (
                          <TableCell key={d.date} className={cn("border-b border-r border-border p-1 text-center min-w-[44px]", isDimmed(d.date) && "bg-muted/30")}>
                            <AttCell
                              def={statusByKey(getStatus(records, student.id, d.date))}
                              note={getNote(records, student.id, d.date)}
                              onClick={() => handleCell(student.id, d.date)}
                              onNote={() => setNotePopup({ studentId: student.id, date: d.date })}
                              faded={isDimmed(d.date)}
                            />
                          </TableCell>
                        ))}

                        {view === "day" && (
                          <TableCell className="border-b border-r border-border px-3">
                            <div className="flex items-center gap-1">
                              {activeStatuses.map((s) => {
                                const v = statusVisual(s);
                                const cur = getStatus(records, student.id, today) === s.key;
                                return (
                                  <Tooltip key={s.key}>
                                    <TooltipTrigger asChild>
                                      <button type="button"
                                        onClick={() => setCell(student.id, today, s.key)}
                                        className={cn(CHIP_BTN, "size-8", v.cellClass, !cur && "opacity-40 hover:opacity-100")}
                                       >
                                        <v.Icon className="size-4" strokeWidth={2.5} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>{s.label}</TooltipContent>
                                  </Tooltip>
                                );
                              })}
                              <div className="mx-0.5 h-6 w-px bg-border" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button"
                                    onClick={() => setNotePopup({ studentId: student.id, date: today })}
                                    className={cn(CHIP_BTN, "size-8 hover:bg-muted", getNote(records, student.id, today)
                                      ? "text-info" : "text-muted-foreground/40 hover:text-foreground")}>
                                    <Pencil className="size-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Izoh</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        )}

                        {/* Davomat % — faqat foiz; hoverda oʻquvchi preview */}
                        <TableCell className="sticky right-0 z-10 bg-card group-hover:bg-muted border-b border-l border-border px-3 text-center no-elevation">
                          {pr ? (
                            <HoverCard openDelay={120} closeDelay={60}>
                              <HoverCardTrigger asChild>
                                <span className={cn("inline-block cursor-default text-sm font-semibold tabular-nums", danger ? "text-destructive" : "text-foreground")}>
                                  {pr.pct}%
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent align="end" className="w-64">
                                <AttendancePreview
                                  student={student}
                                  classLabel={className}
                                  classHex={classHex}
                                  summary={quarterSummaryOf(student.id)}
                                />
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={monthDays.length + (view === "day" ? 3 : 2)} className="py-10 px-8">
                        <Alert className="max-w-md mx-auto bg-muted/50 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Search className="size-4 text-muted-foreground" />
                            <AlertTitle className="mb-0">Topilmadi</AlertTitle>
                          </div>
                          <AlertDescription className="text-muted-foreground ml-6">
                            Qidiruv yoki filtr boʻyicha oʻquvchilar topilmadi.
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Jonli xulosa — holat sonlari + taqsimot bari */}
          <CardFooter className={cn(panelCardFooterClass, "flex items-center gap-4")}>
            <span className="shrink-0 text-caption">{students.length} oʻquvchi</span>

            {/* Oʻrta — holat sonlari, markazda */}
            <div className="flex flex-1 items-center justify-center gap-x-5 gap-y-2 flex-wrap">
              {activeStatuses.map((s) => {
                const v = statusVisual(s);
                return (
                  <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("flex", v.textClass)}><v.Icon className="size-4" strokeWidth={2.5} /></span>
                    <span>{s.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{countByKey(s.key)}</span>
                  </div>
                );
              })}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="size-3 rounded border border-dashed border-muted-foreground/40" />
                <span>Belgilanmagan</span>
                <span className="font-semibold tabular-nums text-foreground">{unmarkedCount}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-info inline-block" />
              <span>Izoh</span>
              <span className="font-semibold tabular-nums text-foreground">{noteCount}</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {notePopup && (
        <NoteModal note={noteRecord?.note ?? ""}
          studentName={noteStudent?.name ?? ""} date={notePopup.date}
          onSave={(v) => handleNoteSave(notePopup.studentId, notePopup.date, v)}
          onClose={() => setNotePopup(null)} />
      )}
    </>
  );
}
