"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { getHolidayForDate, inRange } from "@/lib/academic-calendar";
import { lessonSessions, lessonClassIds, unitIdForClass, type Lesson } from "@/lib/lessons-data";
import { cn } from "@/lib/utils";
import { DAYS_UZ, DAYS_UZ_SHORT, MONTHS_UZ } from "@/lib/localization";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { Label } from "@/components/ui/label";
import { SectionIcon } from "@/components/ui/section-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { panelCardClass, panelCardHeaderClass } from "@/components/DashboardPage";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusIcon, LinkIcon,
  FileText, Check, Trash2, Undo2, CalendarOff, ArrowUpRight, Eye, EyeOff,
  SlidersHorizontal, Pencil, Search, Ban, Clock, CalendarPlus,
} from "lucide-react";
import { CardStripes } from "@/components/CardStripes";
import { CardCorner } from "@/components/CardCorner";
import { LessonStatusBadge } from "@/components/LessonStatusBadge";

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
const NO_UNIT = "__none__";

type BlockedDay = { date: string; label: string };
type SlotModal = { date: Date; classId: string; startMin: number; endMin: number };
/** Kalendarga joylangan bitta sessiya (dars + qaysi sinf + vaqt). */
type Placement = { lesson: Lesson; classId: string; startMin: number; endMin: number };
/** Tahrir/koʻchirish nishoni — QAYSI sessiya (dars + sinf + sana + vaqt). */
type EditTarget = { lessonId: string; classId: string; date: string; startMin: number; endMin: number };
type DragPayload = { lessonId: string; classId: string; date: string; startMin: number; endMin: number };

const SLOT_HEIGHT = 180;
const START_HOUR = 7;
const END_HOUR = 22;
const VISIBLE_HOURS = END_HOUR - START_HOUR;

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
  const dow = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
  const offset = (firstDow + 6) % 7;
  const days = getDaysInMonth(year, month);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
/** Placement timetable eventiga tegishlimi — sinf mos VA boshlanish event
    oraligʻida (vaqt biroz siljigan boʻlsa ham slot ichida qoladi). */
function placementInEvent(p: Placement, ev: TimetableEvent): boolean {
  return p.classId === ev.classId && p.startMin >= ev.startMin && p.startMin < ev.endMin;
}

