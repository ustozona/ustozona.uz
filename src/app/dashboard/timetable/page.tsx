"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { autoClassColor, CLASS_COLOR_HEX, CLASS_CARD_INTERACTION, type ClassColor } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses, useLiveClassesHydrated, useCreateClass, classInfoFromForm, classFormInitial } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { cn } from "@/lib/utils";
import { DAYS_UZ } from "@/lib/localization";
import { useCalendarFormat } from "@/components/calendar/format";
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { ClassFormModal, type ClassFormValues, type ClassSlot } from "@/components/ClassFormModal";
import { ClassCard } from "@/components/ClassCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypographyLabel } from "@/components/ui/typography";
import { EventCard } from "@/components/calendar/EventCard";
import { type TimetableEvent } from "@/lib/timetable";
import { subjectLabel } from "@/lib/standards-data";
import { type BellConfig, defaultBellConfig, computePeriods, remapEventsForBellChange } from "@/lib/bell-schedule";
import PeriodGrid, { type TimetableClass } from "@/components/timetable/PeriodGrid";
import { TimetablePrintSheet } from "@/components/timetable/TimetablePrintSheet";
import BellScheduleDialog from "@/components/timetable/BellScheduleDialog";
import EffectiveDateDialog, { type EffectiveChoice } from "@/components/timetable/EffectiveDateDialog";
import VersionChip, { versionRangeLabel } from "@/components/timetable/VersionChip";
import TimetableCoverageBanner from "@/components/timetable/TimetableCoverageBanner";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeTimetableTourDemo } from "@/components/tour/timetable-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";
import { resolveVersionForDate, sortVersions } from "@/lib/timetable-versions";
import { fmtDayMonthUz } from "@/lib/academic-calendar";
import { todayKey as getTodayKey } from "@/lib/date-keys";
import { minToHHMM, hhmmToMin, snapMin, clamp } from "@/lib/calendar-core/date-math";
import { TimeGrid, type TimeGridColumn } from "@/components/calendar/TimeGrid";
import { SavedIndicator } from "@/app/dashboard/settings/_components/SettingsShared";
import { toast } from "sonner";
import { Clock2Icon, XIcon, TrashIcon, SaveIcon, PlusIcon, GraduationCap, Calendar, CalendarDays, Table, GripVertical, MoreVertical, MoreHorizontal, Printer, PencilIcon as EditIcon, SlidersHorizontal, Lock, CalendarClock, TriangleAlert, CircleDot, CheckCheck } from "lucide-react";

/* ─── Types ─── */
/* TimetableEvent — @/lib/timetable dan (takrorlanuvchi haftalik shablon).
   Jadvalning yagona manbasi endi useTimetableStore (versiyalangan
   snapshotlar); bu sahifa tanlangan versiyaning LOKAL QORALAMASINI
   tahrirlaydi va 600ms debounce bilan store'ga commit qiladi.
   Sinf roʻyxati — JONLI (useLiveClasses); yaratish/tahrirlash bevosita
   useGradesStore'ga yoziladi va serverga sinxronlanadi. */

const TIP_KEY = "murabbiyona-timetable-drag-tip-v1";
const FUTURE_TIP_KEY = "murabbiyona-timetable-future-tip-dismissed-v1";
// ClassFormModal bilan qiymat-protokoli: slot.day = OʻZBEKCHA kun nomi
// (indexOf bilan qayta raqamlanadi) — bu roʻyxat DISPLAY uchun emas.
// Koʻrsatish endi useCalendarFormat (Calendar namespace) orqali.
const DAY_UZ = DAYS_UZ.slice(0, 6);

/* ─── Grid oʻlchamlari — toʻliq 24 soat (00:00–24:00) ─── */
const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_H = 180;                // 1 soat balandligi (px) — planner bilan bir xil
/* Shundan baland kartada fan va vaqt alohida qatorga ajraydi (sarlavha +
   ikki qator ≈ 12px padding × 2 + 3 qator matn). Pastroqda ikkinchi qator
   kartadan chiqib ketardi — u yerda `·` bilan bitta qator qoladi. */
const STACKED_SUBTITLE_MIN_H = 84;
const SNAP = 15;                   // daqiqada tutilish (snap)
const DEFAULT_DURATION = 45;       // yangi dars uzunligi (daqiqa)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const DAY_START_MIN = START_HOUR * 60;
const DAY_END_MIN = END_HOUR * 60;
/** Boshlanishida koʻrsatiladigan soat (maktab boshlanishi) */
const INITIAL_SCROLL_HOUR = 8;

function uid() { return Math.random().toString(36).slice(2, 9); }


/** Qoʻngʻiroq jadvali nusxasi — draft va snapshot orasida shared reference qolmasin. */
function cloneBell(c: BellConfig): BellConfig {
  return { profile: c.profile, shift1: { ...c.shift1 }, shift2: { ...c.shift2 } };
}

/** Kalit tartibidan qatʼi nazar barqaror JSON. Postgres JSONB obyekt
    kalitlarini qayta tartiblab qaytaradi (bellConfig: profile/shift1/shift2 →
    shift1/shift2/profile), oddiy JSON.stringify solishtiruvi shu sabab
    hydratsiyadan soʻng yolgʻon "oʻzgarish bor" berib, "qachondan?" dialogini
    oʻz-oʻzidan ochib yuborardi. */
