"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Check, X, Clock, FileText, ChevronLeft, ChevronRight,
  Funnel, Settings2, Calendar,
  ArrowUpRight, ArrowRight, Pencil, ChevronUp, ChevronDown,
  AlertTriangle, MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS_UZ_SUN } from "@/lib/localization";
import {
  type AttendanceStatus, type AttendanceStatusDef, type AttendanceRecord,
  deriveLessonDays,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
const UNMARKED = "unmarked";

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
const PREVIEW_LEGEND: { key: keyof AttendanceWindow; labelKey: string; Icon: typeof Check; color: string }[] = [
  { key: "present", labelKey: "present", Icon: Check,    color: ATT_COLORS.present },
  { key: "absent",  labelKey: "absent",  Icon: X,        color: ATT_COLORS.absent },
  { key: "late",    labelKey: "late",    Icon: Clock,    color: ATT_COLORS.late },
  { key: "excused", labelKey: "excused", Icon: FileText, color: ATT_COLORS.excused },
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
  const t = useTranslations("AttendanceView");
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
              style={{ backgroundColor: `color-mix(in srgb, ${s.color} 18%, transparent)` }}
              title={t(s.labelKey)}>
              <s.Icon className="size-3.5" strokeWidth={2.5} style={{ color: s.color }} />
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {summary[s.key]}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">{t("times")}</span>
            </span>
          </div>
        ))}
      </div>
      <Button asChild size="sm" className="w-full font-semibold">
        <a href={`/dashboard/students/${student.id}`}>
          {t("openProfile")}
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
  const t = useTranslations("AttendanceView");
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
                <CardTitle>{t("noteTitle")}</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                {studentName} · {dateLabel}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="p-6">
          <Textarea
            ref={ref} value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); }}
            rows={4} placeholder={t("notePlaceholder")} className="resize-none"
          />
          <p className="mt-2 inline-flex items-center gap-1.5 text-caption">
            {t("saveHint")}
            <KbdGroup>
              <Kbd>⌘/Ctrl</Kbd>
              <Kbd>Enter</Kbd>
            </KbdGroup>
          </p>
        </div>

        <DialogFooter className="items-center border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
          {note
            ? <Button variant="ghost" size="sm" onClick={() => { onSave(""); onClose(); }} className="text-destructive hover:text-destructive hover:bg-destructive/10">{t("delete")}</Button>
            : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>{t("cancel")}</Button>
            <Button size="sm" onClick={save}>{t("save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ustun sarlavhasi (bulk set popover) ─────────────────────────────────────

function ColHeader({
  date, isToday, statuses, onBulk, cellRef, future,
}: { date: string; isToday: boolean; statuses: AttendanceStatusDef[]; onBulk: (s: AttendanceStatus) => void; cellRef?: React.Ref<HTMLTableCellElement>; future?: boolean }) {
  const t = useTranslations("AttendanceView");
  const [open, setOpen] = useState(false);
  const [, , dd] = date.split("-");
  const dayName = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"][new Date(date).getDay()];
  // Kelasi dars kuni — hali belgilab boʻlmaydi, popover ochilmaydi.
  if (future) {
    return (
      <th ref={cellRef} className={cn("border-b border-r border-border p-0 w-[44px] min-w-[44px] text-center relative")} style={{ width: 44, minWidth: 44, background: HEADER_BG }}>
        <div className="flex flex-col items-center justify-center h-full w-full gap-0.5 py-2 opacity-40">
          <span className="text-xs font-bold uppercase text-muted-foreground">{dayName}</span>
          <span className="text-sm font-bold text-muted-foreground">{parseInt(dd, 10)}</span>
        </div>
      </th>
    );
  }
  return (
    <th ref={cellRef} className={cn("border-b border-r border-border p-0 w-[44px] min-w-[44px] text-center relative")} style={{ width: 44, minWidth: 44, background: HEADER_BG }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex flex-col items-center justify-center h-full w-full gap-0.5 cursor-pointer py-2 hover:bg-muted/80 transition-colors">
            <span className={cn("text-xs font-bold uppercase", isToday ? "text-primary" : "text-muted-foreground")}>{dayName}</span>
            <span className={cn("text-sm font-bold", isToday && "text-primary")}>{parseInt(dd, 10)}</span>
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
            <TooltipContent>{t("clear")}</TooltipContent>
          </Tooltip>
        </PopoverContent>
      </Popover>
    </th>
  );
}

// ─── Davomat katagi ──────────────────────────────────────────────────────────

function AttCell({
  def, note, onClick, onNote, future,
}: { def: AttendanceStatusDef | null; note: string; onClick: () => void; onNote: () => void; future?: boolean }) {
  const t = useTranslations("AttendanceView");
  const [hov, setHov] = useState(false);
  const v = def ? statusVisual(def) : null;
  // Kelasi dars kuni — hali boʻlib oʻtmagan, belgilab boʻlmaydi (faqat "oldindan
  // koʻrinish"): band emas, band boʻlmagan holatdan farqlanishi uchun xira chizilgan.
  if (future) {
    return (
      <div className="flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(CHIP_BTN, "size-9 cursor-default bg-transparent text-muted-foreground/20 border border-dashed border-muted-foreground/15")}
              aria-hidden
            />
          </TooltipTrigger>
          <TooltipContent>{t("futureLessonDay")}</TooltipContent>
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="relative flex justify-center" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button" onClick={onClick}
            className={cn(
              CHIP_BTN, "size-9",
              v ? v.cellClass : "bg-muted/40 text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted/60",
            )}

          >
            {v ? <v.Icon className="size-4" strokeWidth={2.5} /> : null}
          </button>
        </TooltipTrigger>
        <TooltipContent>{def?.label ?? t("unmarked")}</TooltipContent>
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
  const t = useTranslations("AttendanceView");
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
  // Davr granularligi — "Oy" (bitta oy) yoki "Chorak" (akademik chorak toʻlaligicha,
  // dars kunlari `quarter.range` boʻyicha; navigatsiya choraklar boʻylab).
  const [period, setPeriod] = useState<"month" | "quarter">("month");
  const [onlyAttention, setOnlyAttention] = useState(false);
  
  // Bugungi sana yil diapazonidan tashqaridaligi bo'yicha ogohlantirish (bir martalik yopish uchun)
  const [isAlertDismissed, setIsAlertDismissed] = useState(true);
  
  useEffect(() => {
    if (!demoMode && typeof window !== "undefined") {
      setIsAlertDismissed(localStorage.getItem("attendance-calendar-alert-dismissed") === "true");
    }
  }, [demoMode]);

  // Roster va sinf nomi — baholar jurnali bilan bitta manba (server-backed).
  const gradesClass = useGradesStore((s) => s.classDataMap[classId]);
  const versions = useTimetableStore((s) => s.versions);
  const roster = demoMode ? (demoRoster ?? []) : (gradesClass?.students ?? []);
  const className = demoMode ? (demoClassInfo?.name ?? classId) : (gradesClass?.info.name ?? classId);
  const today = todayKey();

  // Dars kunlari — oʻsha sanada amalda boʻlgan jadval versiyasi + kalendar.
  // Butun oʻquv yili boʻyicha hisoblanadi (bugungacha kesilmaydi) — kelasi
  // kunlar jadvalda "oldindan koʻrinish" sifatida xira chizilib koʻrsatiladi,
  // toʻliq yoʻqolib ketmaydi (aks holda yil boshida "dars kuni yoʻq" degan
  // notoʻgʻri taassurot qoldiradi).
  const realLessonDays = useMemo(() => {
    return deriveLessonDays(classId, calendar.range, calendar, versions);
  }, [classId, calendar, versions]);
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
  const showBanners = (todayOutsideCalendar && !isAlertDismissed) || scheduleGapAtStart;

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
  // O(1) katak qidiruvi — jadval N ta oʻquvchi × M ta kun boʻyicha render
  // qilinganda har katakning `records`ni boshdan skanerlashini oldini oladi
  // (GradesTable'dagi gradeMap bilan bir xil naqsh).
  const recordByKey = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    for (const r of records) m.set(`${r.studentId}:${r.date}`, r);
    return m;
  }, [records]);

  useEffect(() => { setOnlyAttention(false); }, [classId]);

  /* ════════════════════════════════════════════════════════════════
     YETIM YOZUVLAR — jadvalga mos kelmay qolgan davomat.

     🔴 Ilgari bu yerda effekt turardi va ularni SOʻRAMASDAN oʻchirardi.
     Oqibati jimgina va ogʻir edi: dars kuni seshanbadan dushanbaga
     koʻchirilsa, seshanbadagi BUTUN tarix yoʻqolardi — oʻqituvchi buni
     sezmasdi ham, chunki hech qanday xabar chiqmasdi.

     ⛔ Endi hech narsa oʻchirilmaydi. Yozuvlar joyida qoladi (jadvalda
     koʻrinmasa ham), oʻqituvchiga esa bir martalik tanlov beriladi:
     koʻrish · saqlab qoʻyish · oʻchirish. Oʻchirish endi ANIQ amal.

     ⚠️ Yil diapazonidan tashqaridagi (oʻtgan yil) yozuvlar bu yerga
     umuman kirmaydi — ular yetim emas, shunchaki boshqa yilniki.
     ════════════════════════════════════════════════════════════════ */
  const orphanRecords = useMemo<AttendanceRecord[]>(() => {
    if (demoMode || !mounted) return [];
    if (!isCalendarConfigured(calendar) || realLessonDays.length === 0) return [];
    if (!storedRecords?.length) return [];
    const lessonSet = new Set(realLessonDays.map((d) => d.date));
    const end = today < calendar.range.end ? today : calendar.range.end;
    return storedRecords.filter(
      (r) => r.date >= calendar.range.start && r.date <= end && !lessonSet.has(r.date)
    );
  }, [demoMode, mounted, calendar, realLessonDays, storedRecords, today]);

  /* Yetimlar toʻplamining barmoq izi. Oʻqituvchi «saqlab qoʻyish» desa
     banner yopiladi, lekin jadval KEYIN yana oʻzgarsa yangi yetimlar
     paydo boʻladi — va ular haqida qayta ogohlantirish SHART. Shu bois
     yopilish sanalar toʻplamiga bogʻlangan, «koʻrdim» bayrogʻiga emas. */
  const orphanSignature = useMemo(() => {
    if (orphanRecords.length === 0) return "";
    const dates = [...new Set(orphanRecords.map((r) => r.date))].sort();
    return `${orphanRecords.length}|${dates[0]}|${dates[dates.length - 1]}`;
  }, [orphanRecords]);

  const orphanKey = `attendance-orphan-dismissed:${classId}`;
  const [orphanDismissed, setOrphanDismissed] = useState("");
  useEffect(() => {
    if (demoMode || typeof window === "undefined") return;
    setOrphanDismissed(localStorage.getItem(orphanKey) ?? "");
  }, [demoMode, orphanKey]);

  const showOrphanBanner = orphanSignature !== "" && orphanSignature !== orphanDismissed;
  const [orphanOpen, setOrphanOpen] = useState(false);

  /** Yetim sanalar — har birida nechta yozuv borligi bilan. */
  const orphanByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of orphanRecords) m.set(r.date, (m.get(r.date) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [orphanRecords]);

  const keepOrphans = () => {
    setOrphanDismissed(orphanSignature);
    if (typeof window !== "undefined") localStorage.setItem(orphanKey, orphanSignature);
    setOrphanOpen(false);
  };

  /* ⚠️ `showBanners` yuqorida, yetim tekshiruvidan OLDIN hisoblanadi —
     shuning uchun bu yerda kengaytiriladi, u yerda emas. */
  const anyBanner = showBanners || showOrphanBanner;

  const deleteOrphans = () => {
    const doomed = new Set(orphanRecords.map((r) => `${r.studentId}:${r.date}`));
    setRecordsRaw(classId, (storedRecords ?? []).filter(
      (r) => !doomed.has(`${r.studentId}:${r.date}`)
    ));
    setOrphanOpen(false);
  };

  // Oʻquv yili choraklarga boʻlinmay qolsa (masalan davrsiz shablonga
  // oʻtilsa) — "Chorak" rejimida qolib ketmaslik uchun "Oy"ga qaytariladi.
  useEffect(() => {
    if (period === "quarter" && calendar.quarters.length === 0) setPeriod("month");
  }, [period, calendar.quarters.length]);

  // Bugungi ustunga avtoscroll — jadval ochilganda (yoki oy/sinf almashganda)
  // bugungi sana koʻrinishda boʻlsa, ustun markazga keltiriladi.
  const todayColRef = useRef<HTMLTableCellElement>(null);
  useEffect(() => {
    todayColRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [mounted, classId, month.year, month.month, period]);

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

  // Akademik chorak — oy rejimida koʻrilayotgan oyning choragi; chorak rejimida
  // aynan koʻrilayotgan chorak (navigatsiya shu boʻyicha). % ustuni, chorak
  // statistikasi va (chorak rejimida) koʻrsatiladigan kunlar shundan keladi.
  const viewedQuarter = getQuarterForMonth(calendar, month.year, month.month);

  // Koʻrsatiladigan kunlar — har doim dars kunlari. Oy rejimi: koʻrilayotgan
  // oyga tushganlari; chorak rejimi: chorak diapazonidagilari.
  const monthDays = period === "quarter"
    ? (viewedQuarter ? lessonDays.filter((d) => inRange(d.date, viewedQuarter.range)) : [])
    : lessonDays.filter((d) => {
        const [y, m] = d.date.split("-").map(Number);
        return y === month.year && m === month.month;
      });

  // Oʻquvchilar — tartiblash
  const baseStudents = [...roster]
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
  // "Choraklik %" — AKADEMIK chorak dars sanalari (yuqorida hisoblangan
  // viewedQuarter). Oy hech bir chorakka tushmasa (taʼtil oyi / yil tashqarisi)
  // — oylik toʻplamning oʻzi ishlatiladi.
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

  // "Xavfli" — gibrid: <75% (absolyut floor) YOKI sinfning eng past 25% (pertsentil).
  // "Xavfsiz poyabzal": 90%+ hech qachon faqat pertsentil sababli qizil boʻlmaydi —
  // aks holda hamma aʼlo boʻlgan sinfda ham eng "pastroq" 25% sunʼiy qizil chiqadi.
  const SAFE_FLOOR_PCT = 90;
  const periodPcts = baseStudents.map((s) => periodRateOf(s.id)?.pct).filter((p): p is number => p != null);
  const p25 = percentile(periodPcts, 25);
  const isChronic = (id: string) => (monthRateOf(id)?.absents ?? 0) >= 3; // oyiga ≥3 Kelmadi
  const isDanger = (id: string) => {
    const r = periodRateOf(id);
    if (!r) return false;
    if (r.pct < 75) return true;
    if (r.pct >= SAFE_FLOOR_PCT) return false;
    return p25 != null && r.pct < p25;
  };
  const needsAttention = (id: string) => isChronic(id) || isDanger(id);
  const attentionCount = baseStudents.filter((s) => needsAttention(s.id)).length;

  const students = onlyAttention ? baseStudents.filter((s) => needsAttention(s.id)) : baseStudents;

  // Jonli xulosa — koʻrinayotgan oy × oʻquvchilar boʻyicha holat sonlari.
  // Kelasi (hali boʻlib oʻtmagan) kunlar "Belgilanmagan"ga kirmaydi — ular
  // haqiqatda belgilanishi mumkin emas, kiritilsa har oy oxirigacha soxta
  // "necha kun belgilanmagan" raqami koʻrsatardi.
  const pastMonthDays = monthDays.filter((d) => d.date <= today);
  const monthDateSet = new Set(pastMonthDays.map((d) => d.date));
  const studentIdSet = new Set(students.map((s) => s.id));
  const scopeRecords = records.filter((r) => studentIdSet.has(r.studentId) && monthDateSet.has(r.date));
  const countByKey = (key: string) => scopeRecords.filter((r) => r.status === key).length;
  const noteCount = scopeRecords.filter((r) => r.note).length;
  const totalCells = students.length * pastMonthDays.length;
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

  // Kun ustidagi ommaviy belgilash — FAQAT hali belgilanmagan oʻquvchilarni
  // toʻldiradi. Allaqachon belgilangan (va izohli) yozuvlar oʻzgarmaydi —
  // aks holda "Hammasi Keldi" bosilganda ertalab yozilgan "Kelmadi + sababli
  // izoh" yoʻqolib ketardi. "Tozalash" (UNMARKED) esa ataylab toʻliq kunni
  // tozalaydigan aniq destruktiv amal — shu holicha qoladi.
  const handleBulk = (date: string, status: AttendanceStatus) => {
    setRecords((prev) => {
      if (status === UNMARKED) return prev.filter((r) => r.date !== date);
      const already = new Set(
        prev.filter((r) => r.date === date && r.status !== UNMARKED).map((r) => r.studentId)
      );
      const additions = roster
        .filter((s) => !already.has(s.id))
        .map((s) => ({ studentId: s.id, date, status }));
      return [...prev, ...additions];
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

  // Berilgan oy chorakka tushsa — oʻsha chorakning boshlanish oyi; aks holda eng
  // yaqin chorak (yil tugagach → oxirgi, boshlanmagan → birinchi). Kalendar
  // sozlanmagan boʻlsa null. Chorak rejimida "sakrash" nuqtalari shundan.
  const quarterStartMonthFor = (y: number, m: number): { year: number; month: number } | null => {
    const qs = calendar.quarters;
    if (qs.length === 0) return null;
    const mm = String(m).padStart(2, "0");
    const q = getQuarterForMonth(calendar, y, m)
      ?? (`${y}-${mm}-15` > calendar.range.end ? qs[qs.length - 1] : qs[0]);
    const [qy, qm] = q.range.start.split("-").map(Number);
    return { year: qy, month: qm };
  };

  const goToday = () => {
    const n = new Date();
    const y = n.getFullYear(), m = n.getMonth() + 1;
    // Chorak rejimi: bugun chorakka tushmasa ham eng yaqin chorakni koʻrsatamiz.
    if (period === "quarter") {
      const t = quarterStartMonthFor(y, m);
      if (t) { setMonth(t); return; }
    }
    setMonth({ year: y, month: m });
  };

  // Chorak rejimida navigatsiya — koʻrilayotgan chorakdan oldingi/keyingisiga
  // oʻtadi (month'ni oʻsha chorak boshlanish oyiga qoʻyadi; viewedQuarter shundan
  // qayta hisoblanadi). Yagona faol yilda 4 chorak — chetlarda toʻxtaydi.
  const quarterStep = (dir: -1 | 1) => {
    const qs = calendar.quarters;
    if (qs.length === 0) return;
    const idx = viewedQuarter ? qs.findIndex((q) => q.id === viewedQuarter.id) : -1;
    const nextIdx = idx === -1 ? (dir === 1 ? 0 : qs.length - 1) : Math.min(Math.max(idx + dir, 0), qs.length - 1);
    const [y, m] = qs[nextIdx].range.start.split("-").map(Number);
    setMonth({ year: y, month: m });
  };
  const goPrev = () => (period === "quarter" ? quarterStep(-1) : prevMonth());
  const goNext = () => (period === "quarter" ? quarterStep(1) : nextMonth());

  const noteRecord = notePopup ? records.find((r) => r.studentId === notePopup.studentId && r.date === notePopup.date) : null;
  const noteStudent = notePopup ? roster.find((s) => s.id === notePopup.studentId) : null;

  const ctrlBtn = "size-9 rounded-md bg-card border-border shadow-none";

  return (
    <>
      {/* Main panel */}
      <div className="flex-1 min-w-0 min-h-0 grid gap-3" data-tour="attendance-heatmap" style={{ minHeight: 0, gridTemplateRows: anyBanner ? "auto 1fr" : "1fr" }}>
        {anyBanner && (
          <div className="grid gap-3">
            {todayOutsideCalendar && !isAlertDismissed && (
              <Alert variant="info" className="pr-10 relative">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>{t("todayOutsideYearTitle")}</AlertTitle>
                <AlertDescription>
                  {t("todayOutsideYearDescription", { date: today, year: calendar.yearLabel || t("currentYearFallback") })}{" "}
                  <Link href="/dashboard/settings?section=oquv-yili" className="font-medium underline underline-offset-2">
                    {t("goToYearSettings")}
                  </Link>
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 rounded-md text-blue-600/70 hover:text-blue-600 hover:bg-blue-600/10 dark:text-blue-400/70 dark:hover:text-blue-400 dark:hover:bg-blue-400/10 shadow-none"
                  onClick={() => {
                    setIsAlertDismissed(true);
                    localStorage.setItem("attendance-calendar-alert-dismissed", "true");
                  }}
                  aria-label={t("dismissWarning")}
                >
                  <X className="size-3.5" />
                </Button>
              </Alert>
            )}
            {scheduleGapAtStart && <TimetableCoverageBanner />}
            {/* `info` — yondagi banner bilan bir xil. Bu ogohlantirish,
                xato emas: hech narsa yoʻqolmagan, tanlov soʻralyapti. */}
            {showOrphanBanner && (
              <Alert variant="info">
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>{t("orphanTitle", { count: orphanRecords.length })}</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span>{t("orphanDescription")}</span>
                  <span className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7" onClick={() => setOrphanOpen(true)}>
                      {t("orphanReview")}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7" onClick={keepOrphans}>
                      {t("orphanKeep")}
                    </Button>
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        <Card className={cn("min-w-0", panelCardClass)} style={{ height: "100%" }}>
          {/* Header */}
          <CardHeader className={cn(panelCardHeaderClass, "justify-between gap-3 min-h-16 px-5 pt-4! pb-4!")}>
            <div className="flex items-center gap-3 shrink-0">
              <SectionIcon><Calendar /></SectionIcon>
              <CardTitle className="flex items-baseline gap-1.5">
                {period === "quarter" && viewedQuarter ? viewedQuarter.name : MONTH_NAMES[month.month - 1]}
                <span className="font-normal text-foreground/50">({month.year})</span>
              </CardTitle>
            </div>

            {/* Davr granularligi — Oy | Chorak (demo/turda va choraksiz oʻquv yilida yashirin) — markazda */}
            <div className="flex flex-1 items-center justify-center">
              {!demoMode && calendar.quarters.length > 0 && (
                <ToggleGroup
                  type="single"
                  value={period}
                  onValueChange={(v) => {
                    if (!v) return;
                    setPeriod(v as "month" | "quarter");
                    if (v === "quarter") {
                      // Koʻrilayotgan oy chorakka tushmasa (yil tashqarisi) — boʻsh
                      // ekran oʻrniga eng yaqin chorakka sakraymiz.
                      if (!viewedQuarter) {
                        const t = quarterStartMonthFor(month.year, month.month);
                        if (t) setMonth(t);
                      }
                    }
                  }}
                  variant="outline"
                  size="default"
                >
                  <ToggleGroupItem value="month" className="px-3 text-sm font-medium">{t("month")}</ToggleGroupItem>
                  <ToggleGroupItem value="quarter" className="px-3 text-sm font-medium">
                    {t("quarter")}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
              {attentionCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setOnlyAttention((v) => !v)}
                      className={cn(ctrlBtn, onlyAttention && "ring-2 ring-primary ring-offset-2")}>
                      <Funnel className="h-4 w-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {onlyAttention ? t("showAll") : t("needsAttentionCount", { count: attentionCount })}
                  </TooltipContent>
                </Tooltip>
              )}

              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={goPrev} className={ctrlBtn}>
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </Button>
                <Button variant="outline" onClick={goToday} className="h-9 rounded-md bg-card border-border shadow-none font-semibold px-4">
                  {t("today")}
                </Button>
                <Button variant="outline" size="icon" onClick={goNext} className={ctrlBtn}>
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </Button>
              </div>

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
                          aria-label={t("attendanceSettings")}
                        >
                          <Settings2 className="h-4 w-4" aria-hidden />
                        </Button>
                      }
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("attendanceSettings")}</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          {/* Table */}
          <CardContent className={cn(panelCardContentClass, "scrollbar-hover overflow-auto [&_div[data-slot=table-container]]:overflow-visible [&_div[data-slot=table-container]]:h-full")}>
            {monthDays.length === 0 ? (
              <Empty className="h-full w-full">
                <EmptyHeader>
                  <EmptyMedia><Illustration name="22" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>{period === "quarter" ? t("noQuarterLessonDaysTitle") : t("noMonthLessonDaysTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {period === "quarter"
                      ? t("noQuarterLessonDaysDescription", { quarter: viewedQuarter?.name ?? t("thisQuarterFallback") })
                      : t("noMonthLessonDaysDescription", { month: MONTH_NAMES[month.month - 1] })}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" onClick={goToday} className="bg-card">
                    {t("goToToday")}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Table className="w-auto border-separate border-spacing-0 table-fixed border-border">
                <colgroup>
                  <col style={{ width: 220 }} />
                  {monthDays.map((d) => <col key={d.date} style={{ width: 44 }} />)}
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
                              {t("students")}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{sortField === "firstName" ? t("sortByLastName") : t("sortByFirstName")}</TooltipContent>
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
                          <TooltipContent>{sortDir === "asc" ? t("sortDesc") : t("sortAsc")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>

                    {monthDays.map((d) => (
                      <ColHeader key={d.date} date={d.date} isToday={d.date === today} future={d.date > today} statuses={activeStatuses} onBulk={(s) => handleBulk(d.date, s)} cellRef={d.date === today ? todayColRef : undefined} />
                    ))}

                    {/* Davomat % — akademik chorak boʻyicha */}
                    <TableHead className="sticky right-0 z-40 border-b border-l border-border px-2 text-center align-middle text-label whitespace-nowrap" style={{ width: 120, background: HEADER_BG }}>
                      {viewedQuarter ? t("quarterPercent", { quarter: viewedQuarter.name }) : t("quarterlyPercentFallback")}
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
                      danger && t("lowAttendance"),
                      chronic && t("absentTimesThisMonth", { count: monthRateOf(student.id)?.absents ?? 0 }),
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
                                  <span className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-fast flex items-center justify-center bg-[var(--avatar-bg)]"
                                    style={{ "--avatar-bg": classHex } as React.CSSProperties}>
                                    <ArrowUpRight className="size-3.5 text-white" aria-hidden />
                                  </span>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>{t("viewProfile", { name: student.name })}</TooltipContent>
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
                          <TableCell key={d.date} className="border-b border-r border-border p-1 text-center min-w-[44px]">
                            <AttCell
                              def={statusByKey(recordByKey.get(`${student.id}:${d.date}`)?.status ?? UNMARKED)}
                              note={recordByKey.get(`${student.id}:${d.date}`)?.note ?? ""}
                              onClick={() => handleCell(student.id, d.date)}
                              onNote={() => setNotePopup({ studentId: student.id, date: d.date })}
                              future={d.date > today}
                            />
                          </TableCell>
                        ))}

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
                      <TableCell colSpan={monthDays.length + 2} className="py-10 px-8">
                        <Alert className="max-w-md mx-auto bg-muted/50 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="size-4 text-muted-foreground" />
                            <AlertTitle className="mb-0">{t("notFound")}</AlertTitle>
                          </div>
                          <AlertDescription className="text-muted-foreground ml-6">
                            {onlyAttention
                              ? t("noAttentionStudents")
                              : t("noStudentsInClass")}
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
            <span className="shrink-0 text-caption">{t("studentCount", { count: students.length })}</span>

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
                <span>{t("unmarked")}</span>
                <span className="font-semibold tabular-nums text-foreground">{unmarkedCount}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-info inline-block" />
              <span>{t("note")}</span>
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

      {/* Yetim yozuvlar — sanalar ochiq koʻrsatiladi. Oʻchirish tugmasi
          shu yerda, chunki nima oʻchayotganini koʻrmasdan bosilmasin. */}
      <Dialog open={orphanOpen} onOpenChange={setOrphanOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>{t("orphanDialogTitle")}</DialogTitle>
          <DialogDescription>{t("orphanDialogDescription")}</DialogDescription>
          <div className="max-h-64 overflow-y-auto rounded-md border border-border">
            {orphanByDate.map(([date, n]) => (
              <div
                key={date}
                className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm last:border-b-0"
              >
                <span className="text-foreground">{date}</span>
                <span className="text-xs text-muted-foreground">
                  {t("orphanRecordsOnDate", { count: n })}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="destructive" onClick={deleteOrphans}>
              {t("orphanDelete")}
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost">{t("orphanClose")}</Button>
              </DialogClose>
              <Button onClick={keepOrphans}>{t("orphanKeep")}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
