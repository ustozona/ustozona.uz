"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { autoClassColor, CLASS_COLOR_HEX, classTints, CLASS_CARD_INTERACTION, type ClassColor } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses, useLiveClassesHydrated, useCreateClass, classInfoFromForm } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { cn } from "@/lib/utils";
import { DAYS_UZ, DAYS_UZ_SHORT } from "@/lib/localization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import DashboardPageLayout, {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
  panelScrollInnerClass,
  dashboardSplitGridClass,
} from "@/components/DashboardPage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ClassFormModal, type ClassFormValues, type ClassSlot } from "@/components/ClassFormModal";
import { ClassCard } from "@/components/ClassCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TypographyLabel } from "@/components/ui/typography";
import { CardStripes } from "@/components/CardStripes";
import { CardCorner } from "@/components/CardCorner";
import { type TimetableEvent } from "@/lib/timetable";
import { type BellConfig, defaultBellConfig, computePeriods } from "@/lib/bell-schedule";
import PeriodGrid, { type TimetableClass } from "@/components/timetable/PeriodGrid";
import BellScheduleDialog from "@/components/timetable/BellScheduleDialog";
import EffectiveDateDialog, { type EffectiveChoice } from "@/components/timetable/EffectiveDateDialog";
import VersionChip, { versionRangeLabel } from "@/components/timetable/VersionChip";
import { useTimetableStore } from "@/store/useTimetableStore";
import { resolveVersionForDate, sortVersions } from "@/lib/timetable-versions";
import { fmtDayMonthUz } from "@/lib/academic-calendar";
import { todayKey as getTodayKey } from "@/lib/date-keys";
import { toast } from "sonner";
import { Clock2Icon, XIcon, TrashIcon, SaveIcon, PlusIcon, GraduationCap, Calendar, GripVertical, Check, Loader2, MoreVertical, Download, PencilIcon as EditIcon, MousePointer2, Magnet, Hourglass, SlidersHorizontal, Lock, CalendarClock, TriangleAlert } from "lucide-react";

/* ─── Types ─── */
/* TimetableEvent — @/lib/timetable dan (takrorlanuvchi haftalik shablon).
   Jadvalning yagona manbasi endi useTimetableStore (versiyalangan
   snapshotlar); bu sahifa tanlangan versiyaning LOKAL QORALAMASINI
   tahrirlaydi va 600ms debounce bilan store'ga commit qiladi.
   Sinf roʻyxati — JONLI (useLiveClasses); yaratish/tahrirlash bevosita
   useGradesStore'ga yoziladi va serverga sinxronlanadi. */

const TIP_KEY = "murabbiyona-timetable-drag-tip-v1";
// Jadval faqat 6 ish kuni (Dushanba–Shanba) — kanonik `DAYS_UZ`dan slice.
const DAY_UZ = DAYS_UZ.slice(0, 6);
const DAY_UZ_SHORT = DAYS_UZ_SHORT.slice(0, 6);

/* ─── Grid oʻlchamlari — toʻliq 24 soat (00:00–24:00) ─── */
const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_H = 180;                // 1 soat balandligi (px) — planner bilan bir xil
const SNAP = 15;                   // daqiqada tutilish (snap)
const DEFAULT_DURATION = 45;       // yangi dars uzunligi (daqiqa)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const DAY_START_MIN = START_HOUR * 60;
const DAY_END_MIN = END_HOUR * 60;
/** Boshlanishida koʻrsatiladigan soat (maktab boshlanishi) */
const INITIAL_SCROLL_HOUR = 8;

function uid() { return Math.random().toString(36).slice(2, 9); }
function minToHHMM(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
function hhmmToMin(s: string) { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); }
function snapMin(m: number) { return Math.round(m / SNAP) * SNAP; }
function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }

/** Dars davomiyligini oʻqiladigan matnga aylantirish: 45 → "45 daq", 90 → "1 soat 30 daq" */
function fmtDuration(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h} soat ${m} daq`;
  if (h) return `${h} soat`;
  return `${m} daq`;
}


/** Qoʻngʻiroq jadvali nusxasi — draft va snapshot orasida shared reference qolmasin. */
function cloneBell(c: BellConfig): BellConfig {
  return { profile: c.profile, shift1: { ...c.shift1 }, shift2: { ...c.shift2 } };
}

export default function TimetablePage() {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(true);
  const [editEvent, setEditEvent] = useState<TimetableEvent | null>(null);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  /** "free" — uzluksiz vaqt-grid (erkin); "lesson" — tayyor katak grid (dars soatlari) */
  const [snapMode, setSnapMode] = useState<"free" | "lesson">("free");
  /** Qoʻngʻiroq jadvali sozlamasi (smena + dars/tanaffus vaqtlari) */
  const [bellConfig, setBellConfig] = useState<BellConfig>(defaultBellConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ── Versiyalash holati ── */
  const versions = useTimetableStore((s) => s.versions);
  const storeHydrated = useTimetableStore((s) => s._hasHydrated);
  const commitDraft = useTimetableStore((s) => s.commitDraft);
  const createVersion = useTimetableStore((s) => s.createVersion);
  const deleteVersion = useTimetableStore((s) => s.deleteVersion);
  const [today] = useState(() => getTodayKey());
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  /** Arxiv versiyani tahrirlashga ochish (tasdiqdan soʻng) */
  const [archiveUnlocked, setArchiveUnlocked] = useState(false);
  /** Joriy sessiyada "qachondan?" savoliga javob berilganmi (in-place tanlovi) */
  const [decisionMade, setDecisionMade] = useState(false);
  const [effectiveDialogOpen, setEffectiveDialogOpen] = useState(false);
  /** Dialog chipdagi "Yangi versiya…" orqali ochilganmi (in-place varianti yashiriladi) */
  const [dialogExplicit, setDialogExplicit] = useState(false);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  /** Hal qilinmagan qoralama bilan versiya almashtirilsa — maqsad shu yerda kutadi */
  const pendingSwitchRef = useRef<string | null>(null);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) ?? null,
    [versions, selectedVersionId]
  );
  const currentVersionId = useMemo(
    () => resolveVersionForDate(versions, today)?.id ?? null,
    [versions, today]
  );
  const mode: "none" | "current" | "past-locked" | "past-unlocked" | "future" = !selectedVersion
    ? "none"
    : selectedVersion.effectiveFrom > today
      ? "future"
      : selectedVersion.id === currentVersionId
        ? "current"
        : archiveUnlocked
          ? "past-unlocked"
          : "past-locked";
  /** Arxiv (qulflangan) rejim — grid faqat koʻrish uchun */
  const readOnly = mode === "past-locked";

  /** Mavjud darsni koʻchirayotganda — ushlangan nuqtaning dars boshidan daqiqa-ofseti */
  const grabOffsetRef = useRef<number | null>(null);
  /** Vaqt gridining scroll konteyneri — boshlanishida maktab soatiga oʻtish uchun */
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /** Jonli sinflar (server-backed) — palette va event nomlari shu yerdan */
  const liveClasses = useLiveClasses();
  const liveHydrated = useLiveClassesHydrated();
  const createClass = useCreateClass();
  const updateClassStore = useGradesStore((s) => s.updateClass);
  const classesAll = useMemo<TimetableClass[]>(
    () => liveClasses.map((c) => ({
      id: c.id,
      name: c.name,
      color: classColor(c),
      grade: c.grade ?? null,
      subject: c.subject,
      icon: c.icon as TimetableClass["icon"],
      description: c.description,
    })),
    [liveClasses]
  );
  const classById = useMemo(() => new Map(classesAll.map((c) => [c.id, c])), [classesAll]);

  /** Qoʻngʻiroq jadvalidan hisoblangan period qatorlari ("1-soat" …) */
  const periods = useMemo(() => computePeriods(bellConfig), [bellConfig]);

  /** Event sinfi — jonli roʻyxatdan; oʻchirilgan/legacy id uchun barqaror fallback */
  const getClass = useCallback((id: string): TimetableClass => {
    return classById.get(id) ?? { id, name: "Nomaʼlum sinf", color: autoClassColor(id) };
  }, [classById]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Store hydratsiyasidan soʻng bugun amaldagi versiyani tanlash
  useEffect(() => {
    if (!storeHydrated || versions.length === 0 || selectedVersionId) return;
    setSelectedVersionId(resolveVersionForDate(versions, today)?.id ?? sortVersions(versions)[0].id);
  }, [storeHydrated, versions, selectedVersionId, today]);

  // Versiya almashganda — qoralama shu versiya snapshotidan qayta quriladi
  useEffect(() => {
    if (!selectedVersion) return;
    setEvents(selectedVersion.events.map((e) => ({ ...e })));
    setBellConfig(cloneBell(selectedVersion.bellConfig));
    setSaved(true);
    setDecisionMade(false);
    setArchiveUnlocked(false);
    // Faqat versiya almashganda (id) — commit'dan keyingi snapshot yangilanishida emas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionId, storeHydrated]);

  /* Commit oqimi: qoralama snapshotdan farq qilsa 600ms debounce, soʻng —
     joriy versiyada birinchi marta boʻlsa "qachondan?" dialogi, aks holda
     toʻgʻridan-toʻgʻri commit (arxiv-ochiq va kelgusi versiyalar dialogsiz). */
  useEffect(() => {
    if (!hydrated || !storeHydrated || !selectedVersion) return;
    const dirty =
      JSON.stringify(events) !== JSON.stringify(selectedVersion.events) ||
      JSON.stringify(bellConfig) !== JSON.stringify(selectedVersion.bellConfig);
    if (!dirty) { setSaved(true); return; }
    setSaved(false);
    const t = setTimeout(() => {
      if (mode === "current" && !decisionMade) {
        setDialogExplicit(false);
        setEffectiveDialogOpen(true);
        return;
      }
      commitDraft(selectedVersion.id, events, bellConfig);
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [events, bellConfig, hydrated, storeHydrated, selectedVersion, mode, decisionMade, commitDraft]);

  /* ── Versiya amallari ── */

  const revertDraft = useCallback(() => {
    if (!selectedVersion) return;
    setEvents(selectedVersion.events.map((e) => ({ ...e })));
    setBellConfig(cloneBell(selectedVersion.bellConfig));
    setSaved(true);
  }, [selectedVersion]);

  const handleSelectVersion = useCallback((id: string) => {
    if (id === selectedVersionId) return;
    if (!saved && selectedVersion) {
      if (mode === "current" && !decisionMade) {
        // Hal qilinmagan oʻzgarish bor — avval "qachondan?" savoli, soʻng almashish
        pendingSwitchRef.current = id;
        setDialogExplicit(false);
        setEffectiveDialogOpen(true);
        return;
      }
      commitDraft(selectedVersion.id, events, bellConfig); // kutayotgan commit'ni darhol yakunlash
    }
    setSelectedVersionId(id);
  }, [selectedVersionId, saved, selectedVersion, mode, decisionMade, commitDraft, events, bellConfig]);

  const applyEffectiveChoice = useCallback((choice: EffectiveChoice) => {
    if (!selectedVersion) return;
    if (choice.kind === "in-place") {
      commitDraft(selectedVersion.id, events, bellConfig);
      setDecisionMade(true);
      setSaved(true);
    } else {
      const id = createVersion({ effectiveFrom: choice.effectiveFrom, note: choice.note, baseId: selectedVersion.id });
      if (!id) { toast.error("Bu sanada allaqachon versiya bor"); return; }
      // Yangi versiya qoralamadagi holatni oladi; eski versiya snapshoti oʻzgarmaydi
      commitDraft(id, events, bellConfig);
      toast.success(`Yangi jadval versiyasi — ${fmtDayMonthUz(choice.effectiveFrom)}dan`);
      setEffectiveDialogOpen(false);
      setSelectedVersionId(pendingSwitchRef.current ?? id);
      pendingSwitchRef.current = null;
      return;
    }
    setEffectiveDialogOpen(false);
    if (pendingSwitchRef.current) {
      setSelectedVersionId(pendingSwitchRef.current);
      pendingSwitchRef.current = null;
    }
  }, [selectedVersion, commitDraft, createVersion, events, bellConfig]);

  const cancelEffectiveDialog = useCallback(() => {
    revertDraft();
    setEffectiveDialogOpen(false);
    if (pendingSwitchRef.current) {
      setSelectedVersionId(pendingSwitchRef.current);
      pendingSwitchRef.current = null;
    }
  }, [revertDraft]);

  const confirmDeleteVersion = useCallback(() => {
    if (!selectedVersion || versions.length <= 1) return;
    const remaining = versions.filter((v) => v.id !== selectedVersion.id);
    deleteVersion(selectedVersion.id);
    setSelectedVersionId(
      resolveVersionForDate(remaining, today)?.id ?? sortVersions(remaining)[0]?.id ?? null
    );
    setDeleteConfirmOpen(false);
  }, [selectedVersion, versions, deleteVersion, today]);

  // Jadvalni JSON sifatida eksport qilish
  const exportSchedule = useCallback(() => {
    if (events.length === 0) {
      toast.error("Eksport uchun jadval boʻsh");
      return;
    }
    const rows = [...events]
      .sort((a, b) => a.day - b.day || a.startMin - b.startMin)
      .map(e => {
        const cls = getClass(e.classId);
        return { sinf: cls.name, kun: DAY_UZ[e.day - 1], boshlanish: minToHHMM(e.startMin), tugash: minToHHMM(e.endMin) };
      });
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dars-jadvali.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Jadval eksport qilindi");
  }, [events, getClass]);

  // Birinchi foydalanishda drag maslahati (bir martalik, localStorage)
  useEffect(() => {
    try { if (!localStorage.getItem(TIP_KEY)) setShowTip(true); } catch {}
  }, []);
  const dismissTip = useCallback(() => {
    try { localStorage.setItem(TIP_KEY, "1"); } catch {}
    setShowTip(false);
  }, []);

  const removeEvent = useCallback((id: string) => setEvents(prev => prev.filter(e => e.id !== id)), []);

  // Sinfning barcha darslarini jadvaldan olib tashlash — Qaytarish (undo) bilan.
  const removeClassFromSchedule = useCallback((classId: string) => {
    const removed = events.filter(ev => ev.classId === classId);
    if (removed.length === 0) return;
    setEvents(prev => prev.filter(ev => ev.classId !== classId));
    toast.success("Sinf jadvaldan olib tashlandi", {
      action: { label: "Qaytarish", onClick: () => setEvents(prev => [...prev, ...removed]) },
    });
  }, [events]);

  /* ─── Native drag-and-drop ─── */

  // Sinf kartasini sudrash boshlanishi (chap roʻyxatdan)
  const onClassDragStart = useCallback((e: React.DragEvent, classId: string) => {
    e.dataTransfer.setData("text/class-id", classId);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  // Mavjud darsni sudrash boshlanishi (grid ichida koʻchirish)
  const onEventDragStart = useCallback((e: React.DragEvent, ev: TimetableEvent) => {
    e.dataTransfer.setData("text/event-id", ev.id);
    e.dataTransfer.effectAllowed = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    grabOffsetRef.current = ((e.clientY - rect.top) / HOUR_H) * 60;
  }, []);

  // Kun ustuniga tashlash (Erkin rejim) — Y koordinatadan vaqtni 15 daq snap qiladi
  const onColumnDrop = useCallback((e: React.DragEvent, day: number) => {
    if (readOnly) return;
    e.preventDefault();
    setDragOverDay(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const rawMin = DAY_START_MIN + ((e.clientY - rect.top) / HOUR_H) * 60;

    const eventId = e.dataTransfer.getData("text/event-id");
    const classId = e.dataTransfer.getData("text/class-id");

    if (eventId) {
      const grab = grabOffsetRef.current ?? 0;
      grabOffsetRef.current = null;
      setEvents(prev => prev.map(ev => {
        if (ev.id !== eventId) return ev;
        const dur = ev.endMin - ev.startMin;             // davomiylik saqlanadi
        const startMin = clamp(snapMin(rawMin - grab), DAY_START_MIN, DAY_END_MIN - dur);
        return { ...ev, day, startMin, endMin: startMin + dur };
      }));
    } else if (classId) {
      const startMin = clamp(snapMin(rawMin), DAY_START_MIN, DAY_END_MIN - DEFAULT_DURATION);
      setEvents(prev => [...prev, { id: uid(), classId, day, startMin, endMin: startMin + DEFAULT_DURATION }]);
    }
  }, [readOnly]);

  // Period katagiga sinf qoʻyish (Dars soatlari rejim) — oʻsha katakdagi mavjudini almashtiradi
  const placeInPeriod = useCallback((day: number, startMin: number, endMin: number, classId: string) => {
    setEvents(prev => [...prev.filter(e => !(e.day === day && e.startMin === startMin)), { id: uid(), classId, day, startMin, endMin }]);
  }, []);

  // Erkin-vaqtli toʻgarak qoʻshish
  const addClub = useCallback((day: number, classId: string, startMin: number, endMin: number) => {
    setEvents(prev => [...prev, { id: uid(), classId, day, startMin, endMin }]);
  }, []);

  // Dars cardini sudrab davomiylikni oʻzgartirish (faqat erkin rejimda)
  const onResizeEvent = useCallback((id: string, newStart: number, newEnd: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, startMin: newStart, endMin: newEnd } : e));
  }, []);

  /** Modaldan kelgan slotlarni (kun-nomi + "HH:MM") jadval hodisalariga yozish */
  const handleSaveClassSlots = useCallback((classId: string, slots: { day: string; start: string; end: string }[]) => {
    if (readOnly) return;
    setEvents(prev => {
      const next = prev.filter(e => e.classId !== classId);
      slots.forEach(slot => {
        const dayIndex = DAY_UZ.indexOf(slot.day); // 0–5
        if (dayIndex < 0) return;
        next.push({ id: uid(), classId, day: dayIndex + 1, startMin: hhmmToMin(slot.start), endMin: hhmmToMin(slot.end) });
      });
      return next;
    });
  }, [readOnly]);

  /** Sinf eventʼlaridan modal uchun slot roʻyxati tuzish */
  const slotsForClass = useCallback((classId: string): ClassSlot[] =>
    events.filter(e => e.classId === classId).map(ev => ({
      day: DAY_UZ[ev.day - 1] ?? "Dushanba",
      start: minToHHMM(ev.startMin),
      end: minToHHMM(ev.endMin),
    })), [events]);

  /** "+" — yangi JONLI sinf yaratish (server-sync) + slotlarini jadvalga yozish */
  const handleCreateClass = useCallback((values: ClassFormValues) => {
    const newId = createClass(values);
    handleSaveClassSlots(newId, values.slots);
    setCreateOpen(false);
  }, [createClass, handleSaveClassSlots]);

  /** Sinf tahriri — jonli sinfga yoziladi (barcha sahifalarga taʼsir qiladi) */
  const handleEditClass = useCallback((classId: string, v: ClassFormValues) => {
    updateClassStore(classId, (cd) => ({ ...cd, info: classInfoFromForm(classId, v, cd.info) }));
    handleSaveClassSlots(classId, v.slots);
    setEditingClass(null);
  }, [updateClassStore, handleSaveClassSlots]);

  /** Sinfning haftalik slotlaridan "Du 09:00, Pa 14:00" kabi xulosa matni */
  const scheduleSummary = useCallback((classId: string): string => {
    const evs = events.filter(e => e.classId === classId);
    if (evs.length === 0) return "Jadvalga qoʻshilmagan";
    const seen = new Set<string>();
    const parts: { order: number; text: string }[] = [];
    evs.forEach(e => {
      const idx = e.day - 1;
      if (idx < 0 || idx > 5) return;
      const text = `${DAY_UZ_SHORT[idx]} ${minToHHMM(e.startMin)}`;
      if (seen.has(text)) return;
      seen.add(text);
      parts.push({ order: idx * 1440 + e.startMin, text });
    });
    parts.sort((a, b) => a.order - b.order);
    if (parts.length <= 2) return parts.map(p => p.text).join(", ");
    return `${parts[0].text}, ${parts[1].text} +${parts.length - 2}`;
  }, [events]);

  // Boshlanishida gridʼni maktab soatiga (yoki eng erta darsga) suradi
  useEffect(() => {
    if (!hydrated || !scrollRef.current) return;
    const earliest = events.length ? Math.min(...events.map(e => e.startMin)) : INITIAL_SCROLL_HOUR * 60;
    scrollRef.current.scrollTop = Math.max(0, (earliest / 60) * HOUR_H - HOUR_H * 0.5);
    // faqat birinchi yuklanishda — events oʻzgarganda qayta surmaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated || !storeHydrated || !liveHydrated) return null;

  /** Arxiv/kelgusi banner matnlari uchun tanlangan versiya davri */
  const selectedRangeLabel = selectedVersion ? versionRangeLabel(versions, selectedVersion) : "";

  return (
    <DashboardPageLayout className="h-full">
      {/* Chap ustun minmax bilan: sidebar ochilib joy torayganda ham panel
          300px dan tor boʻlmaydi — kartalar siqilib qolmaydi. */}
      <div className={cn(dashboardSplitGridClass, "grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_3fr]")}>
        {/* ── Left: Sinflar ── */}
        <div className="min-w-0 min-h-0 grid">
        <Card className={cn(panelCardClass)} data-tour="timetable-class-selector">
          {/* Header */}
          <CardHeader className={cn(panelCardHeaderClass, "gap-3 border-b min-h-[4.5rem] px-5 py-5!")}>
            <SectionIcon>
              <GraduationCap />
            </SectionIcon>
            <CardTitle>Sinflar</CardTitle>
            <Button variant="ghost" size="sm" disabled={readOnly} className="ml-auto shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              Qoʻshish
            </Button>
          </CardHeader>

          {/* Birinchi foydalanish maslahati (bir martalik) */}
          {showTip && (
            <div className="mx-4 mb-4 mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground shrink-0 shadow-sm">
              <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
              <p className="flex-1 leading-snug">Sinf kartasini ushlab, oʻngdagi jadvalga sudrab tashlang.</p>
              <button type="button" onClick={dismissTip} aria-label="Yopish" className="shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground">
                <XIcon className="size-3.5" />
              </button>
            </div>
          )}

          {/* Class list with fade gradient. @container — panel torayganda
              (sidebar ochiq) roʻyxat paddingʼi va kartalar zichlashadi. */}
          <CardContent className={cn(panelCardContentClass, "@container")}>
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <ScrollArea className="h-full w-full">
              <div className={cn(panelScrollInnerClass, "space-y-2 @max-[400px]:px-4")}>
                {classesAll.length === 0 && (
                  <Empty className="py-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><GraduationCap /></EmptyMedia>
                      <EmptyTitle>Hali sinf yoʻq</EmptyTitle>
                      <EmptyDescription>
                        «Qoʻshish» tugmasi bilan birinchi sinfingizni yarating — soʻng uni jadvalga sudrab qoʻyasiz.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
                {classesAll.map((cls, i) => {
                  const merged = getClass(cls.id);
                  const color = merged.color;
                  return (
                    <ContextMenu key={cls.id}>
                      <ContextMenuTrigger asChild>
                        <ClassCard
                          name={merged.name}
                          subtitle={scheduleSummary(cls.id)}
                          color={color}
                          variant="card"
                          draggable={!readOnly}
                          onDragStart={(e) => onClassDragStart(e, cls.id)}
                          data-class-id={cls.id}
                          className="draggable-class cursor-grab active:cursor-grabbing animate-fade-slide-up"
                          style={{ animationDelay: `${i * 40}ms` }}
                          actions={
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Amallar"
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-2 top-1/2 size-7 -translate-y-1/2 border border-border/50 bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-opacity opacity-100 md:opacity-0 md:group-hover/cc:opacity-100 data-[state=open]:opacity-100"
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem disabled={readOnly} onClick={() => setEditingClass(merged)}>
                                  <EditIcon />
                                  Tahrirlash
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" disabled={readOnly} onClick={() => removeClassFromSchedule(cls.id)}>
                                  <TrashIcon />
                                  Jadvaldan oʻchirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          }
                        />
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem disabled={readOnly} onClick={() => setEditingClass(merged)}>
                          <EditIcon />
                          Tahrirlash
                        </ContextMenuItem>
                        <ContextMenuItem variant="destructive" disabled={readOnly} onClick={() => removeClassFromSchedule(cls.id)}>
                          <TrashIcon />
                          Jadvaldan oʻchirish
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        </div>

      {/* ── Right: Dars jadvali ── */}
      <div className="min-w-0 min-h-0 grid">
        <Card className={panelCardClass} data-tour="timetable-grid">
          {/* Header */}
          <CardHeader className={cn(panelCardHeaderClass, "gap-3 border-b-0 min-h-[4.5rem] px-5 py-5")}>
            {/* Chap: sarlavha + versiya satri (ostki qatorda) */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SectionIcon>
                <Calendar />
              </SectionIcon>
              <div className="flex min-w-0 flex-col">
                <CardTitle>Dars jadvali</CardTitle>
                {versions.length > 0 && (
                  <VersionChip
                    variant="subtitle"
                    versions={versions}
                    selectedId={selectedVersionId}
                    todayKey={today}
                    onSelect={handleSelectVersion}
                    onCreateNew={() => { setDialogExplicit(true); setEffectiveDialogOpen(true); }}
                    onDeleteSelected={() => setDeleteConfirmOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* Markaz: koʻrinish rejimi */}
            <ToggleGroup
              type="single"
              value={snapMode}
              onValueChange={(v) => v && setSnapMode(v as "free" | "lesson")}
              variant="outline"
              size="default"
              aria-label="Koʻrinish rejimi"
              className="shrink-0 shadow-none"
            >
              <ToggleGroupItem value="free" className="gap-1.5 text-xs" title="Erkin: uzluksiz vaqt-grid, istalgan vaqtga qoʻyish">
                <MousePointer2 className="size-4" />
                <span className="hidden sm:inline">Erkin</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="lesson" className="gap-1.5 text-xs" title="Dars soatlari: tayyor katak grid (qoʻngʻiroq jadvali asosida)">
                <Magnet className="size-4" />
                <span className="hidden sm:inline">Dars soatlari</span>
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Oʻng: avto-saqlash holati + koʻproq amallar */}
            <div className="flex flex-1 items-center justify-end gap-2">
              <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex" aria-live="polite">
                {saved ? <Check className="size-3" strokeWidth={2.5} /> : <Loader2 className="size-3 animate-spin" strokeWidth={2} />}
                {saved ? "Saqlandi" : "Saqlanmoqda…"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Koʻproq amallar" className="shadow-none">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!readOnly && (
                    <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                      <SlidersHorizontal />
                      Qoʻngʻiroq jadvali
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={exportSchedule}>
                    <Download />
                    Eksport qilish
                  </DropdownMenuItem>
                  {events.length > 0 && !readOnly && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setClearOpen(true)}>
                        <TrashIcon />
                        Jadvalni tozalash
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tozalashni tasdiqlash (⋯ menyudan ochiladi) */}
            <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Jadvalni tozalash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Barcha qoʻyilgan darslar jadvaldan olib tashlanadi. Bu amalni ortga qaytarib boʻlmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setEvents([]); toast.success("Jadval tozalandi"); }} className="bg-destructive text-white hover:bg-destructive/90">Tozalash</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>

          {/* Versiya holati banneri — arxiv (qulflangan/ochilgan) va kelgusi versiyalar */}
          {mode === "past-locked" && (
            <div className="mx-6 mb-2 flex items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3.5 py-2 text-xs text-muted-foreground shrink-0">
              <Lock className="size-3.5 shrink-0" />
              <p className="flex-1 leading-snug">
                Arxiv jadval · {selectedRangeLabel}. Faqat koʻrish rejimi.
              </p>
              <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setUnlockConfirmOpen(true)}>
                Tahrirlashga ochish
              </Button>
            </div>
          )}
          {mode === "past-unlocked" && (
            <Alert className="mx-6 mb-2 shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <TriangleAlert />
              <AlertTitle>Arxiv tahrirlanmoqda</AlertTitle>
              <AlertDescription className="text-amber-700/90 dark:text-amber-400/90">
                Oʻzgarishlar {selectedRangeLabel} davri tarixiga taʼsir qiladi.
              </AlertDescription>
            </Alert>
          )}
          {mode === "future" && (
            <Alert className="mx-6 mb-2 shrink-0 text-muted-foreground">
              <CalendarClock />
              <AlertDescription>
                Bu jadval {fmtDayMonthUz(selectedVersion?.effectiveFrom ?? today)}dan kuchga kiradi.
              </AlertDescription>
            </Alert>
          )}

          {/* Hafta jadvali (kun × vaqt grid) */}
          <CardContent className={cn(panelCardContentClass, "relative flex flex-col overflow-hidden")} data-carousel-ignore="true">
            {snapMode === "free" && events.length === 0 && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-3 text-center rounded-xl border border-dashed border-border bg-background/90 backdrop-blur-sm px-10 py-8 shadow-sm">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Calendar className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Jadval hozircha boʻsh</p>
                    <p className="text-xs text-muted-foreground">Sinflarni chapdan shu yerga sudrab tashlang</p>
                  </div>
                </div>
              </div>
            )}

            {snapMode === "lesson" ? (
              <PeriodGrid
                periods={periods}
                events={events}
                classes={classesAll}
                getClass={getClass}
                profile={bellConfig.profile}
                readOnly={readOnly}
                onPlace={placeInPeriod}
                onAddClub={addClub}
                onRemove={removeEvent}
                onEditEvent={setEditEvent}
              />
            ) : (
            <>
            {/* Yagona scroll konteyneri: sticky sarlavha + grid bitta oqimda →
                ustunlar aniq mos keladi (scrollbar ikkalasiga ham bir xil taʼsir qiladi) */}
            <div ref={scrollRef} className="mx-6 my-2 min-h-0 flex-1 overflow-y-auto rounded-md border border-border [scrollbar-width:thin]">
              {/* Sarlavha (kun nomlari) — "Dars soatlari" headeri bilan bir xil dizayn */}
              <div className="sticky top-0 z-20 flex border-b border-border bg-muted">
                <div className="w-16 shrink-0 border-r border-border py-2.5 text-center text-[13px] font-semibold text-foreground/70">
                  Vaqt
                </div>
                {DAY_UZ.map((d, i) => (
                  <div key={d} className={cn("min-w-0 flex-1 truncate py-2.5 text-center text-sm font-medium text-foreground/80", i > 0 && "border-l border-border")}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid tanasi */}
              <div className="flex">
                {/* Vaqt oʻqi — soatlar soat chizigʻiga (tepaga) tekislangan */}
                <div className="w-16 shrink-0 border-r border-border">
                  {HOURS.map((h, idx) => (
                    <div key={h} style={{ height: HOUR_H }} className={cn("relative", idx > 0 && "border-t border-border")}>
                      <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[11px] font-medium tabular-nums text-muted-foreground">{minToHHMM(h * 60)}</span>
                    </div>
                  ))}
                </div>

                {/* Kun ustunlari */}
                {DAY_UZ.map((d, col) => {
                  const day = col + 1;
                  const dayEvents = events.filter(e => e.day === day);
                  return (
                    <div
                      key={d}
                      onDragOver={(e) => { if (readOnly) return; e.preventDefault(); e.dataTransfer.dropEffect = grabOffsetRef.current != null ? "move" : "copy"; if (dragOverDay !== day) setDragOverDay(day); }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDay(prev => (prev === day ? null : prev)); }}
                      onDrop={(e) => onColumnDrop(e, day)}
                      className={cn("relative min-w-0 flex-1 transition-colors", col > 0 && "border-l border-border/50", dragOverDay === day && "bg-primary/[0.04]")}
                      style={{ height: HOURS.length * HOUR_H }}
                    >
                      {/* 15-daqiqalik chiziqlar — :30 biroz aniqroq, :15/:45 eng xira */}
                      {HOURS.map((h, idx) => [1, 2, 3].map(q => (
                        <div key={`q-${h}-${q}`} className={cn("pointer-events-none absolute inset-x-0 border-t", q === 2 ? "border-border/50" : "border-border/25")} style={{ top: idx * HOUR_H + (q * HOUR_H) / 4 }} />
                      )))}
                      {/* Soat chiziqlari — aniqroq (asosiy) */}
                      {HOURS.map((h, idx) => (
                        idx > 0 ? <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border" style={{ top: idx * HOUR_H }} /> : null
                      ))}

                      {/* Darslar */}
                      {dayEvents.map(ev => {
                        const cls = getClass(ev.classId);
                        const tints = classTints(cls.color);
                        const top = ((ev.startMin - DAY_START_MIN) / 60) * HOUR_H;
                        const height = Math.max(((ev.endMin - ev.startMin) / 60) * HOUR_H, 22);
                        if (top + height < 0 || top > HOURS.length * HOUR_H) return null;
                        return (
                          <EventBlock
                            key={ev.id}
                            name={cls.name}
                            startMin={ev.startMin}
                            endMin={ev.endMin}
                            stripeColor={cls.color}
                            surface={tints.surfaceStrong}
                            softBorder={tints.borderMedium}
                            textStrong={tints.textStrong}
                            top={top}
                            height={height}
                            readOnly={readOnly}
                            resizable={snapMode === "free" && !readOnly}
                            onResize={(s, en) => onResizeEvent(ev.id, s, en)}
                            onDragStart={(e) => onEventDragStart(e, ev)}
                            onDragEnd={() => { grabOffsetRef.current = null; setDragOverDay(null); }}
                            onClick={() => { if (!readOnly) setEditEvent(ev); }}
                            onRemove={() => removeEvent(ev.id)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Edit dialog */}
      {editEvent && (
        <EditDialog
          event={editEvent}
          className={getClass(editEvent.classId).name}
          color={getClass(editEvent.classId).color}
          onSave={(patch) => { setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...patch } : e)); setEditEvent(null); }}
          onDelete={() => { removeEvent(editEvent.id); setEditEvent(null); }}
          onClose={() => setEditEvent(null)}
        />
      )}
      {createOpen && (
        <ClassFormModal
          mode="create"
          onSubmit={handleCreateClass}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editingClass && (
        <ClassFormModal
          mode="edit"
          initial={{
            name: editingClass.name,
            grade: editingClass.grade ?? null,
            subject: editingClass.subject ?? "",
            color: editingClass.color,
            icon: editingClass.icon,
            description: editingClass.description ?? "",
            slots: slotsForClass(editingClass.id),
          }}
          onSubmit={(v) => handleEditClass(editingClass.id, v)}
          onClose={() => setEditingClass(null)}
        />
      )}
      {settingsOpen && (
        <BellScheduleDialog
          config={bellConfig}
          onSave={(c) => { setBellConfig(c); setSettingsOpen(false); }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* "Qachondan kuchga kiradi?" — joriy jadval tahririda yoki "Yangi versiya…" da */}
      <EffectiveDateDialog
        open={effectiveDialogOpen}
        todayKey={today}
        takenDates={versions.map((v) => v.effectiveFrom)}
        allowInPlace={!dialogExplicit}
        onConfirm={applyEffectiveChoice}
        onCancel={dialogExplicit ? () => setEffectiveDialogOpen(false) : cancelEffectiveDialog}
      />

      {/* Arxivni tahrirlashga ochish tasdigʻi */}
      <AlertDialog open={unlockConfirmOpen} onOpenChange={setUnlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arxiv jadvalni tahrirlash?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu jadval {selectedRangeLabel} davrida amalda boʻlgan. Oʻzgarishlar oʻsha davr
              tarixiga (planner, davomat) taʼsir qiladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setArchiveUnlocked(true); setUnlockConfirmOpen(false); }}>
              Tahrirlashga ochish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Versiyani oʻchirish tasdigʻi */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Versiyani oʻchirish?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedVersion
                ? `«${fmtDayMonthUz(selectedVersion.effectiveFrom)}dan» versiyasi oʻchiriladi. Bu davr sanalari qoʻshni versiya jadvali bilan koʻrsatiladi.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVersion} className="bg-destructive text-white hover:bg-destructive/90">
              Oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  );
}