function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export default function TimetablePage() {
  const t = useTranslations("TimetablePage");
  const fmt = useCalendarFormat();
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(true);
  /** Har haqiqiy commit'da +1 — SavedIndicator shu signalga qarab vaqtinchalik chip koʻrsatadi. */
  const [savedSignal, setSavedSignal] = useState(0);
  const [editEvent, setEditEvent] = useState<TimetableEvent | null>(null);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  /** "free" — uzluksiz vaqt-grid (erkin); "lesson" — tayyor katak grid (dars soatlari) */
  const [snapMode, setSnapMode] = useState<"free" | "lesson">("free");
  /** "lesson" + 2-smenali profilda koʻrsatiladigan smena — dropdown headerda */
  const [periodShift, setPeriodShift] = useState<1 | 2 | "both">(1);
  /** Qoʻngʻiroq jadvali sozlamasi (smena + dars/tanaffus vaqtlari) */
  const [bellConfig, setBellConfig] = useState<BellConfig>(defaultBellConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ── Versiyalash holati ── */
  const versions = useTimetableStore((s) => s.versions);
  // Faol oʻquv yili — versiya roʻyxati shu yil bilan cheklanadi (VersionChip).
  const activeCalendar = useCalendarStore((s) => s.calendar);
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
  /** Versiya endigina almashdi (qoralama snapshotdan qayta qurilmoqda) —
      commit-effect shu renderda hali eski `events`ni koʻradi, uni oʻtkazib
      yubormasa yolgʻon "oʻzgarish bor" deb "qachondan?" dialogini ochib yuboradi. */
  const justSwitchedRef = useRef(false);

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

  /** Joriy versiya oraligʻida (effectiveFrom … bugungacha) biror sinfda davomat
      yozuvi bormi — "qachondan?" savoli shunga qarab beriladi. Yil boshi/
      sozlash paytida (yozuv yoʻq) savol umuman chiqmaydi.
      ⚠️ Store hydratsiyasi tugamagunча EHTIYOTKOR javob: `true`. Aks holda
      sahifa ochilgan zahoti qilingan tahrir "davomat yoʻq" deb hisoblanib,
      oʻtmishni jimgina qayta yozib yuborardi. */
  const attendanceRecords = useAttendanceStore((s) => s.recordsByClass);
  const attendanceHydrated = useAttendanceStore((s) => s._hasHydrated);
  const attendanceAtRisk = useMemo(() => {
    if (!selectedVersion || selectedVersion.effectiveFrom > today) return false;
    if (!attendanceHydrated) return true;
    for (const recs of Object.values(attendanceRecords)) {
      for (const r of recs) {
        if (r.date >= selectedVersion.effectiveFrom && r.date < today) return true;
      }
    }
    return false;
  }, [attendanceRecords, attendanceHydrated, selectedVersion, today]);

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
      section: c.section,
      label: c.label,
      subject: c.subject,
      icon: c.icon as TimetableClass["icon"],
    })),
    [liveClasses]
  );
  const classById = useMemo(() => new Map(classesAll.map((c) => [c.id, c])), [classesAll]);

  // ── Tur-demo rejimi — jadval turʼi boʻsh hisobda ochilsa, boʻsh
  //    panellar namunaviy sinf/dars bilan toʻldiriladi (faqat vizual,
  //    hech narsa store'ga yozilmaydi) — [[home-tour-demo]] bilan bir xil naqsh.
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "timetable");
  const tourDemo = useMemo(() => (tourDemoActive ? makeTimetableTourDemo() : null), [tourDemoActive]);
  const isDemoMode = tourDemo != null && classesAll.length === 0;
  const classesDisplay = isDemoMode ? tourDemo!.classes : classesAll;
  const eventsDisplay = isDemoMode ? tourDemo!.events : events;
  const classByIdDisplay = useMemo(() => new Map(classesDisplay.map((c) => [c.id, c])), [classesDisplay]);

  /** Qoʻngʻiroq jadvalidan hisoblangan period qatorlari ("1-soat" …) */
  const periods = useMemo(() => computePeriods(bellConfig), [bellConfig]);

  /** Event sinfi — jonli roʻyxatdan; oʻchirilgan/legacy id uchun barqaror fallback */
  const getClass = useCallback((id: string): TimetableClass => {
    return classById.get(id) ?? { id, name: t("unknownClass"), color: autoClassColor(id) };
  }, [classById, t]);
  const getClassDisplay = useCallback((id: string): TimetableClass => {
    return classByIdDisplay.get(id) ?? { id, name: t("unknownClass"), color: autoClassColor(id) };
  }, [classByIdDisplay, t]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Sozlamalardagi "Dars jadvalida sozlash" havolasi: ?bell=1 → qoʻngʻiroq
  // dialogini ochib, paramni URL'dan tozalaymiz (router.replace remount
  // qilgani uchun history.replaceState).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("bell") !== "1") return;
    setSettingsOpen(true);
    sp.delete("bell");
    const qs = sp.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  // Store hydratsiyasidan soʻng bugun amaldagi versiyani tanlash
  useEffect(() => {
    if (!storeHydrated || versions.length === 0 || selectedVersionId) return;
    setSelectedVersionId(resolveVersionForDate(versions, today)?.id ?? sortVersions(versions)[0].id);
  }, [storeHydrated, versions, selectedVersionId, today]);

  // Versiya almashganda — qoralama shu versiya snapshotidan qayta quriladi
  useEffect(() => {
    if (!selectedVersion) return;
    justSwitchedRef.current = true;
    setEvents(selectedVersion.events.map((e) => ({ ...e })));
    setBellConfig(cloneBell(selectedVersion.bellConfig));
    setSaved(true);
    setDecisionMade(false);
    setArchiveUnlocked(false);
    // Faqat versiya almashganda (id) — commit'dan keyingi snapshot yangilanishida emas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionId, storeHydrated]);

  /* Commit oqimi (qoralama → nashr): qoralama snapshotdan farq qilsa 600ms
     debounce, soʻng avto-commit. Joriy jadvalda esa oʻzgarish avtomatik
     QOʻLLANMAYDI — "qachondan?" hal qilinmaguncha qoralama kutib turadi va
     ustida «Qoʻllash…» paneli chiqadi. Arxiv-ochiq va kelgusi versiyalar,
     shuningdek boʻsh jadvalning birinchi toʻldirilishi — toʻgʻridan-toʻgʻri. */
  useEffect(() => {
    if (!hydrated || !storeHydrated || !selectedVersion) return;
    if (justSwitchedRef.current) { justSwitchedRef.current = false; return; }
    const dirty =
      stableStringify(events) !== stableStringify(selectedVersion.events) ||
      stableStringify(bellConfig) !== stableStringify(selectedVersion.bellConfig);
    if (!dirty) { setSaved(true); return; }
    setSaved(false);
    const timer = setTimeout(() => {
      // Boʻsh jadval birinchi marta toʻldirilmoqda — saqlanadigan "eski
      // tartib" yoʻq, "qachondan?" savoli maʼnosiz; jimgina joriy versiyaga
      // yozamiz va sessiya davomida boshqa soʻramaymiz.
      const firstFill = selectedVersion.events.length === 0;
      // Qaror kutilmoqda — qoralama joyida qoladi, panel foydalanuvchini
      // «Qoʻllash…» ga chaqiradi. Modal bilan ish oʻrtasida toʻsilmaydi.
      if (mode === "current" && !decisionMade && !firstFill) return;
      if (firstFill && mode === "current") setDecisionMade(true);
      commitDraft(selectedVersion.id, events, bellConfig);
      setSaved(true);
      setSavedSignal((n) => n + 1);
    }, 600);
    return () => clearTimeout(timer);
  }, [events, bellConfig, hydrated, storeHydrated, selectedVersion, mode, decisionMade, commitDraft]);

  /** Qoʻllanmagan oʻzgarishlar soni — panel matni uchun (event qoʻshildi/
      oʻzgardi/oʻchdi; qoʻngʻiroq jadvali oʻzgarishi bitta deb sanaladi). */
  const pendingCount = useMemo(() => {
    if (!selectedVersion) return 0;
    const before = new Map(selectedVersion.events.map((e) => [e.id, stableStringify(e)]));
    let n = 0;
    for (const e of events) {
      const prev = before.get(e.id);
      if (prev === undefined || prev !== stableStringify(e)) n += 1;
      before.delete(e.id);
    }
    n += before.size;
    if (stableStringify(bellConfig) !== stableStringify(selectedVersion.bellConfig)) n += 1;
    return n;
  }, [events, bellConfig, selectedVersion]);

  /** Qoralama qoʻllashni kutmoqda — joriy jadvalga tegadi, lekin
      "qachondan?" hali hal qilinmagan. */
  const awaitingApply =
    !saved && mode === "current" && !decisionMade && pendingCount > 0 &&
    (selectedVersion?.events.length ?? 0) > 0;

  /** Qaror soʻralmagan holda qoralamani XAVFSIZ saqlash — modalning default
      yoʻli ("Bugundan"): bugundan yangi versiya ochiladi, oldingi kunlar eski
      jadvalda qoladi. Joriy versiya allaqachon bugundan boshlangan boʻlsa
      (yoki yangi versiya ochib boʻlmasa) oʻsha versiyaning oʻziga yoziladi —
      bu holda oʻtmish baribir qayta yozilmaydi. */
  const commitSafely = useCallback(() => {
    if (!selectedVersion) return;
    if (selectedVersion.effectiveFrom === today) {
      commitDraft(selectedVersion.id, events, bellConfig);
      return;
    }
    const id = createVersion({ effectiveFrom: today, baseId: selectedVersion.id });
    commitDraft(id ?? selectedVersion.id, events, bellConfig);
    if (id) setSelectedVersionId(id);
  }, [selectedVersion, today, createVersion, commitDraft, events, bellConfig]);

  // Sahifadan chiqishda kutayotgan (debounce'dagi) oʻzgarish bekor boʻlib qolmasin —
  // unmount paytida joriy qoralamani darhol commit qilamiz. flush closure'ni har
  // renderdan keyin effektda yangilaymiz (render paytida ref yozilmasin deb).
  // ⚠️ Qaror kutilayotgan boʻlsa (`awaitingApply`) joriy versiyaga YOZILMAYDI —
  // u "Boshidan" degani boʻlib, oʻtmishni foydalanuvchi tanlamagan holda qayta
  // yozardi. Oʻrniga xavfsiz default: bugundan yangi versiya.
  const flushRef = useRef<() => void>(() => {});
  useEffect(() => {
    flushRef.current = () => {
      if (!selectedVersion || saved) return;
      if (awaitingApply) commitSafely();
      else commitDraft(selectedVersion.id, events, bellConfig);
    };
  });
  useEffect(() => () => flushRef.current(), []);

  /* ── Versiya amallari ── */

  const revertDraft = useCallback(() => {
    if (!selectedVersion) return;
    setEvents(selectedVersion.events.map((e) => ({ ...e })));
    setBellConfig(cloneBell(selectedVersion.bellConfig));
    setSaved(true);
  }, [selectedVersion]);

  /** Bekor qilishdan oldingi qoralama — "Qaytarish" toast'i uchun. */
  const discardedRef = useRef<{ events: TimetableEvent[]; bellConfig: BellConfig } | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  /** Bekor qilish + bir bosishli qaytarish taklifi. */
  const discardDraft = useCallback(() => {
    discardedRef.current = { events: events.map((e) => ({ ...e })), bellConfig: cloneBell(bellConfig) };
    revertDraft();
    setDiscardConfirmOpen(false);
    toast(t("discardedToast", { count: pendingCount }), {
      action: {
        label: t("undo"),
        onClick: () => {
          const snap = discardedRef.current;
          if (!snap) return;
          setEvents(snap.events);
          setBellConfig(snap.bellConfig);
        },
      },
    });
  }, [events, bellConfig, revertDraft, pendingCount, t]);

  // Koʻp ish yoʻqolayotgan boʻlsa avval tasdiq soʻraladi (5+ oʻzgarish) —
  // undo toast'i qisqa umr koʻradi, katta ishga yetarli kafolat emas.
  const requestDiscard = useCallback(() => {
    if (pendingCount >= 5) setDiscardConfirmOpen(true);
    else discardDraft();
  }, [pendingCount, discardDraft]);

  // Versiya almashtirish — NAVIGATSIYA amali, savol berish uchun joy emas.
  // Ilgari bu yerda "qachondan?" modali ochilardi va bekor qilinsa bosilgan
  // versiya jimgina ochilmay qolardi. Endi qoralama darhol saqlanadi:
  // qaror kutilayotgan boʻlsa xavfsiz default (bugundan yangi versiya),
  // aks holda joyida commit. Keyin almashish har doim amalga oshadi.
  const handleSelectVersion = useCallback((id: string) => {
    if (id === selectedVersionId) return;
    if (!saved && selectedVersion) {
      if (awaitingApply) commitSafely();
      else commitDraft(selectedVersion.id, events, bellConfig);
    }
    setSelectedVersionId(id);
  }, [selectedVersionId, saved, selectedVersion, awaitingApply, commitSafely, commitDraft, events, bellConfig]);

  const applyEffectiveChoice = useCallback((choice: EffectiveChoice) => {
    if (!selectedVersion) return;
    // "Bugundan" tanlandi, lekin joriy versiya aynan bugundan boshlangan —
    // yangi versiya emas, oʻshа versiyaga yoziladi (dublikat sana boʻlmaydi).
    const asInPlace =
      choice.kind === "in-place" ||
      (choice.kind === "new" && choice.effectiveFrom === selectedVersion.effectiveFrom);
    if (asInPlace) {
      commitDraft(selectedVersion.id, events, bellConfig);
      setDecisionMade(true);
      setSaved(true);
      setSavedSignal((n) => n + 1);
      toast.success(t("scheduleSavedToast"));
    } else {
      const id = createVersion({ effectiveFrom: choice.effectiveFrom, baseId: selectedVersion.id });
      if (!id) { toast.error(t("versionExistsError")); return; }
      // "Bugundan" — yangi versiya joriy boʻlib qoladi; keyingi tahrirlar
      // shu sessiyada qayta soʻralmasin.
      if (choice.effectiveFrom <= today) setDecisionMade(true);
      // Yangi versiya qoralamadagi holatni oladi; eski versiya snapshoti oʻzgarmaydi
      commitDraft(id, events, bellConfig);
      toast.success(t("newVersionToast", { date: fmtDayMonthUz(choice.effectiveFrom) }));
      setSelectedVersionId(id);
    }
    setEffectiveDialogOpen(false);
  }, [selectedVersion, commitDraft, createVersion, events, bellConfig, today]);

  /* ── "Saqlash" — paneldan yoki ⌘/Ctrl+S ──
     Odatiy holat: shunchaki xatoni tuzatish. Modal CHIQMAYDI — oʻzgarish
     joriy versiyaga yoziladi (in-place). Modal faqat oʻzgarish oʻtgan
     davomatga taʼsir qilishi mumkin boʻlgandagина ochiladi ("Bugundan"
     yangi versiya yoki "Boshidan" qayta yozish tanlovi bilan). Aniq
     kelajak sana — versiyalar roʻyxatidagi "Yangi sanadan…" da. */
  const saveChanges = useCallback(() => {
    if (attendanceAtRisk) {
      setDialogExplicit(false);
      setEffectiveDialogOpen(true);
    } else {
      applyEffectiveChoice({ kind: "in-place" });
    }
  }, [attendanceAtRisk, applyEffectiveChoice]);

  // Dialogni bekor qilish QORALAMAGA TEGMAYDI — savol bekor qilinadi, ish emas.
  const cancelEffectiveDialog = useCallback(() => {
    setEffectiveDialogOpen(false);
  }, []);

  /* Klaviatura — panel koʻringanda: ⌘/Ctrl+S asosiy amal, Esc bekor qilish.
     Modal/dialog ochiq boʻlsa tegmaymiz (Esc oʻsha yerga tegishli), matn
     kiritilayotganda ham (Esc input'ni tark etish uchun kerak). */
  useEffect(() => {
    if (!awaitingApply) return;
    const onKey = (e: KeyboardEvent) => {
      if (effectiveDialogOpen || discardConfirmOpen) return;
      const el = e.target as HTMLElement | null;
      if (el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? "")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveChanges();
      } else if (e.key === "Escape") {
        e.preventDefault();
        requestDiscard();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [awaitingApply, effectiveDialogOpen, discardConfirmOpen, saveChanges, requestDiscard]);

  const confirmDeleteVersion = useCallback(() => {
    if (!selectedVersion || versions.length <= 1) return;
    const remaining = versions.filter((v) => v.id !== selectedVersion.id);
    deleteVersion(selectedVersion.id);
    setSelectedVersionId(
      resolveVersionForDate(remaining, today)?.id ?? sortVersions(remaining)[0]?.id ?? null
    );
    setDeleteConfirmOpen(false);
  }, [selectedVersion, versions, deleteVersion, today]);

  // Jadvalni PDF sifatida eksport qilish — brauzerning chop etish dialogi
  // (A4 landshaft) orqali, TimetablePrintSheet komponenti pastda chop uchun render qilinadi.
  const exportSchedule = useCallback(() => {
    if (events.length === 0) {
      toast.error(t("exportEmptyError"));
      return;
    }
    window.print();
  }, [events, t]);

  // Birinchi foydalanishda drag maslahati (bir martalik, localStorage)
  useEffect(() => {
    try { if (!localStorage.getItem(TIP_KEY)) setShowTip(true); } catch {}
  }, []);
  const dismissTip = useCallback(() => {
    try { localStorage.setItem(TIP_KEY, "1"); } catch {}
    setShowTip(false);
  }, []);

  // "Kelgusi jadval" xabari — versiya boʻyicha bir martalik (localStorage)
  const [dismissedFutureIds, setDismissedFutureIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FUTURE_TIP_KEY);
      if (raw) setDismissedFutureIds(JSON.parse(raw));
    } catch {}
  }, []);
  const dismissFutureTip = useCallback((id: string) => {
    setDismissedFutureIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try { localStorage.setItem(FUTURE_TIP_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeEvent = useCallback((id: string) => setEvents(prev => prev.filter(e => e.id !== id)), []);

  // Sinfning barcha darslarini jadvaldan olib tashlash — Qaytarish (undo) bilan.
  const removeClassFromSchedule = useCallback((classId: string) => {
    const removed = events.filter(ev => ev.classId === classId);
    if (removed.length === 0) return;
    setEvents(prev => prev.filter(ev => ev.classId !== classId));
    toast.success(t("classRemovedToast"), {
      action: { label: t("undo"), onClick: () => setEvents(prev => [...prev, ...removed]) },
    });
  }, [events, t]);

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
    handleSaveClassSlots(createClass(values), values.slots);
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
    if (evs.length === 0) return t("notScheduled");
    const seen = new Set<string>();
    const parts: { order: number; text: string }[] = [];
    evs.forEach(e => {
      const idx = e.day - 1;
      if (idx < 0 || idx > 5) return;
      const text = `${fmt.dayShort(idx + 1)} ${minToHHMM(e.startMin)}`;
      if (seen.has(text)) return;
      seen.add(text);
      parts.push({ order: idx * 1440 + e.startMin, text });
    });
    parts.sort((a, b) => a.order - b.order);
    if (parts.length <= 2) return parts.map(p => p.text).join(", ");
    return `${parts[0].text}, ${parts[1].text} +${parts.length - 2}`;
  }, [events, t]);

  // Boshlanishida (va "Taqvim" rejimiga qaytganda — TimeGrid qayta mount boʻladi)
  // gridʼni maktab soatiga (yoki eng erta darsga) suradi
  useEffect(() => {
    if (!hydrated || snapMode !== "free" || !scrollRef.current) return;
    const hasEvents = events.length > 0;
    const earliest = hasEvents ? Math.min(...events.map(e => e.startMin)) : INITIAL_SCROLL_HOUR * 60;
    const offsetMin = hasEvents ? 15 : 30;
    scrollRef.current.scrollTop = Math.max(0, (earliest / 60) * HOUR_H - (offsetMin / 60) * HOUR_H);
    // faqat mount boʻlganda — events oʻzgarganda qayta surmaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, snapMode]);

  if (!hydrated || !storeHydrated || !liveHydrated) return null;

  /** Arxiv/kelgusi banner matnlari uchun tanlangan versiya davri */
  const selectedRangeLabel = selectedVersion ? versionRangeLabel(versions, selectedVersion) : "";

  return (
    <DashboardPageLayout className="h-full">
      <TourDemoBanner tourId="timetable" active={isDemoMode} />
      {/* Chap ustun minmax bilan: sidebar ochilib joy torayganda ham panel
          300px dan tor boʻlmaydi — kartalar siqilib qolmaydi. */}
      <div className={cn(dashboardSplitGridClass, "grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_3fr]")}>
        {/* ── Left: Sinflar ── */}
        <div className="min-w-0 min-h-0 grid">
        <Card className={cn(panelCardClass)} data-tour="timetable-class-selector">
          {/* Header */}
          <CardHeader className={cn(panelCardHeaderClass, "gap-3 border-b min-h-16 px-5 pt-4! pb-4!")}>
            <SectionIcon>
              <GraduationCap />
            </SectionIcon>
            <CardTitle>{t("classesTitle")}</CardTitle>
            {classesAll.length > 0 && (
              <Button variant="ghost" size="sm" disabled={readOnly} className="ml-auto shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setCreateOpen(true)}>
                <PlusIcon className="size-4" />
                {t("add")}
              </Button>
            )}
          </CardHeader>

          {/* Birinchi foydalanish maslahati (bir martalik) */}
          {showTip && classesAll.length > 0 && (
            <div className="mx-5 mb-3 mt-3 flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
              <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />
              <p className="flex-1 leading-snug">{t("dragTip")}</p>
              <button type="button" onClick={dismissTip} aria-label={t("closeAria")} className="shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground">
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
                {classesDisplay.length === 0 && (
                  <Empty className="py-8">
                    <EmptyHeader>
                      <EmptyMedia><Illustration name="23" className="h-32 text-black dark:text-white" /></EmptyMedia>
                      <EmptyTitle>{t("noClassesTitle")}</EmptyTitle>
                      <EmptyDescription>
                        {t("noClassesDescription")}
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button onClick={() => setCreateOpen(true)} disabled={readOnly} className="gap-1.5">
                        <PlusIcon className="size-4" /> {t("addClass")}
                      </Button>
                    </EmptyContent>
                  </Empty>
                )}
                {classesDisplay.map((cls, i) => {
                  const isDemo = isDemoMode;
                  const merged = isDemo ? cls : getClass(cls.id);
                  const color = merged.color;
                  return (
                    <ContextMenu key={cls.id}>
                      <ContextMenuTrigger asChild>
                        <ClassCard
                          name={merged.name}
                          subtitle={isDemo ? "" : scheduleSummary(cls.id)}
                          color={color}
                          variant="card"
                          draggable={!readOnly && !isDemo}
                          onDragStart={(e) => onClassDragStart(e, cls.id)}
                          data-class-id={cls.id}
                          className={cn("draggable-class animate-fade-slide-up", isDemo ? "pointer-events-none" : "cursor-grab active:cursor-grabbing")}
                          style={{ animationDelay: `${i * 40}ms` }}
                          actions={
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={t("actionsAria")}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-2 top-1/2 size-7 -translate-y-1/2 border border-border/50 bg-card/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-opacity opacity-100 md:opacity-0 md:group-hover/cc:opacity-100 data-[state=open]:opacity-100"
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem disabled={readOnly} onClick={() => setEditingClass(merged)}>
                                  <EditIcon />
                                  {t("edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" disabled={readOnly} onClick={() => removeClassFromSchedule(cls.id)}>
                                  <TrashIcon />
                                  {t("removeFromSchedule")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          }
                        />
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem disabled={readOnly} onClick={() => setEditingClass(merged)}>
                          <EditIcon />
                          {t("edit")}
                        </ContextMenuItem>
                        <ContextMenuItem variant="destructive" disabled={readOnly} onClick={() => removeClassFromSchedule(cls.id)}>
                          <TrashIcon />
                          {t("removeFromSchedule")}
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
          {/* border-b-0: ostida darhol jadval grid chizigʻi boshlanadi, ikkinchi ajratuvchi ortiqcha — panel-language-v1 "no-divider" istisnosi */}
          <CardHeader className={cn(panelCardHeaderClass, "border-b-0 gap-3 pt-4! pb-4!")}>
            {/* Chap: sarlavha + versiya satri (ostki qatorda) */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SectionIcon>
                <Calendar />
              </SectionIcon>
              <div className="flex min-w-0 flex-col">
                <CardTitle>{t("scheduleTitle")}</CardTitle>
                {versions.length > 0 && (
                  <VersionChip
                    variant="subtitle"
                    versions={versions}
                    selectedId={selectedVersionId}
                    todayKey={today}
                    onSelect={handleSelectVersion}
                    onCreateNew={() => { setDialogExplicit(true); setEffectiveDialogOpen(true); }}
                    onDeleteSelected={() => setDeleteConfirmOpen(true)}
                    activeYear={{ label: activeCalendar.yearLabel, range: activeCalendar.range }}
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
              className="shrink-0"
              aria-label={t("viewModeAria")}
            >
              <ToggleGroupItem value="free" className="gap-1.5 text-xs" title={t("calendarModeTitle")}>
                <CalendarDays className="size-4" />
                <span className="hidden sm:inline">{t("calendarMode")}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="lesson" className="gap-1.5 text-xs" title={t("gridModeTitle")}>
                <Table className="size-4" />
                <span className="hidden sm:inline">{t("gridMode")}</span>
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Oʻng: avto-saqlash holati + koʻproq amallar */}
            <div className="flex flex-1 items-center justify-end gap-2">
              <SavedIndicator signal={savedSignal} />
              {/* 2-smenali profilda: qaysi smena koʻrsatilishi (faqat "Jadval" rejimida) */}
              {snapMode === "lesson" && bellConfig.profile === "double" && (
                <Select value={String(periodShift)} onValueChange={(v) => setPeriodShift(v === "both" ? "both" : (Number(v) as 1 | 2))}>
                  <SelectTrigger className="shrink-0 text-sm" aria-label={fmt.t("shiftFilterAria")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="1">{fmt.t("firstShift")}</SelectItem>
                    <SelectItem value="2">{fmt.t("secondShift")}</SelectItem>
                    <SelectItem value="both">{fmt.t("bothShifts")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={t("moreActionsAria")} className="shadow-none">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!readOnly && (
                    <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                      <SlidersHorizontal />
                      {t("bellSchedule")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={exportSchedule}>
                    <Printer />
                    {t("exportAction")}
                  </DropdownMenuItem>
                  {events.length > 0 && !readOnly && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setClearOpen(true)}>
                        <TrashIcon />
                        {t("clearSchedule")}
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
                  <AlertDialogTitle>{t("clearConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("clearConfirmDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setEvents([]); toast.success(t("clearedToast")); }} className="bg-destructive text-white hover:bg-destructive/90">{t("clear")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>

          {/* Versiya holati banneri — arxiv (qulflangan/ochilgan) va kelgusi versiyalar */}
          {mode === "past-locked" && (
            <div className="mx-6 mb-2 flex items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3.5 py-2 text-xs text-muted-foreground shrink-0">
              <Lock className="size-3.5 shrink-0" />
              <p className="flex-1 leading-snug">
                {t("archiveBanner", { range: selectedRangeLabel })}
              </p>
              <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setUnlockConfirmOpen(true)}>
                {t("unlockToEdit")}
              </Button>
            </div>
          )}
          {mode === "past-unlocked" && (
            <Alert className="mx-6 mb-2 shrink-0 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <TriangleAlert />
              <AlertTitle>{t("archiveEditingTitle")}</AlertTitle>
              <AlertDescription className="text-amber-700/90 dark:text-amber-400/90">
                {t("archiveEditingDescription", { range: selectedRangeLabel })}
              </AlertDescription>
            </Alert>
          )}
          {mode === "future" && selectedVersion && !dismissedFutureIds.includes(selectedVersion.id) && (
            <Alert variant="info" className="mx-6 mb-2 flex w-auto shrink-0 items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <CalendarClock className="size-4 shrink-0" />
                <AlertDescription className="truncate">
                  {t("futureVersionNotice", { date: fmtDayMonthUz(selectedVersion.effectiveFrom) })}
                </AlertDescription>
              </span>
              <button
                type="button"
                onClick={() => dismissFutureTip(selectedVersion.id)}
                aria-label={t("closeAria")}
                className="shrink-0 rounded-md p-1 text-current/60 transition-colors hover:bg-blue-500/10 hover:text-current"
              >
                <XIcon className="size-3.5" />
              </button>
            </Alert>
          )}

          {/* Jadval faol oʻquv yili boshini qoplamasa — bir bosishli tuzatish */}
          {!isDemoMode && <TimetableCoverageBanner className="mx-6 mb-2 shrink-0" />}

          {/* Hafta jadvali (kun × vaqt grid) */}
          <CardContent
            className={cn(panelCardContentClass, "relative flex flex-col overflow-hidden")}
            data-carousel-ignore="true"
          >
            {snapMode === "free" && eventsDisplay.length === 0 && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
                <Empty className="pointer-events-none w-auto">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Calendar />
                    </EmptyMedia>
                    <EmptyTitle>{t("scheduleEmptyTitle")}</EmptyTitle>
                    <EmptyDescription>
                      {t("scheduleEmptyDescription")}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            )}

            {snapMode === "lesson" ? (
              <PeriodGrid
                periods={periods}
                events={eventsDisplay}
                classes={classesDisplay}
                getClass={isDemoMode ? getClassDisplay : getClass}
                profile={bellConfig.profile}
                shift={periodShift}
                readOnly={readOnly || isDemoMode}
                onPlace={placeInPeriod}
                onAddClub={addClub}
                onRemove={removeEvent}
                onEditEvent={setEditEvent}
              />
            ) : (
            <TimeGrid
              scrollRef={scrollRef}
              startHour={START_HOUR}
              endHour={END_HOUR}
              pxPerHour={HOUR_H}
              gutterWidth={64}
              gutterVariant="centered"
              lines="quarter"
              gutterHeader={
                <div className="py-2.5 text-center text-[13px] font-semibold text-foreground/70">{t("time")}</div>
              }
              className="mx-6 mb-6 mt-2 h-auto min-h-0 flex-1 rounded-md border border-border [scrollbar-width:thin]"
              columns={DAY_UZ.map((_, col): TimeGridColumn => {
                const day = col + 1;
                return {
                  key: String(day),
                  header: fmt.dayName(day),
                  headerProps: { className: "min-w-0 truncate py-2.5 text-center text-sm font-medium text-foreground/80" },
                  columnProps: {
                    onDragOver: (e) => { if (readOnly || isDemoMode) return; e.preventDefault(); e.dataTransfer.dropEffect = grabOffsetRef.current != null ? "move" : "copy"; if (dragOverDay !== day) setDragOverDay(day); },
                    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDay(prev => (prev === day ? null : prev)); },
                    onDrop: (e) => { if (isDemoMode) return; onColumnDrop(e, day); },
                    className: cn("min-w-0 transition-colors", col === 0 ? "border-l-0" : "border-border/50", dragOverDay === day && "bg-primary/[0.04]"),
                  },
                };
              })}
              renderColumn={(colDef) => {
                const day = Number(colDef.key);
                const dayEvents = eventsDisplay.filter(e => e.day === day);
                return (
                  <>
                      {dayEvents.map(ev => {
                        const cls = isDemoMode ? getClassDisplay(ev.classId) : getClass(ev.classId);
                        const top = ((ev.startMin - DAY_START_MIN) / 60) * HOUR_H;
                        const height = Math.max(((ev.endMin - ev.startMin) / 60) * HOUR_H, 22);
                        if (top + height < 0 || top > HOURS.length * HOUR_H) return null;
                        return (
                          <EventBlock
                            key={ev.id}
                            name={cls.name}
                            subject={subjectLabel(cls.subject)}
                            startMin={ev.startMin}
                            endMin={ev.endMin}
                            color={cls.color}
                            top={top}
                            height={height}
                            readOnly={readOnly || isDemoMode}
                            resizable={snapMode === "free" && !readOnly && !isDemoMode}
                            onResize={(s, en) => onResizeEvent(ev.id, s, en)}
                            onDragStart={(e) => onEventDragStart(e, ev)}
                            onDragEnd={() => { grabOffsetRef.current = null; setDragOverDay(null); }}
                            onClick={() => { if (!readOnly && !isDemoMode) setEditEvent(ev); }}
                            onRemove={() => removeEvent(ev.id)}
                          />
                        );
                      })}
                  </>
                );
              }}
            />
            )}

            {/* ── Qoʻllanmagan qoralama — suzuvchi panel ──
                Yuqoridagi bannerlar HOLATNI bildiradi, bu esa AMAL soʻraydi:
                gridning ostida — koʻz jadvalni koʻzdan kechirib tugagan
                joyda. Absolyut qatlam CardContent'ga bogʻlangan (padding
                qutisi) — jadval siqilmaydi, grid ichi varaqlansa ham panel
                joyida qoladi. Rang INVERSIYA (bg-foreground/text-background):
                loyihaning yuqori-kontrast sirti, BulkActionBar bilan bir til;
                oq fonda oq panel koʻzdan qochardi. Tugmalar: yashil "Saqlash"
                (hoverda yengil koʻtariladi) + neytral "Bekor qilish". */}
            {awaitingApply && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
                <div className="pointer-events-auto flex w-[min(100%,34rem)] items-center gap-3 rounded-overlay bg-foreground py-2.5 pr-3 pl-3.5 text-background shadow-overlay duration-200 animate-in fade-in slide-in-from-bottom-2">
                  {/* Ikona qutisi — disket emas: hali saqlanmagan, kutayotgan
                      holat. Inversiya sirtida shaffof oq qatlam. */}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-background/15 text-background/80">
                    <CircleDot className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t("pendingChanges", { count: pendingCount })}
                    </p>
                    <p className="truncate text-xs text-background/60">{t("pendingSubtitle")}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={requestDiscard}
                    className="shrink-0 cursor-pointer text-background/80 hover:bg-background/10 hover:text-background"
                    variant="ghost"
                  >
                    {t("discardChanges")}
                  </Button>
                  <div className="group shrink-0">
                    <Button
                      size="sm"
                      onClick={saveChanges}
                      className="cursor-pointer bg-green-500 text-white transition-transform duration-200 hover:bg-green-500/80 group-hover:-translate-y-1"
                    >
                      <CheckCheck className="size-4" />
                      {t("applyChanges")}
                    </Button>
                  </div>
                </div>
              </div>
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
            ...classFormInitial(editingClass),
            color: editingClass.color,
            icon: editingClass.icon,
            slots: slotsForClass(editingClass.id),
          }}
          onSubmit={(v) => handleEditClass(editingClass.id, v)}
          onClose={() => setEditingClass(null)}
        />
      )}
      {settingsOpen && (
        <BellScheduleDialog
          config={bellConfig}
          events={events}
          onSave={(c) => {
            // Qoʻngʻiroq vaqtlari oʻzgarsa, kataklarga qoʻyilgan darslar yangi
            // period vaqtlariga koʻchadi — jadval kataklardan "tushib ketmaydi".
            const { events: remapped, moved } = remapEventsForBellChange(events, bellConfig, c);
            if (moved > 0) {
              setEvents(remapped);
              toast.success(t("bellChangeMovedToast", { count: moved }));
            }
            setBellConfig(c);
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* "Qachondan kuchga kiradi?" — joriy jadval tahririda yoki "Yangi versiya…" da */}
      <EffectiveDateDialog
        open={effectiveDialogOpen}
        todayKey={today}
        takenDates={versions.map((v) => v.effectiveFrom)}
        mode={dialogExplicit ? "pick-date" : "decide"}
        attendanceAtRisk={attendanceAtRisk}
        onConfirm={applyEffectiveChoice}
        onCancel={cancelEffectiveDialog}
      />

      {/* Koʻp oʻzgarish bekor qilinayotganda tasdiq (5+) */}
      <AlertDialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discardConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discardConfirmDescription", { count: pendingCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={discardDraft} className="bg-destructive text-white hover:bg-destructive/90">
              {t("discardChanges")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Arxivni tahrirlashga ochish tasdigʻi */}
      <AlertDialog open={unlockConfirmOpen} onOpenChange={setUnlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unlockConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unlockConfirmDescription", { range: selectedRangeLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setArchiveUnlocked(true); setUnlockConfirmOpen(false); }}>
              {t("unlockToEdit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Versiyani oʻchirish tasdigʻi */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteVersionConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedVersion
                ? t("deleteVersionConfirmDescription", { date: fmtDayMonthUz(selectedVersion.effectiveFrom) })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVersion} className="bg-destructive text-white hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chop etish/PDF uchun statik A4 (albom) jadval — faqat print'da koʻrinadi */}
      <TimetablePrintSheet
        periods={periods}
        events={events}
        getClass={getClass}
        profile={bellConfig.profile}
        title={t("scheduleTitle")}
        subtitle={selectedRangeLabel || undefined}
      />
    </DashboardPageLayout>
  );
}

/* ─── Dars bloki (grid ichida) ─── */
function EventBlock({ name, subject, startMin, endMin, color, top, height, resizable, readOnly = false, onResize, onDragStart, onDragEnd, onClick, onRemove }: {
  name: string;
  /** Fan nomi — bitta sinfda bir necha fan oʻtiladi (masalan «Ona tili» va
      «Adabiyot» ikkalasi ham 9-A da), faqat sinf nomi bilan kartalar
      ajratib boʻlmasdi. Jadval (PeriodGrid) koʻrinishi bilan bir xil. */
  subject?: string;
  startMin: number;
  endMin: number;
  color: ClassColor;
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
  const t = useTranslations("TimetablePage");
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

  return (
    <EventCard
      color={color}
      title={name}
      /* Soat ikonkasi yoʻq — vaqt qatori barcha event kartalarida bir xil:
         faqat "HH:MM–HH:MM" ([[design-system]] standarti, TodayRail etalon). */
      /* Qatorlar balandlikka qarab ochiladi (kalendar yuzalarining umumiy
         qoidasi): baland kartada fan va vaqt ALOHIDA qatorda, past kartada
         ular `·` bilan bitta qatorga yigʻiladi. `·` — joy torligining
         zaxirasi, kenglikdagi standart emas. */
      subtitle={
        subject && height >= STACKED_SUBTITLE_MIN_H ? (
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{subject}</span>
            <span className="truncate tabular-nums">{minToHHMM(startMin)} — {minToHHMM(endMin)}</span>
          </span>
        ) : (
          <span className="truncate">
            {subject ? `${subject} · ` : ""}
            <span className="tabular-nums">{minToHHMM(startMin)} — {minToHHMM(endMin)}</span>
          </span>
        )
      }
      density="auto"
      draggable={!readOnly && !resizing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      interactive
      className={cn("absolute isolate left-1 right-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]", readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing", CLASS_CARD_INTERACTION)}
      style={{ top: top + 1, height: height - 2 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      actions={
        !readOnly ? (
          <button
            type="button"
            aria-label={t("delete")}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex size-5 cursor-pointer items-center justify-center rounded-sm bg-foreground/8 hover:bg-foreground/15"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : undefined
      }
    >
      {/* Oʻlcham (davomiylik) tutqichlari — faqat erkin rejimda */}
      {resizable && (
        <>
          <div draggable={false} onPointerDown={startResize("start")} className="absolute inset-x-0 top-0 z-10 h-2 cursor-ns-resize">
            <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground opacity-0 transition-opacity group-hover/ev:opacity-40" aria-hidden />
          </div>
          <div draggable={false} onPointerDown={startResize("end")} className="absolute inset-x-0 bottom-0 z-10 h-2 cursor-ns-resize">
            <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground opacity-0 transition-opacity group-hover/ev:opacity-40" aria-hidden />
          </div>
        </>
      )}
    </EventCard>
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
  const t = useTranslations("TimetablePage");
  const [st, setSt] = useState(minToHHMM(event.startMin));
  const fmt = useCalendarFormat();
  const [et, setEt] = useState(minToHHMM(event.endMin));
  const hex = CLASS_COLOR_HEX[color];
  const dayName = fmt.dayName(event.day);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("editEventDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("classLabel")}</Label>
            <div className="flex items-center gap-2.5 rounded-md border border-input bg-muted/40 px-3 py-2">
              <ClassSwatch hex={hex} className="size-2.5" />
              <span className="text-sm font-medium">{className}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("dayTimeLabel", { day: dayName })}</Label>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <TypographyLabel>{t("startTime")}</TypographyLabel>
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
                <TypographyLabel>{t("endTime")}</TypographyLabel>
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
            {t("delete")}
          </Button>
          <Button onClick={() => onSave({ startMin: hhmmToMin(st), endMin: hhmmToMin(et) })}>
            <SaveIcon />
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
