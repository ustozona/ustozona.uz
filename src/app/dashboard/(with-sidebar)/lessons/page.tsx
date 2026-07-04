"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { classTints, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses, useCreateClass } from "@/hooks/useLiveClasses";
import { useClassStore } from "@/store/useClassStore";
import { useLessonStore } from "@/store/useLessonStore";
import { lessonClassIds, unitIdForClass, type Unit, type Lesson } from "@/lib/lessons-data";
import ClassListPanel from "@/components/ClassListPanel";
import { ClassFormModal } from "@/components/ClassFormModal";
import CreateUnitModal from "@/components/CreateUnitModal";
import { Layers, FileText, Plus, Search, ArrowDownUp, Pencil, List, Calendar, Trash2 } from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

/** Status badge ranglari — semantik tokenlar (success / info / warning / muted) */
const STATUS_STYLES: Record<Lesson["status"], string> = {
  Completed: "bg-success/10 text-success",
  Scheduled: "bg-info/10 text-info",
  Unscheduled: "bg-warning/10 text-warning-foreground",
  Draft: "bg-muted text-muted-foreground",
};

/** Status yorliqlari — oʻzbekcha */
const STATUS_LABELS: Record<Lesson["status"], string> = {
  Completed: "Tugallandi",
  Scheduled: "Rejalashtirilgan",
  Unscheduled: "Rejasiz",
  Draft: "Qoralama",
};

const pad = (n: number) => String(n).padStart(2, "0");
const NONE = "__none__";

