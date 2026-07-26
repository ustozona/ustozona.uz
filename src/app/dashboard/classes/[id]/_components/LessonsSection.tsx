"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { useLessonStore } from "@/store/useLessonStore";
import { lessonClassIds, unitIdForClass, type Unit, type Lesson } from "@/lib/lessons-data";
import CreateUnitModal from "@/components/CreateUnitModal";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Layers, FileText, Plus, Search, ArrowDownUp, Pencil, List, Calendar, Trash2, ChevronDown } from "lucide-react";
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
import type { ClassIdentity } from "@/lib/class-id";

/** Status badge ranglari — semantik tokenlar */
const STATUS_STYLES: Record<Lesson["status"], string> = {
  Completed: "bg-success/10 text-success",
  Scheduled: "bg-info/10 text-info",
  Unscheduled: "bg-warning/10 text-warning",
  Draft: "bg-muted text-muted-foreground",
};
function statusLabels(t: (key: string) => string): Record<Lesson["status"], string> {
  return {
    Completed: t("statusCompleted"),
    Scheduled: t("statusScheduled"),
    Unscheduled: t("statusUnscheduled"),
    Draft: t("statusDraft"),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const NONE = "__none__";

export function LessonsSection({ identity }: { identity: ClassIdentity }) {
  const t = useTranslations("LessonsSection");
  const router = useRouter();
  const classId = identity.id;
  const tints = classTints(identity.color);
  const hex = CLASS_COLOR_HEX[identity.color];

  // Persist (localStorage) store — SSR seed ≠ client (rehydrate) hydration mismatch'ini
  // oldini olish uchun mount-gate: birinchi client renderда server bilan bir xil (gate).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const units = useLessonStore((s) => s.units);
  const lessons = useLessonStore((s) => s.lessons);
  const addUnit = useLessonStore((s) => s.addUnit);
  const addLesson = useLessonStore((s) => s.addLesson);
  const updateUnit = useLessonStore((s) => s.updateUnit);
  const deleteUnit = useLessonStore((s) => s.deleteUnit);
  const restoreUnit = useLessonStore((s) => s.restoreUnit);
  const deleteLesson = useLessonStore((s) => s.deleteLesson);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editUnitTarget, setEditUnitTarget] = useState<Unit | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);
  const [editUnitTitle, setEditUnitTitle] = useState("");
  const [editUnitDesc, setEditUnitDesc] = useState("");
  const [unitModalOpen, setUnitModalOpen] = useState(false);
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

  useEffect(() => { setSelectedUnitId(null); }, [classId]);

  const unitsForClass = useMemo(
    () => units.filter((u) => u.classId === classId).sort((a, b) => a.number - b.number),
    [classId, units]
  );

  const noUnitLessons = useMemo(
    () => lessons.filter((l) => lessonClassIds(l).includes(classId) && unitIdForClass(l, classId) === null),
    [lessons, classId]
  );

  const lessonsForUnit = useMemo(() => {
    if (!selectedUnitId) return [];
    if (selectedUnitId === NONE) return noUnitLessons;
    return lessons.filter((l) => lessonClassIds(l).includes(classId) && unitIdForClass(l, classId) === selectedUnitId);
  }, [selectedUnitId, classId, noUnitLessons, lessons]);

  const unitProgress = (unitId: string | null) => {
    const all = unitId === null
      ? noUnitLessons
      : lessons.filter((l) => lessonClassIds(l).includes(classId) && unitIdForClass(l, classId) === unitId);
    const done = all.filter((l) => l.status === "Completed").length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };

  const unitStats = useMemo(() => {
    if (!selectedUnitId || selectedUnitId === NONE) return null;
    const unitLessons = lessons.filter((l) => lessonClassIds(l).includes(classId) && unitIdForClass(l, classId) === selectedUnitId);
    const completed = unitLessons.filter((l) => l.status === "Completed").length;
    return { lessons: unitLessons.length, completed, pct: unitLessons.length ? Math.round((completed / unitLessons.length) * 100) : 0 };
  }, [selectedUnitId, classId, lessons]);

  const selectedUnit = selectedUnitId && selectedUnitId !== NONE
    ? units.find((u) => u.id === selectedUnitId) ?? null
    : null;

  const handleUnitSubmit = (values: { name: string; classIds: string[]; description: string }) => {
    let createdId: string | null = null;
    values.classIds.forEach((cid) => {
      const id = addUnit({ classId: cid, title: values.name, description: values.description });
      if (cid === classId) createdId = id;
    });
    setUnitModalOpen(false);
    if (createdId) setSelectedUnitId(createdId);
  };

  const handleNewLesson = () => {
    if (!selectedUnitId) return;
    const id = addLesson({
      classId,
      unitId: selectedUnitId === NONE ? null : selectedUnitId,
      title: "",
      status: "Draft",
    });
    toast.success(t("newLessonToast"));
    router.push(`/lessons/${id}`);
  };

  const openLesson = (id: string) => router.push(`/lessons/${id}`);

  const detailMode = !!selectedUnitId;
  // Muvozanatli boʻlinish — hech bir ustun 2:1 darajada dominant emas.
  // Boʻlim tanlanmagan → Units biroz kengroq (3:2); tanlangan → Mavzular kengroq (2:3).
  const grow = detailMode ? { units: 2, lessons: 3 } : { units: 3, lessons: 2 };

  // Mount-gate: store rehydrate boʻlguncha boʻsh panel (SSR/client mos kelishi uchun)
  if (!mounted) {
    return (
      <div className="flex h-full min-h-0 gap-6 overflow-hidden">
        <div className="flex-[2] min-w-0 h-full bg-card rounded-xl border border-border" />
        <div className="flex-1 min-w-0 h-full bg-card rounded-xl border border-border" />
      </div>
    );
  }

  /* ── Unit qator/karta koʻrinishlari (lessons/page.tsx bilan bir xil uslub) ── */

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

  const renderUnitWide = (unit: Unit) => {
    const { total, pct } = unitProgress(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => setSelectedUnitId(unit.id)}
        className="list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer"
        style={{ ["--card-accent" as string]: hex }}
      >
        <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={tints.gradientTile}>
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
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hex }} />
          </div>
          <span className="text-xs font-medium tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
        </div>
      </button>
    );
  };

  const renderUnitSelected = (unit: Unit) => {
    const { total } = unitProgress(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => setSelectedUnitId(null)}
        className="list-card w-full flex items-center text-left gap-3 p-4 cursor-pointer"
        data-active="true"
        style={{ ["--card-accent" as string]: hex, ...tints.tint }}
      >
        <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={tints.gradientTile}>
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{pad(unit.number)}. {unit.title}</h4>
          <TypographyMuted className="text-xs leading-snug mt-1 line-clamp-1">{unit.description}</TypographyMuted>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ ...tints.badge, ...tints.text }}>
          {total}
        </span>
      </button>
    );
  };

  const renderUnitCompact = (unit: Unit) => {
    const { total } = unitProgress(unit.id);
    return withUnitMenu(unit,
      <button
        onClick={() => setSelectedUnitId(unit.id)}
        className="list-row group w-full"
      >
        <span className="size-2.5 rounded-[4px] shrink-0" style={{ backgroundColor: hex }} />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
          {pad(unit.number)}. {unit.title}
        </span>
        <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0">{total}</span>
      </button>
    );
  };

  const renderNoUnitWide = () => {
    const { total, pct } = unitProgress(null);
    return (
      <button
        onClick={() => setSelectedUnitId(NONE)}
        className="list-card group w-full flex items-center text-left gap-3 p-4 cursor-pointer"
        style={{ ["--card-accent" as string]: "var(--muted-foreground)" }}
      >
        <div className="list-card-icon size-11 rounded-full bg-muted shrink-0 flex items-center justify-center">
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

  const renderNoUnitNarrow = () => {
    if (selectedUnitId === NONE) {
      return (
        <button
          onClick={() => setSelectedUnitId(null)}
          className="list-card w-full flex items-center text-left gap-3 p-4 cursor-pointer"
          data-active="true"
          style={{ ["--card-accent" as string]: "var(--muted-foreground)", backgroundColor: "var(--muted)" }}
        >
          <div className="list-card-icon size-11 rounded-full bg-muted shrink-0 flex items-center justify-center">
            <Layers className="size-5 text-muted-foreground" />
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
        className="list-row group w-full"
      >
        <span className="size-2.5 rounded-[4px] shrink-0 bg-muted-foreground/25" />
        <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
          {t("noUnitTitle")}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-0 gap-6 overflow-hidden">
      {/* ── Boʻlimlar (Units) ── */}
      <div
        className="min-w-0 min-h-0 h-full bg-card rounded-xl border border-border flex flex-col overflow-hidden"
        style={{ flexGrow: grow.units, flexBasis: 0 }}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0 gap-2 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <SectionIcon><Layers /></SectionIcon>
            <CardTitle className="truncate">{t("unitsTitle")}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setUnitModalOpen(true)}>
            <Plus className="size-4" />
            <span>{t("addUnit")}</span>
          </Button>
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
          <ScrollArea className="h-full w-full">
            <div className="px-3 pt-4 pb-5 space-y-2">
              {detailMode ? (
                <>
                  {unitsForClass.map((unit) =>
                    unit.id === selectedUnitId ? renderUnitSelected(unit) : renderUnitCompact(unit)
                  )}
                  {renderNoUnitNarrow()}
                </>
              ) : (
                <>
                  {unitsForClass.map(renderUnitWide)}
                  {renderNoUnitWide()}
                  {unitsForClass.length === 0 && (
                    <Empty className="py-12">
                      <EmptyHeader>
                        <EmptyMedia><Illustration name="23" className="h-32 text-black dark:text-white" /></EmptyMedia>
                        <EmptyTitle>{t("unitsEmptyTitle")}</EmptyTitle>
                        <EmptyDescription>{t("unitsEmptyDescription")}</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button variant="outline" className="gap-2 h-9" onClick={() => setUnitModalOpen(true)}>
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

        {selectedUnit && unitStats && (
          <div className="border-t border-border shrink-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="size-9 rounded-full shrink-0 flex items-center justify-center text-white" style={tints.gradientTile}>
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
                    <p className="text-sm font-bold tabular-nums text-foreground mt-1">{unitStats.lessons} {t("lessonsUnit")}</p>
                  </div>
                  <div className="flex-1 min-w-0 px-3 first:pl-0 last:pr-0 text-center">
                    <p className="text-xs text-muted-foreground truncate">{t("completedStatLabel")}</p>
                    <p className="text-sm font-bold tabular-nums text-foreground mt-1">{unitStats.completed} {t("lessonsUnit")}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("progress")}</span>
                    <span className="font-bold tabular-nums text-foreground">{Math.round(unitStats.pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(unitStats.pct, 100)}%`, backgroundColor: hex }} />
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
                <Label htmlFor="eus-title">{t("nameLabel")}</Label>
                <Input id="eus-title" value={editUnitTitle} onChange={(e) => setEditUnitTitle(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eus-desc">{t("descriptionLabel")}</Label>
                <Textarea id="eus-desc" value={editUnitDesc} onChange={(e) => setEditUnitDesc(e.target.value)} rows={3} />
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
      </div>

      {/* ── Mavzular (Lessons) ── */}
      <div
        className="min-w-0 min-h-0 h-full bg-card rounded-xl border border-border flex flex-col overflow-hidden"
        style={{ flexGrow: grow.lessons, flexBasis: 0 }}
      >
        {!selectedUnitId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <SectionIcon size="lg" className="mb-4"><FileText /></SectionIcon>
            <p className="text-base font-semibold text-foreground">{t("noUnitSelectedTitle")}</p>
            <TypographyMuted className="text-sm mt-1.5">{t("noUnitSelectedDescription")}</TypographyMuted>
          </div>
        ) : (
          <>
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
                <Button size="sm" className="h-9 gap-1.5 ml-1 px-3" onClick={handleNewLesson}>
                  <Plus className="size-3.5" />
                  <span className="hidden lg:inline">{t("newLesson")}</span>
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1.5" />
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60">
                  <button type="button" className="size-7 rounded-md flex items-center justify-center bg-card text-foreground shadow-sm transition-colors" title={t("listViewAria")}>
                    <List className="size-4" />
                  </button>
                  <button type="button" className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title={t("calendarViewAria")}>
                    <Calendar className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
              <ScrollArea className="h-full w-full">
                <div className="px-4 pt-4 pb-5 space-y-2">
                  {lessonsForUnit.length === 0 ? (
                    <Empty className="py-16">
                      <EmptyHeader>
                        <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                        <EmptyTitle>{t("lessonsEmptyTitle")}</EmptyTitle>
                        <EmptyDescription>{t("lessonsEmptyDescription")}</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button variant="outline" className="gap-2 h-9" onClick={handleNewLesson}>
                          <Plus className="size-4" />
                          {t("newLesson")}
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
                          className="list-card group flex items-center gap-3 p-4 cursor-pointer"
                          style={{ ["--card-accent" as string]: hex }}
                        >
                          <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={tints.gradientTile}>
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
                              {pad(lesson.number)}. {lesson.title}
                            </h4>
                            {lessonUnit && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                <ClassSwatch hex={hex} className="size-2" />
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
                              {statusLabels(t)[lesson.status]}
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

      {unitModalOpen && (
        <CreateUnitModal
          defaultClassIds={[classId]}
          onSubmit={handleUnitSubmit}
          onClose={() => setUnitModalOpen(false)}
        />
      )}
    </div>
  );
}
