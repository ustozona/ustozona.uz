"use client";

import * as React from "react";
import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import { useComposedRefs } from "@/lib/compose-refs";
import { useLocale, useTranslations } from "next-intl";
import { MONTHS_UZ_SHORT, DAYS_UZ_SHORT } from "@/lib/localization";
import { dateKeyToDate } from "@/lib/date-keys";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { classTints, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses, useCreateClass } from "@/hooks/useLiveClasses";
import { useClassIdParam, useUrlParam } from "@/hooks/useClassIdParam";
import { useLessonStore } from "@/store/useLessonStore";
import { commitLessonsDelete } from "@/lib/sync/lessons-delete";
import { lessonClassIds, lessonSessions, lessonUnitIds, unitIdForClass, type Unit, type Lesson } from "@/lib/lessons-data";
import { byNumber, ordinalsOf } from "@/lib/ordinals";
import { isTaught, lessonPlanState, byLessonOrder } from "@/lib/lessons-data";
import { todayKey } from "@/lib/date-keys";
import { needsTaughtConfirm } from "@/lib/lesson-shift";
import { useLessonBump } from "@/hooks/useLessonBump";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeLessonsTourDemoClasses, makeLessonsTourDemoUnits, makeLessonsTourDemoLessons,
  LESSONS_TOUR_DEMO_CLASS_ID, LESSONS_TOUR_DEMO_UNIT_ID,
} from "@/components/tour/lessons-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";
import { LessonsClassPanel } from "@/components/lessons/LessonsClassPanel";
import { LessonDateLeaf, LessonMetaChips, LessonStatusPill } from "@/components/lessons/LessonPlanMarks";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { ClassFormModal } from "@/components/ClassFormModal";
import CreateUnitModal from "@/components/CreateUnitModal";
import IshRejaImportModal from "@/components/IshRejaImportModal";
import UnitImportModal from "@/components/UnitImportModal";
import { LibraryBig, FileText, Clock, Plus, Search, ArrowDownUp, Pencil, Trash2, FolderInput, ListChecks, FileCheck, CircleCheck, Check, SkipForward, X, CircleDashed, GripVertical } from "lucide-react";
import { ReorderList, useEscape, useReorderDraft } from "@/components/ReorderList";
import { BulkActionBar, BulkActionButton, BulkActionCount, BulkActionDivider } from "@/components/BulkActionBar";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuSeparator, ContextMenuLabel,
} from "@/components/ui/context-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const pad = (n: number) => String(n).padStart(2, "0");
const NONE = "__none__";

/* Boʻlim/"Boʻlimsiz" kartalarini @dnd-kit droppable-zonasiga aylantiradi —
   mavzuni sudrab tashlash uchun umumiy wrapper (loyihaning DnD standarti). */
function UnitDropZone({ id, children }: { id: string; children: (isOver: boolean) => ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef}>{children(isOver)}</div>;
}

/* Mavzu kartasini sudrab boʻlim-zonalarga tashlash uchun draggable wrapper.
   `forwardRef` + `...rest` MAJBURIY — `ContextMenuTrigger asChild` Radix
   Slot orqali `onContextMenu`ni aynan shu yerga ulaydi; ular yoʻq boʻlsa
   prop jimgina tushib qoladi va oʻng tugma menyusi umuman ochilmaydi. */
const DraggableLesson = React.forwardRef<HTMLDivElement, {
  id: string; className?: string; style?: React.CSSProperties; onClick: () => void; children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>>(function DraggableLesson(
  { id, className, style, onClick, children, ...rest }, forwardedRef
) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  const composedRef = useComposedRefs(setNodeRef, forwardedRef);
  return (
    <div
      ref={composedRef}
      {...attributes}
      {...rest}
      {...listeners}
      // Radix trigger ham onPointerDown beradi (sensorli uzoq bosish) — ikkalasi ham ishlashi shart,
      // aks holda rest sudrash tinglovchisini ustidan yozadi va karta umuman surilmaydi.
      onPointerDown={(e) => { rest.onPointerDown?.(e); listeners?.onPointerDown?.(e); }}
      onClick={onClick}
      style={style}
      className={cn(className, isDragging && "opacity-40 border-dashed")}
    >
      {children}
    </div>
  );
});