export default function LessonsPage() {
  const router = useRouter();
  const setStoreClassId = useClassStore((s) => s.setSelectedClassId);
  // Sinf tanlash — lokal holat. null = sahifaga kirilganda hech narsa tanlanmagan
  // (Sinflar ustuni 50%). Tanlangach store ham yangilanadi (boshqa sahifalar bilan sinxron).
  const [selectedClassId, setSelectedClassIdState] = useState<string | null>(null);
  const handleSelectClass = (id: string) => { setSelectedClassIdState(id); setStoreClassId(id); };
  const liveClasses = useLiveClasses();
  const createClass = useCreateClass();
  const units = useLessonStore((s) => s.units);
  const lessons = useLessonStore((s) => s.lessons);
  const addUnit = useLessonStore((s) => s.addUnit);
  const addLesson = useLessonStore((s) => s.addLesson);
  const deleteUnit = useLessonStore((s) => s.deleteUnit);
  const deleteLesson = useLessonStore((s) => s.deleteLesson);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useEffect(() => { setSelectedUnitId(null); }, [selectedClassId]);

  const unitsForClass = useMemo(
    () => units.filter((u) => u.classId === selectedClassId).sort((a, b) => a.number - b.number),
    [selectedClassId, units]
  );

  const noUnitLessons = useMemo(
    () => selectedClassId
      ? lessons.filter((l) => lessonClassIds(l).includes(selectedClassId) && unitIdForClass(l, selectedClassId) === null)
      : [],
    [lessons, selectedClassId]
  );

  const lessonsForUnit = useMemo(() => {
    if (!selectedUnitId || !selectedClassId) return [];
    if (selectedUnitId === NONE) return noUnitLessons;
    return lessons.filter((l) => lessonClassIds(l).includes(selectedClassId) && unitIdForClass(l, selectedClassId) === selectedUnitId);
  }, [selectedUnitId, selectedClassId, noUnitLessons, lessons]);

  const unitProgress = (unitId: string | null) => {
    const all = unitId === null
      ? noUnitLessons
      : (selectedClassId ? lessons.filter((l) => lessonClassIds(l).includes(selectedClassId) && unitIdForClass(l, selectedClassId) === unitId) : []);
    const done = all.filter((l) => l.status === "Completed").length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };

  const unitStats = useMemo(() => {
    if (!selectedUnitId || selectedUnitId === NONE || !selectedClassId) return null;
    const unitLessons = lessons.filter((l) => lessonClassIds(l).includes(selectedClassId) && unitIdForClass(l, selectedClassId) === selectedUnitId);
    const completed = unitLessons.filter((l) => l.status === "Completed").length;
    return { lessons: unitLessons.length, completed, pct: unitLessons.length ? Math.round((completed / unitLessons.length) * 100) : 0 };
  }, [selectedUnitId, selectedClassId, lessons]);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);

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
    toast.success("Yangi dars yaratildi");
    router.push(`/lessons/${id}`);
  };

  const openLesson = (id: string) => router.push(`/lessons/${id}`);

  const selectedClass = liveClasses.find((c) => c.id === selectedClassId) ?? null;
  const selectedUnit = selectedUnitId && selectedUnitId !== NONE
    ? units.find((u) => u.id === selectedUnitId) ?? null
    : null;

  const selectedClassColor = selectedClass ? classColor(selectedClass) : "teal";
  const selectedClassTints = classTints(selectedClassColor);
  const selectedClassHex = CLASS_COLOR_HEX[selectedClassColor];
  /** Tanlangan element foni — sinf rangining shaffof tinti (EMStudio rgba effekti) */
  const tintBg = (pct: number) => `color-mix(in srgb, ${selectedClassHex} ${pct}%, transparent)`;

  /* Ustun nisbatlari — "sidebardan tashqari" maydon = 100%, flex-grow + flex-basis:0
     bilan boʻlinadi (sidebar ochiq/yopiq boʻlsa ham responsive). "Faol ish" ustuni keng:
       sinf tanlanmagan → 50/25/25, sinf tanlangan → 25/50/25, boʻlim tanlangan → 25/25/50. */
  const noClass = !selectedClassId;
  const detailMode = !!selectedUnitId;
  const grow = noClass
    ? { classes: 2, units: 1, lessons: 1 }
    : detailMode
      ? { classes: 1, units: 1, lessons: 2 }
      : { classes: 1, units: 2, lessons: 1 };

  /* ── Unit qator/karta koʻrinishlari ── */

  // Keng ustun (boʻlim tanlanmagan): toʻliq karta — nom + tavsif + dars soni + progress
  const renderUnitWide = (unit: Unit) => {
    const { total, pct } = unitProgress(unit.id);
    return (
      <button
        key={unit.id}
        onClick={() => setSelectedUnitId(unit.id)}
        className="list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer"
        style={{ ["--card-accent" as string]: selectedClassHex }}
      >
        <div style={selectedClassTints.iconBg} className="list-card-icon size-11 rounded-lg shrink-0 flex items-center justify-center">
          <Layers style={selectedClassTints.iconText} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
            {pad(unit.number)}. {unit.title}
          </h4>
          <TypographyMuted className="text-xs leading-relaxed mt-1 line-clamp-1">{unit.description}</TypographyMuted>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">
          <FileText className="size-3.5" />
          <span>{total} dars</span>
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
  const renderUnitSelected = (unit: Unit) => {
    const { total } = unitProgress(unit.id);
    return (
      <button
        key={unit.id}
        onClick={() => setSelectedUnitId(null)}
        className="list-card w-full flex items-center text-left gap-3 p-4 cursor-pointer"
        data-active="true"
        style={{ ["--card-accent" as string]: selectedClassHex, ...selectedClassTints.tint }}
      >
        <div style={selectedClassTints.iconBg} className="list-card-icon size-11 rounded-lg shrink-0 flex items-center justify-center">
          <Layers style={selectedClassTints.iconText} className="size-5" />
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
  const renderUnitCompact = (unit: Unit) => {
    const { total } = unitProgress(unit.id);
    return (
      <button
        key={unit.id}
        onClick={() => setSelectedUnitId(unit.id)}
        className="group w-full flex items-center text-left gap-3 px-3 py-2.5 min-h-12 rounded-lg border-2 border-transparent cursor-pointer transition-colors hover:bg-muted/50"
      >
        <span className="size-3 rounded-[4px] shrink-0" style={{ backgroundColor: selectedClassHex }} />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
          {pad(unit.number)}. {unit.title}
        </span>
        <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0">{total}</span>
      </button>
    );
  };

  // "Boʻlimsiz" — keng ustun
  const renderNoUnitWide = () => {
    const { total, pct } = unitProgress(null);
    return (
      <button
        onClick={() => setSelectedUnitId(NONE)}
        className="list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer"
        style={{ ["--card-accent" as string]: "var(--muted-foreground)" }}
      >
        <div className="list-card-icon size-11 rounded-lg bg-muted shrink-0 flex items-center justify-center">
          <Layers className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-tight truncate">Boʻlimsiz</h4>
          <TypographyMuted className="text-xs leading-relaxed mt-1 line-clamp-1">Birorta boʻlimga biriktirilmagan darslar</TypographyMuted>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">
          <FileText className="size-3.5" />
          <span>{total} dars</span>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 w-[130px]">
          <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-muted-foreground/40 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
        </div>
      </button>
    );
  };

  // "Boʻlimsiz" — tor ustun (tanlangan / kompakt)
  const renderNoUnitNarrow = () => {
    if (selectedUnitId === NONE) {
      return (
        <button
          onClick={() => setSelectedUnitId(null)}
          className="list-card w-full flex items-center text-left gap-3 p-4 cursor-pointer"
          data-active="true"
          style={{ ["--card-accent" as string]: "var(--muted-foreground)", backgroundColor: "var(--muted)" }}
        >
          <div className="list-card-icon size-11 rounded-lg bg-muted shrink-0 flex items-center justify-center">
            <Layers className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground leading-tight block">Boʻlimsiz</h4>
            <TypographyMuted className="text-xs leading-snug mt-1">Biriktirilmagan darslar</TypographyMuted>
          </div>
        </button>
      );
    }
    return (
      <button
        onClick={() => setSelectedUnitId(NONE)}
        className="group w-full flex items-center text-left gap-3 px-3 py-2.5 min-h-12 rounded-lg border-2 border-transparent cursor-pointer transition-colors hover:bg-muted/50"
      >
        <span className="size-3 rounded-[4px] shrink-0 bg-muted-foreground/30" />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
          Boʻlimsiz
        </span>
      </button>
    );
  };

  return (
    <div className="flex-1 min-w-0 h-full min-h-0 flex gap-6 p-4 md:p-6 overflow-hidden">
      {/* ── Column 1: Sinflar (25%) ── */}
      <div className="hidden lg:block min-w-0 min-h-0 h-full" style={{ flexGrow: grow.classes, flexBasis: 0 }}>
        <ClassListPanel page="lessons" selectedClassId={selectedClassId ?? ""} onSelect={handleSelectClass} onAddClass={() => setClassModalOpen(true)} />
      </div>

      {/* ── Column 2: Boʻlimlar ── */}
      <div
        className="min-w-0 min-h-0 h-full bg-card rounded-xl card-elevation flex flex-col overflow-hidden"
        style={{ flexGrow: grow.units, flexBasis: 0 }}
      >
          {noClass ? (
            /* Sinf tanlanmagan — headerʼsiz, markaziy placeholder (2-rasm) */
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Layers /></EmptyMedia>
                <EmptyTitle>Sinf tanlanmagan</EmptyTitle>
                <EmptyDescription>Boʻlimlarni koʻrish uchun sinf tanlang</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
          {/* Header */}
          <div className="px-5 py-5 flex items-center justify-between shrink-0 gap-2 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <SectionIcon><Layers /></SectionIcon>
              <CardTitle className="truncate">Boʻlimlar</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleCreateUnit}>
              <Plus className="size-4" />
              <span>Qoʻshish</span>
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <ScrollArea className="h-full w-full">
              <div className="px-3 pt-4 pb-5 space-y-1.5">
                {detailMode ? (
                  /* Tor rejim — tanlangan katta, qolganlari kompakt */
                  <>
                    {unitsForClass.map((unit) =>
                      unit.id === selectedUnitId ? renderUnitSelected(unit) : renderUnitCompact(unit)
                    )}
                    {renderNoUnitNarrow()}
                  </>
                ) : (
                  /* Keng rejim — toʻliq kartalar + doimo "Boʻlimsiz" karta.
                     Haqiqiy boʻlim boʻlmasa, qoʻshimcha markaziy yoʻriqnoma. */
                  <>
                    {unitsForClass.map(renderUnitWide)}
                    {renderNoUnitWide()}
                    {unitsForClass.length === 0 && (
                      <Empty className="py-12">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><Layers /></EmptyMedia>
                          <EmptyTitle>Boʻlimlar yoʻq</EmptyTitle>
                          <EmptyDescription>Boʻlim qoʻshing yoki darslarni toʻgʻridan-toʻgʻri qoʻshing.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button variant="outline" className="gap-2 h-9" onClick={handleCreateUnit}>
                            <Plus className="size-4" />
                            Boʻlim qoʻshish
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Bottom selected unit stats (faqat haqiqiy boʻlim tanlanganda) */}
          {selectedUnit && unitStats && (
            <div className="group/stats border-t border-border px-5 py-5 space-y-4 shrink-0">
              <div className="flex items-center gap-3">
                <div style={selectedClassTints.iconBg} className="p-3.5 rounded-xl shrink-0">
                  <Layers style={selectedClassTints.iconText} className="size-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground leading-tight truncate">
                    {pad(selectedUnit.number)}. {selectedUnit.title}
                  </h4>
                  <TypographyMuted className="text-xs leading-relaxed mt-1 line-clamp-1">
                    {selectedUnit.description}
                  </TypographyMuted>
                </div>
                <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-200">
                  <button title="Tahrirlash" className="p-2 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-muted transition-colors">
                    <Pencil className="size-4" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        title="Oʻchirish"
                        className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-muted transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Boʻlimni oʻchirish</AlertDialogTitle>
                        <AlertDialogDescription>
                          «{pad(selectedUnit.number)}. {selectedUnit.title}» boʻlimi oʻchiriladi. Undagi darslar oʻchmaydi — faqat boʻlimsiz boʻlib qoladi. Bu amalni qaytarib boʻlmaydi.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => { deleteUnit(selectedUnit.id); setSelectedUnitId(null); toast.success("Boʻlim oʻchirildi"); }}
                        >
                          Oʻchirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg" style={{ backgroundColor: tintBg(8.2) }}>
                  <p className="text-lg font-bold text-foreground leading-none">{unitStats.lessons}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Darslar</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: tintBg(8.2) }}>
                  <p className="text-lg font-bold text-foreground leading-none">{unitStats.completed}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Bajarildi</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tugallandi</span>
                  <span className="font-medium tabular-nums">{unitStats.completed}/{unitStats.lessons}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(unitStats.pct, 100)}%`, backgroundColor: selectedClassHex }} />
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* ── Column 3: Mavzular ── */}
        <div
          className="min-w-0 min-h-0 h-full bg-card rounded-xl card-elevation flex flex-col overflow-hidden"
          style={{ flexGrow: grow.lessons, flexBasis: 0 }}
        >
          {!selectedUnitId ? (
            /* Boʻlim tanlanmagan — headerʼsiz, faqat markaziy placeholder (1-rasm) */
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                <EmptyTitle>Boʻlim tanlanmagan</EmptyTitle>
                <EmptyDescription>Mavzularni koʻrish uchun boʻlim tanlang.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
          {/* Header */}
          <div className="px-5 py-5 flex items-center justify-between shrink-0 gap-2 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <SectionIcon><FileText /></SectionIcon>
              <CardTitle className="truncate">Mavzular</CardTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="hidden xl:flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Tahrirlash" className="text-muted-foreground hover:text-foreground">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Qidirish" className="text-muted-foreground hover:text-foreground">
                  <Search className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Saralash" className="text-muted-foreground hover:text-foreground">
                  <ArrowDownUp className="size-4" />
                </Button>
              </div>
              {selectedUnitId && (
                <Button size="sm" className="h-9 gap-1.5 ml-1 px-3" onClick={handleNewLesson}>
                  <Plus className="size-3.5" />
                  <span className="hidden lg:inline">Yangi mavzu</span>
                </Button>
              )}
              <Separator orientation="vertical" className="h-5 mx-1.5" />
              {/* Segmented list/calendar toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60">
                <button type="button" className="size-7 rounded-md flex items-center justify-center bg-card text-foreground shadow-sm transition-colors" title="Roʻyxat">
                  <List className="size-4" />
                </button>
                <button type="button" className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Kalendar">
                  <Calendar className="size-4" />
                </button>
              </div>
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
                      <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                      <EmptyTitle>Hali mavzu yoʻq</EmptyTitle>
                      <EmptyDescription>Ushbu boʻlimga birinchi mavzuni qoʻshing.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button variant="outline" className="gap-2 h-9" onClick={handleNewLesson}>
                        <Plus className="size-4" />
                        Yangi mavzu
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  lessonsForUnit.map((lesson) => {
                    const lessonUnit = units.find((u) => u.id === lesson.unitId);
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => openLesson(lesson.id)}
                        className="list-card group flex items-center gap-3 p-3.5 cursor-pointer"
                        style={{ ["--card-accent" as string]: selectedClassHex }}
                      >
                        <div style={selectedClassTints.iconBg} className="list-card-icon size-11 rounded-lg shrink-0 flex items-center justify-center">
                          <FileText style={selectedClassTints.iconText} className="size-5" />
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
                        <div className="shrink-0 overflow-hidden max-w-0 opacity-0 group-hover:max-w-9 group-hover:opacity-100 transition-all duration-200 ease-out">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                title="Oʻchirish"
                                className="size-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-muted transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Darsni oʻchirish</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu dars va uning tahrirlagichdagi barcha mazmuni butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => { deleteLesson(lesson.id); toast.success("Dars oʻchirildi"); }}
                                >
                                  Oʻchirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
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
            onSubmit={(v) => { handleSelectClass(createClass(v)); setClassModalOpen(false); }}
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
      </div>
  );
}
