"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { fmtMin, type TimetableEvent } from "@/lib/timetable";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { useGradesStore } from "@/store/useGradesStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import {
  dateToKey as toDateKey,
  minToHHMM,
  hhmmToMin as HHMMToMin,
  getWeekDates,
  getMonthGrid,
  isSameDay,
  jsDayToIsoDay,
} from "@/lib/calendar-core/date-math";
import { sessionMatchesSlot } from "@/lib/calendar-core/resolve";
import { EventPill as CalendarEventPill } from "@/components/calendar/EventPill";
import { TimeGrid, type TimeGridColumn } from "@/components/calendar/TimeGrid";
import { MonthGrid, MonthMorePopover } from "@/components/calendar/MonthGrid";
import { useCalendarFormat } from "@/components/calendar/format";
import { getHolidayForDate, inRange } from "@/lib/academic-calendar";
import { lessonSessions, lessonClassIds, unitIdForClass, type Lesson } from "@/lib/lessons-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { Label } from "@/components/ui/label";
import { SectionIcon } from "@/components/ui/section-icon";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { panelCardClass, panelCardHeaderClass, panelCardContentClass } from "@/components/DashboardPage";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusIcon, LinkIcon,
  FileText, Check, Trash2, Undo2, CalendarOff, ArrowUpRight, Eye, EyeOff, X,
  SlidersHorizontal, Pencil, Search, Ban, Clock, CalendarPlus, MoreVertical,
  Minus, ListFilter,
} from "lucide-react";
import {
  DndContext, PointerSensor, KeyboardSensor, useDraggable, useDroppable,
  useSensor, useSensors, closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import { EventCard } from "@/components/calendar/EventCard";
import { LessonStatusBadge } from "@/components/LessonStatusBadge";
import { useTourRequest } from "@/components/tour/tour-request";
import { makePlannerTourDemo } from "@/components/tour/planner-tour-demo";

/* ════════════════════════════════════════════════════════════════════
   PLANNER — dars jadvali (timetable) kalendarda. Standalone /planner
   BARCHA sinflarni, sinf-detali Planner boʻlimi esa `classId` berilsa
   FAQAT shu sinfni koʻrsatadi. Jadval eventlari ham, darslar ham endi
   BITTA jonli sinf id maydonida — koʻprik yoʻq. Ikkalasi shu
   komponentni ishlatadi (DRY).

   REJALASHTIRISH — yagona manba: useLessonStore `scheduleByClass`.
   Planner ham, dars muharriri ham SHU xaritaga yozadi (addScheduleForClass/
   moveSession/unscheduleSession). Eski (faqat legacy maydonli) darslar
   `lessonSessions()` orqali sintez qilinadi — migratsiyasiz mos ishlaydi.
   ════════════════════════════════════════════════════════════════════ */

const BLOCKED_KEY = "murabbiyona-blocked-days";

type BlockedDay = { date: string; label: string };
type SlotModal = { date: Date; classId: string; startMin: number; endMin: number };
/** Kalendarga joylangan bitta sessiya (dars + qaysi sinf + vaqt). */
type Placement = { lesson: Lesson; classId: string; startMin: number; endMin: number };
/** Tahrir/koʻchirish nishoni — QAYSI sessiya (dars + sinf + sana + vaqt). */
type EditTarget = { lessonId: string; classId: string; date: string; startMin: number; endMin: number };
type DragPayload = { lessonId: string; classId: string; date: string; startMin: number; endMin: number };

const SLOT_HEIGHT = 180;
/** Toʻliq sutka koʻrsatiladi (00:00–24:00); ochilganda 08:00'ga scroll qilinadi. */
const START_HOUR = 0;
const END_HOUR = 24;
const VISIBLE_HOURS = END_HOUR - START_HOUR;

const ZOOM_KEY = "ustozona-planner-zoom";
const ZOOM_MIN = 60;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

/* ── Kunlik panel (oy koʻrinishi) vaqt-toʻri ──────────────────────────────
   Haftalik koʻrinish bilan BIR XIL qadam (SLOT_HEIGHT, 100% zoom) — panel tor
   boʻlsa ham, soatlar tiqilib qolmasligi uchun. Toʻr TOʻLIQ sutkani qamraydi
   (00:00–24:00), lekin ochilganda qatʼiy 08:00 ga emas, SHU KUNNING birinchi
   eventiga scroll qilinadi. */
const DAY_PX_PER_HOUR = SLOT_HEIGHT;
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;

/* Motion tokenlarga mos (globals.css @theme, [[motion-system]]):
   duration-base = 250ms, ease-standard = Material 3 standard. */
const PANEL_EASE_STANDARD = [0.2, 0, 0, 1] as const;
const PANEL_DURATION_BASE = 0.25;

/** Kun kaliti — calendar-core konvensiyasi. */
function dateToTimetableDay(d: Date): number {
  return jsDayToIsoDay(d.getDay());
}
/** Placement timetable eventiga tegishlimi — kanonik sessionMatchesSlot
    ("start-in-slot": sinf mos VA boshlanish event oraligʻida). */
function placementInEvent(p: Placement, ev: TimetableEvent): boolean {
  return sessionMatchesSlot(ev, p, "start-in-slot");
}

/* ── @dnd-kit identifikatorlari ───────────────────────────────────────────
   Bitta DndContext ichida ikki xil drop-zona bor, shuning uchun id'lar
   prefiksli va tahlil qilinadigan. Ajratgich `|` — dateKey (YYYY-MM-DD) va
   uuid'da uchramaydi, shuning uchun split xavfsiz.
     L| lessonId | classId | dateKey | startMin | endMin   → sudraladigan dars
     D| dateKey                                            → oy katagi (kun)
     S| dateKey | classId | startMin | endMin              → paneldagi boʻsh slot */
const dndLessonId = (p: Placement, dateKey: string) =>
  `L|${p.lesson.id}|${p.classId}|${dateKey}|${p.startMin}|${p.endMin}`;
const dndDayId = (dateKey: string) => `D|${dateKey}`;
const dndSlotId = (dateKey: string, ev: TimetableEvent) =>
  `S|${dateKey}|${ev.classId}|${ev.startMin}|${ev.endMin}`;

/** Oy katagining drop-zonasi. Katak div'i MonthGrid ichida — unga ref bera
    olmaymiz (hook'ni `getCellProps` callback'idan chaqirib boʻlmaydi), shuning
    uchun katakni toʻldiruvchi koʻrinmas qatlam registratsiya qilinadi.
    `pointer-events-none` xalaqit bermaydi: @dnd-kit toʻqnashuvni pointer emas,
    oʻlchangan REKT boʻyicha aniqlaydi. */
function MonthDayDropZone({ dateKey }: { dateKey: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: dndDayId(dateKey) });
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-sm transition-colors",
        isOver && "bg-primary/8 inset-ring-2 inset-ring-[var(--ring)]",
      )}
    />
  );
}

/** Paneldagi boʻsh slot drop-zonasi — darsni aynan shu vaqtga tushirish.
    Geometriya (top/height) AYNAN shu oʻramda boʻlishi shart: @dnd-kit
    toʻqnashuvni shu tugunning rekti boʻyicha oʻlchaydi. */
function SlotDropZone({ id, style, children }: {
  id: string;
  style: React.CSSProperties;
  children: (isOver: boolean) => ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={style} className="absolute inset-x-1">
      {children(isOver)}
    </div>
  );
}

/** Sudraladigan joylangan dars (panel vaqt-toʻrida). Klaviatura bilan ham
    ishlaydi — @dnd-kit KeyboardSensor `attributes` orqali fokus/ARIA beradi. */