export default function LessonsPage() {
  const t = useTranslations("LessonsPage");
  const router = useRouter();
  // Sinf tanlash — `?classId=` URL param (refresh/deep-link chidamli).
  // null = hech narsa tanlanmagan (Sinflar ustuni 50%). Tanlanganda URL +
  // store default yangilanadi (boshqa sahifalar bilan sinxron).
  // Yon menyudan «toza» kirilganda (URL'da `?classId=` yoʻq) oxirgi
  // tanlangan sinfdan davom etadi — har safar qaytadan tanlash shart emas.
  const [selectedClassId, handleSelectClass] = useClassIdParam({ fallbackToStore: true });
  const liveClasses = useLiveClasses();
  const createClass = useCreateClass();
  const units = useLessonStore((s) => s.units);
  const lessons = useLessonStore((s) => s.lessons);
  const addUnit = useLessonStore((s) => s.addUnit);
  const addLesson = useLessonStore((s) => s.addLesson);
  const updateUnit = useLessonStore((s) => s.updateUnit);
  const deleteUnit = useLessonStore((s) => s.deleteUnit);
  const restoreUnit = useLessonStore((s) => s.restoreUnit);
  const restoreLesson = useLessonStore((s) => s.restoreLesson);
  const deleteLesson = useLessonStore((s) => s.deleteLesson);
  const setUnitForClass = useLessonStore((s) => s.setUnitForClass);
  const reorderUnits = useLessonStore((s) => s.reorderUnits);
  const reorderLessons = useLessonStore((s) => s.reorderLessons);
  const setPlanState = useLessonStore((s) => s.setPlanState);
  /* Kontekst menyudagi «Holat» boʻlimi — muharrir badge'i bilan bir xil 4 holat
     va bir xil mantiq: oʻtilgan darsda reja holati tanlansa «oʻtildi» olinadi. */
  const LESSON_STATES = [
    { key: "none", Icon: CircleDashed, iconCls: "text-muted-foreground", label: "pillNone" },
    { key: "draft", Icon: Clock, iconCls: "text-warning", label: "pillDraft" },
    { key: "ready", Icon: FileCheck, iconCls: "text-info", label: "planReadyShort" },
    { key: "taught", Icon: CircleCheck, iconCls: "text-success", label: "taught" },
  ] as const;
  const applyLessonState = (lesson: Lesson, next: (typeof LESSON_STATES)[number]["key"]) => {
    if (next === "taught") { setTaught(lesson.id, todayKey(), effectiveClassId); return; }
    if (isTaught(lesson, effectiveClassId)) setTaught(lesson.id, null, effectiveClassId);
    setPlanState(lesson.id, next);
  };
  const setTaught = useLessonStore((s) => s.setTaught);
  const tc = useTranslations("LessonCycle");
  const locale = useLocale();
  const bumpLesson = useLessonBump();
  const today = todayKey();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  // Boʻlim tanlovi — sinf kabi `?unit=` URL param'ida. Ilgari oddiy
  // `useState` edi va dars muharririga kirib chiqqanda (sahifa unmount
  // boʻladi) yoʻqolardi: sinf tiklanib, boʻlim nolga tushardi.
  const [selectedUnitId, setSelectedUnitId] = useUrlParam("unit");
  const [editUnitTarget, setEditUnitTarget] = useState<Unit | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);
  // Standart: boʻlim bilan darslar ham oʻchadi (kutilgan «papka» semantikasi).
  const [keepLessonsOnUnitDelete, setKeepLessonsOnUnitDelete] = useState(false);
  const [editUnitTitle, setEditUnitTitle] = useState("");
  const [editUnitDesc, setEditUnitDesc] = useState("");
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);

  const openEditUnit = (unit: Unit) => {
    setEditUnitTarget(unit);
    setEditUnitTitle(unit.title);
    setEditUnitDesc(unit.description);
  };
  const saveEditUnit = () => {
    if (!editUnitTarget) return;
    updateUnit(editUnitTarget.id, { title: editUnitTitle.trim(), description: editUnitDesc.trim() });
    setEditUnitTarget(null);
  };
  const handleConfirmDeleteUnit = async () => {
    if (!deleteUnitTarget) return;
    const unit = deleteUnitTarget;
    // Undo uchun: oʻchadigan darslar TOʻLIQ nusxada, saqlanadiganlar esa
    // faqat id boʻyicha (ularga boʻlim bogʻlanishi qaytariladi).
    const affected = lessons.filter((l) => lessonUnitIds(l).includes(unit.id));
    const removed = keepLessonsOnUnitDelete
      ? []
      : affected.filter((l) => !lessonUnitIds(l).some((uid) => uid !== unit.id));
    const removedIds = new Set(removed.map((l) => l.id));
    const detachedIds = affected.filter((l) => !removedIds.has(l.id)).map((l) => l.id);
    deleteUnit(unit.id, { withLessons: !keepLessonsOnUnitDelete });
    if (unit.id === selectedUnitId) setSelectedUnitId(null);
    setDeleteUnitTarget(null);
    toast.success(t("unitDeletedToast", { unit: `${uNo(unit)}. ${unit.title}` }), {
      action: {
        label: t("undo"),
        onClick: () => {
          removed.forEach((l) => restoreLesson(l));
          restoreUnit(unit, [...detachedIds, ...removedIds]);
        },
      },
    });
  };
  // Oʻchirish dialogida koʻrsatiladigan taʼsir: nechta dars va ulardan
  // jadvalga joylangan nechta yozuv yoʻqoladi (koʻrsatmasdan oʻchirish
  // «yashirin yoʻqotish» beradi — kechagi yetim sessiyalar shundan chiqqan).
  const deleteUnitImpact = useMemo(() => {
    if (!deleteUnitTarget) return { lessons: 0, sessions: 0 };
    const affected = lessons.filter((l) => lessonUnitIds(l).includes(deleteUnitTarget.id));
    return {
      lessons: affected.length,
      sessions: affected.reduce((n, l) => n + lessonSessions(l).length, 0),
    };
  }, [deleteUnitTarget, lessons]);

  const handleConfirmDeleteLesson = () => {
    if (!deleteLessonTarget) return;
    deleteLesson(deleteLessonTarget.id);
    setDeleteLessonTarget(null);
    toast.success(t("lessonDeletedToast"));
  };

  // Sinf ALMASHSA boʻlim tanlovi bekor qilinadi (boshqa sinfning boʻlimi
  // qolib ketmasin). Ataylab oldingi qiymat bilan solishtiriladi: mount'da
  // `selectedClassId` bir kadr `null` boʻlib turadi, oddiy effekt esa shuni
  // «almashuv» deb bilib URL'dan endigina tiklangan `?unit=` ni oʻchirardi.
  // Shart `prev` haqiqiy sinf boʻlgandagina bajariladi.
  const prevClassIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevClassIdRef.current;
    prevClassIdRef.current = selectedClassId;
    if (prev && prev !== selectedClassId) setSelectedUnitId(null);
  }, [selectedClassId, setSelectedUnitId]);

  // Tur (product tour) — hech qanday sinf qoʻshilmagan boʻlsa, "Darslar" turʼi
  // boʻsh panellarni namunaviy sinf/boʻlim/dars bilan toʻldiradi (faqat vizual,
  // store'ga yozilmaydi — [[students-tour-demo]] bilan bir xil naqsh).
  const tourActive = useTourRequest((s) => s.activeTourId === "lessons");
  const activeTourStepId = useTourRequest((s) => s.activeStepId);
  const isDemoMode = tourActive && liveClasses.length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeLessonsTourDemoClasses() : null), [isDemoMode]);
  const demoUnits = useMemo(() => (isDemoMode ? makeLessonsTourDemoUnits() : null), [isDemoMode]);
  const demoLessons = useMemo(() => (isDemoMode ? makeLessonsTourDemoLessons() : null), [isDemoMode]);

  // "Sinflaringiz" bosqichida boʻlimlar ustuni hali tanlanmagan koʻrinishida
  // qolsin — aks holda (demo REJIMIDA HAM, haqiqiy sinf allaqachon tanlangan
  // hisobda HAM) boʻlimlar oldindan toʻldirilgan koʻrinib, tooltip matni
  // ("sinfni tanlang") allaqachon bajarilgan amal bilan ziddiyatga kelardi.
  const suppressClassForTourIntro = tourActive && activeTourStepId === "lessons-classes";
  const effectiveClassId = suppressClassForTourIntro
    ? null
    : isDemoMode ? LESSONS_TOUR_DEMO_CLASS_ID : selectedClassId;
  const effectiveUnitId = isDemoMode
    ? (selectedUnitId ?? (suppressClassForTourIntro ? null : LESSONS_TOUR_DEMO_UNIT_ID))
    : selectedUnitId;
  const unitsSource = isDemoMode ? demoUnits! : units;
  const lessonsSource = isDemoMode ? demoLessons! : lessons;

  const unitsForClass = useMemo(
    () => unitsSource.filter((u) => u.classId === effectiveClassId).sort(byNumber),
    [effectiveClassId, unitsSource]
  );
  // Koʻrinadigan raqam — tartibdagi oʻrin, saqlangan `number` emas (`@/lib/ordinals`).
  const unitOrdinals = useMemo(() => ordinalsOf(unitsForClass), [unitsForClass]);
  const uNo = (unit: Unit) => pad(unitOrdinals.get(unit.id) ?? unit.number);

  const noUnitLessons = useMemo(
    () => effectiveClassId
      ? lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === null)
      : [],
    [lessonsSource, effectiveClassId]
  );

  // Tartiblangan: kartadagi raqam = roʻyxatdagi oʻrin (`i + 1`).
  const lessonsForUnit = useMemo(() => {
    if (!effectiveUnitId || !effectiveClassId) return [];
    if (effectiveUnitId === NONE) return [...noUnitLessons].sort(byLessonOrder(effectiveClassId));
    return lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === effectiveUnitId).sort(byLessonOrder(effectiveClassId));
  }, [effectiveUnitId, effectiveClassId, noUnitLessons, lessonsSource]);

  const unitProgress = (unitId: string | null) => {
    const all = unitId === null
      ? noUnitLessons
      : (effectiveClassId ? lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === unitId) : []);
    const done = all.filter((l) => isTaught(l, effectiveClassId)).length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };


  const [classModalOpen, setClassModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [unitImportOpen, setUnitImportOpen] = useState(false);
  // «Koʻchirish → Yangi boʻlimga…»: boʻlim yaratilgach shu mavzu unga koʻchiriladi.
  const [pendingMoveLessonId, setPendingMoveLessonId] = useState<string | null>(null);
  const finishPendingMove = (unitId: string | null) => {
    if (pendingMoveLessonId && unitId && selectedClassId) setUnitForClass(pendingMoveLessonId, selectedClassId, unitId);
    setPendingMoveLessonId(null);
  };

  // Mavzuni boʻlimlar oʻrtasida drag-and-drop bilan koʻchirish (bitta sinf konteksti, @dnd-kit).
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  // Sudralayotgan mavzu — DragOverlay nusxasi kursorga ergashadi, asl karta joyida xira qoladi.
  const [dragLessonId, setDragLessonId] = useState<string | null>(null);
  const handleLessonDragStart = (e: DragStartEvent) => setDragLessonId(e.active.id as string);
  const handleLessonDragEnd = (e: DragEndEvent) => {
    setDragLessonId(null);
    const lessonId = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId || !effectiveClassId) return;
    const targetUnitId = overId === "unit-none" ? null : overId.replace(/^unit-/, "");
    const lesson = lessonsSource.find((l) => l.id === lessonId);
    if (!lesson || unitIdForClass(lesson, effectiveClassId) === targetUnitId) return;
    setUnitForClass(lessonId, effectiveClassId, targetUnitId);
  };

  // «Boʻlim qoʻshish» — nusxa koʻchirish / Excel oynasi (batafsil oyna — uning ichidan).
  const handleCreateUnit = () => {
    if (!selectedClassId) return;
    setUnitImportOpen(true);
  };
  const handleUnitSubmit = (values: { name: string; classIds: string[]; description: string }) => {
    let createdId: string | null = null;
    values.classIds.forEach((cid) => {
      const id = addUnit({ classId: cid, title: values.name, description: values.description });
      if (cid === selectedClassId) createdId = id;
    });
    setUnitModalOpen(false);
    finishPendingMove(createdId);
    if (createdId) setSelectedUnitId(createdId);
  };

  // «Yangi dars» — faqat boʻlim ichidan: bitta dars / nusxa koʻchirish / Excel yuklash.
  const handleNewLessonChoice = () => {
    if (!selectedUnitId || selectedUnitId === NONE || !selectedClassId) return;
    setImportOpen(true);
  };

  const handleNewLesson = () => {
    if (!selectedUnitId || !selectedClassId) return;
    const id = addLesson({
      classId: selectedClassId,
      unitId: selectedUnitId === NONE ? null : selectedUnitId,
      title: "",
      status: "Draft",
    });
    toast.success(t("newLessonToast"));
    router.push(`/lessons/${id}`);
  };

  const openLesson = (id: string) => router.push(`/lessons/${id}`);

  /* Kartadagi sana/vaqt — saqlangan inglizcha matn («Sep 24», «8:00 AM») emas,
     shu sinfning sessiyasidan: eng yaqin kelgusi (boʻlmasa oxirgi) dars,
     «24-sen» va 24 soatlik «08:00 — 08:45». Brauzerda oʻzbekcha oy nomlari yoʻq —
     `MONTHS_UZ_SHORT`. */
  const intlMonthMissing = new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2024, 8, 1)).startsWith("M0");
  const lessonWhen = (lesson: Lesson) => {
    const sessions = lessonSessions(lesson)
      .filter((x) => !effectiveClassId || x.classId === effectiveClassId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
    if (!sessions.length) return null;
    const s = sessions.find((x) => x.date >= today) ?? sessions[sessions.length - 1];
    const d = dateKeyToDate(s.date);
    const month = intlMonthMissing
      ? MONTHS_UZ_SHORT[d.getMonth()]
      : new Intl.DateTimeFormat(locale, { month: "short" }).format(d).replace(".", "");
    const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    // Oʻzbek imlosi: kun va oy chiziqcha bilan («5-sen»), vaqt oraligʻi tire bilan («08:00 — 08:45»).
    const sep = locale.startsWith("uz") ? "-" : " ";
    const weekday = intlMonthMissing
      ? DAYS_UZ_SHORT[(d.getDay() + 6) % 7]
      : new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d).replace(".", "");
    return {
      day: String(d.getDate()),
      month,
      weekday,
      date: `${d.getDate()}${sep}${month}`,
      time: `${hhmm(s.startMin)} — ${hhmm(s.endMin)}`,
    };
  };

  const selectedClass = isDemoMode
    ? demoClasses![0]
    : liveClasses.find((c) => c.id === selectedClassId) ?? null;
  const selectedUnit = effectiveUnitId && effectiveUnitId !== NONE
    ? unitsSource.find((u) => u.id === effectiveUnitId) ?? null
    : null;

  const selectedClassColor = selectedClass ? classColor(selectedClass) : "teal";
  const selectedClassTints = classTints(selectedClassColor);
  const selectedClassHex = CLASS_COLOR_HEX[selectedClassColor];

  /* Ustun nisbatlari — "sidebardan tashqari" maydon = 100%, flex-grow + flex-basis:0
     bilan boʻlinadi (sidebar ochiq/yopiq boʻlsa ham responsive). "Faol ish" ustuni keng:
       sinf tanlanmagan → 50/25/25, sinf tanlangan → 25/50/25, boʻlim tanlangan → 25/25/50. */
  const noClass = !effectiveClassId;
  const detailMode = !!effectiveUnitId;
  const grow = noClass
    ? { classes: 2, units: 1, lessons: 1 }
    : detailMode
      ? { classes: 1, units: 1, lessons: 2 }
      : { classes: 1, units: 2, lessons: 1 };

  /* Grid template (`lg+`) — 3 ustun doim DOM'da; nisbat grow'dan. */
  const columnsTemplate = `minmax(0,${grow.classes}fr) minmax(0,${grow.units}fr) minmax(0,${grow.lessons}fr)`;

  /* ── Unit qator/karta koʻrinishlari ── */

  // Har bir boʻlim qatori/kartasi ustida oʻng-klik menyu — Tahrirlash/Oʻchirish.
  const withUnitMenu = (unit: Unit, node: ReactNode) => (
    <ContextMenu key={unit.id}>
      <ContextMenuTrigger asChild>{node}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => openEditUnit(unit)}>
          <Pencil className="size-4" />
          {t("editUnit")}
        </ContextMenuItem>
        <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => startUnitPick(unit.id)}>
          <ListChecks className="size-4" />
          {t("selectMenuItem")}
        </ContextMenuItem>
        {unitsForClass.length > 1 && (
          <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => startReorder("units")}>
            <ArrowDownUp className="size-4" />
            {t("reorderMenuItem")}
          </ContextMenuItem>
        )}
        <ContextMenuItem
          variant="destructive"
          className="gap-2 cursor-pointer"
          onClick={() => setDeleteUnitTarget(unit)}
        >
          <Trash2 className="size-4" />
          {t("deleteUnit")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  // Keng ustun (boʻlim tanlanmagan): toʻliq karta — nom + tavsif + dars soni + progress
  const renderUnitWide = (unit: Unit, isOver = false) => {
    const { total, pct } = unitProgress(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => (unitPickMode
          ? toggleIn(selectedUnitIds, setSelectedUnitIds, unit.id)
          : setSelectedUnitId(unit.id))}
        className={cn(
          "list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer",
          isOver && "ring-2"
        )}
        data-active={unitPickMode && selectedUnitIds.has(unit.id) ? "true" : undefined}
        style={{ ["--card-accent" as string]: selectedClassHex, ...(unitPickMode && selectedUnitIds.has(unit.id) ? selectedClassTints.tint : {}), ...(isOver ? { ["--tw-ring-color" as string]: selectedClassHex } : {}) }}
      >
        {unitPickMode && pickCircle(selectedUnitIds.has(unit.id))}{(
        <div style={selectedClassTints.gradientTile} className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white">
          <LibraryBig className="size-5" />
        </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-body font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
            {uNo(unit)}. {unit.title}
          </h4>
          <TypographyMuted className="text-caption leading-relaxed mt-1 line-clamp-1">{unit.description}</TypographyMuted>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-caption text-muted-foreground/70 shrink-0 whitespace-nowrap">
          <FileText className="size-3.5" />
          <span>{t("lessonsCountSuffix", { count: total })}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 w-[130px]">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: selectedClassHex }} />
          </div>
          <span className="text-caption font-medium tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
        </div>
      </button>
    );
  };

  // Tor ustun, tanlangan: katta karta + count badge + spring-bounce
  /* Tor ustun, TANLANGAN: qator kartaga "koʻtariladi" (ataylab morf —
     tanlangan boʻlim shu ustundagi asosiy obyekt boʻlgani uchun ikonka,
     tavsif va dars soni bilan toʻliq pasport oladi). */
  /* Tor ustunda HAMMA boʻlim toʻliq karta (nuqtali kompakt qator yoʻq);
     tanlangani tint va gradient ikonka bilan ajraladi. */
  const renderUnitSelected = (unit: Unit, isOver = false, active = true) => {
    const { total, pct } = unitProgress(unit.id);
    const picked = unitPickMode && selectedUnitIds.has(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => (unitPickMode
          ? toggleIn(selectedUnitIds, setSelectedUnitIds, unit.id)
          : setSelectedUnitId(active ? null : unit.id))}
        className={cn(
          "list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer",
          isOver && "ring-2"
        )}
        data-active={active || picked ? "true" : undefined}
        style={{ ["--card-accent" as string]: selectedClassHex, ...(active || picked ? selectedClassTints.tint : {}), ...(isOver ? { ["--tw-ring-color" as string]: selectedClassHex } : {}) }}
      >
        {unitPickMode && pickCircle(selectedUnitIds.has(unit.id))}{(
        <div
          style={active ? selectedClassTints.gradientTile : { ...selectedClassTints.badge, ...selectedClassTints.iconText }}
          className={cn("list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center", active && "text-white")}
        >
          <LibraryBig className="size-5" />
        </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-body font-semibold text-foreground leading-tight truncate">{uNo(unit)}. {unit.title}</h4>
          {unit.description && <TypographyMuted className="text-caption leading-snug mt-1 line-clamp-1">{unit.description}</TypographyMuted>}
          <div className="h-1 mt-2 rounded-full bg-muted overflow-hidden" title={t("classCoverage", { pct })}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: selectedClassHex }} />
          </div>
        </div>
        <span className="text-caption font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ ...selectedClassTints.badge, ...selectedClassTints.text }}>
          {total}
        </span>
      </button>
    );
  };

  /* ── GURUHAVIY TANLASH ─────────────────────────────────────
     Loyihaning yagona nashqi (sinflar, oʻquvchilar, materiallar): qatorda
     doimiy katakcha + tanlov boʻlsa `BulkActionBar` suzib chiqadi.
     Alohida «tanlash rejimi» tugmasi YOʻQ — boshqa sahifalarda ham yoʻq.

     Ikkala ustun OZ tanlovini yuritadi: boʻlim va dars boshqa-boshqa
     obyekt, va ularni bitta roʻyxatga qoʻshib oʻchirish «nimani
     oʻchiryapman?» degan savolni tugʻdiradi. Shu sabab ikkita mustaqil
     Set va ikkita panel. */
  /* Tartiblash rejimi (`@/components/ReorderList`) — bir vaqtda bitta ustunda.
     Qoralama faqat «Tayyor» da store'ga yoziladi; tanlash rejimi bilan birga yoqilmaydi. */
  const [reorderKind, setReorderKind] = useState<"units" | "lessons" | null>(null);
  const reorderDraft = useReorderDraft();
  const reorderLabels = { drag: t("reorderDrag"), up: t("reorderUp"), down: t("reorderDown") };
  const startReorder = (kind: "units" | "lessons") => {
    if (isDemoMode) return;
    setUnitPickMode(false); setSelectedUnitIds(new Set());
    setLessonPickMode(false); setSelectedLessonIds(new Set());
    setReorderKind(kind);
    reorderDraft.start(kind === "units" ? unitsForClass.map((u) => u.id) : lessonsForUnit.map((l) => l.id));
  };
  const endReorder = (save: boolean) => {
    if (save && reorderDraft.order && reorderDraft.movedIds.size > 0) {
      if (reorderKind === "units") reorderUnits(reorderDraft.order);
      else if (effectiveClassId) reorderLessons(reorderDraft.order, effectiveClassId);
    }
    reorderDraft.stop();
    setReorderKind(null);
  };
  useEscape(reorderDraft.active, () => endReorder(false));
  const reorderBar = (
    <BulkActionBar>
      <BulkActionCount>
        {reorderDraft.movedIds.size > 0 ? t("reorderMoved", { count: reorderDraft.movedIds.size }) : t("reorderHint")}
      </BulkActionCount>
      <BulkActionDivider />
      <BulkActionButton onClick={() => endReorder(false)}>{t("cancel")}</BulkActionButton>
      <BulkActionButton className="bg-background text-foreground hover:bg-background/90" onClick={() => endReorder(true)}>
        {t("reorderDone")}
      </BulkActionButton>
    </BulkActionBar>
  );

  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  /** Qaysi panel tasdiq soʻrayapti. */
  const [bulkTarget, setBulkTarget] = useState<"units" | "lessons" | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Sinf almashsa tanlov qoldigʻi ergashib yurmasin.
  useEffect(() => {
    setUnitPickMode(false);
    setLessonPickMode(false);
    setSelectedUnitIds(new Set());
    setSelectedLessonIds(new Set());
    setReorderKind(null);
    reorderDraft.stop();
  }, [effectiveClassId]);
  // Boʻlim almashsa faqat DARS tanlovi tozalanadi (roʻyxat butunlay boshqa).
  useEffect(() => {
    setLessonPickMode(false);
    setSelectedLessonIds(new Set());
    setReorderKind((k) => (k === "lessons" ? null : k));
  }, [effectiveUnitId]);

  const toggleIn = (
    set: Set<string>,
    apply: (v: Set<string>) => void,
    id: string
  ) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    apply(next);
  };

  const allUnitsSelected = unitsForClass.length > 0 && selectedUnitIds.size === unitsForClass.length;
  const allLessonsSelected = lessonsForUnit.length > 0 && selectedLessonIds.size === lessonsForUnit.length;

  /* Tanlangan boʻlimlarning toʻliq taʼsiri. Boʻlimi tanlanmagan BOSHQA
     joyda ham turgan dars saqlanadi — undan faqat bogʻlanish uziladi. */
  const unitsBulkImpact = useMemo(() => {
    const cascaded = lessonsSource.filter((l) => {
      const uids = lessonUnitIds(l);
      return uids.length > 0 && uids.every((u) => selectedUnitIds.has(u));
    });
    return {
      units: selectedUnitIds.size,
      lessons: cascaded.length,
      sessions: cascaded.reduce((n, l) => n + lessonSessions(l).length, 0),
      removed: cascaded,
    };
  }, [selectedUnitIds, lessonsSource]);

  const lessonsBulkImpact = useMemo(() => {
    const removed = lessonsSource.filter((l) => selectedLessonIds.has(l.id));
    return {
      lessons: removed.length,
      sessions: removed.reduce((n, l) => n + lessonSessions(l).length, 0),
      removed,
    };
  }, [selectedLessonIds, lessonsSource]);

  const handleBulkDeleteUnits = async () => {
    const unitIds = [...selectedUnitIds];
    const { removed } = unitsBulkImpact;
    const removedUnits = unitsSource.filter((u) => selectedUnitIds.has(u.id));
    setBulkBusy(true);
    const ok = await commitLessonsDelete({ unitIds, lessonIds: removed.map((l) => l.id) });
    setBulkBusy(false);
    if (!ok) return;
    removed.forEach((l) => deleteLesson(l.id));
    // Darslar allaqachon oʻchdi — bu yerda boʻlim faqat qolganlardan uziladi.
    unitIds.forEach((id) => deleteUnit(id, { withLessons: false }));
    if (effectiveUnitId && selectedUnitIds.has(effectiveUnitId)) setSelectedUnitId(null);
    setBulkTarget(null);
    endUnitPick();
    toast.success(t("bulkUnitsDeletedToast", { units: removedUnits.length, lessons: removed.length }), {
      action: {
        label: t("undo"),
        onClick: () => {
          // Avval darslar (snapshot oʻz unitIdʼsini olib keladi), keyin boʻlimlar.
          removed.forEach((l) => restoreLesson(l));
          removedUnits.forEach((u) => restoreUnit(u, []));
        },
      },
    });
  };

  const handleBulkDeleteLessons = async () => {
    const { removed } = lessonsBulkImpact;
    setBulkBusy(true);
    const ok = await commitLessonsDelete({ lessonIds: removed.map((l) => l.id) });
    setBulkBusy(false);
    if (!ok) return;
    removed.forEach((l) => deleteLesson(l.id));
    setBulkTarget(null);
    endLessonPick();
    toast.success(t("bulkLessonsDeletedToast", { lessons: removed.length }), {
      action: {
        label: t("undo"),
        onClick: () => removed.forEach((l) => restoreLesson(l)),
      },
    });
  };

  /* Tanlash rejimi kartaning OʻZ doirasini egallaydi: 44px glif katakchaga
     almashadi. Shu sabab tinch holatda roʻyxatda hech qanday qoʻshimcha
     belgi yoʻq — na chetda boʻsh yoʻlak, na doimiy katakcha ustuni.

     Kirish nuqtasi ikkita, natija bitta: kontekst menyudagi «Tanlash»
     (bilganlar uchun tez) va sarlavhadagi ikonka (topilishi uchun). Faqat
     oʻng tugmaga tayanib boʻlmaydi — koʻpchilik uni bosib koʻrmaydi. */
  const [unitPickMode, setUnitPickMode] = useState(false);
  const [lessonPickMode, setLessonPickMode] = useState(false);
  // Mavzular ustunidagi qidiruv — faqat nom boʻyicha, tanlangan boʻlim ichida.
  const [lessonSearchOpen, setLessonSearchOpen] = useState(false);
  const [lessonQuery, setLessonQuery] = useState("");
  const lessonQ = lessonQuery.trim().toLocaleLowerCase();
  const lessonMatches = (l: Lesson) => !lessonQ || (l.title ?? "").toLocaleLowerCase().includes(lessonQ);
  const closeLessonSearch = () => { setLessonSearchOpen(false); setLessonQuery(""); };

  const startUnitPick = (id?: string) => {
    setUnitPickMode(true);
    if (id) setSelectedUnitIds(new Set([id]));
  };
  const startLessonPick = (id?: string) => {
    setLessonPickMode(true);
    if (id) setSelectedLessonIds(new Set([id]));
  };
  const endUnitPick = () => { setUnitPickMode(false); setSelectedUnitIds(new Set()); };
  const endLessonPick = () => { setLessonPickMode(false); setSelectedLessonIds(new Set()); };

  /** Glif oʻrnidagi katakcha. `pointer-events-none` — bosishni kartaning
      oʻzi qabul qiladi (karta `<button>`, ichiga tugma qoʻyib boʻlmaydi). */
  /* Tanlash rejimi: checkbox ikonka/varaqcha OLDIDA alohida turadi — sana va
     boʻlim ikonkasi koʻrinib qoladi (nima tanlanayotgani bilinadi). */
  const pickCircle = (checked: boolean) => (
    <Checkbox checked={checked} aria-label={t("selectAria")} className="pointer-events-none shrink-0" />
  );

  // "Boʻlimsiz" — keng ustun
  const renderNoUnitWide = (isOver = false) => {
    const { total, pct } = unitProgress(null);
    return (
      <button
        onClick={() => setSelectedUnitId(NONE)}
        className={cn(
          "list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer",
          isOver && "ring-2 ring-muted-foreground/50"
        )}
        style={{ ["--card-accent" as string]: "var(--muted-foreground)" }}
      >
        <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center bg-muted">
          <LibraryBig className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-body font-semibold text-foreground leading-tight truncate">{t("noUnitTitle")}</h4>
          <TypographyMuted className="text-caption leading-relaxed mt-1 line-clamp-1">{t("noUnitDescription")}</TypographyMuted>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-caption text-muted-foreground/70 shrink-0 whitespace-nowrap">
          <FileText className="size-3.5" />
          <span>{t("lessonsCountSuffix", { count: total })}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 w-[130px]">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-caption font-medium tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
        </div>
      </button>
    );
  };

  // "Boʻlimsiz" — tor ustun (tanlangan / kompakt). Haqiqiy boʻlimlar bilan
  // bir xil naqsh: tanlanganda kartaga koʻtariladi.
  const renderNoUnitNarrow = (isOver = false) => {
    if (effectiveUnitId === NONE) {
      return (
        <button
          onClick={() => setSelectedUnitId(null)}
          className={cn(
            "list-card w-full flex items-center text-left gap-3 p-4 cursor-pointer",
            isOver && "ring-2 ring-muted-foreground/50"
          )}
          data-active="true"
          style={{ ["--card-accent" as string]: "var(--muted-foreground)", backgroundColor: "var(--muted)" }}
        >
          <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={{ backgroundImage: `linear-gradient(135deg, var(--muted-foreground) 0%, oklch(0.4 0 0) 100%)` }}>
            <LibraryBig className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-body font-semibold text-foreground leading-tight block">{t("noUnitTitle")}</h4>
            <TypographyMuted className="text-caption leading-snug mt-1">{t("noUnitShortDescription")}</TypographyMuted>
          </div>
        </button>
      );
    }
    return (
      <button
        onClick={() => setSelectedUnitId(NONE)}
        className={cn(
          "list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer",
          isOver && "ring-2 ring-muted-foreground/50"
        )}
        style={{ ["--card-accent" as string]: "var(--muted-foreground)" }}
      >
        <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center bg-muted">
          <LibraryBig className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-body font-semibold text-foreground leading-tight truncate">{t("noUnitTitle")}</h4>
          <TypographyMuted className="text-caption leading-snug mt-1 line-clamp-1">{t("noUnitShortDescription")}</TypographyMuted>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6 max-lg:min-h-full lg:h-full lg:min-h-0">
      <TourDemoBanner tourId="lessons" active={isDemoMode} />
      <DndContext sensors={dndSensors} onDragStart={handleLessonDragStart} onDragEnd={handleLessonDragEnd} onDragCancel={() => setDragLessonId(null)}>
      <DashboardColumns template={columnsTemplate} className="lg:h-full lg:overflow-hidden">
      {/* ── Column 1: Sinflar (25%) ── */}
      <DashboardColumn hideBelow="lg" mobile="self" data-tour="lessons-classes">
        <LessonsClassPanel
          selectedClassId={selectedClassId ?? (isDemoMode ? LESSONS_TOUR_DEMO_CLASS_ID : "")}
          onSelect={handleSelectClass}
          onAddClass={() => setClassModalOpen(true)}
          units={unitsSource}
          lessons={lessonsSource}
          demoClasses={demoClasses ?? undefined}
        />
      </DashboardColumn>

      {/* ── Column 2: Boʻlimlar ── */}
      <div
        data-tour="lessons-units"
        className="min-w-0 min-h-0 bg-card rounded-xl border border-border flex flex-col overflow-hidden lg:h-full max-lg:min-h-[50svh]"
      >
          {noClass ? (
            /* Sinf tanlanmagan — headerʼsiz, markaziy placeholder (2-rasm) */
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia><Illustration name="23" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>{t("noClassTitle")}</EmptyTitle>
                <EmptyDescription>{t("noClassDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between shrink-0 gap-2 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <SectionIcon><LibraryBig /></SectionIcon>
              <CardTitle className="truncate">{t("unitsTitle")}</CardTitle>
              {unitsForClass.length > 0 && <span className="text-caption tabular-nums text-muted-foreground">{unitsForClass.length}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Boʻsh holat oynasi faqat keng rejimda chiqadi — tor rejimda tugma sarlavhada. */}
              {(unitsForClass.length > 0 || detailMode) && (
                <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleCreateUnit}>
                  <Plus className="size-4" />
                  <span>{t("addUnit")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            {reorderKind === "units" && reorderBar}
            {unitPickMode && (
              <BulkActionBar>
                <BulkActionCount>{t("selectedCount", { count: selectedUnitIds.size })}</BulkActionCount>
                <BulkActionDivider />
                {!allUnitsSelected && (
                  <BulkActionButton onClick={() => setSelectedUnitIds(new Set(unitsForClass.map((u) => u.id)))}>
                    {t("selectAll")}
                  </BulkActionButton>
                )}
                {selectedUnitIds.size > 0 && (
                  <BulkActionButton icon={<Trash2 className="size-4" />} variant="destructive" onClick={() => setBulkTarget("units")}>
                    {t("delete")}
                  </BulkActionButton>
                )}
                <BulkActionDivider />
                <BulkActionButton onClick={endUnitPick}>{t("cancel")}</BulkActionButton>
              </BulkActionBar>
            )}
            <ScrollArea className="h-full w-full">
              <div className="px-3 pt-4 pb-5 space-y-2">
                {reorderKind === "units" && reorderDraft.order ? (
                  <ReorderList ids={reorderDraft.order} onMove={reorderDraft.move} labels={reorderLabels}>
                    {(id, i, h) => {
                      const unit = unitsSource.find((u) => u.id === id);
                      if (!unit) return null;
                      return (
                        <div
                          className="list-row w-full"
                          style={reorderDraft.movedIds.has(id) ? selectedClassTints.tint : undefined}
                        >
                          {h.handle}
                          <span className="text-body text-foreground truncate flex-1">{pad(i + 1)}. {unit.title}</span>
                          {h.arrows}
                        </div>
                      );
                    }}
                  </ReorderList>
                ) : detailMode ? (
                  /* Tor rejim — tanlangan katta, qolganlari kompakt */
                  <>
                    {unitsForClass.map((unit) => (
                      <UnitDropZone key={unit.id} id={`unit-${unit.id}`}>
                        {(isOver) => renderUnitSelected(unit, isOver, unit.id === effectiveUnitId)}
                      </UnitDropZone>
                    ))}
                    <UnitDropZone id="unit-none">{(isOver) => renderNoUnitNarrow(isOver)}</UnitDropZone>
                  </>
                ) : (
                  /* Keng rejim — toʻliq kartalar + doimo "Boʻlimsiz" karta.
                     Haqiqiy boʻlim boʻlmasa, qoʻshimcha markaziy yoʻriqnoma. */
                  <>
                    {unitsForClass.map((unit) => (
                      <UnitDropZone key={unit.id} id={`unit-${unit.id}`}>
                        {(isOver) => renderUnitWide(unit, isOver)}
                      </UnitDropZone>
                    ))}
                    <UnitDropZone id="unit-none">{(isOver) => renderNoUnitWide(isOver)}</UnitDropZone>
                    {unitsForClass.length === 0 && (
                      <Empty className="py-12">
                        <EmptyHeader>
                          <EmptyMedia><Illustration name="23" className="h-32 text-black dark:text-white" /></EmptyMedia>
                          <EmptyTitle>{t("unitsEmptyTitle")}</EmptyTitle>
                          <EmptyDescription>{t("unitsEmptyDescription")}</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button className="gap-2 h-9" onClick={handleCreateUnit}>
                            <Plus className="size-4" />
                            {t("addUnitButton")}
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          <Dialog open={!!editUnitTarget} onOpenChange={(o) => !o && setEditUnitTarget(null)}>
            <DialogContent className="max-w-[440px]">
              <DialogHeader>
                <DialogTitle>{t("editUnitDialogTitle")}</DialogTitle>
                <DialogDescription>{t("editUnitDialogDescription")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="eu-title">{t("nameLabel")}</Label>
                  <Input id="eu-title" value={editUnitTitle} onChange={(e) => setEditUnitTitle(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eu-desc">{t("descriptionLabel")}</Label>
                  <Textarea id="eu-desc" value={editUnitDesc} onChange={(e) => setEditUnitDesc(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUnitTarget(null)}>{t("cancel")}</Button>
                <Button onClick={saveEditUnit} disabled={!editUnitTitle.trim()}>{t("save")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!deleteUnitTarget}
            onOpenChange={(o) => { if (!o) { setDeleteUnitTarget(null); setKeepLessonsOnUnitDelete(false); } }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteUnitDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteUnitTarget && t("deleteUnitDialogDescription", { unit: `${uNo(deleteUnitTarget)}. ${deleteUnitTarget.title}` })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteUnitImpact.lessons > 0 && (
                <div className="space-y-3">
                  <TypographyMuted>{t("deleteUnitImpact", deleteUnitImpact)}</TypographyMuted>
                  <label className="flex items-center gap-2 text-body">
                    <Checkbox
                      checked={keepLessonsOnUnitDelete}
                      onCheckedChange={(v) => setKeepLessonsOnUnitDelete(v === true)}
                    />
                    {t("deleteUnitKeepLessons")}
                  </label>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => void handleConfirmDeleteUnit()}
                >
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
            </>
          )}
        </div>

        {/* ── Column 3: Mavzular ── */}
        <div
          data-tour="lessons-list"
          className="min-w-0 min-h-0 bg-card rounded-xl border border-border flex flex-col overflow-hidden lg:h-full max-lg:min-h-[50svh]"
        >
          {!effectiveUnitId ? (
            /* Boʻlim tanlanmagan — headerʼsiz, faqat markaziy placeholder (1-rasm) */
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>{t("noUnitSelectedTitle")}</EmptyTitle>
                <EmptyDescription>{t("noUnitSelectedDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between shrink-0 gap-2 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <SectionIcon><FileText /></SectionIcon>
              <CardTitle className="truncate">{t("lessonsTitle")}</CardTitle>
              {lessonsForUnit.length > 0 && <span className="text-caption tabular-nums text-muted-foreground">{lessonsForUnit.length}</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {lessonsForUnit.length > 0 && (lessonSearchOpen ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="lesson-search"
                    autoFocus
                    value={lessonQuery}
                    onChange={(e) => setLessonQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") closeLessonSearch(); }}
                    placeholder={t("lessonsSearchPlaceholder")}
                    className="h-9 w-44 xl:w-56 pl-9 pr-8"
                  />
                  <button
                    type="button"
                    aria-label={t("cancel")}
                    onClick={closeLessonSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" title={t("searchAria")} aria-label={t("searchAria")} onClick={() => setLessonSearchOpen(true)} className="text-muted-foreground hover:text-foreground">
                  <Search className="size-4" />
                </Button>
              ))}
              {effectiveUnitId && lessonsForUnit.length > 0 && (
                <Button size="sm" className="h-9 gap-1.5 ml-1 px-3" onClick={effectiveUnitId === NONE ? handleNewLesson : handleNewLessonChoice}>
                  <Plus className="size-3.5" />
                  <span className="hidden lg:inline">{t("newLesson")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            {reorderKind === "lessons" && reorderBar}
            {lessonPickMode && (
              <BulkActionBar>
                <BulkActionCount>{t("selectedCount", { count: selectedLessonIds.size })}</BulkActionCount>
                <BulkActionDivider />
                {!allLessonsSelected && (
                  <BulkActionButton onClick={() => setSelectedLessonIds(new Set(lessonsForUnit.map((l) => l.id)))}>
                    {t("selectAll")}
                  </BulkActionButton>
                )}
                {selectedLessonIds.size > 0 && (
                  <BulkActionButton icon={<Trash2 className="size-4" />} variant="destructive" onClick={() => setBulkTarget("lessons")}>
                    {t("delete")}
                  </BulkActionButton>
                )}
                <BulkActionDivider />
                <BulkActionButton onClick={endLessonPick}>{t("cancel")}</BulkActionButton>
              </BulkActionBar>
            )}
            <ScrollArea className="h-full w-full">
              <div className="px-4 pt-4 pb-5 space-y-3">
                {lessonsForUnit.length === 0 ? (
                  <Empty className="py-16">
                    <EmptyHeader>
                      <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                      <EmptyTitle>{t("lessonsEmptyTitle")}</EmptyTitle>
                      <EmptyDescription>{t("lessonsEmptyDescription")}</EmptyDescription>
                    </EmptyHeader>
                    {(
                      <EmptyContent>
                        <Button className="gap-2 h-9" onClick={effectiveUnitId === NONE ? handleNewLesson : handleNewLessonChoice}>
                          <Plus className="size-4" />
                          {t("newLesson")}
                        </Button>
                      </EmptyContent>
                    )}
                  </Empty>
                ) : reorderKind === "lessons" && reorderDraft.order ? (
                  <ReorderList ids={reorderDraft.order} onMove={reorderDraft.move} labels={reorderLabels}>
                    {(id, i, h) => {
                      const lesson = lessonsSource.find((l) => l.id === id);
                      if (!lesson) return null;
                      const moved = reorderDraft.movedIds.has(id);
                      return (
                        <div
                          className="list-card flex items-center gap-3 p-4"
                          data-active={moved ? "true" : undefined}
                          style={{ ["--card-accent" as string]: selectedClassHex, ...(moved ? selectedClassTints.tint : {}) }}
                        >
                          {h.handle}
                          <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={selectedClassTints.gradientTile}>
                            <FileText className="size-5" />
                          </div>
                          <h4 className="min-w-0 flex-1 text-body font-semibold text-foreground leading-tight truncate">
                            {pad(i + 1)}. {lesson.title}
                          </h4>
                          {h.arrows}
                        </div>
                      );
                    }}
                  </ReorderList>
                ) : (
                  <>
                  {lessonQ && !lessonsForUnit.some(lessonMatches) && (
                    <p className="py-8 text-center text-caption text-muted-foreground">{t("lessonsSearchEmpty", { q: lessonQuery.trim() })}</p>
                  )}
                  {lessonsForUnit.map((lesson, i) => {
                    // Qidiruvda raqam asl tartibdan qoladi (i — filtrsiz roʻyxatdagi oʻrin).
                    if (!lessonMatches(lesson)) return null;
                    // Koʻp sinfli mavzuda boʻlim — shu sinfniki (`unitByClass`), asosiy sinfniki emas.
                    const lessonUnitId = effectiveClassId ? unitIdForClass(lesson, effectiveClassId) : lesson.unitId;
                    const lessonUnit = unitsSource.find((u) => u.id === lessonUnitId);
                    // "Koʻchirish" submenu — joriy boʻlim va "Boʻlimsiz" oʻzi chiqarib tashlanadi.
                    const moveTargets = [
                      ...unitsForClass.filter((u) => u.id !== lessonUnitId),
                      ...(lessonUnitId ? [null] : []),
                    ];
                    return (
                    <ContextMenu key={lesson.id}>
                    <ContextMenuTrigger asChild>
                      <DraggableLesson
                        id={lesson.id}
                        onClick={() => (lessonPickMode
                          ? toggleIn(selectedLessonIds, setSelectedLessonIds, lesson.id)
                          : openLesson(lesson.id))}
                        className="list-card group flex flex-wrap items-center gap-3 p-4 cursor-pointer active:cursor-grabbing"
                        data-active={lessonPickMode && selectedLessonIds.has(lesson.id) ? "true" : undefined}
                        style={{ ["--card-accent" as string]: selectedClassHex, ...(lessonPickMode && selectedLessonIds.has(lesson.id) ? selectedClassTints.tint : {}) }}
                      >
                        {lessonPickMode && pickCircle(selectedLessonIds.has(lesson.id))}{(
                          <LessonDateLeaf lesson={lesson} classId={effectiveClassId} hex={selectedClassHex} day={lessonWhen(lesson)?.day} month={lessonWhen(lesson)?.month} />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-body font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
                            {pad(i + 1)}. {lesson.title}
                          </h4>
                          {(() => {
                            const when = lessonWhen(lesson);
                            if (!lessonUnit && !when) return null;
                            return (
                              <div className="flex items-center gap-1.5 mt-1 text-caption text-muted-foreground min-w-0">
                                {lessonUnit && <ClassSwatch hex={selectedClassHex} />}
                                {lessonUnit && <span className="truncate">{uNo(lessonUnit)}. {lessonUnit.title}</span>}
                                {when && (
                                  <span className="shrink-0 tabular-nums">
                                    {lessonUnit && "· "}{when.weekday}, {when.time}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <LessonMetaChips lesson={lesson} />
                          <LessonStatusPill lesson={lesson} classId={effectiveClassId} />
                        </div>
                        {effectiveClassId && !isDemoMode && needsTaughtConfirm(lesson, effectiveClassId, today, nowMin) && (
                          /* Dars vaqti oʻtdi, lekin belgilanmagan — B4 savoli kartaning ostidagi
                             lentada. Tugmalar kartaning sudrash/ochish hodisalarini toʻsadi. */
                          <div
                            className="basis-full flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-caption"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Clock className="size-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 min-w-0 font-medium text-foreground">{tc("askTaughtBanner")}</span>
                            <Button size="sm" className="h-7 gap-1.5 bg-success text-success-foreground hover:bg-success/90" onClick={() => setTaught(lesson.id, today, effectiveClassId)}>
                              <Check className="size-3.5" />
                              {tc("yesTaught")}
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 gap-1.5 bg-card text-foreground" onClick={() => bumpLesson(lesson.id, effectiveClassId)}>
                              <SkipForward className="size-3.5" />
                              {tc("bumpNext")}
                            </Button>
                          </div>
                        )}
                      </DraggableLesson>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => startLessonPick(lesson.id)}>
                        <ListChecks className="size-4" />
                        {t("selectMenuItem")}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuLabel className="text-label">{tc("statusSection")}</ContextMenuLabel>
                      {(() => {
                        const cur = isTaught(lesson, effectiveClassId) ? "taught" : lessonPlanState(lesson);
                        return LESSON_STATES.map((st) => (
                          <ContextMenuItem key={st.key} className="gap-2 cursor-pointer" onClick={() => cur !== st.key && applyLessonState(lesson, st.key)}>
                            <st.Icon className={cn("size-4", st.iconCls)} />
                            <span className="flex-1">{tc(st.label)}</span>
                            {cur === st.key && <Check className="size-4" />}
                          </ContextMenuItem>
                        ));
                      })()}
                      <ContextMenuSeparator />
                      {!isTaught(lesson, effectiveClassId) && lessonSessions(lesson).some((x) => x.classId === effectiveClassId) && (
                        <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => bumpLesson(lesson.id, effectiveClassId!)}>
                          <SkipForward className="size-4" />
                          {tc("bump")}
                        </ContextMenuItem>
                      )}
                      {lessonsForUnit.length > 1 && (
                        <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => startReorder("lessons")}>
                          <ArrowDownUp className="size-4" />
                          {t("reorderMenuItem")}
                        </ContextMenuItem>
                      )}
                      <ContextMenuSeparator />
                      <ContextMenuSub>
                        <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                          <FolderInput className="size-4" />
                          {t("moveLesson")}
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          {moveTargets.map((target) => (
                            <ContextMenuItem
                              key={target?.id ?? NONE}
                              className="gap-2 cursor-pointer"
                              onClick={() => setUnitForClass(lesson.id, effectiveClassId!, target?.id ?? null)}
                            >
                              <ClassSwatch
                                hex={target ? selectedClassHex : "var(--muted-foreground)"} />
                              {target ? `${uNo(target)}. ${target.title}` : t("noUnitTitle")}
                            </ContextMenuItem>
                          ))}
                          {/* Boʻsh ichki menyu chiqmasin: har doim «Yangi boʻlimga…» bor. */}
                          {moveTargets.length > 0 && <ContextMenuSeparator />}
                          <ContextMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => { setPendingMoveLessonId(lesson.id); handleCreateUnit(); }}
                          >
                            <Plus className="size-4" />
                            {t("moveToNewUnit")}
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        className="gap-2 cursor-pointer"
                        onClick={() => setDeleteLessonTarget(lesson)}
                      >
                        <Trash2 className="size-4" />
                        {t("delete")}
                      </ContextMenuItem>
                    </ContextMenuContent>
                    </ContextMenu>
                    );
                  })}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
            </>
          )}
        </div>

        {classModalOpen && (
          <ClassFormModal
            mode="create"
            onSubmit={(v) => {
              handleSelectClass(createClass(v));
              setClassModalOpen(false);
            }}
            onClose={() => setClassModalOpen(false)}
          />
        )}
        {importOpen && selectedClassId && selectedUnitId && selectedUnitId !== NONE && (
          <IshRejaImportModal
            classId={selectedClassId}
            unitId={selectedUnitId}
            onSingle={() => { setImportOpen(false); handleNewLesson(); }}
            onClose={() => setImportOpen(false)}
          />
        )}
        {unitImportOpen && selectedClassId && (
          <UnitImportModal
            classId={selectedClassId}
            onDetailed={() => { setUnitImportOpen(false); setUnitModalOpen(true); }}
            onCreated={(id) => { setUnitImportOpen(false); finishPendingMove(id ?? null); if (id) setSelectedUnitId(id); }}
            onClose={() => { setUnitImportOpen(false); setPendingMoveLessonId(null); }}
          />
        )}
        {unitModalOpen && (
          <CreateUnitModal
            defaultClassIds={selectedClassId ? [selectedClassId] : []}
            onSubmit={handleUnitSubmit}
            onClose={() => { setUnitModalOpen(false); setPendingMoveLessonId(null); }}
          />
        )}

        <AlertDialog open={bulkTarget !== null} onOpenChange={(o) => !o && setBulkTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkTarget === "units" ? t("bulkDeleteUnitsTitle") : t("bulkDeleteLessonsTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkTarget === "units"
                  ? t("bulkDeleteUnitsDescription", { units: unitsBulkImpact.units, lessons: unitsBulkImpact.lessons })
                  : t("bulkDeleteLessonsDescription", { lessons: lessonsBulkImpact.lessons })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {(bulkTarget === "units" ? unitsBulkImpact.sessions : lessonsBulkImpact.sessions) > 0 && (
              <TypographyMuted>
                {t("bulkDeleteSessions", {
                  sessions: bulkTarget === "units" ? unitsBulkImpact.sessions : lessonsBulkImpact.sessions,
                })}
              </TypographyMuted>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkBusy}>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={bulkBusy}
                onClick={(e) => {
                  e.preventDefault();
                  void (bulkTarget === "units" ? handleBulkDeleteUnits() : handleBulkDeleteLessons());
                }}
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteLessonTarget} onOpenChange={(o) => !o && setDeleteLessonTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteLessonDialogTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteLessonDialogDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => void handleConfirmDeleteLesson()}
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardColumns>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {(() => {
          const lesson = dragLessonId ? lessonsSource.find((l) => l.id === dragLessonId) : null;
          if (!lesson) return null;
          const when = lessonWhen(lesson);
          const idx = lessonsForUnit.findIndex((l) => l.id === lesson.id);
          return (
            <div
              className="list-card flex items-center gap-3 p-4 w-[min(22rem,80vw)] -rotate-2 cursor-grabbing shadow-lg"
              style={{ ["--card-accent" as string]: selectedClassHex }}
            >
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
              <LessonDateLeaf lesson={lesson} classId={effectiveClassId} hex={selectedClassHex} day={when?.day} month={when?.month} />
              <span className="min-w-0 flex-1 truncate text-body font-semibold text-foreground">
                {idx >= 0 ? `${pad(idx + 1)}. ` : ""}{lesson.title}
              </span>
            </div>
          );
        })()}
      </DragOverlay>
      </DndContext>
    </div>
  );
}