/* ─── Dars bloki (grid ichida) ─── */
function EventBlock({ name, startMin, endMin, stripeColor, surface, softBorder, textStrong, top, height, resizable, readOnly = false, onResize, onDragStart, onDragEnd, onClick, onRemove }: {
  name: string;
  startMin: number;
  endMin: number;
  stripeColor: ClassColor;
  surface: React.CSSProperties;
  softBorder: React.CSSProperties;
  textStrong: React.CSSProperties;
  top: number;
  height: number;
  resizable: boolean;
  /** Arxiv rejimi — drag/resize/oʻchirish oʻchadi */
  readOnly?: boolean;
  onResize: (newStart: number, newEnd: number) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onRemove: () => void;
}) {
  const [resizing, setResizing] = useState(false);

  // Tutqichni sudrash — yuqori yoki pastki chetdan davomiylikni oʻzgartiradi (15 daq snap)
  const startResize = (edge: "start" | "end") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    const startY = e.clientY;
    const origStart = startMin, origEnd = endMin;
    const onMove = (me: PointerEvent) => {
      const delta = snapMin(((me.clientY - startY) / HOUR_H) * 60);
      if (edge === "end") onResize(origStart, clamp(origEnd + delta, origStart + SNAP, DAY_END_MIN));
      else onResize(clamp(origStart + delta, DAY_START_MIN, origEnd - SNAP), origEnd);
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const compact = height < 58; // juda past bloklarda davomiylik qatorini yashiramiz

  return (
    <div
      draggable={!readOnly && !resizing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn("group/event isolate absolute left-1 right-1 overflow-hidden rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]", readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing", CLASS_CARD_INTERACTION)}
      style={{ top: top + 1, height: height - 2, ...surface, ...softBorder }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <CardStripes color={stripeColor} variant="cover" />
      <CardCorner color={stripeColor} className="-right-5 -top-5 size-16" />
      {!readOnly && (
        <button
          type="button"
          aria-label="Oʻchirish"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-0.5 right-0.5 z-20 flex size-5 cursor-pointer items-center justify-center rounded-sm opacity-100 transition-opacity hover:bg-foreground/10 md:opacity-0 md:group-hover/event:opacity-100"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
      <div className="flex flex-col gap-1.5 pb-2 pt-3 pl-2.5 pr-5">
        <span className="flex items-center gap-1.5">
          <span style={{ backgroundColor: CLASS_COLOR_HEX[stripeColor] }} className="h-3 w-0.5 shrink-0 rounded-full" aria-hidden />
          <span className="truncate text-[13px] font-semibold leading-tight text-foreground">{name}</span>
        </span>
        <span style={textStrong} className="flex items-center gap-1 truncate text-[11px] leading-tight opacity-90">
          <Clock2Icon className="size-2.5 shrink-0" />
          <span className="tabular-nums">{minToHHMM(startMin)} — {minToHHMM(endMin)}</span>
        </span>
        {!compact && (
          <span style={textStrong} className="flex items-center gap-1 truncate text-[11px] leading-tight opacity-75">
            <Hourglass className="size-2.5 shrink-0" />
            <span className="tabular-nums">{fmtDuration(endMin - startMin)}</span>
          </span>
        )}
      </div>

      {/* Oʻlcham (davomiylik) tutqichlari — faqat erkin rejimda */}
      {resizable && (
        <>
          <div draggable={false} onPointerDown={startResize("start")} className="absolute inset-x-0 top-0 z-10 h-2 cursor-ns-resize">
            <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground opacity-0 transition-opacity group-hover/event:opacity-40" aria-hidden />
          </div>
          <div draggable={false} onPointerDown={startResize("end")} className="absolute inset-x-0 bottom-0 z-10 h-2 cursor-ns-resize">
            <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground opacity-0 transition-opacity group-hover/event:opacity-40" aria-hidden />
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Edit dialog ─── */
function EditDialog({ event, className, color, onSave, onDelete, onClose }: {
  event: TimetableEvent;
  className: string;
  color: ClassColor;
  onSave: (p: Partial<TimetableEvent>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [st, setSt] = useState(minToHHMM(event.startMin));
  const [et, setEt] = useState(minToHHMM(event.endMin));
  const hex = CLASS_COLOR_HEX[color];
  const dayName = DAY_UZ[event.day - 1] ?? "";

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dars vaqtini tahrirlash</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sinf</Label>
            <div className="flex items-center gap-2.5 rounded-md border border-input bg-muted/40 px-3 py-2">
              <ClassSwatch hex={hex} className="size-2.5" />
              <span className="text-sm font-medium">{className}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{dayName} kuni vaqti</Label>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <TypographyLabel>Kirish</TypographyLabel>
                <div className="relative">
                  <Input
                    type="time"
                    value={st}
                    onChange={e => setSt(e.target.value)}
                    className="pr-9 [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <Clock2Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
              <span className="pb-2 text-muted-foreground">—</span>
              <div className="flex-1 space-y-1.5">
                <TypographyLabel>Chiqish</TypographyLabel>
                <div className="relative">
                  <Input
                    type="time"
                    value={et}
                    onChange={e => setEt(e.target.value)}
                    className="pr-9 [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <Clock2Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="soft-destructive" onClick={onDelete}>
            <TrashIcon />
            Oʻchirish
          </Button>
          <Button onClick={() => onSave({ startMin: hhmmToMin(st), endMin: hhmmToMin(et) })}>
            <SaveIcon />
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