function DraggablePlacement({ id, style, className, onClick, children }: {
  id: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={style}
      className={cn(className, isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}

export default function PlannerView({ classId }: { classId?: string }) {
  const t = useTranslations("PlannerView");
  const fmt = useCalendarFormat();
  const router = useRouter();

  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [blocked, setBlocked] = useState<BlockedDay[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [nowMin, setNowMin] = useState(0);
  const [showOffDays, setShowOffDays] = useState(false);
  // Oy koʻrinishida tanlangan kun — chapdagi kunlik panel shu kalitga bogʻlangan.
  // `null` boʻlsa panel umuman render qilinmaydi (kalendar 100% joyni oladi).
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const slotHeight = Math.round((SLOT_HEIGHT * zoom) / 100);

  // ── Jadval versiyalari + oʻquv yili kalendari (yagona manbalar) ──
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);

  // ── Mavzu banki (umumiy store) ──
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const addLesson = useLessonStore((s) => s.addLesson);
  const updateLesson = useLessonStore((s) => s.updateLesson);
  const deleteLessonAction = useLessonStore((s) => s.deleteLesson);
  const addScheduleForClass = useLessonStore((s) => s.addScheduleForClass);
  const moveSession = useLessonStore((s) => s.moveSession);
  const unscheduleSession = useLessonStore((s) => s.unscheduleSession);
  const restoreLesson = useLessonStore((s) => s.restoreLesson);
  const setStatus = useLessonStore((s) => s.setStatus);

  const [blockModal, setBlockModal] = useState<{ date: Date } | null>(null);
  const [blockLabel, setBlockLabel] = useState("");

  const [linkModal, setLinkModal] = useState<SlotModal | null>(null);
  const [lmLessonId, setLmLessonId] = useState<string>("");
  const [lmSearch, setLmSearch] = useState("");
  const [lmUnitFilter, setLmUnitFilter] = useState<string>("all");

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [emTitle, setEmTitle] = useState("");
  const [emDateStr, setEmDateStr] = useState("");
  const [emStartStr, setEmStartStr] = useState("08:00");
  const [emEndStr, setEmEndStr] = useState("08:45");

  const scrollerRef = useRef<HTMLDivElement>(null);

  // ── Hydrate ──
  useEffect(() => {
    try {
      const rawB = localStorage.getItem(BLOCKED_KEY);
      if (rawB) setBlocked(JSON.parse(rawB));
      const rawZ = localStorage.getItem(ZOOM_KEY);
      if (rawZ) {
        const z = Number(rawZ);
        if (Number.isFinite(z) && z >= ZOOM_MIN && z <= ZOOM_MAX) setZoom(z);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch {}
  }, [zoom, hydrated]);

  function zoomBy(delta: number) {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
  }

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked)); } catch {}
  }, [blocked, hydrated]);

  useEffect(() => {
    const tick = () => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Jonli sinflar — event/dars nomi va rangi shu yerdan (server-backed)
  const classDataMap = useGradesStore((s) => s.classDataMap);

  /** Boʻsh hisobda "planner" turʼi ishga tushsa, grid namunaviy sinf +
      bogʻlangan dars bilan toʻldiriladi (faqat vizual — [[planner-tour-demo]]). */
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "planner");
  const isDemoMode = tourDemoActive && !classId && !versions.some((v) => v.events.length > 0);
  /** Kun sozlamalari qadami ochiq boʻlsa, hover'siz ham koʻrinsin. */
  const forceShowDaySettings = useTourRequest((s) => s.activeStepTarget === '[data-tour="planner-day-settings"]');
  /** "Oylik koʻrinish" qadami markaziy modal (real Oy tugmasiga spotlight
      emas) — shu bosqichda koʻrinishning oʻzini "oy"ga oʻtkazamiz, aks
      holda demo namunasi hech qachon koʻrinmas edi. */
  const showMonthPreview = useTourRequest((s) => s.activeStepId === "planner-month-preview");
  useEffect(() => {
    if (showMonthPreview) setView("month");
  }, [showMonthPreview]);
  const plannerDemo = useMemo(() => (isDemoMode ? makePlannerTourDemo() : null), [isDemoMode]);

  const classInfoById = (id: string): ClassInfo | undefined =>
    plannerDemo?.classInfoById.get(id) ?? classDataMap[id]?.info;
  const liveClassColor = (info: ClassInfo): ClassColor => classColor(info);
  /** Joylangan mavzuning rangi/nomi — blok bilan mos (jonli sinfdan).
      `classIdOverride` — mavzu bir NECHA sinfga aloqador boʻlishi mumkin
      (lessonSessions), shu sabab rang doim SHU JOYLASHTIRISHNING (session)
      sinfidan olinishi kerak, mavzuning "asosiy" `classId`sidan emas —
      aks holda koʻp-sinfli mavzular notoʻgʻri (boshqa sinf) rangda chiqadi. */
  const lessonDisplay = (l: Lesson, classIdOverride?: string): { name: string; color: ClassColor; tints: ReturnType<typeof classTints> } => {
    const info = classInfoById(classIdOverride ?? l.classId);
    const c: ClassColor = info ? liveClassColor(info) : "gray";
    return { name: info?.name ?? t("unknownClass"), color: c, tints: classTints(c) };
  };
  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.date)), [blocked]);
  const blockedMap = useMemo(() => new Map(blocked.map((b) => [b.date, b.label])), [blocked]);

  /** Bloklangan kunlar roʻyxati (popover uchun) — sana boʻyicha tartiblangan. */
  const blockedList = useMemo(
    () => [...blocked].sort((a, b) => a.date.localeCompare(b.date)),
    [blocked],
  );
  /** Oʻquv yili bayramlari (popover uchun, faqat oʻqish uchun) — boshlanish
      sanasi boʻyicha tartiblangan. */
  const holidayList = useMemo(
    () => [...calendar.holidays].sort((a, b) => a.range.start.localeCompare(b.range.start)),
    [calendar.holidays],
  );
  /** "kk-monthname" (kichik harf) — kun panelidagi sarlavha bilan bir xil format. */
  const shortDate = (key: string) => {
    const [, m, d] = key.split("-").map(Number);
    return `${d}-${fmt.monthName((m || 1) - 1).toLowerCase()}`;
  };

  /** Sinflar boʻyicha filtr — `null` = hammasi koʻrinadi. Faqat umumiy
      (sinf-detalisiz) plannerda maʼnoli, shu sabab `classId` berilganda
      ishlatilmaydi. */
  const [classFilter, setClassFilter] = useState<Set<string> | null>(null);
  // Arxivlangan sinflar pickerlardan yashirin — filtr roʻyxatida ham koʻrinmaydi.
  const allClassInfos = useMemo(
    () =>
      Object.values(classDataMap)
        .map((c) => c.info)
        .filter((info) => !info.archivedAt)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [classDataMap],
  );
  const toggleClassFilter = (id: string) => {
    setClassFilter((prev) => {
      const all = allClassInfos.map((c) => c.id);
      const base = prev ?? new Set(all);
      const next = new Set(base);
      if (next.has(id)) next.delete(id); else next.add(id);
      // Hammasi belgilangan boʻlsa — filtr "yoʻq" holatiga qaytadi.
      return next.size === all.length ? null : next;
    });
  };
  /** Nomga bosish = "faqat shuni koʻrsat" (Gmail label / Linear filtri naqshi) —
      checkbox esa multi-toggle uchun. */
  const soloClassFilter = (id: string) => setClassFilter(new Set([id]));
  /** Master qator — uch-holatli: hammasi tanlangan boʻlsa hech birini
      qoldirmaydi, aks holda hammasini tanlaydi. */
  const toggleAllClassFilter = () => setClassFilter((prev) => (prev === null ? new Set() : null));
  /** Daraja boʻyicha guruhlangan (5, 6, 7...), toʻgarak/darajasizlar oxirida. */
  const classFilterGroups = useMemo(() => {
    const byGrade = new Map<number | null, ClassInfo[]>();
    for (const info of allClassInfos) {
      const g = info.grade ?? null;
      const arr = byGrade.get(g) ?? [];
      arr.push(info);
      byGrade.set(g, arr);
    }
    const graded = [...byGrade.entries()]
      .filter((e): e is [number, ClassInfo[]] => e[0] !== null)
      .sort((a, b) => a[0] - b[0]);
    const ungraded = byGrade.get(null);
    return ungraded ? [...graded, [null, ungraded] as const] : graded;
  }, [allClassInfos]);

  /** Jadvalda umuman event bormi — boʻsh holat (onboarding) uchun. */
  const hasAnyTimetable = useMemo(() => versions.some((v) => v.events.length > 0) || isDemoMode, [versions, isDemoMode]);

  // Toʻr toʻliq sutkani (00:00–24:00) qamraydi, lekin ochilganda 08:00 koʻrinsin.
  // `hasAnyTimetable` grid mount boʻlgandan keyin oʻzgarsa ham (masalan
  // tur demo rejimi kechroq yoqilsa) qayta ishlaydi.
  useEffect(() => {
    if (!hydrated || !scrollerRef.current || view !== "week" || !hasAnyTimetable) return;
    scrollerRef.current.scrollTop = (8 - START_HOUR) * slotHeight;
  }, [hydrated, view, hasAnyTimetable, slotHeight]);

  /** Sanada amalda boʻlgan versiya jadvalidan shu kunning darslari.
      Oʻquv yilidan tashqari yoki taʼtil kuni — boʻsh. */
  const eventsForDate = (date: Date): TimetableEvent[] => {
    const tDay = dateToTimetableDay(date);
    if (plannerDemo) return plannerDemo.eventsForWeekday(tDay);
    const key = toDateKey(date);
    if (!inRange(key, calendar.range)) return [];
    if (getHolidayForDate(calendar, key)) return [];
    const evs = (resolveVersionForDate(versions, key)?.events ?? []).filter((e) => e.day === tDay);
    if (classId) return evs.filter((e) => e.classId === classId);
    return classFilter ? evs.filter((e) => classFilter.has(e.classId)) : evs;
  };

  // Sinf-detali: shu sinfda AZO boʻlgan (asosiy boʻlmasa ham) barcha darslar.
  const visLessons = useMemo(
    () => (classId ? lessons.filter((l) => lessonClassIds(l).includes(classId)) : lessons),
    [lessons, classId],
  );

  const today = new Date();
  const allWeekDates = useMemo(() => getWeekDates(anchor), [anchor]);
  const monthGrid = useMemo(() => getMonthGrid(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  // ── Joylangan sessiyalar (yagona manba: lessonSessions) ──
  const placedByDate = useMemo(() => {
    const map = new Map<string, Placement[]>();
    for (const l of visLessons) {
      for (const s of lessonSessions(l)) {
        if (classId && s.classId !== classId) continue; // sinf-detali filtri
        if (!classId && classFilter && !classFilter.has(s.classId)) continue; // sinflar filtri
        const arr = map.get(s.date) ?? [];
        arr.push({ lesson: l, classId: s.classId, startMin: s.startMin, endMin: s.endMin });
        map.set(s.date, arr);
      }
    }
    if (plannerDemo) {
      const visibleDates = [...allWeekDates, ...monthGrid.filter((d): d is Date => d !== null)];
      for (const d of visibleDates) {
        const dateKey = toDateKey(d);
        const placements = plannerDemo.placementsForDate(dateKey, dateToTimetableDay(d));
        if (placements.length === 0) continue;
        map.set(dateKey, [...(map.get(dateKey) ?? []), ...placements]);
      }
    }
    return map;
  }, [visLessons, classId, classFilter, plannerDemo, allWeekDates, monthGrid]);

  const hasLessonsOn = (d: Date) => (placedByDate.get(toDateKey(d))?.length ?? 0) > 0;
  const isOffDay = (d: Date) => dateToTimetableDay(d) === 7 || blockedSet.has(toDateKey(d));
  // Darsli dam/blok kunlari YASHIRILMAYDI — aks holda darslar "yoʻqoladi".
  const weekDates = useMemo(
    () => (showOffDays ? allWeekDates : allWeekDates.filter((d) => !isOffDay(d) || hasLessonsOn(d))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allWeekDates, showOffDays, blockedSet, placedByDate]
  );

  // Oy/koʻrinish almashsa tanlangan kun yopiladi — boshqa oyning kuni panelda
  // osilib qolmasin.
  useEffect(() => {
    setSelectedDayKey(null);
  }, [view, anchor]);

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

  // Hafta sarlavhasi — oraligʻ (ikki oyga boʻlinsa ikkovi ham).
  const weekTitle = useMemo(() => {
    if (view !== "week" || allWeekDates.length === 0) return null;
    const a = allWeekDates[0], b = allWeekDates[allWeekDates.length - 1];
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${fmt.monthName(a.getMonth())}`;
    return `${a.getDate()} ${fmt.monthName(a.getMonth())} – ${b.getDate()} ${fmt.monthName(b.getMonth())}`;
  }, [view, allWeekDates, fmt]);

  // ── Bayram ──
  function openBlockModal(date: Date) {
    setBlockLabel(blockedMap.get(toDateKey(date)) ?? "");
    setBlockModal({ date });
  }
  function saveBlock() {
    if (!blockModal) return;
    const key = toDateKey(blockModal.date);
    const label = blockLabel.trim();
    const lessonsOnDay = placedByDate.get(key)?.length ?? 0;
    setBlocked((prev) => {
      const without = prev.filter((b) => b.date !== key);
      if (!label) return without;
      return [...without, { date: key, label }];
    });
    setBlockModal(null);
    setBlockLabel("");
    if (label) {
      toast.success(t("dayBlockedToast"), {
        description: lessonsOnDay > 0 ? t("dayBlockedWithLessonsHint", { count: lessonsOnDay }) : undefined,
      });
    } else {
      toast.success(t("blockRemovedToast"));
    }
  }
  function removeBlock() {
    if (!blockModal) return;
    const k = toDateKey(blockModal.date);
    setBlocked((p) => p.filter((b) => b.date !== k));
    setBlockModal(null);
    toast.success(t("blockRemovedToast"));
  }

  // ── Yaratish — toʻgʻridan-toʻgʻri dars muharrirga oʻtadi (modalsiz) ──
  function createLessonInSlot(date: Date, ev: TimetableEvent) {
    const id = addLesson({
      classId: ev.classId,
      unitId: null,
      title: "",
      status: "Draft",
    });
    addScheduleForClass(id, ev.classId, toDateKey(date), ev.startMin, ev.endMin);
    router.push(`/lessons/${id}`);
  }

  // ── Ulash (bitta mavzu; slot vaqti) ──
  function openLinkModal(date: Date, ev: TimetableEvent) {
    setLinkModal({ date, classId: ev.classId, startMin: ev.startMin, endMin: ev.endMin });
    setLmLessonId("");
    setLmSearch("");
    setLmUnitFilter("all");
  }
  function saveLink() {
    if (!linkModal || !lmLessonId) return;
    const linked = lessons.find((l) => l.id === lmLessonId);
    addScheduleForClass(lmLessonId, linkModal.classId, toDateKey(linkModal.date), linkModal.startMin, linkModal.endMin);
    setLinkModal(null);
    toast.success(t("lessonLinkedToast"), { description: linked?.title });
  }
  const linkUnits = useMemo(
    () => (linkModal ? units.filter((u) => u.classId === linkModal.classId) : []),
    [units, linkModal]
  );
  // Nomzodlar: shu sinf aʼzosi, oʻtilmagan, VA shu sinfda hali joylanmagan.
  const linkCandidates = useMemo(() => {
    const gid = linkModal?.classId;
    if (!gid) return [];
    const q = lmSearch.trim().toLowerCase();
    return lessons.filter((l) =>
      lessonClassIds(l).includes(gid) &&
      l.status !== "Completed" &&
      lessonSessions(l).every((s) => s.classId !== gid) &&
      (lmUnitFilter === "all" || unitIdForClass(l, gid) === lmUnitFilter) &&
      (!q || l.title.toLowerCase().includes(q))
    );
  }, [lessons, linkModal, lmSearch, lmUnitFilter]);

  // ── Joylangan mavzu — tahrir / koʻchirish / oʻchirish ──
  const editLesson = useMemo(
    () => (editTarget ? lessons.find((l) => l.id === editTarget.lessonId) ?? null : null),
    [editTarget, lessons]
  );
  function openEdit(p: Placement, dateKey: string) {
    setEditTarget({ lessonId: p.lesson.id, classId: p.classId, date: dateKey, startMin: p.startMin, endMin: p.endMin });
    setEmTitle(p.lesson.title);
    setEmDateStr(dateKey);
    setEmStartStr(minToHHMM(p.startMin));
    setEmEndStr(minToHHMM(p.endMin));
  }
  function saveEdit() {
    if (!editLesson || !editTarget) return;
    const newStart = HHMMToMin(emStartStr);
    const newEnd = HHMMToMin(emEndStr);
    if (newEnd <= newStart) {
      toast.error(t("endBeforeStartError"));
      return;
    }
    updateLesson(editLesson.id, { title: emTitle.trim() || editLesson.title });
    if (emDateStr !== editTarget.date || newStart !== editTarget.startMin || newEnd !== editTarget.endMin) {
      moveSession(editLesson.id, editTarget.classId, editTarget.date, editTarget.startMin, emDateStr, newStart, newEnd);
    }
    setEditTarget(null);
    toast.success(t("savedToast"));
  }
  function handleDelete() {
    if (!editLesson) return;
    const snap: Lesson = { ...editLesson }; // toʻliq snapshot (content/standards/scheduleByClass ham)
    deleteLessonAction(snap.id);
    setEditTarget(null);
    toast(t("lessonDeletedToast"), {
      description: snap.title,
      action: {
        label: t("undo"),
        onClick: () => { restoreLesson(snap); toast.success(t("lessonRestoredToast")); },
      },
    });
  }

  /** Shu sinfning (dateKey, startMin) dan keyingi/oldingi BOʻSH sloti.
      Ikki hafta ichida qidiriladi; band slotlar oʻtkazib yuboriladi. */
  function findAdjacentSlot(p: Placement, dateKey: string, dir: 1 | -1): { date: string; ev: TimetableEvent } | null {
    const base = new Date(`${dateKey}T00:00:00`);
    for (let i = 0; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + dir * i);
      const key = toDateKey(d);
      const evs = eventsForDate(d)
        .filter((e) => e.classId === p.classId)
        .sort((a, b) => dir * (a.startMin - b.startMin));
      for (const ev of evs) {
        // Shu kunda joriy slotdan oldingilarni (yoʻnalishga qarab) tashlab ket
        if (i === 0 && (dir === 1 ? ev.startMin <= p.startMin : ev.startMin >= p.startMin)) continue;
        const occupied = (placedByDate.get(key) ?? []).some(
          (q) => q.lesson.id !== p.lesson.id && placementInEvent(q, ev),
        );
        if (occupied) continue;
        return { date: key, ev };
      }
    }
    return null;
  }
  function shiftPlacement(p: Placement, dateKey: string, dir: 1 | -1) {
    const target = findAdjacentSlot(p, dateKey, dir);
    if (!target) {
      toast.error(t("noFreeSlotToast"));
      return;
    }
    moveSession(p.lesson.id, p.classId, dateKey, p.startMin, target.date, target.ev.startMin, target.ev.endMin);
    toast.success(t("lessonMovedToast"), { description: p.lesson.title });
  }
  function unlinkPlacement(p: Placement, dateKey: string) {
    unscheduleSession(p.lesson.id, p.classId, dateKey, p.startMin);
    toast.success(t("returnedToBankToast"), { description: p.lesson.title });
  }

  // ── Drag: darsni boshqa kunga (aynan shu vaqtda) koʻchirish ──
  function startDrag(e: React.DragEvent, p: Placement, dateKey: string) {
    const payload: DragPayload = { lessonId: p.lesson.id, classId: p.classId, date: dateKey, startMin: p.startMin, endMin: p.endMin };
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }
  function dropOnDay(e: React.DragEvent, targetDate: Date) {
    e.preventDefault();
    setDragOverKey(null);
    let payload: DragPayload;
    try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    if (!payload?.lessonId) return;
    const targetKey = toDateKey(targetDate);
    if (targetKey === payload.date) return; // oʻsha kunga tashlash — oʻzgarishsiz
    moveSession(payload.lessonId, payload.classId, payload.date, payload.startMin, targetKey, payload.startMin, payload.endMin);
    const moved = lessons.find((l) => l.id === payload.lessonId);
    toast.success(t("lessonMovedToast"), {
      description: `${moved?.title ?? t("lessonFallback")} · ${targetDate.getDate()} ${fmt.monthName(targetDate.getMonth())}`,
    });
  }

  /* ── @dnd-kit: klaviatura bilan ham koʻchirish (kunlik panel + oy toʻri) ──
     Haftalik koʻrinish hozircha native HTML5 drag'da qoladi — u ishlayapti va
     bitta ishda ikkalasini almashtirish keraksiz regressiya xavfi. */
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function handleDndEnd(e: DragEndEvent) {
    const a = String(e.active.id).split("|");
    if (a[0] !== "L" || !e.over) return;
    const [, lessonId, classId, fromDate, fromStartS, fromEndS] = a;
    const fromStart = Number(fromStartS);
    const fromEnd = Number(fromEndS);
    const o = String(e.over.id).split("|");

    if (o[0] === "D") {
      // Kunga tashlash — vaqt oʻzgarmaydi, faqat sana.
      const toDate = o[1];
      if (toDate === fromDate) return;
      moveSession(lessonId, classId, fromDate, fromStart, toDate, fromStart, fromEnd);
    } else if (o[0] === "S") {
      // Aniq slotga tashlash — sana ham, vaqt ham slotdan olinadi.
      const [, toDate, slotClassId, toStartS, toEndS] = o;
      // Boshqa sinfning slotiga koʻchirish maʼnosiz (dars shu sinfga bogʻlangan).
      if (slotClassId !== classId) return;
      const toStart = Number(toStartS);
      const toEnd = Number(toEndS);
      if (toDate === fromDate && toStart === fromStart) return;
      moveSession(lessonId, classId, fromDate, fromStart, toDate, toStart, toEnd);
    } else {
      return;
    }

    const moved = lessons.find((l) => l.id === lessonId);
    toast.success(t("lessonMovedToast"), { description: moved?.title ?? t("lessonFallback") });
  }

  const slotClass = (m: SlotModal | null) => (m ? classInfoById(m.classId) : undefined);
  const slotTints = (m: SlotModal | null) => { const c = slotClass(m); return c ? classTints(liveClassColor(c)) : null; };

  // Oy-koʻrinish chiplari — umumiy CalendarEventPill (chipFill retsepti u yerda).
  function EventPill({ ev, onOpen }: { ev: TimetableEvent; onOpen?: () => void }) {
    const cls = classInfoById(ev.classId);
    if (!cls) return null;
    return <CalendarEventPill color={liveClassColor(cls)} label={cls.name} onClick={onOpen} />;
  }

  // Joylangan mavzu pili (oy koʻrinishi) — MAVZU nomini koʻrsatadi (sinf emas).
  function PlacedPill({ p, dateKey }: { p: Placement; dateKey: string }) {
    const { color, tints } = lessonDisplay(p.lesson, p.classId);
    return (
      <CalendarEventPill
        color={color}
        variant="fill"
        label={p.lesson.title}
        onClick={() => openEdit(p, dateKey)}
        trailing={
          <span className="flex size-4 shrink-0 items-center justify-center rounded bg-[var(--card)]/60">
            {p.lesson.status === "Completed"
              ? <Check style={tints.textStrong} className="size-2.5" strokeWidth={3} />
              : <FileText style={tints.textStrong} className="size-2.5" />}
          </span>
        }
      />
    );
  }

  /* ── Kunlik panel (oy koʻrinishi, chapda 25%) ──────────────────────────
     Faqat katak bosilganda ochiladi. Oy toʻrida katak juda tor — bu yerda
     shu kunning TOʻLIQ jadvali vaqti bilan koʻrinadi. */
  const selectedDate = selectedDayKey
    ? monthGrid.find((d): d is Date => d !== null && toDateKey(d) === selectedDayKey) ?? null
    : null;

  // Panel toʻliq 00:00–24:00 qamraydi, lekin ochilganda shu kunning BIRINCHI
  // eventiga scroll qilinadi (hech narsa boʻlmasa — 08:00 ga, haftalik
  // koʻrinishdagi defolt bilan bir xil).
  const dayScrollerRef = useRef<HTMLDivElement>(null);
  const dayFirstEventMin = useMemo(() => {
    if (!selectedDate) return null;
    const key = toDateKey(selectedDate);
    const placed = placedByDate.get(key) ?? [];
    const isBlocked = blockedSet.has(key);
    const evs = isBlocked ? [] : eventsForDate(selectedDate);
    const starts = [...placed.map((p) => p.startMin), ...evs.map((e) => e.startMin)];
    return starts.length > 0 ? Math.min(...starts) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, placedByDate, blockedSet]);

  useEffect(() => {
    if (!dayScrollerRef.current || !selectedDate) return;
    // Birinchi event darhol yuqori chetga tirilib qolmasin — 15 daqiqalik
    // "nafas joyi" qoldirib scroll qilinadi.
    const targetMin = (dayFirstEventMin ?? 8 * 60) - 15;
    dayScrollerRef.current.scrollTop = Math.max(targetMin / 60 - DAY_START_HOUR, 0) * DAY_PX_PER_HOUR;
  }, [selectedDate, dayFirstEventMin]);

  /* KOMPONENT EMAS, oddiy render-funksiya: render tanasi ichida eʼlon qilingan
     komponent har renderda yangi identifikatsiyaga ega boʻlib, React uni qayta
     MOUNT qiladi — bu yerda bu scroll holatini nolga qaytarardi va @dnd-kit
     tugunlarini uzluksiz qayta roʻyxatdan oʻtkazardi. Funksiya chaqiruvi esa
     elementlarni ota daraxtga inline qoʻyadi. */
  function renderDayPanel(date: Date) {
    const key = toDateKey(date);
    const isBlocked = blockedSet.has(key);
    const blockLbl = blockedMap.get(key);
    const holiday = getHolidayForDate(calendar, key);
    const placed = placedByDate.get(key) ?? [];
    const dayEvents = isBlocked ? [] : eventsForDate(date);
    /* Haftalik koʻrinish bilan BIR XIL tuzilma: tashqi karta = jadval SLOTI
       (sinf rangi/nomi/vaqti), mavzu esa uning ICHIDA alohida chip. Slotga
       tushmagan (yoki blok/taʼtil kunidagi) mavzular alohida "orphan" karta —
       koʻchirilishi kerakligi koʻrinib tursin. */
    const orphans = placed.filter(
      (p) => isBlocked || holiday || !dayEvents.some((ev) => placementInEvent(p, ev)),
    );
    type DayItem = { t: "slot"; ev: TimetableEvent; s: number } | { t: "orphan"; p: Placement; s: number };
    const items: DayItem[] = [
      ...dayEvents.map((ev): DayItem => ({ t: "slot", ev, s: ev.startMin })),
      ...orphans.map((p): DayItem => ({ t: "orphan", p, s: p.startMin })),
    ].sort((a, b) => a.s - b.s);

    return (
      <Card className={cn("h-full", panelCardClass)}>
        <CardHeader className={cn(panelCardHeaderClass, "gap-2.5 pt-4! pb-4!")}>
          <SectionIcon>
            <CalendarIcon />
          </SectionIcon>
          <div className="flex min-w-0 flex-col">
            <CardTitle className="truncate">
              {date.getDate()}-{fmt.monthName(date.getMonth()).toLowerCase()}
            </CardTitle>
            <TypographyMuted className="truncate text-xs">
              {fmt.dayName(dateToTimetableDay(date))}
            </TypographyMuted>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={t("dayPanelCloseAria")}
              title={t("dayPanelCloseAria")}
              onClick={() => setSelectedDayKey(null)}>
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        {/* @container — panel tor (25%), shuning uchun ichki oʻlchamlar EKRAN
            emas, PANEL kengligiga qarab moslashadi (loyihada mavjud naqsh). */}
        <CardContent className={cn(panelCardContentClass, "@container flex flex-col p-0")}>
          {(isBlocked || holiday) && (
            <div className={cn(
              "flex shrink-0 items-center gap-2 border-b border-border px-4 py-2 text-xs font-semibold",
              isBlocked ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
            )}>
              {isBlocked ? <CalendarOff className="size-3.5 shrink-0" /> : <CalendarIcon className="size-3.5 shrink-0" />}
              <span className="truncate">{isBlocked ? (blockLbl || t("blockedDay")) : holiday!.name}</span>
            </div>
          )}

          {items.length === 0 ? (
            <TypographyMuted className="px-4 py-8 text-center text-sm">{t("dayPanelEmpty")}</TypographyMuted>
          ) : (
            <TimeGrid
              className="min-h-0 flex-1"
              scrollRef={dayScrollerRef}
              columns={[{ key, header: null, isToday: isSameDay(date, today) }]}
              startHour={DAY_START_HOUR}
              endHour={DAY_END_HOUR}
              pxPerHour={DAY_PX_PER_HOUR}
              gutterWidth={46}
              gutterVariant="centered"
              lines="quarter"
              nowMin={isSameDay(date, today) ? nowMin : null}
              renderColumn={() => (
                <>
                  {items.map((it, k) => {
                    const top = (it.s / 60 - DAY_START_HOUR) * DAY_PX_PER_HOUR;

                    /* ── Jadval sloti: tashqi karta (sinf), mavzu ichida chip ── */
                    if (it.t === "slot") {
                      const ev = it.ev;
                      const cls = classInfoById(ev.classId);
                      if (!cls) return null;
                      const clsColor = liveClassColor(cls);
                      const tints = classTints(clsColor);
                      const slotLessons = placed.filter((p) => placementInEvent(p, ev));
                      const hasLesson = slotLessons.length > 0;
                      const h = Math.max(((ev.endMin - ev.startMin) / 60) * DAY_PX_PER_HOUR - 4, 30);
                      return (
                        <SlotDropZone key={`ds-${ev.id}-${k}`} id={dndSlotId(key, ev)}
                          style={{ top: top + 2, height: h }}>
                          {(isOver) => (
                            <EventCard
                              color={clsColor}
                              state={hasLesson ? "filled" : "empty"}
                              title={cls.name}
                              density="auto"
                              style={{ height: h }}
                              className={cn("h-full", isOver && "inset-ring-2 inset-ring-[var(--ring)]")}
                              subtitle={
                                <>
                                  <Clock className="size-3 shrink-0" />
                                  {minToHHMM(ev.startMin)}–{minToHHMM(ev.endMin)}
                                </>
                              }
                              footer={!hasLesson ? (
                                /* @[200px] — panel juda torayganda tugmalar ustma-ust
                                   tushadi, aks holda yonma-yon. */
                                <div className="flex flex-col gap-1 @[200px]:flex-row">
                                  <button type="button" onClick={() => createLessonInSlot(date, ev)}
                                    className="flex h-6 flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm bg-foreground/6 px-1.5 text-xs font-semibold text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
                                    <PlusIcon className="size-3 shrink-0" strokeWidth={2.5} />
                                    <span className="truncate">{t("create")}</span>
                                  </button>
                                  <button type="button" onClick={() => openLinkModal(date, ev)}
                                    className="flex h-6 flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm bg-foreground/6 px-1.5 text-xs font-semibold text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
                                    <LinkIcon className="size-3 shrink-0" />
                                    <span className="truncate">{t("link")}</span>
                                  </button>
                                </div>
                              ) : undefined}
                            >
                              {hasLesson && (
                                /* relative — nuqta teksturasi mavzu chipi ustidan tushmasin */
                                <div className="relative mt-1.5 flex flex-col gap-1.5">
                                  {slotLessons.map((p) => (
                                    <DraggablePlacement
                                      key={`${p.lesson.id}-${p.classId}-${p.startMin}`}
                                      id={dndLessonId(p, key)}
                                      onClick={() => openEdit(p, key)}
                                      className="group/chip relative cursor-grab active:cursor-grabbing"
                                    >
                                      <div className="flex w-full items-center gap-2 overflow-hidden rounded-sm border border-border bg-card p-1.5 pr-2.5 text-left shadow-xs transition-[box-shadow,border-color,padding] duration-fast hover:border-foreground/20 hover:shadow-md group-hover/chip:pr-8">
                                        <span style={tints.iconBg} className="flex size-6 shrink-0 items-center justify-center rounded-full">
                                          {p.lesson.status === "Completed"
                                            ? <Check style={tints.iconText} className="size-3.5" strokeWidth={3} />
                                            : <FileText style={tints.iconText} className="size-3.5" />}
                                        </span>
                                        <span className="truncate text-xs font-semibold text-foreground">{p.lesson.title}</span>
                                      </div>
                                      {/* Tez amallar — hoverda; qolgani ⋮ menyusida */}
                                      <div className="pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover/chip:pointer-events-auto group-hover/chip:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button type="button" aria-label={t("lessonActionsAria")}
                                              onClick={(e) => e.stopPropagation()}
                                              className="flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
                                              <MoreVertical className="size-3.5" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => router.push(`/lessons/${p.lesson.id}`)}>
                                              <Pencil />
                                              {t("editAction")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => shiftPlacement(p, key, -1)}>
                                              <ChevronLeft />
                                              {t("shiftBackwardAria")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => shiftPlacement(p, key, 1)}>
                                              <ChevronRight />
                                              {t("shiftForwardAria")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => unlinkPlacement(p, key)}>
                                              <Undo2 />
                                              {t("returnToBank")}
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </DraggablePlacement>
                                  ))}
                                </div>
                              )}
                            </EventCard>
                          )}
                        </SlotDropZone>
                      );
                    }

                    /* ── Slotsiz (orphan) mavzu — koʻchirilishi kerak ── */
                    const { name, color, tints } = lessonDisplay(it.p.lesson, it.p.classId);
                    const done = it.p.lesson.status === "Completed";
                    const h = Math.max(((it.p.endMin - it.p.startMin) / 60) * DAY_PX_PER_HOUR - 4, 30);
                    return (
                      <DraggablePlacement
                        key={`dl-${it.p.lesson.id}-${it.p.classId}-${it.p.startMin}`}
                        id={dndLessonId(it.p, key)}
                        onClick={() => openEdit(it.p, key)}
                        style={{ top: top + 2, height: h }}
                        className="absolute inset-x-1 z-[11] cursor-grab active:cursor-grabbing"
                      >
                        <EventCard
                          color={color}
                          title={it.p.lesson.title}
                          density="auto"
                          style={{ height: h }}
                          className="h-full transition hover:brightness-[0.97]"
                          leading={done
                            ? <Check className="size-3.5 shrink-0" strokeWidth={3} style={tints.textOnSolid} />
                            : <FileText className="size-3.5 shrink-0" style={tints.textOnSolid} />}
                          subtitle={
                            <span style={tints.textOnSolidMuted} className="flex min-w-0 items-center gap-1 truncate">
                              <Clock className="size-3 shrink-0" />
                              {minToHHMM(it.p.startMin)}–{minToHHMM(it.p.endMin)}
                              <span className="truncate">· {name}</span>
                            </span>
                          }
                        />
                      </DraggablePlacement>
                    );
                  })}
                </>
              )}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Kunlik panel FAQAT oy koʻrinishida va kun tanlanganda chiqadi.
  const dayPanelOpen = view === "month" && selectedDate !== null;

  /* MotionProvider'dagi `reducedMotion="user"` FAQAT transform/layout
     animatsiyalarini oʻchiradi — `width` kabi oddiy CSS xossalari baribir
     animatsiyalanadi. Shu sabab panel kengligini qoʻlda oʻchiramiz. */
  const prefersReducedMotion = useReducedMotion();
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: PANEL_DURATION_BASE, ease: PANEL_EASE_STANDARD };

  return (
    <>
    {/* Bitta DndContext — kunlik panel va oy toʻri bir DnD maydonida: darsni
        paneldan boshqa kunga (yoki shu kunning boshqa slotiga) klaviatura
        bilan ham koʻchirish mumkin. */}
    <DndContext
      sensors={dndSensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDndEnd}
      accessibility={{
        screenReaderInstructions: { draggable: t("dndInstructions") },
        announcements: {
          onDragStart: () => t("dndStart"),
          onDragOver: () => undefined,
          onDragEnd: ({ over }) => (over ? t("dndDropped") : t("dndCancelled")),
          onDragCancel: () => t("dndCancelled"),
        },
      }}
    >
    <div className="flex h-full min-h-0">
      {/* Grid track-soni oʻzgarishi (1↔2 ustun) CSS'da interpolyatsiyalanmaydi —
          shu sabab flexbox: panel kengligi 0%→25% animatsiyalanadi, sherik
          ustun `flex-1 min-w-0` boʻlgani uchun HECH QANDAY qoʻshimcha
          animatsiyasiz tabiiy silliq torayadi/kengayadi (VSCode/Linear/Notion
          yon-panel naqshi).

          Ustunlar orasidagi masofa konteynerning `gap`i EMAS, panelning oʻz
          oʻng padding'i — va u kenglik bilan BIRGA animatsiyalanadi. Statik
          `pr-6` ishlamaydi: `box-sizing: border-box` padding'ni qisqartirmaydi,
          shu sabab `width` 24px dan pastga tushganda element 24px boʻlib qotib
          qolardi va unmount paytida shuncha sakrardi. */}
      <AnimatePresence>
        {dayPanelOpen && (
          <motion.div
            key="day-panel"
            initial={{ width: "0%", paddingRight: 0, opacity: 0 }}
            animate={{ width: "25%", paddingRight: 24, opacity: 1 }}
            exit={{ width: "0%", paddingRight: 0, opacity: 0 }}
            transition={panelTransition}
            className="hidden h-full shrink-0 overflow-hidden lg:block"
          >
            {/* Ichki qatlam gorizontal sirpanadi: kenglik animatsiyasi kontentni
                har kadrda qayta oqizadi ("ezilish" effekti), transform esa GPU'da
                ketadi va koʻz buni "chapdan kirib kelish" deb oʻqiydi. */}
            <motion.div
              initial={{ x: -16 }}
              animate={{ x: 0 }}
              exit={{ x: -16 }}
              transition={panelTransition}
              className="h-full w-full"
            >
              {renderDayPanel(selectedDate)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Card className={cn("flex-1", panelCardClass)}>

        {/* ── Toolbar ── */}
        <CardHeader className={cn(panelCardHeaderClass, "grid grid-rows-[auto] items-center gap-0 space-y-0 pt-4! pb-4!")} style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          <div className="flex min-w-0 items-center gap-3">
            <SectionIcon>
              <CalendarIcon />
            </SectionIcon>
            <CardTitle className="flex items-baseline gap-1.5 truncate text-xl">
              {view === "week" && weekTitle ? (
                <span className="truncate">{weekTitle}</span>
              ) : (
                <>
                  {fmt.monthName(anchor.getMonth())}
                  <span className="font-normal text-muted-foreground">{anchor.getFullYear()}</span>
                </>
              )}
              {classId && classInfoById(classId) && (
                <span className="font-normal text-muted-foreground">
                  · {classInfoById(classId)!.name}
                </span>
              )}
            </CardTitle>
          </div>

          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "week" | "month")}
            variant="outline"
            size="default"
            className="self-center"
            data-tour="planner-view-toggle"
          >
            <ToggleGroupItem value="week" className="px-5 text-sm font-medium">{t("week")}</ToggleGroupItem>
            <ToggleGroupItem value="month" className="px-5 text-sm font-medium">{t("month")}</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center justify-end gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={blockedList.length + holidayList.length > 0 ? "secondary" : "ghost"}
                  size="icon-sm"
                  title={t("blockedHolidaysAria")}
                  aria-label={t("blockedHolidaysAria")}
                >
                  <CalendarOff className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {t("blockedHolidaysTitle")}
                </div>
                <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto p-1.5">
                  {blockedList.length === 0 && holidayList.length === 0 ? (
                    <TypographyMuted className="px-2 py-4 text-center text-xs">
                      {t("blockedHolidaysEmpty")}
                    </TypographyMuted>
                  ) : (
                    <>
                      {holidayList.map((h) => (
                        <div key={h.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{h.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{shortDate(h.range.start)}</span>
                        </div>
                      ))}
                      {blockedList.map((b) => (
                        <div key={b.date} className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                          <Ban className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{b.label || t("blockedDay")}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{shortDate(b.date)}</span>
                          <button
                            type="button"
                            onClick={() => setBlocked((p) => p.filter((x) => x.date !== b.date))}
                            className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label={t("removeBlock")}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {!classId && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={classFilter ? "secondary" : "ghost"}
                    size="icon-sm"
                    title={t("classFilterAria")}
                    aria-label={t("classFilterAria")}
                    className="relative"
                  >
                    <ListFilter className="size-4" />
                    {classFilter && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground">
                        {classFilter.size}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-0">
                  <Command>
                    <CommandInput placeholder={t("classFilterSearchPlaceholder")} />
                    <CommandList className="max-h-80">
                      <CommandEmpty>{t("classFilterNotFound")}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value={t("allClasses")} onSelect={toggleAllClassFilter}>
                          <span className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                            classFilter === null ? "border-primary bg-primary text-primary-foreground" : "border-input",
                          )}>
                            {classFilter === null && <Check className="size-3" strokeWidth={3} />}
                          </span>
                          <span className="font-medium">{t("allClasses")}</span>
                        </CommandItem>
                      </CommandGroup>
                      {classFilterGroups.map(([grade, infos]) => (
                        <CommandGroup key={grade ?? "other"} heading={grade !== null ? t("gradeGroup", { grade }) : t("otherClassesGroup")}>
                          {infos.map((info) => {
                            const checked = !classFilter || classFilter.has(info.id);
                            const tints = classTints(liveClassColor(info));
                            return (
                              <CommandItem key={info.id} value={info.name} onSelect={() => soloClassFilter(info.id)}>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleClassFilter(info.id); }}
                                  aria-label={info.name}
                                  style={checked ? tints.dot : undefined}
                                  className={cn(
                                    "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                                    !checked && "border-input",
                                  )}
                                >
                                  {checked && <Check className="size-3 text-white" strokeWidth={3} />}
                                </button>
                                <span className="size-2 shrink-0 rounded-full" style={tints.dot} />
                                <span className="truncate">{info.name}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {view === "week" && (
              <Button
                variant={showOffDays ? "ghost" : "secondary"}
                size="icon-sm"
                onClick={() => setShowOffDays((v) => !v)}
                title={showOffDays ? t("hideOffDays") : t("showOffDays")}
                aria-label={t("offDaysAria")}
              >
                {showOffDays ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={prevPeriod} aria-label={t("previousAria")}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())} className="font-semibold">
              {t("today")}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={nextPeriod} aria-label={t("nextAria")}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative flex-1 min-h-0 flex flex-col p-0">
          {view === "week" && hasAnyTimetable && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-30">
              <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border bg-background/90 p-0.5 shadow-md backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full hover:bg-primary hover:text-primary-foreground"
                  onClick={() => zoomBy(-ZOOM_STEP)}
                  disabled={zoom <= ZOOM_MIN}
                  aria-label={t("zoomOutAria")}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-10 text-center text-xs font-semibold tabular-nums text-muted-foreground">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full hover:bg-primary hover:text-primary-foreground"
                  onClick={() => zoomBy(ZOOM_STEP)}
                  disabled={zoom >= ZOOM_MAX}
                  aria-label={t("zoomInAria")}
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

            {/* ── Boʻsh holat (jadval hali tuzilmagan) ── */}
            {hydrated && !hasAnyTimetable ? (
              <Empty className="h-auto flex-1">
                <EmptyHeader>
                  <EmptyMedia><Illustration name="22" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>{t("noScheduleTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {t("noScheduleDescription")}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => router.push("/dashboard/timetable")} className="gap-1.5">
                    <CalendarPlus className="size-4" />
                    {t("buildSchedule")}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
            {/* ── Hafta ── */}
            {view === "week" && (
              <TimeGrid
                scrollRef={scrollerRef}
                data-tour="planner-grid"
                className={cn("h-auto flex-1", isDemoMode && "pointer-events-none")}
                startHour={START_HOUR}
                endHour={END_HOUR}
                pxPerHour={slotHeight}
                nowMin={nowMin}
                lines="half"
                gutterHeader={
                  <div className="flex h-full items-center justify-center">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                }
                columns={weekDates.map((d, i): TimeGridColumn => {
                  const isToday = isSameDay(d, today);
                  const key = toDateKey(d);
                  const isBlocked = blockedSet.has(key);
                  const holiday = getHolidayForDate(calendar, key);
                  // Versiya chegarasi: kecha va bugun har xil versiyaga tushsa
                  const prevDate = new Date(d); prevDate.setDate(d.getDate() - 1);
                  const vNow = resolveVersionForDate(versions, key);
                  const versionChanged =
                    versions.length > 1 && vNow != null && vNow.id !== resolveVersionForDate(versions, toDateKey(prevDate))?.id;
                  const short = fmt.dayShort(dateToTimetableDay(d));
                  return {
                    key,
                    isToday,
                    headerProps: {
                      "data-tour": i === 0 ? "planner-day-cell" : undefined,
                      className: cn(
                        "group/day relative px-2 py-3 text-center",
                        isBlocked && "bg-destructive/10",
                      ),
                    },
                    columnProps: {
                      onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverKey !== key) setDragOverKey(key); },
                      onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey((k) => (k === key ? null : k)); },
                      onDrop: (e) => dropOnDay(e, d),
                      className: cn(
                        // "Bugun" — juda yengil neytral tint; asosiy signal baribir
                        // sarlavhada (toʻldirilgan doira + toʻq yorliq) va "hozir" chizigʻida.
                        isToday && "bg-muted/20",
                        isBlocked && "bg-destructive/5",
                        !isBlocked && holiday && "bg-muted/40",
                        dragOverKey === key && "outline outline-2 -outline-offset-2 outline-[var(--ring)] bg-primary/5"
                      ),
                    },
                    header: (
                      <>
                        {/* Uch teng ustunga boʻlingan — hafta nomi / sana / sozlama tugmasi
                            har biri OʻZ boʻlagida markazlashadi (umumiy hujayraga nisbatan emas). */}
                        <div className="grid grid-cols-3 items-center">
                          {/* Bugun — yorliq toʻq va qalinroq (.text-label layersiz eʼlon
                              qilingani uchun rang inline style bilan bekor qilinadi). */}
                          <span
                            className={cn("justify-self-center whitespace-nowrap text-label", isToday && "font-bold")}
                            style={isToday ? { color: "var(--foreground)" } : undefined}
                          >
                            {short}
                          </span>
                          <span className="justify-self-center">
                            {isToday ? (
                              <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{d.getDate()}</span>
                            ) : (
                              <span className="text-sm font-bold text-foreground">{d.getDate()}</span>
                            )}
                          </span>
                          <span className="justify-self-center">
                            {/* Hover sozlama menyusi — tur shu tugmani nishonga olsa majburan koʻrinadi */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  data-tour="planner-day-settings"
                                  aria-label={t("daySettingsAria")}
                                  className={cn(
                                    "flex size-7 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-opacity transition hover:bg-primary hover:text-primary-foreground focus-visible:opacity-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)] group-hover/day:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground",
                                    forceShowDaySettings && "opacity-100 bg-foreground/10 text-foreground"
                                  )}
                                >
                                  <SlidersHorizontal className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => router.push("/dashboard/timetable")}>
                                  <Pencil />
                                  {t("editSchedule")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openBlockModal(d)} variant={isBlocked ? "default" : "destructive"}>
                                  {isBlocked ? <CalendarOff /> : <Ban />}
                                  {isBlocked ? t("unblockDay") : t("blockDay")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </span>
                        </div>
                        {isBlocked && (
                          <div className="mt-1 flex justify-center">
                            <span className="max-w-full truncate rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                              {blockedMap.get(key)}
                            </span>
                          </div>
                        )}
                        {!isBlocked && holiday && (
                          <div className="mt-1 flex justify-center">
                            <span className="max-w-full truncate rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {holiday.name}
                            </span>
                          </div>
                        )}
                        {versionChanged && (
                          <div className="mt-1 flex justify-center">
                            <span className="max-w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              {t("scheduleUpdated")}
                            </span>
                          </div>
                        )}
                      </>
                    ),
                  };
                })}
                renderColumn={(col) => {
                  const date = weekDates.find((dd) => toDateKey(dd) === col.key)!;
                  const dateKey = col.key;
                  const dayEvents = eventsForDate(date);
                  const isBlocked = blockedSet.has(dateKey);
                  const holiday = getHolidayForDate(calendar, dateKey);
                  const placed = placedByDate.get(dateKey) ?? [];
                  return (
                    <>
                        {isBlocked && (
                          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-3">
                            <span className="-rotate-45 select-none text-xs font-semibold text-destructive/40">
                              {blockedMap.get(dateKey)}
                            </span>
                          </div>
                        )}

                        {!isBlocked && holiday && (
                          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-3">
                            <span className="-rotate-45 select-none text-xs font-semibold text-muted-foreground/50">
                              {holiday.name}
                            </span>
                          </div>
                        )}

                        {/* Dars bloklari (timetable) — blok/taʼtil kunida koʻrsatilmaydi */}
                        {!isBlocked && !holiday && dayEvents.map((ev) => {
                          const cls = classInfoById(ev.classId);
                          if (!cls) return null;
                          const clsColor = liveClassColor(cls);
                          const topH = ev.startMin / 60 - START_HOUR;
                          const durH = (ev.endMin - ev.startMin) / 60;
                          if (topH + durH < 0 || topH > VISIBLE_HOURS) return null;
                          const tints = classTints(clsColor);
                          const blockLessons = placed.filter((p) => placementInEvent(p, ev));
                          // Darsli slot toʻyingan yuzada, boʻshi xira — rejalashtirilmagan joylar bir qarashda koʻrinadi
                          const hasLesson = blockLessons.length > 0;
                          const blockPx = Math.max((durH + Math.min(topH, 0)) * slotHeight - 4, 32);
                          // Baland blokda tugmalar ustma-ust, past blokda yonma-yon sigʻadi
                          const stackActions = blockPx >= 118;
                          return (
                            <EventCard
                              key={ev.id}
                              data-tour={hasLesson ? "planner-lesson-block" : "planner-empty-slot"}
                              color={clsColor}
                              title={cls.name}
                              subtitle={
                                <>
                                  <Clock className="size-3 shrink-0" />
                                  {fmtMin(ev.startMin)} – {fmtMin(ev.endMin)}
                                </>
                              }
                              state={hasLesson ? "filled" : "empty"}
                              density="auto"
                              style={{ top: Math.max(topH, 0) * slotHeight + 2, height: blockPx }}
                              className="absolute inset-x-1 z-10"
                              actions={
                                /* ↗ sinfni ochish — faqat umumiy /planner'da (sinf-detali ichida
                                    allaqachon shu sinfdamiz, shuning uchun yashiriladi). */
                                !classId ? (
                                  <Link
                                    href={`/dashboard/classes/${ev.classId}`}
                                    title={t("openClass")}
                                    className="flex size-6 items-center justify-center rounded-md bg-foreground/8 text-foreground/70 transition hover:bg-foreground/15 hover:text-foreground"
                                  >
                                    <ArrowUpRight className="size-3.5" />
                                  </Link>
                                ) : undefined
                              }
                            >
                              {/* Boʻsh slot: ikki tez-amal tugmasi boʻsh joyni toʻldiradi —
                                  dropdown ochish qadami yoʻq */}
                              {!hasLesson && (
                                <div className={cn(
                                  "relative mt-1.5 flex min-h-0 flex-1 gap-1.5 opacity-0 transition-opacity duration-fast",
                                  "pointer-events-none group-hover/ev:pointer-events-auto group-hover/ev:opacity-100",
                                  "focus-within:pointer-events-auto focus-within:opacity-100",
                                  "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100",
                                  stackActions ? "flex-col" : "flex-row",
                                )}>
                                  <button type="button" onClick={() => createLessonInSlot(date, ev)}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-foreground/6 px-2 text-xs font-semibold text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
                                    <PlusIcon className="size-3.5 shrink-0" strokeWidth={2.5} />
                                    <span className="truncate">{t("create")}</span>
                                  </button>
                                  <button type="button" onClick={() => openLinkModal(date, ev)}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-foreground/6 px-2 text-xs font-semibold text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
                                    <LinkIcon className="size-3.5 shrink-0" />
                                    <span className="truncate">{t("link")}</span>
                                  </button>
                                </div>
                              )}
                              {hasLesson && (
                                /* relative — nuqta teksturasi mavzu kartasi ustidan tushmasin */
                                <div className="relative mt-1.5 flex flex-col gap-1.5">
                                  {blockLessons.map((p) => (
                                    <div key={p.lesson.id} className="group/chip relative">
                                      <button type="button"
                                        draggable
                                        onDragStart={(e) => startDrag(e, p, dateKey)}
                                        onClick={() => openEdit(p, dateKey)}
                                        className="flex w-full items-center gap-2 overflow-hidden rounded-sm border border-border bg-card p-1.5 pr-2.5 text-left shadow-xs transition-[box-shadow,border-color,padding] duration-fast hover:border-foreground/20 hover:shadow-md group-hover/chip:pr-8 cursor-grab active:cursor-grabbing">
                                        <span style={tints.iconBg} className="flex size-6 shrink-0 items-center justify-center rounded-full">
                                          {p.lesson.status === "Completed"
                                            ? <Check style={tints.iconText} className="size-3.5" strokeWidth={3} />
                                            : <FileText style={tints.iconText} className="size-3.5" />}
                                        </span>
                                        <span className="truncate text-xs font-semibold text-foreground">{p.lesson.title}</span>
                                      </button>
                                      {/* Tez amallar — hoverda; qolgani ⋮ menyusida */}
                                      <div className="pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover/chip:pointer-events-auto group-hover/chip:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button type="button" aria-label={t("lessonActionsAria")}
                                              onClick={(e) => e.stopPropagation()}
                                              className="flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
                                              <MoreVertical className="size-3.5" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => router.push(`/lessons/${p.lesson.id}`)}>
                                              <Pencil />
                                              {t("editAction")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => shiftPlacement(p, dateKey, -1)}>
                                              <ChevronLeft />
                                              {t("shiftBackwardAria")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => shiftPlacement(p, dateKey, 1)}>
                                              <ChevronRight />
                                              {t("shiftForwardAria")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => unlinkPlacement(p, dateKey)}>
                                              <Undo2 />
                                              {t("returnToBank")}
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </EventCard>
                          );
                        })}

                        {/* Slotga tushmagan (mustaqil) mavzular — blok/taʼtil kunida BARCHA
                            darslar shu yerda (koʻchirilishi kerakligi koʻrinib tursin) */}
                        {placed.filter((p) => isBlocked || holiday || !dayEvents.some((ev) => placementInEvent(p, ev))).map((p) => {
                          const l = p.lesson;
                          const start = p.startMin;
                          const end = p.endMin;
                          const topH = start / 60 - START_HOUR;
                          const durH = (end - start) / 60;
                          if (topH + durH < 0 || topH > VISIBLE_HOURS) return null;
                          const { name, color, tints } = lessonDisplay(l, p.classId);
                          const done = l.status === "Completed";
                          return (
                            <EventCard key={`${l.id}-${p.classId}-${start}`}
                              as="button"
                              color={color}
                              title={name}
                              subtitle={l.title}
                              leading={done ? <Check className="size-3.5 shrink-0" strokeWidth={3} style={tints.textOnSolid} /> : <FileText className="size-3.5 shrink-0" style={tints.textOnSolid} />}
                              draggable
                              onDragStart={(e) => startDrag(e, p, dateKey)}
                              onClick={() => openEdit(p, dateKey)}
                              style={{ top: Math.max(topH, 0) * slotHeight + 2, height: Math.max((durH + Math.min(topH, 0)) * slotHeight - 4, 30) }}
                              className={cn("absolute inset-x-1 z-[11] transition-all hover:brightness-95 cursor-grab active:cursor-grabbing", done && "opacity-75")}
                              actions={<LessonStatusBadge status={l.status} />}
                            >
                              <span style={tints.textOnSolidMuted} className="mt-0.5 flex items-center gap-1.5 truncate text-[11px]">
                                <Clock className="size-3 shrink-0" />
                                {minToHHMM(start)} – {minToHHMM(end)}
                              </span>
                            </EventCard>
                          );
                        })}
                    </>
                  );
                }}
              />
            )}

            {/* ── Oy ── */}
            {view === "month" && (
              <MonthGrid
                year={anchor.getFullYear()}
                month={anchor.getMonth()}
                className={cn("h-auto flex-1", isDemoMode && "pointer-events-none")}
                getCellProps={(date, key) => {
                  const isCurrentMonth = date.getMonth() === anchor.getMonth();
                  const isBlocked = blockedSet.has(key);
                  const holiday = getHolidayForDate(calendar, key);
                  return {
                    onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverKey !== key) setDragOverKey(key); },
                    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey((k) => (k === key ? null : k)); },
                    onDrop: (e: React.DragEvent<HTMLDivElement>) => dropOnDay(e, date),
                    // Katakni bosish → chapdagi kunlik panel. Katak ichidagi oʻz
                    // tugmalari (sana menyusi, chiplar, "+N ta") oʻz ishini qiladi,
                    // shuning uchun ular ustidagi bosish bu yerda eʼtiborsiz qoldiriladi.
                    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                      if ((e.target as HTMLElement).closest("button, a")) return;
                      setSelectedDayKey((k) => (k === key ? null : key));
                    },
                    className: cn(
                      "cursor-pointer",
                      // "Bugun" — katak foni ATAYLAB neytral; signal sana doirasida (renderCell).
                      !isCurrentMonth && "bg-muted/10",
                      isBlocked && "bg-destructive/10",
                      !isBlocked && holiday && "bg-muted/40",
                      selectedDayKey === key && "bg-muted/30 inset-ring-2 inset-ring-foreground/25",
                      dragOverKey === key && "outline outline-2 -outline-offset-2 outline-[var(--ring)]"
                    ),
                  };
                }}
                renderCell={(date, key) => {
                    const isToday = isSameDay(date, today);
                    const dayEvents = eventsForDate(date);
                    const isBlocked = blockedSet.has(key);
                    const blockLbl = blockedMap.get(key);
                    const holiday = getHolidayForDate(calendar, key);
                    const placed = placedByDate.get(key) ?? [];
                    // Dedupe: joylangan darsi bor eventni alohida pill qilib koʻrsatmaymiz.
                    const emptyEvents = dayEvents.filter((ev) => !placed.some((p) => placementInEvent(p, ev)));
                    // Birlashtirilgan roʻyxat — vaqt boʻyicha tartib.
                    type MonthItem = { t: "l"; p: Placement; s: number } | { t: "e"; ev: TimetableEvent; s: number };
                    const items: MonthItem[] = [
                      ...placed.map((p): MonthItem => ({ t: "l", p, s: p.startMin })),
                      ...(isBlocked ? [] : emptyEvents.map((ev): MonthItem => ({ t: "e", ev, s: ev.startMin }))),
                    ].sort((a, b) => a.s - b.s);
                    const shown = items.slice(0, 2);
                    const hidden = items.length - shown.length;

                    const goToDay = () => { setAnchor(date); setView("week"); };
                    const isCurrentMonth = date.getMonth() === anchor.getMonth();
                    return (
                      <>
                        <MonthDayDropZone dateKey={key} />
                        <div className="relative mb-0.5 flex items-center justify-between gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" aria-label={t("dayActionsAria", { day: date.getDate() })}
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-full text-xs font-bold outline-none transition-colors hover:ring-2 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-[var(--ring)] data-[state=open]:ring-2 data-[state=open]:ring-foreground/30",
                                  isToday ? "bg-foreground text-background"
                                    : !isCurrentMonth ? "text-muted-foreground/40 hover:text-foreground"
                                      : "text-foreground hover:bg-muted"
                                )}>{date.getDate()}</button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                              <DropdownMenuItem onClick={goToDay}>
                                <CalendarIcon />
                                {t("goToWeek")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openBlockModal(date)} variant={isBlocked ? "default" : "destructive"}>
                                {isBlocked ? <CalendarOff /> : <Ban />}
                                {isBlocked ? t("unblockDay") : t("blockDay")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {isBlocked && blockLbl && (
                            <span className="max-w-[80px] truncate rounded bg-destructive/10 px-1 py-0.5 text-[11px] font-semibold text-destructive">
                              {blockLbl}
                            </span>
                          )}
                          {!isBlocked && holiday && (
                            <span className="max-w-[80px] truncate rounded bg-foreground/5 px-1 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {holiday.name}
                            </span>
                          )}
                        </div>
                        {shown.map((it, k) =>
                          it.t === "l"
                            ? <PlacedPill key={`l-${it.p.lesson.id}-${it.p.classId}-${it.p.startMin}`} p={it.p} dateKey={key} />
                            : <EventPill key={`e-${it.ev.id}-${k}`} ev={it.ev} onOpen={goToDay} />
                        )}
                        <MonthMorePopover count={hidden} title={`${date.getDate()} ${fmt.monthName(date.getMonth())}`}>
                          {items.map((it, k) =>
                            it.t === "l"
                              ? <PlacedPill key={`pl-${it.p.lesson.id}-${it.p.classId}-${it.p.startMin}`} p={it.p} dateKey={key} />
                              : <EventPill key={`pe-${it.ev.id}-${k}`} ev={it.ev} onOpen={goToDay} />
                          )}
                        </MonthMorePopover>
                        {isBlocked && <TypographyMuted className="mt-0.5 pl-0.5 text-xs font-medium text-destructive/60">{t("blockedDay")}</TypographyMuted>}
                      </>
                    );
                }}
              />
            )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
    </DndContext>

      {/* ── Bayram modali ── */}
      <Dialog open={!!blockModal} onOpenChange={(o) => !o && setBlockModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("blockDayDialogTitle")}</DialogTitle>
            <DialogDescription>
              {blockModal && `${blockModal.date.getDate()} ${fmt.monthName(blockModal.date.getMonth())} ${blockModal.date.getFullYear()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input autoFocus type="text"
              placeholder={t("blockReasonPlaceholder")}
              value={blockLabel}
              onChange={(e) => setBlockLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveBlock()}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            {blockModal && blockedSet.has(toDateKey(blockModal.date)) ? (
              <Button variant="soft-destructive" className="mr-auto gap-1.5" onClick={removeBlock}>
                <CalendarOff className="size-4" />
                {t("removeBlock")}
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setBlockModal(null)}>{t("cancelShort")}</Button>
              <Button onClick={saveBlock}>{t("save")}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Ulash modali (qidiruv + Boʻlim filtri) ── */}
      <Dialog open={!!linkModal} onOpenChange={(o) => !o && setLinkModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{slotClass(linkModal) ? t("linkToClassTitle", { name: slotClass(linkModal)!.name }) : t("linkLessonTitle")}</DialogTitle>
            <DialogDescription>
              {t("linkDialogDescription")}
              {linkModal ? ` · ${minToHHMM(linkModal.startMin)}–${minToHHMM(linkModal.endMin)}` : ""}
            </DialogDescription>
          </DialogHeader>

          {linkModal && (
            <div className="flex flex-col gap-3 py-1">
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={lmSearch} onChange={(e) => setLmSearch(e.target.value)} placeholder={t("searchLessonPlaceholder")} className="pl-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-label">{t("classLabel")}</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                      <span style={slotTints(linkModal)?.dot} className="size-2 shrink-0 rounded-[4px]" />
                      <span className="truncate">{slotClass(linkModal)?.name}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block text-label">{t("unit")}</Label>
                    <Select value={lmUnitFilter} onValueChange={setLmUnitFilter}>
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allUnits")}</SelectItem>
                        {linkUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {linkCandidates.length === 0 ? (
                <TypographyMuted className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center text-sm">
                  {t("noCandidatesFound")}
                </TypographyMuted>
              ) : (
                <ScrollArea className="max-h-[240px] pr-1">
                  <div className="flex flex-col gap-1.5">
                    {linkCandidates.map((l) => {
                      const { tints } = lessonDisplay(l, linkModal?.classId);
                      const sel = lmLessonId === l.id;
                      const uid2 = linkModal ? unitIdForClass(l, linkModal.classId) : null;
                      const unitTitle = uid2 ? linkUnits.find((u) => u.id === uid2)?.title : null;
                      return (
                        <button key={l.id} type="button" onClick={() => setLmLessonId(sel ? "" : l.id)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
                            sel ? "border-primary bg-primary/5" : "border-border bg-background hover:border-foreground/30"
                          )}>
                          <span style={tints.dot} className="size-2 shrink-0 rounded-[4px]" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{l.title || t("untitled")}</span>
                            {unitTitle && <span className="block truncate text-xs text-muted-foreground">{unitTitle}</span>}
                          </div>
                          <span className={cn(
                            "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                            sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {sel ? <><Check className="size-3.5" /> {t("selected")}</> : t("add")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModal(null)}>{t("cancelShort")}</Button>
            <Button onClick={saveLink} disabled={!lmLessonId}>{t("link")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Joylangan mavzu — tahrir / koʻchirish / oʻchirish ── */}
      <Dialog open={!!editLesson} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("editLessonDialogTitle")}</DialogTitle>
            <DialogDescription>
              {editLesson && lessonDisplay(editLesson, editTarget?.classId).name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            <div>
              <Label htmlFor="em-title" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("lessonName")}</Label>
              <Input id="em-title" value={emTitle} onChange={(e) => setEmTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
            </div>
            {/* Koʻchirish — sana + vaqt shu yerda (bank orqali unschedule/relink kerak emas) */}
            <div>
              <Label htmlFor="em-date" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("dateLabel")}</Label>
              <DateKeyPicker value={emDateStr} onChange={setEmDateStr} ariaLabel={t("dateLabel")} className="w-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="em-start" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("startTime")}</Label>
                <Input id="em-start" type="time" value={emStartStr} onChange={(e) => setEmStartStr(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label htmlFor="em-end" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("endTime")}</Label>
                <Input id="em-end" type="time" value={emEndStr} onChange={(e) => setEmEndStr(e.target.value)} />
              </div>
            </div>
            {editLesson && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={editLesson.status === "Completed" ? "soft" : "outline"}
                  size="sm" className="gap-1.5"
                  onClick={() => {
                    if (!editLesson) return;
                    const next = editLesson.status === "Completed" ? "Scheduled" : "Completed";
                    setStatus(editLesson.id, next);
                    toast.success(next === "Completed" ? t("markedCompletedToast") : t("rescheduledToast"));
                  }}>
                  <Check className="size-4" />
                  {editLesson.status === "Completed" ? t("completedCheck") : t("markCompleted")}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  if (!editTarget) return;
                  unscheduleSession(editTarget.lessonId, editTarget.classId, editTarget.date, editTarget.startMin);
                  setEditTarget(null);
                  toast.success(t("returnedToBankToast"));
                }}>
                  <Undo2 className="size-4" />
                  {t("returnToBank")}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="soft-destructive" className="mr-auto gap-1.5" onClick={handleDelete}>
              <Trash2 className="size-4" />
              {t("delete")}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>{t("cancelShort")}</Button>
              <Button onClick={saveEdit}>{t("save")}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
