"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { panelCardClass, panelCardHeaderClass } from "@/components/DashboardPage";
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
  FileText, Check, Trash2, Undo2, CalendarOff, ArrowUpRight, Eye, EyeOff,
  SlidersHorizontal, Pencil, Search, Ban, Clock, CalendarPlus, MoreVertical,
} from "lucide-react";
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

/** Kun kaliti — calendar-core konvensiyasi. */
function dateToTimetableDay(d: Date): number {
  return jsDayToIsoDay(d.getDay());
}
/** Placement timetable eventiga tegishlimi — kanonik sessionMatchesSlot
    ("start-in-slot": sinf mos VA boshlanish event oraligʻida). */
function placementInEvent(p: Placement, ev: TimetableEvent): boolean {
  return sessionMatchesSlot(ev, p, "start-in-slot");
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
  /** Joylangan mavzuning rangi/nomi — blok bilan mos (jonli sinfdan) */
  const lessonDisplay = (l: Lesson): { name: string; color: ClassColor; tints: ReturnType<typeof classTints> } => {
    const info = classInfoById(l.classId);
    const c: ClassColor = info ? liveClassColor(info) : "gray";
    return { name: info?.name ?? t("unknownClass"), color: c, tints: classTints(c) };
  };
  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.date)), [blocked]);
  const blockedMap = useMemo(() => new Map(blocked.map((b) => [b.date, b.label])), [blocked]);

  /** Jadvalda umuman event bormi — boʻsh holat (onboarding) uchun. */
  const hasAnyTimetable = useMemo(() => versions.some((v) => v.events.length > 0) || isDemoMode, [versions, isDemoMode]);

  // Sahifa (yoki grid) ochilganda 07:00 emas 08:00'dan boshlab koʻrinsin —
  // `hasAnyTimetable` grid mount boʻlgandan keyin oʻzgarsa ham (masalan
  // tur demo rejimi kechroq yoqilsa) qayta ishlaydi.
  useEffect(() => {
    if (!hydrated || !scrollerRef.current || view !== "week" || !hasAnyTimetable) return;
    scrollerRef.current.scrollTop = (8 - START_HOUR) * SLOT_HEIGHT;
  }, [hydrated, view, hasAnyTimetable]);

  /** Sanada amalda boʻlgan versiya jadvalidan shu kunning darslari.
      Oʻquv yilidan tashqari yoki taʼtil kuni — boʻsh. */
  const eventsForDate = (date: Date): TimetableEvent[] => {
    const tDay = dateToTimetableDay(date);
    if (plannerDemo) return plannerDemo.eventsForWeekday(tDay);
    const key = toDateKey(date);
    if (!inRange(key, calendar.range)) return [];
    if (getHolidayForDate(calendar, key)) return [];
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
  }, [visLessons, classId, plannerDemo, allWeekDates, monthGrid]);

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
      toast.error(t("endBeforeStartError"));
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
    toast.success(t("lessonCreatedToast"), { description: title });
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
    const { color, tints } = lessonDisplay(p.lesson);
    return (
      <CalendarEventPill
        color={color}
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

  return (
    <div className="flex h-full min-h-0 flex-col">
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

        <CardContent className="flex-1 min-h-0 flex flex-col p-0">
          <div className="flex-1 min-h-0 overflow-hidden">

            {/* ── Boʻsh holat (jadval hali tuzilmagan) ── */}
            {hydrated && !hasAnyTimetable ? (
              <Empty className="h-full">
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
                className={cn(isDemoMode && "pointer-events-none")}
                startHour={START_HOUR}
                endHour={END_HOUR}
                pxPerHour={SLOT_HEIGHT}
                nowMin={nowMin}
                lines="half"
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
                  const full = fmt.dayName(dateToTimetableDay(d));
                  return {
                    key,
                    isToday,
                    headerProps: {
                      "data-tour": i === 0 ? "planner-day-cell" : undefined,
                      className: "group/day relative px-2 py-3 text-center",
                    },
                    columnProps: {
                      onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverKey !== key) setDragOverKey(key); },
                      onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey((k) => (k === key ? null : k)); },
                      onDrop: (e) => dropOnDay(e, d),
                      className: cn(
                        isToday && "bg-muted/50",
                        isBlocked && "bg-destructive/5",
                        !isBlocked && holiday && "bg-muted/40",
                        dragOverKey === key && "outline outline-2 -outline-offset-2 outline-[var(--ring)] bg-primary/5"
                      ),
                    },
                    header: (
                      <>
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
                              {t("scheduleUpdated")}
                            </span>
                          </div>
                        )}
                        {/* Hover sozlama menyusi — tur shu tugmani nishonga olsa majburan koʻrinadi */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              data-tour="planner-day-settings"
                              aria-label={t("daySettingsAria")}
                              className={cn(
                                "absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-opacity transition hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)] group-hover/day:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground",
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
                          const blockPx = Math.max((durH + Math.min(topH, 0)) * SLOT_HEIGHT - 4, 32);
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
                              style={{ top: Math.max(topH, 0) * SLOT_HEIGHT + 2, height: blockPx }}
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
                                  <button type="button" onClick={() => openCreateModal(date, ev)}
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
                                            <DropdownMenuItem onClick={() => openEdit(p, dateKey)}>
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
                          const { name, color, tints } = lessonDisplay(l);
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
                              style={{ top: Math.max(topH, 0) * SLOT_HEIGHT + 2, height: Math.max((durH + Math.min(topH, 0)) * SLOT_HEIGHT - 4, 30) }}
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
                className={cn(isDemoMode && "pointer-events-none")}
                getCellProps={(date, key) => {
                  const isToday = isSameDay(date, today);
                  const isCurrentMonth = date.getMonth() === anchor.getMonth();
                  const isBlocked = blockedSet.has(key);
                  const holiday = getHolidayForDate(calendar, key);
                  return {
                    onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverKey !== key) setDragOverKey(key); },
                    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverKey((k) => (k === key ? null : k)); },
                    onDrop: (e: React.DragEvent<HTMLDivElement>) => dropOnDay(e, date),
                    className: cn(
                      !isCurrentMonth && "bg-muted/10",
                      isBlocked && "bg-destructive/5",
                      !isBlocked && holiday && "bg-muted/40",
                      isToday && !isBlocked && "bg-muted/50",
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
                        <div className="mb-0.5 flex items-center justify-between gap-1">
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

      {/* ── Yaratish modali ── */}
      <Dialog open={!!createModal} onOpenChange={(o) => !o && setCreateModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("createLessonDialogTitle")}</DialogTitle>
            <DialogDescription>
              {createModal && `${createModal.date.getDate()} ${fmt.monthName(createModal.date.getMonth())} ${createModal.date.getFullYear()}`}
              {slotClass(createModal) ? ` · ${slotClass(createModal)!.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          {createModal && (
            <div className="flex flex-col gap-3 py-1">
              <div>
                <Label htmlFor="cm-title" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("lessonWord")}</Label>
                <Input id="cm-title" autoFocus type="text" value={cmTitle}
                  onChange={(e) => setCmTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCreate()}
                  placeholder={t("lessonNamePlaceholder")} />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("unit")}</Label>
                <Select value={cmUnitId} onValueChange={setCmUnitId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectUnit")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_UNIT}>{t("noUnit")}</SelectItem>
                    {createUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="cm-start" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("startTime")}</Label>
                  <Input id="cm-start" type="time" value={cmStartStr} onChange={(e) => setCmStartStr(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="cm-end" className="mb-1 block text-xs font-semibold text-muted-foreground">{t("endTime")}</Label>
                  <Input id="cm-end" type="time" value={cmEndStr} onChange={(e) => setCmEndStr(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(null)}>{t("cancelShort")}</Button>
            <Button onClick={saveCreate} disabled={!cmTitle.trim()}>{t("save")}</Button>
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
              {editLesson && lessonDisplay(editLesson).name}
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
    </div>
  );
}
