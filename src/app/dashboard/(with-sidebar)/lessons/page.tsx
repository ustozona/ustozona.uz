"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
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
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { useLessonStore } from "@/store/useLessonStore";
import { lessonClassIds, unitIdForClass, type Unit, type Lesson } from "@/lib/lessons-data";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeLessonsTourDemoClasses, makeLessonsTourDemoUnits, makeLessonsTourDemoLessons,
  LESSONS_TOUR_DEMO_CLASS_ID, LESSONS_TOUR_DEMO_UNIT_ID,
} from "@/components/tour/lessons-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { ClassFormModal } from "@/components/ClassFormModal";
import CreateUnitModal from "@/components/CreateUnitModal";
import { Layers, FileText, Plus, Search, ArrowDownUp, Pencil, Trash2, ChevronDown } from "lucide-react";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

/** Status badge ranglari — semantik tokenlar (success / info / warning / muted) */
const STATUS_STYLES: Record<Lesson["status"], string> = {
  Completed: "bg-success/10 text-success",
  Scheduled: "bg-info/10 text-info",
  Unscheduled: "bg-warning/10 text-warning",
  Draft: "bg-muted text-muted-foreground",
};

const pad = (n: number) => String(n).padStart(2, "0");
const NONE = "__none__";

/* Boʻlim/"Boʻlimsiz" kartalarini @dnd-kit droppable-zonasiga aylantiradi —
   mavzuni sudrab tashlash uchun umumiy wrapper (loyihaning DnD standarti). */
function UnitDropZone({ id, children }: { id: string; children: (isOver: boolean) => ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef}>{children(isOver)}</div>;
}