export default function PlannerView({ classId }: { classId?: string }) {
  const router = useRouter();

  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [blocked, setBlocked] = useState<BlockedDay[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [nowMin, setNowMin] = useState(0);
  const [showOffDays, setShowOffDays] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

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

  const [createModal, setCreateModal] = useState<SlotModal | null>(null);
  const [cmTitle, setCmTitle] = useState("");
  const [cmUnitId, setCmUnitId] = useState<string>(NO_UNIT);
  const [cmStartStr, setCmStartStr] = useState("08:00");
  const [cmEndStr, setCmEndStr] = useState("08:45");

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
    } catch {}
    setHydrated(true);
  }, []);

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

  useEffect(() => {
    if (!hydrated || !scrollerRef.current) return;
    const top = (nowMin / 60 - START_HOUR) * SLOT_HEIGHT - 120;
    scrollerRef.current.scrollTop = Math.max(0, top);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, view]);

  // Jonli sinflar — event/dars nomi va rangi shu yerdan (server-backed)
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const classInfoById = (id: string): ClassInfo | undefined => classDataMap[id]?.info;
  const liveClassColor = (info: ClassInfo): ClassColor => classColor(info);
  /** Joylangan mavzuning rangi/nomi — blok bilan mos (jonli sinfdan) */
  const lessonDisplay = (l: Lesson): { name: string; color: ClassColor; tints: ReturnType<typeof classTints> } => {
    const info = classInfoById(l.classId);
    const c: ClassColor = info ? liveClassColor(info) : "gray";
    return { name: info?.name ?? "Nomaʼlum sinf", color: c, tints: classTints(c) };
  };
  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.date)), [blocked]);
  const blockedMap = useMemo(() => new Map(blocked.map((b) => [b.date, b.label])), [blocked]);

  /** Jadvalda umuman event bormi — boʻsh holat (onboarding) uchun. */
  const hasAnyTimetable = useMemo(() => versions.some((v) => v.events.length > 0), [versions]);

  /** Sanada amalda boʻlgan versiya jadvalidan shu kunning darslari.
      Oʻquv yilidan tashqari yoki taʼtil kuni — boʻsh. */
  const eventsForDate = (date: Date): TimetableEvent[] => {
    const key = toDateKey(date);
    if (!inRange(key, calendar.range)) return [];
    if (getHolidayForDate(calendar, key)) return [];
    const tDay = dateToTimetableDay(date);
    const evs = (resolveVersionForDate(versions, key)?.events ?? []).filter((e) => e.day === tDay);
    return classId ? evs.filter((e) => e.classId === classId) : evs;
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
        const arr = map.get(s.date) ?? [];
        arr.push({ lesson: l, classId: s.classId, startMin: s.startMin, endMin: s.endMin });
        map.set(s.date, arr);
      }
    }
    return map;
  }, [visLessons, classId]);

  const hasLessonsOn = (d: Date) => (placedByDate.get(toDateKey(d))?.length ?? 0) > 0;
  const isOffDay = (d: Date) => dateToTimetableDay(d) === 7 || blockedSet.has(toDateKey(d));
  // Darsli dam/blok kunlari YASHIRILMAYDI — aks holda darslar "yoʻqoladi".
  const weekDates = useMemo(
    () => (showOffDays ? allWeekDates : allWeekDates.filter((d) => !isOffDay(d) || hasLessonsOn(d))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allWeekDates, showOffDays, blockedSet, placedByDate]
  );

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
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_UZ[a.getMonth()]}`;
    return `${a.getDate()} ${MONTHS_UZ[a.getMonth()]} – ${b.getDate()} ${MONTHS_UZ[b.getMonth()]}`;
  }, [view, allWeekDates]);

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
      toast.success("Kun bloklandi", {
        description: lessonsOnDay > 0 ? `Bu kunda ${lessonsOnDay} ta dars bor — ularni boshqa kunga koʻchiring` : undefined,
      });
    } else {
      toast.success("Blok olib tashlandi");
    }
  }
  function removeBlock() {
    if (!blockModal) return;
    const k = toDateKey(blockModal.date);
    setBlocked((p) => p.filter((b) => b.date !== k));
    setBlockModal(null);
    toast.success("Blok olib tashlandi");
  }

  // ── Yaratish (nom + Boʻlim + vaqt) ──
  function openCreateModal(date: Date, ev: TimetableEvent) {
    setCreateModal({ date, classId: ev.classId, startMin: ev.startMin, endMin: ev.endMin });
    setCmTitle("");
    setCmUnitId(NO_UNIT);
    setCmStartStr(minToHHMM(ev.startMin));
    setCmEndStr(minToHHMM(ev.endMin));
  }
  function saveCreate() {
    if (!createModal || !cmTitle.trim()) return;
    const startMin = HHMMToMin(cmStartStr);
    const endMin = HHMMToMin(cmEndStr);
    if (endMin <= startMin) {
      toast.error("Tugash vaqti boshlanish vaqtidan keyin boʻlishi kerak");
      return;
    }
    const title = cmTitle.trim();
    const id = addLesson({
      classId: createModal.classId,
      unitId: cmUnitId === NO_UNIT ? null : cmUnitId,
      title,
      status: "Scheduled",
    });
    addScheduleForClass(id, createModal.classId, toDateKey(createModal.date), startMin, endMin);
    setCreateModal(null);
    toast.success("Dars yaratildi va joylandi", { description: title });
  }
  const createUnits = useMemo(
    () => (createModal ? units.filter((u) => u.classId === createModal.classId) : []),
    [units, createModal]
  );

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
    toast.success("Mavzu ulandi", { description: linked?.title });
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
      toast.error("Tugash vaqti boshlanish vaqtidan keyin boʻlishi kerak");
      return;
    }
    updateLesson(editLesson.id, { title: emTitle.trim() || editLesson.title });
    if (emDateStr !== editTarget.date || newStart !== editTarget.startMin || newEnd !== editTarget.endMin) {
      moveSession(editLesson.id, editTarget.classId, editTarget.date, editTarget.startMin, emDateStr, newStart, newEnd);
    }
    setEditTarget(null);
    toast.success("Saqlandi");
  }
  function handleDelete() {
    if (!editLesson) return;
    const snap: Lesson = { ...editLesson }; // toʻliq snapshot (content/standards/scheduleByClass ham)
    deleteLessonAction(snap.id);
    setEditTarget(null);
    toast("Mavzu oʻchirildi", {
      description: snap.title,
      action: {
        label: "Qaytarish",
        onClick: () => { restoreLesson(snap); toast.success("Mavzu qaytarildi"); },
      },
    });
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
    toast.success("Dars koʻchirildi", {
      description: `${moved?.title ?? "Dars"} · ${targetDate.getDate()} ${MONTHS_UZ[targetDate.getMonth()]}`,
    });
  }

  const slotClass = (m: SlotModal | null) => (m ? classInfoById(m.classId) : undefined);
  const slotTints = (m: SlotModal | null) => { const c = slotClass(m); return c ? classTints(liveClassColor(c)) : null; };
  const weekColsStyle = { gridTemplateColumns: `56px repeat(${weekDates.length}, minmax(0,1fr))` };

  function EventPill({ ev, onOpen }: { ev: TimetableEvent; onOpen?: () => void }) {
    const cls = classInfoById(ev.classId);
    if (!cls) return null;
    const tints = classTints(liveClassColor(cls));
    return (
      <button type="button" onClick={onOpen} style={tints.gradient}
        className="flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
        <span style={tints.dot} className="size-1.5 shrink-0 rounded-[3px]" />
        <span style={tints.text} className="min-w-0 truncate text-xs font-semibold">{cls.name}</span>
        <span style={tints.text} className="ml-auto shrink-0 text-[10px] font-medium opacity-70">{fmtMin(ev.startMin)}</span>
      </button>
    );
  }

  // Joylangan mavzu pili (oy koʻrinishi) — MAVZU nomini koʻrsatadi (sinf emas).
  function PlacedPill({ p, dateKey }: { p: Placement; dateKey: string }) {
    const { tints } = lessonDisplay(p.lesson);
    return (
      <button type="button" onClick={() => openEdit(p, dateKey)}
        style={{ ...tints.surfaceStrong, ...tints.borderMedium }}
        className="flex w-full items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-left transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
        <span style={tints.dot} className="size-1.5 shrink-0 rounded-[3px]" />
        {p.lesson.status === "Completed"
          ? <Check style={tints.textStrong} className="size-2.5 shrink-0" strokeWidth={3} />
          : <FileText style={tints.textStrong} className="size-2.5 shrink-0" />}
        <span style={tints.textStrong} className="min-w-0 truncate text-xs font-semibold">{p.lesson.title}</span>
        <span style={tints.textStrong} className="ml-auto shrink-0 text-[10px] opacity-70">{minToHHMM(p.startMin)}</span>
      </button>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Card className={cn("rounded-2xl shadow-sm border-border flex-1", panelCardClass)}>

        {/* ── Toolbar ── */}
        <CardHeader className={cn(panelCardHeaderClass, "grid grid-rows-[auto] items-center gap-0 space-y-0 border-b-0 min-h-[4.5rem] px-5 py-5")} style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          <div className="flex min-w-0 items-center gap-3">
            <SectionIcon>
              <CalendarIcon />
            </SectionIcon>
            <CardTitle className="flex items-baseline gap-1.5 truncate text-xl">
              {view === "week" && weekTitle ? (
                <span className="truncate">{weekTitle}</span>
              ) : (
                <>
                  {MONTHS_UZ[anchor.getMonth()]}
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

          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")} className="self-center">
            <TabsList data-tour="planner-view-toggle">
              <TabsTrigger value="week" className="px-5">Hafta</TabsTrigger>
              <TabsTrigger value="month" className="px-5">Oy</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-end gap-1">
            {view === "week" && (
              <Button
                variant={showOffDays ? "ghost" : "secondary"}
                size="icon-sm"
                onClick={() => setShowOffDays((v) => !v)}
                title={showOffDays ? "Dam kunlarini yashirish" : "Dam kunlarini koʻrsatish"}
                aria-label="Dam kunlari"
              >
                {showOffDays ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={prevPeriod} aria-label="Oldingi">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())} className="font-semibold">
              Bugun
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={nextPeriod} aria-label="Keyingi">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 flex flex-col p-0">
          <div className="flex-1 min-h-0 overflow-hidden">

            {/* ── Boʻsh holat (jadval hali tuzilmagan) ── */}
            {hydrated && !hasAnyTimetable ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarPlus className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Jadval hali tuzilmagan</EmptyTitle>
                  <EmptyDescription>
                    Planner dars jadvalingiz ustiga quriladi. Avval haftalik jadvalni tuzing —
                    keyin bu yerda darslarni rejalashtirasiz.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => router.push("/dashboard/timetable")} className="gap-1.5">
                    <CalendarPlus className="size-4" />
                    Jadval tuzish
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
            {/* ── Hafta ── */}
            {view === "week" && (
              <div ref={scrollerRef} data-tour="planner-grid" className="h-full overflow-y-auto scrollbar-thin">
                <div className="grid" style={weekColsStyle}>

                  {/* Sticky sarlavha (opaque) */}
                  <div className="sticky top-0 z-30 border-b border-border bg-muted" />
                  {weekDates.map((d, i) => {
                    const isToday = isSameDay(d, today);
                    const key = toDateKey(d);
                    const isBlocked = blockedSet.has(key);
                    const holiday = getHolidayForDate(calendar, key);
                    // Versiya chegarasi: kecha va bugun har xil versiyaga tushsa
                    const prevDate = new Date(d); prevDate.setDate(d.getDate() - 1);
                    const vNow = resolveVersionForDate(versions, key);
                    const versionChanged =
                      versions.length > 1 && vNow != null && vNow.id !== resolveVersionForDate(versions, toDateKey(prevDate))?.id;
                    const full = DAYS_UZ[dateToTimetableDay(d) - 1];
                    return (
                      <div key={i} data-tour={i === 0 ? "planner-day-cell" : undefined} className="group/day relative sticky top-0 z-30 border-l border-b border-border bg-muted px-2 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="truncate max-w-full text-label">{full}</span>
                          {isToday ? (
                            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">{d.getDate()}</span>
                          ) : (
                            <span className="text-sm font-bold text-foreground">{d.getDate()}</span>
                          )}
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
                              Jadval yangilandi
                            </span>
                          </div>
                        )}
                        {/* Hover sozlama menyusi */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Kun sozlamalari"
                              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-opacity transition hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)] group-hover/day:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground"
                            >
                              <SlidersHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => router.push("/dashboard/timetable")}>
                              <Pencil />
                              Jadvalni tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBlockModal(d)} variant={isBlocked ? "default" : "destructive"}>
                              {isBlocked ? <CalendarOff /> : <Ban />}
                              {isBlocked ? "Blokni ochish" : "Kunni bloklash"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}

                  {/* Vaqt oʻqi */}
                  <div className="border-r border-border/40">
                    {Array.from({ length: VISIBLE_HOURS }, (_, h) => (
                      <div key={h}
                        className="border-t border-border/40 pr-2 pt-1 text-right text-xs font-medium tabular-nums text-muted-foreground"
                        style={{ height: SLOT_HEIGHT }}>
                        {String(START_HOUR + h).padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>

                  {/* Kun ustunlari */}
                  {weekDates.map((date, colIdx) => {
                    const dayEvents = eventsForDate(date);
                    const isToday = isSameDay(date, today);
                    const dateKey = toDateKey(date);
                    const isBlocked = blockedSet.has(dateKey);
                    const holiday = getHolidayForDate(calendar, dateKey);
                    const nowTop = (nowMin / 60 - START_HOUR) * SLOT_HEIGHT;
                    const placed = placedByDate.get(dateKey) ?? [];
                    const isDragOver = dragOverKey === dateKey;

                    return (
                      <div key={colIdx}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverKey !== dateKey) setDragOverKey(dateKey); }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey((k) => (k === dateKey ? null : k)); }}
                        onDrop={(e) => dropOnDay(e, date)}
                        className={cn(
                          "relative border-l border-border/40",
                          isToday && "bg-muted/50",
                          isBlocked && "bg-destructive/5",
                          !isBlocked && holiday && "bg-muted/40",
                          isDragOver && "outline outline-2 -outline-offset-2 outline-[var(--ring)] bg-primary/5"
                        )}
                      >
                        {Array.from({ length: VISIBLE_HOURS }, (_, h) => (
                          <div key={h} className="relative border-t border-border/40" style={{ height: SLOT_HEIGHT }}>
                            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/40" style={{ top: SLOT_HEIGHT / 2 }} />
                          </div>
                        ))}

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

                        {isToday && nowTop >= 0 && nowTop <= VISIBLE_HOURS * SLOT_HEIGHT && (
                          <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: nowTop }}>
                            <div className="-ml-1.5 size-2.5 shrink-0 rounded-full bg-destructive" />
                            <div className="h-px flex-1 bg-destructive" />
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
                          return (
                            <div key={ev.id}
                              style={{ top: Math.max(topH, 0) * SLOT_HEIGHT + 2, height: Math.max((durH + Math.min(topH, 0)) * SLOT_HEIGHT - 4, 32), ...(hasLesson ? { ...tints.surfaceStrong, ...tints.borderMedium } : { ...tints.tint, ...tints.softBorder }) }}
                              className={cn("group/ev absolute inset-x-1 z-10 flex flex-col overflow-hidden rounded-xl border px-3 pb-2.5 pt-3.5 transition-all", !hasLesson && "border-dashed")}>
                              {hasLesson && <CardStripes color={clsColor} variant="cover" />}
                              {hasLesson && <CardCorner color={clsColor} className="-right-5 -top-5 size-16" />}
                              {/* ↗ sinfni ochish — faqat umumiy /planner'da (sinf-detali ichida
                                  allaqachon shu sinfdamiz, shuning uchun yashiriladi). */}
                              {!classId && (
                                <Link
                                  href={`/dashboard/classes/${ev.classId}`}
                                  title="Sinfni ochish"
                                  className="absolute right-1.5 top-1.5 z-20 hidden size-6 items-center justify-center rounded-md bg-background/70 text-foreground/70 shadow-sm transition hover:bg-background hover:text-foreground group-hover/ev:flex"
                                >
                                  <ArrowUpRight className="size-3.5" />
                                </Link>
                              )}
                              <span className="flex items-center gap-1.5 pr-6">
                                <span style={{ backgroundColor: tints.solid }} className={cn("h-3.5 w-0.5 shrink-0 rounded-full", !hasLesson && "opacity-40")} aria-hidden />
                                <span style={hasLesson ? tints.textStrong : undefined} className={cn("truncate text-[15px] leading-tight", hasLesson ? "font-bold" : "font-semibold text-muted-foreground")}>{cls.name}</span>
                              </span>
                              <span style={hasLesson ? tints.textStrong : undefined} className={cn("mt-1.5 flex items-center gap-1.5 truncate text-[13px] leading-snug", hasLesson ? "opacity-80" : "text-muted-foreground/70")}>
                                <Clock className="size-3 shrink-0" />
                                {fmtMin(ev.startMin)} – {fmtMin(ev.endMin)}
                              </span>
                              {hasLesson ? (
                                <div className="mt-2 flex flex-col gap-1.5">
                                  {blockLessons.map((p) => (
                                    <button key={p.lesson.id} type="button"
                                      draggable
                                      onDragStart={(e) => startDrag(e, p, dateKey)}
                                      onClick={() => openEdit(p, dateKey)}
                                      className="flex items-center gap-2 overflow-hidden rounded-lg bg-background/95 px-2 py-1.5 text-left shadow-sm transition hover:bg-background cursor-grab active:cursor-grabbing">
                                      <span style={tints.iconBg} className="flex size-6 shrink-0 items-center justify-center rounded-md">
                                        {p.lesson.status === "Completed"
                                          ? <Check style={tints.iconText} className="size-3.5" strokeWidth={3} />
                                          : <FileText style={tints.iconText} className="size-3.5" />}
                                      </span>
                                      <span className="truncate text-[13px] font-bold text-foreground">{p.lesson.title}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-auto flex justify-end pt-1.5">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        aria-label="Dars qoʻshish"
                                        className="flex items-center gap-1 rounded-lg bg-background/85 px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border/50 transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)] data-[state=open]:bg-background"
                                      >
                                        <PlusIcon className="size-3.5" strokeWidth={2.5} />
                                        Dars
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem onClick={() => openCreateModal(date, ev)}>
                                        <PlusIcon />
                                        Yaratish
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openLinkModal(date, ev)}>
                                        <LinkIcon />
                                        Ulash
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
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
                          const { name, color, tints } = lessonDisplay(l);
                          const done = l.status === "Completed";
                          return (
                            <button key={`${l.id}-${p.classId}-${start}`}
                              type="button"
                              draggable
                              onDragStart={(e) => startDrag(e, p, dateKey)}
                              onClick={() => openEdit(p, dateKey)}
                              style={{ top: Math.max(topH, 0) * SLOT_HEIGHT + 2, height: Math.max((durH + Math.min(topH, 0)) * SLOT_HEIGHT - 4, 30), ...tints.surfaceStrong, ...tints.borderMedium }}
                              className={cn("absolute inset-x-1 z-[11] overflow-hidden rounded-xl border px-3 pb-2.5 pt-3.5 text-left transition-all hover:brightness-95 cursor-grab active:cursor-grabbing", done && "opacity-75")}>
                              <CardStripes color={color} variant="cover" />
                              <CardCorner color={color} className="-right-5 -top-5 size-16" />
                              <LessonStatusBadge status={l.status} className="absolute right-1.5 top-1.5" />
                              <span className="flex items-center gap-1.5 truncate pr-20 text-[15px] font-bold leading-tight">
                                <span style={{ backgroundColor: tints.solid }} className="h-3.5 w-0.5 shrink-0 rounded-full" aria-hidden />
                                {done ? <Check style={tints.textStrong} className="size-3.5 shrink-0" strokeWidth={3} /> : <FileText style={tints.textStrong} className="size-3.5 shrink-0" />}
                                <span style={tints.textStrong} className="truncate">{name}</span>
                              </span>
                              <span style={tints.textStrong} className="mt-1 block truncate text-[13px] leading-snug">{l.title}</span>
                              <span style={tints.textStrong} className="mt-1 flex items-center gap-1.5 truncate text-[12px] leading-snug opacity-75">
                                <Clock className="size-3 shrink-0" />
                                {minToHHMM(start)} – {minToHHMM(end)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Oy ── */}
            {view === "month" && (
              <div className="flex h-full flex-col overflow-y-auto scrollbar-thin">
                <div className="grid shrink-0 border-b border-border bg-muted" style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
                  {DAYS_UZ_SHORT.map((d) => (
                    <div key={d} className="border-l border-border/40 py-3 text-center first:border-l-0">
                      <TypographyLabel>{d}</TypographyLabel>
                    </div>
                  ))}
                </div>
                <div className="grid flex-1" style={{ gridTemplateColumns: "repeat(7, minmax(0,1fr))" }}>
                  {monthGrid.map((date, idx) => {
                    if (!date) return <div key={idx} className="min-h-[96px] border-l border-t border-border/40 bg-muted/10 first:border-l-0" />;
                    const isToday = isSameDay(date, today);
                    const dayEvents = eventsForDate(date);
                    const isCurrentMonth = date.getMonth() === anchor.getMonth();
                    const key = toDateKey(date);
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
                    return (
                      <div key={idx}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverKey !== key) setDragOverKey(key); }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey((k) => (k === key ? null : k)); }}
                        onDrop={(e) => dropOnDay(e, date)}
                        className={cn(
                          "group/cell relative flex min-h-[104px] flex-col gap-1 border-l border-t border-border/40 p-2 text-left transition-colors first:border-l-0",
                          !isCurrentMonth && "bg-muted/10",
                          isBlocked && "bg-destructive/5",
                          !isBlocked && holiday && "bg-muted/40",
                          isToday && !isBlocked && "bg-muted/50",
                          dragOverKey === key && "outline outline-2 -outline-offset-2 outline-[var(--ring)]"
                        )}>
                        <div className="mb-0.5 flex items-center justify-between gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" aria-label={`${date.getDate()}-kun amallari`}
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
                                Haftaga oʻtish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openBlockModal(date)} variant={isBlocked ? "default" : "destructive"}>
                                {isBlocked ? <CalendarOff /> : <Ban />}
                                {isBlocked ? "Blokni ochish" : "Kunni bloklash"}
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
                        {hidden > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button"
                                className="self-start rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]">
                                +{hidden} koʻproq
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-60 p-2">
                              <div className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">
                                {date.getDate()} {MONTHS_UZ[date.getMonth()]}
                              </div>
                              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                                {items.map((it, k) =>
                                  it.t === "l"
                                    ? <PlacedPill key={`pl-${it.p.lesson.id}-${it.p.classId}-${it.p.startMin}`} p={it.p} dateKey={key} />
                                    : <EventPill key={`pe-${it.ev.id}-${k}`} ev={it.ev} onOpen={goToDay} />
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        {isBlocked && <TypographyMuted className="mt-0.5 pl-0.5 text-xs font-medium text-destructive/60">Bloklangan kun</TypographyMuted>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Bayram modali ── */}
      <Dialog open={!!blockModal} onOpenChange={(o) => !o && setBlockModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kunni bloklash</DialogTitle>
            <DialogDescription>
              {blockModal && `${blockModal.date.getDate()} ${MONTHS_UZ[blockModal.date.getMonth()]} ${blockModal.date.getFullYear()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input autoFocus type="text"
              placeholder="Sabab (masalan: Bayram, Taʼtil...)"
              value={blockLabel}
              onChange={(e) => setBlockLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveBlock()}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            {blockModal && blockedSet.has(toDateKey(blockModal.date)) ? (
              <Button variant="soft-destructive" className="mr-auto gap-1.5" onClick={removeBlock}>
                <CalendarOff className="size-4" />
                Blokni olib tashlash
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setBlockModal(null)}>Bekor</Button>
              <Button onClick={saveBlock}>Saqlash</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Yaratish modali ── */}
      <Dialog open={!!createModal} onOpenChange={(o) => !o && setCreateModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dars yaratish</DialogTitle>
            <DialogDescription>
              {createModal && `${createModal.date.getDate()} ${MONTHS_UZ[createModal.date.getMonth()]} ${createModal.date.getFullYear()}`}
              {slotClass(createModal) ? ` · ${slotClass(createModal)!.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          {createModal && (
            <div className="flex flex-col gap-3 py-1">
              <div>
                <Label htmlFor="cm-title" className="mb-1 block text-xs font-semibold text-muted-foreground">Mavzu</Label>
                <Input id="cm-title" autoFocus type="text" value={cmTitle}
                  onChange={(e) => setCmTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCreate()}
                  placeholder="Mavzu nomi" />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Boʻlim</Label>
                <Select value={cmUnitId} onValueChange={setCmUnitId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Boʻlim tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_UNIT}>Boʻlimsiz</SelectItem>
                    {createUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="cm-start" className="mb-1 block text-xs font-semibold text-muted-foreground">Boshlanish</Label>
                  <Input id="cm-start" type="time" value={cmStartStr} onChange={(e) => setCmStartStr(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="cm-end" className="mb-1 block text-xs font-semibold text-muted-foreground">Tugash</Label>
                  <Input id="cm-end" type="time" value={cmEndStr} onChange={(e) => setCmEndStr(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(null)}>Bekor</Button>
            <Button onClick={saveCreate} disabled={!cmTitle.trim()}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Ulash modali (qidiruv + Boʻlim filtri) ── */}
      <Dialog open={!!linkModal} onOpenChange={(o) => !o && setLinkModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{slotClass(linkModal) ? `${slotClass(linkModal)!.name}ga mavzu ulash` : "Mavzuni ulash"}</DialogTitle>
            <DialogDescription>
              Bu slotga ulash uchun bankdan mavzu tanlang
              {linkModal ? ` · ${minToHHMM(linkModal.startMin)}–${minToHHMM(linkModal.endMin)}` : ""}
            </DialogDescription>
          </DialogHeader>

          {linkModal && (
            <div className="flex flex-col gap-3 py-1">
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={lmSearch} onChange={(e) => setLmSearch(e.target.value)} placeholder="Mavzu qidirish..." className="pl-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-label">Sinf</Label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                      <span style={slotTints(linkModal)?.dot} className="size-2 shrink-0 rounded-[4px]" />
                      <span className="truncate">{slotClass(linkModal)?.name}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block text-label">Boʻlim</Label>
                    <Select value={lmUnitFilter} onValueChange={setLmUnitFilter}>
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha boʻlimlar</SelectItem>
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
                  Rejalanmagan mavzu topilmadi. &quot;Yaratish&quot; orqali yarating yoki lessons sahifasida qoʻshing.
                </TypographyMuted>
              ) : (
                <ScrollArea className="max-h-[240px] pr-1">
                  <div className="flex flex-col gap-1.5">
                    {linkCandidates.map((l) => {
                      const { tints } = lessonDisplay(l);
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
                            <span className="block truncate text-sm font-medium text-foreground">{l.title || "Nomsiz"}</span>
                            {unitTitle && <span className="block truncate text-xs text-muted-foreground">{unitTitle}</span>}
                          </div>
                          <span className={cn(
                            "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                            sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {sel ? <><Check className="size-3.5" /> Tanlandi</> : "Qoʻshish"}
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
            <Button variant="outline" onClick={() => setLinkModal(null)}>Bekor</Button>
            <Button onClick={saveLink} disabled={!lmLessonId}>Ulash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Joylangan mavzu — tahrir / koʻchirish / oʻchirish ── */}
      <Dialog open={!!editLesson} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mavzuni tahrirlash</DialogTitle>
            <DialogDescription>
              {editLesson && lessonDisplay(editLesson).name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            <div>
              <Label htmlFor="em-title" className="mb-1 block text-xs font-semibold text-muted-foreground">Mavzu nomi</Label>
              <Input id="em-title" value={emTitle} onChange={(e) => setEmTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
            </div>
            {/* Koʻchirish — sana + vaqt shu yerda (bank orqali unschedule/relink kerak emas) */}
            <div>
              <Label htmlFor="em-date" className="mb-1 block text-xs font-semibold text-muted-foreground">Sana</Label>
              <DateKeyPicker value={emDateStr} onChange={setEmDateStr} ariaLabel="Sana" className="w-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="em-start" className="mb-1 block text-xs font-semibold text-muted-foreground">Boshlanish</Label>
                <Input id="em-start" type="time" value={emStartStr} onChange={(e) => setEmStartStr(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label htmlFor="em-end" className="mb-1 block text-xs font-semibold text-muted-foreground">Tugash</Label>
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
                    toast.success(next === "Completed" ? "Oʻtilgan deb belgilandi" : "Qayta rejalashtirildi");
                  }}>
                  <Check className="size-4" />
                  {editLesson.status === "Completed" ? "Oʻtilgan ✓" : "Oʻtildi"}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  if (!editTarget) return;
                  unscheduleSession(editTarget.lessonId, editTarget.classId, editTarget.date, editTarget.startMin);
                  setEditTarget(null);
                  toast.success("Mavzu bankka qaytarildi");
                }}>
                  <Undo2 className="size-4" />
                  Bankka qaytarish
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="soft-destructive" className="mr-auto gap-1.5" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Oʻchirish
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>Bekor</Button>
              <Button onClick={saveEdit}>Saqlash</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