/* Mavzu kartasini sudrab boʻlim-zonalarga tashlash uchun draggable wrapper. */
function DraggableLesson({ id, className, style, onClick, children }: {
  id: string; className?: string; style?: React.CSSProperties; onClick: () => void; children: ReactNode;
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

export default function LessonsPage() {
  const t = useTranslations("LessonsPage");
  const STATUS_LABELS: Record<Lesson["status"], string> = {
    Completed: t("statusCompleted"),
    Scheduled: t("statusScheduled"),
    Unscheduled: t("statusUnscheduled"),
    Draft: t("statusDraft"),
  };
  const router = useRouter();
  // Sinf tanlash — `?classId=` URL param (refresh/deep-link chidamli).
  // null = hech narsa tanlanmagan (Sinflar ustuni 50%). Tanlanganda URL +
  // store default yangilanadi (boshqa sahifalar bilan sinxron).
  const [selectedClassId, handleSelectClass] = useClassIdParam();
  const liveClasses = useLiveClasses();
  const createClass = useCreateClass();
  const units = useLessonStore((s) => s.units);
  const lessons = useLessonStore((s) => s.lessons);
  const addUnit = useLessonStore((s) => s.addUnit);
  const addLesson = useLessonStore((s) => s.addLesson);
  const updateUnit = useLessonStore((s) => s.updateUnit);
  const deleteUnit = useLessonStore((s) => s.deleteUnit);
  const restoreUnit = useLessonStore((s) => s.restoreUnit);
  const deleteLesson = useLessonStore((s) => s.deleteLesson);
  const setUnitForClass = useLessonStore((s) => s.setUnitForClass);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editUnitTarget, setEditUnitTarget] = useState<Unit | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);
  const [editUnitTitle, setEditUnitTitle] = useState("");
  const [editUnitDesc, setEditUnitDesc] = useState("");

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
  const handleConfirmDeleteUnit = () => {
    if (!deleteUnitTarget) return;
    const unit = deleteUnitTarget;
    const lessonIds = lessons.filter((l) => l.unitId === unit.id).map((l) => l.id);
    deleteUnit(unit.id);
    if (unit.id === selectedUnitId) setSelectedUnitId(null);
    setDeleteUnitTarget(null);
    toast.success(t("unitDeletedToast", { unit: `${pad(unit.number)}. ${unit.title}` }), {
      action: { label: t("undo"), onClick: () => restoreUnit(unit, lessonIds) },
    });
  };

  useEffect(() => { setSelectedUnitId(null); }, [selectedClassId]);

  // Tur (product tour) — hech qanday sinf qoʻshilmagan boʻlsa, "Darslar" turʼi
  // boʻsh panellarni namunaviy sinf/boʻlim/dars bilan toʻldiradi (faqat vizual,
  // store'ga yozilmaydi — [[students-tour-demo]] bilan bir xil naqsh).
  const tourActive = useTourRequest((s) => s.activeTourId === "lessons");
  const activeTourStepId = useTourRequest((s) => s.activeStepId);
  const isDemoMode = tourActive && liveClasses.length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeLessonsTourDemoClasses() : null), [isDemoMode]);
  const demoUnits = useMemo(() => (isDemoMode ? makeLessonsTourDemoUnits() : null), [isDemoMode]);
  const demoLessons = useMemo(() => (isDemoMode ? makeLessonsTourDemoLessons() : null), [isDemoMode]);

  const effectiveClassId = isDemoMode ? LESSONS_TOUR_DEMO_CLASS_ID : selectedClassId;
  // "Sinflaringiz" bosqichida boʻlimlar ustuni hali tanlanmagan koʻrinishida
  // qolsin — aks holda demo boʻlim oldindan tanlangan boʻlib koʻrinib, xuddi
  // tur allaqachon boʻlimlarga oʻtganday taassurot qoldiradi.
  const demoUnitPreselected = isDemoMode && activeTourStepId !== "lessons-classes";
  const effectiveUnitId = isDemoMode
    ? (selectedUnitId ?? (demoUnitPreselected ? LESSONS_TOUR_DEMO_UNIT_ID : null))
    : selectedUnitId;
  const unitsSource = isDemoMode ? demoUnits! : units;
  const lessonsSource = isDemoMode ? demoLessons! : lessons;

  const unitsForClass = useMemo(
    () => unitsSource.filter((u) => u.classId === effectiveClassId).sort((a, b) => a.number - b.number),
    [effectiveClassId, unitsSource]
  );

  const noUnitLessons = useMemo(
    () => effectiveClassId
      ? lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === null)
      : [],
    [lessonsSource, effectiveClassId]
  );

  const lessonsForUnit = useMemo(() => {
    if (!effectiveUnitId || !effectiveClassId) return [];
    if (effectiveUnitId === NONE) return noUnitLessons;
    return lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === effectiveUnitId);
  }, [effectiveUnitId, effectiveClassId, noUnitLessons, lessonsSource]);

  const unitProgress = (unitId: string | null) => {
    const all = unitId === null
      ? noUnitLessons
      : (effectiveClassId ? lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === unitId) : []);
    const done = all.filter((l) => l.status === "Completed").length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };

  const unitStats = useMemo(() => {
    if (!effectiveUnitId || effectiveUnitId === NONE || !effectiveClassId) return null;
    const unitLessons = lessonsSource.filter((l) => lessonClassIds(l).includes(effectiveClassId) && unitIdForClass(l, effectiveClassId) === effectiveUnitId);
    const completed = unitLessons.filter((l) => l.status === "Completed").length;
    return { lessons: unitLessons.length, completed, pct: unitLessons.length ? Math.round((completed / unitLessons.length) * 100) : 0 };
  }, [effectiveUnitId, effectiveClassId, lessonsSource]);

  const [unitFooterOpen, setUnitFooterOpen] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("unit-panel-footer-open");
    if (saved !== null) setUnitFooterOpen(saved === "1");
  }, []);
  const toggleUnitFooter = () => {
    setUnitFooterOpen((prev) => {
      const next = !prev;
      localStorage.setItem("unit-panel-footer-open", next ? "1" : "0");
      return next;
    });
  };

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);

  // Mavzuni boʻlimlar oʻrtasida drag-and-drop bilan koʻchirish (bitta sinf konteksti, @dnd-kit).
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const handleLessonDragEnd = (e: DragEndEvent) => {
    const lessonId = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId || !effectiveClassId) return;
    const targetUnitId = overId === "unit-none" ? null : overId.replace(/^unit-/, "");
    const lesson = lessonsSource.find((l) => l.id === lessonId);
    if (!lesson || unitIdForClass(lesson, effectiveClassId) === targetUnitId) return;
    setUnitForClass(lessonId, effectiveClassId, targetUnitId);
  };

  const handleCreateUnit = () => {
    if (!selectedClassId) return;
    setUnitModalOpen(true);
  };
  const handleUnitSubmit = (values: { name: string; classIds: string[]; description: string }) => {
    let createdId: string | null = null;
    values.classIds.forEach((cid) => {
      const id = addUnit({ classId: cid, title: values.name, description: values.description });
      if (cid === selectedClassId) createdId = id;
    });
    setUnitModalOpen(false);
    if (createdId) setSelectedUnitId(createdId);
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
        onClick={() => setSelectedUnitId(unit.id)}
        className={cn(
          "list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer",
          isOver && "ring-2"
        )}
        style={{ ["--card-accent" as string]: selectedClassHex, ...(isOver ? { ["--tw-ring-color" as string]: selectedClassHex } : {}) }}
      >
        <div style={selectedClassTints.gradientTile} className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white">
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
            {pad(unit.number)}. {unit.title}
          </h4>
          <TypographyMuted className="text-xs leading-relaxed mt-1 line-clamp-1">{unit.description}</TypographyMuted>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">
          <FileText className="size-3.5" />
          <span>{t("lessonsCountSuffix", { count: total })}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 w-[130px]">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: selectedClassHex }} />
          </div>
          <span className="text-xs font-medium tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
        </div>
      </button>
    );
  };

  // Tor ustun, tanlangan: katta karta + count badge + spring-bounce
  const renderUnitSelected = (unit: Unit, isOver = false) => {
    const { total } = unitProgress(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => setSelectedUnitId(null)}
        className={cn(
          "list-card w-full flex items-center text-left gap-3 p-4 cursor-pointer",
          isOver && "ring-2"
        )}
        data-active="true"
        style={{ ["--card-accent" as string]: selectedClassHex, ...selectedClassTints.tint, ...(isOver ? { ["--tw-ring-color" as string]: selectedClassHex } : {}) }}
      >
        <div style={selectedClassTints.gradientTile} className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white">
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{pad(unit.number)}. {unit.title}</h4>
          <TypographyMuted className="text-xs leading-snug mt-1 line-clamp-1">{unit.description}</TypographyMuted>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ ...selectedClassTints.badge, ...selectedClassTints.text }}>
          {total}
        </span>
      </button>
    );
  };

  // Tor ustun, tanlanmagan: kompakt nuqtali qator
  const renderUnitCompact = (unit: Unit, isOver = false) => {
    const { total } = unitProgress(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => setSelectedUnitId(unit.id)}
        className={cn("list-row group w-full", isOver && "ring-2 rounded-lg")}
        style={isOver ? { ["--tw-ring-color" as string]: selectedClassHex } : undefined}
      >
        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedClassHex }} />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
          {pad(unit.number)}. {unit.title}
        </span>
        <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0">{total}</span>
      </button>
    );
  };

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
          <Layers className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{t("noUnitTitle")}</h4>
          <TypographyMuted className="text-xs leading-relaxed mt-1 line-clamp-1">{t("noUnitDescription")}</TypographyMuted>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">
          <FileText className="size-3.5" />
          <span>{t("lessonsCountSuffix", { count: total })}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 w-[130px]">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
        </div>
      </button>
    );
  };

  // "Boʻlimsiz" — tor ustun (tanlangan / kompakt)
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
            <Layers className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground leading-tight block">{t("noUnitTitle")}</h4>
            <TypographyMuted className="text-xs leading-snug mt-1">{t("noUnitShortDescription")}</TypographyMuted>
          </div>
        </button>
      );
    }
    return (
      <button
        onClick={() => setSelectedUnitId(NONE)}
        className={cn("list-row group w-full", isOver && "ring-2 ring-muted-foreground/50 rounded-lg")}
      >
        <span className="size-2.5 rounded-[4px] shrink-0 bg-muted-foreground/25" />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
          {t("noUnitTitle")}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0">
      <TourDemoBanner tourId="lessons" active={isDemoMode} />
      <DndContext sensors={dndSensors} onDragEnd={handleLessonDragEnd}>
      <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden p-4 md:p-6">
      {/* ── Column 1: Sinflar (25%) ── */}
      <DashboardColumn hideBelow="lg" data-tour="lessons-classes">
        <ClassListPanel
          page="lessons"
          selectedClassId={selectedClassId ?? (isDemoMode ? LESSONS_TOUR_DEMO_CLASS_ID : "")}
          onSelect={handleSelectClass}
          onAddClass={() => setClassModalOpen(true)}
          demoClasses={demoClasses ?? undefined}
        />
      </DashboardColumn>

      {/* ── Column 2: Boʻlimlar ── */}
      <div
        data-tour="lessons-units"
        className="min-w-0 min-h-0 h-full bg-card rounded-xl border border-border flex flex-col overflow-hidden"
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
              <SectionIcon><Layers /></SectionIcon>
              <CardTitle className="truncate">{t("unitsTitle")}</CardTitle>
            </div>
            {unitsForClass.length > 0 && (
              <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleCreateUnit}>
                <Plus className="size-4" />
                <span>{t("addUnit")}</span>
              </Button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <ScrollArea className="h-full w-full">
              <div className="px-3 pt-4 pb-5 space-y-1.5">
                {detailMode ? (
                  /* Tor rejim — tanlangan katta, qolganlari kompakt */
                  <>
                    {unitsForClass.map((unit) => (
                      <UnitDropZone key={unit.id} id={`unit-${unit.id}`}>
                        {(isOver) => (unit.id === effectiveUnitId ? renderUnitSelected(unit, isOver) : renderUnitCompact(unit, isOver))}
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

          {/* Bottom selected unit stats — Sinflar panel footeri bilan bir xil til (ochib/yopib qoʻyiladi) */}
          {selectedUnit && unitStats && (
            <div className="border-t border-border shrink-0">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="size-9 rounded-full shrink-0 flex items-center justify-center text-white" style={selectedClassTints.gradientTile}>
                  <Layers className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground leading-tight truncate">
                    {pad(selectedUnit.number)}. {selectedUnit.title}
                  </h4>
                </div>
                <button
                  onClick={toggleUnitFooter}
                  title={unitFooterOpen ? t("hideStats") : t("showStats")}
                  aria-expanded={unitFooterOpen}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronDown className={cn("size-4 transition-transform duration-fast", unitFooterOpen && "rotate-180")} aria-hidden="true" />
                </button>
              </div>
              {unitFooterOpen && (
                <div className="px-4 pb-4">
                  <div className="flex items-start divide-x divide-border">
                    <div className="flex-1 min-w-0 px-3 first:pl-0 last:pr-0 text-center">
                      <p className="text-xs text-muted-foreground truncate">{t("lessonsStatLabel")}</p>
                      <p className="text-sm font-bold tabular-nums text-foreground mt-1">{t("lessonsUnitCount", { count: unitStats.lessons })}</p>
                    </div>
                    <div className="flex-1 min-w-0 px-3 first:pl-0 last:pr-0 text-center">
                      <p className="text-xs text-muted-foreground truncate">{t("completedStatLabel")}</p>
                      <p className="text-sm font-bold tabular-nums text-foreground mt-1">{t("lessonsUnitCount", { count: unitStats.completed })}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("progress")}</span>
                      <span className="font-bold tabular-nums text-foreground">{Math.round(unitStats.pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(unitStats.pct, 100)}%`, backgroundColor: selectedClassHex }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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

          <AlertDialog open={!!deleteUnitTarget} onOpenChange={(o) => !o && setDeleteUnitTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteUnitDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteUnitTarget && t("deleteUnitDialogDescription", { unit: `${pad(deleteUnitTarget.number)}. ${deleteUnitTarget.title}` })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={handleConfirmDeleteUnit}
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
          className="min-w-0 min-h-0 h-full bg-card rounded-xl border border-border flex flex-col overflow-hidden"
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
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="hidden xl:flex items-center gap-1">
                <Button variant="ghost" size="icon" title={t("editAria")} className="text-muted-foreground hover:text-foreground">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title={t("searchAria")} className="text-muted-foreground hover:text-foreground">
                  <Search className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title={t("sortAria")} className="text-muted-foreground hover:text-foreground">
                  <ArrowDownUp className="size-4" />
                </Button>
              </div>
              {selectedUnitId && lessonsForUnit.length > 0 && (
                <Button size="sm" className="h-9 gap-1.5 ml-1 px-3" onClick={handleNewLesson}>
                  <Plus className="size-3.5" />
                  <span className="hidden lg:inline">{t("newLesson")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <ScrollArea className="h-full w-full">
              <div className="px-4 pt-4 pb-5 space-y-3">
                {lessonsForUnit.length === 0 ? (
                  <Empty className="py-16">
                    <EmptyHeader>
                      <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                      <EmptyTitle>{t("lessonsEmptyTitle")}</EmptyTitle>
                      <EmptyDescription>{t("lessonsEmptyDescription")}</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button className="gap-2 h-9" onClick={handleNewLesson}>
                        <Plus className="size-4" />
                        {t("newLesson")}
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  lessonsForUnit.map((lesson) => {
                    const lessonUnit = unitsSource.find((u) => u.id === lesson.unitId);
                    return (
                      <DraggableLesson
                        key={lesson.id}
                        id={lesson.id}
                        onClick={() => openLesson(lesson.id)}
                        className="list-card group flex items-center gap-3 p-4 cursor-pointer active:cursor-grabbing"
                        style={{ ["--card-accent" as string]: selectedClassHex }}
                      >
                        <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={selectedClassTints.gradientTile}>
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
                            {pad(lesson.number)}. {lesson.title}
                          </h4>
                          {lessonUnit && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                              <ClassSwatch hex={selectedClassHex} className="size-2" />
                              <span className="truncate">{pad(lessonUnit.number)}. {lessonUnit.title}</span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {lesson.date && (
                            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground/60 tabular-nums">
                              <span>{lesson.date}</span>
                              {lesson.time && (
                                <>
                                  <span className="text-muted-foreground/30">·</span>
                                  <span>{lesson.time}</span>
                                </>
                              )}
                              {lesson.classCount && lesson.classCount > 1 && (
                                <span className="text-muted-foreground/40 font-medium">+{lesson.classCount - 1}</span>
                              )}
                            </div>
                          )}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border-transparent",
                              STATUS_STYLES[lesson.status]
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {STATUS_LABELS[lesson.status]}
                          </Badge>
                        </div>
                        <div className="shrink-0 overflow-hidden max-w-0 opacity-0 group-hover:max-w-9 group-hover:opacity-100 transition-all duration-fast ease-standard">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                title={t("deleteLessonAria")}
                                className="size-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-muted transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                                  onClick={() => { deleteLesson(lesson.id); toast.success(t("lessonDeletedToast")); }}
                                >
                                  {t("delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </DraggableLesson>
                    );
                  })
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
        {unitModalOpen && (
          <CreateUnitModal
            defaultClassIds={selectedClassId ? [selectedClassId] : []}
            onSubmit={handleUnitSubmit}
            onClose={() => setUnitModalOpen(false)}
          />
        )}
      </DashboardColumns>
      </DndContext>
    </div>
  );
}
