"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";
import { BulkActionBar, BulkActionButton, BulkActionCount, BulkActionDivider } from "@/components/BulkActionBar";
import { useSidebar } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StripedPattern } from "@/components/ui/striped-pattern";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  XIcon, PlusIcon, ChevronDownIcon,
  LayoutGrid, List as ListIcon, Table as TableIcon, PencilIcon, Trash2 as TrashIcon,
  GraduationCap, Search, ArrowUpDown, BarChart3, Users, BookOpen,
  ClipboardList, MoreHorizontal, ArrowRight, Archive as ArchiveIcon, ArchiveRestore,
} from "lucide-react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CLASS_COLOR_HEX, classTints, classColorValue, type ClassColor } from "@/lib/class-colors";
import { classIcon, type ClassIconKey } from "@/lib/class-icons";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { lessonClassIds } from "@/lib/lessons-data";
import { classFormInitial, classInfoFromForm, useCreateClass } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeClassesTourDemo } from "@/components/tour/classes-tour-demo";
import { ClassFormModal, type ClassFormValues } from "@/components/ClassFormModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import DashboardPage, {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
  panelScrollInnerClass,
} from "@/components/DashboardPage";

/* Sinflar — jonli manbadan (useGradesStore.classDataMap, server-backed).
   Yaratish/tahrirlash/oʻchirish store'ga yoziladi; GradesServerSync
   oʻzgarishni avtomatik serverga sinxronlaydi. */

type SortKey = "name" | "students" | "lessons";
type ViewMode = "grid" | "list" | "table";
const CLASSES_VIEW_STORAGE_KEY = "classes-view-mode";

/** Sahifa koʻrinishi uchun jonli sinf modeli (statistika bilan). */
export type LiveClass = {
  id: string;
  info: ClassInfo;
  name: string;
  color: ClassColor;
  schedule?: string;
  subject?: string;
  students: number;
  lessons: number;
  coveredLessons: number;
  assignments: number;
  initials: string[];
};

export default function ClassesPage() {
  const t = useTranslations("ClassesPage");
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  useEffect(() => {
    const stored = localStorage.getItem(CLASSES_VIEW_STORAGE_KEY);
    if (stored === "grid" || stored === "list" || stored === "table") setView(stored);
  }, []);
  const handleViewChange = (v: ViewMode) => {
    setView(v);
    if (v !== "table") setSelectedIds(new Set());
    localStorage.setItem(CLASSES_VIEW_STORAGE_KEY, v);
  };
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LiveClass | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<LiveClass[] | null>(null);
  // Jadval koʻrinishida qator tanlash — faqat bulk arxivlash/oʻchirish uchun.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Onboarding CTA'dan (`?new=1`) kelganda create-modalni avtomatik ochish —
  // "Birinchi sinfni yaratish" tugmasi vaʼda qilgan ishni bajaradi.
  // window.location + replaceState — useClassIdParam naqshi (Suspense
  // chegarasi talab qilmaydi, router.replace remount gotcha'sidan xoli).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") {
      setIsCreateModalOpen(true);
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url);
    }
  }, []);

  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const hydrated = useGradesStore((s) => s._hasHydrated);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const allLessons = useLessonStore((s) => s.lessons);
  // Server hydration tugamaguncha skeleton
  const loading = !hydrated;

  const allLiveClasses = useMemo<LiveClass[]>(
    () =>
      Object.values(classDataMap).map((cd) => {
        const cls = cd.info;
        const classLessons = allLessons.filter((l) => lessonClassIds(l).includes(cls.id));
        return {
          id: cls.id,
          info: cls,
          name: cls.name,
          color: classColor(cls),
          schedule: cls.time,
          subject: cls.subject,
          students: cd.students.length,
          lessons: classLessons.length,
          coveredLessons: classLessons.filter((l) => l.status === "Completed").length,
          assignments: cd.assignments.length,
          initials: cd.students.slice(0, 3).map((s) => s.initials),
        };
      }),
    [classDataMap, allLessons]
  );
  // Arxivlangan sinflar asosiy roʻyxatdan/statistikadan chiqariladi — pastda
  // alohida "Arxivlangan" boʻlimda tiklash uchun koʻrsatiladi.
  const liveClasses = useMemo(() => allLiveClasses.filter((c) => !c.info.archivedAt), [allLiveClasses]);
  const archivedClasses = useMemo(() => allLiveClasses.filter((c) => !!c.info.archivedAt), [allLiveClasses]);

  // Tur-demo rejimi — sinflar turʼi boʻsh hisobda ochilsa (3–4-qadam:
  // koʻrinish almashtirish, statistika) boʻsh panellar namunaviy sinflar
  // bilan toʻldiriladi (faqat vizual, store'ga hech narsa yozilmaydi) —
  // [[timetable-tour-demo]] bilan bir xil naqsh.
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "classes");
  const tourDemoClasses = useMemo(() => (tourDemoActive ? makeClassesTourDemo() : null), [tourDemoActive]);
  const isDemoMode = tourDemoClasses != null && liveClasses.length === 0;
  const liveClassesDisplay = isDemoMode ? tourDemoClasses! : liveClasses;

  const createClass = useCreateClass();

  const handleCreate = (v: ClassFormValues) => {
    createClass(v);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (v: ClassFormValues) => {
    if (!editTarget) return;
    updateClass(editTarget.id, (cd) => ({
      ...cd,
      info: classInfoFromForm(editTarget.id, v, cd.info),
    }));
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTargets || deleteTargets.length === 0) return;
    const ids = new Set(deleteTargets.map((c) => c.id));
    setClassDataMap((prev) => {
      const next = { ...prev };
      for (const id of ids) delete next[id];
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    toast.success(
      deleteTargets.length === 1
        ? t("deleteToast", { name: deleteTargets[0].name })
        : t("deleteBulkToast", { count: deleteTargets.length })
    );
    setDeleteTargets(null);
  };

  // Arxivlash — sinf pickerlardan yashirin boʻladi, lekin id/tarixi saqlanadi.
  const handleArchive = (cls: LiveClass) => {
    updateClass(cls.id, (cd) => ({
      ...cd,
      info: { ...cd.info, archivedAt: new Date().toISOString() },
    }));
    toast.success(t("archiveToast", { name: cls.name }), {
      action: { label: t("archiveUndo"), onClick: () => handleRestore(cls.id) },
    });
  };

  const handleBulkArchive = (targets: LiveClass[]) => {
    const ids = targets.map((c) => c.id);
    for (const id of ids) {
      updateClass(id, (cd) => ({
        ...cd,
        info: { ...cd.info, archivedAt: new Date().toISOString() },
      }));
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    toast.success(t("archiveBulkToast", { count: targets.length }), {
      action: { label: t("archiveUndo"), onClick: () => ids.forEach(handleRestore) },
    });
  };

  const handleRestore = (id: string) => {
    updateClass(id, (cd) => {
      if (!cd.info.archivedAt) return cd;
      const info = { ...cd.info };
      delete info.archivedAt;
      return { ...cd, info };
    });
    toast.success(t("restoreToast"));
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? liveClassesDisplay.filter((c) => c.name.toLowerCase().includes(q)) : liveClassesDisplay;
    return [...list].sort((a, b) => {
      if (sortKey === "students") return b.students - a.students;
      if (sortKey === "lessons") return b.lessons - a.lessons;
      return a.name.localeCompare(b.name);
    });
  }, [liveClassesDisplay, search, sortKey]);

  const totals = useMemo(() => ({
    classes: liveClassesDisplay.length,
    students: liveClassesDisplay.reduce((s, c) => s + c.students, 0),
    lessons: liveClassesDisplay.reduce((s, c) => s + c.lessons, 0),
    assignments: liveClassesDisplay.reduce((s, c) => s + c.assignments, 0),
  }), [liveClassesDisplay]);

  return (
    <DashboardPage>
      <TourDemoBanner tourId="classes" active={isDemoMode} />
      {/* ── Two-column layout: main card + overview sidebar ── */}
      <div className="flex flex-1 min-h-0 gap-6">

        {/* ── Main: classes panel ── */}
        <Card data-tour="classes-list" className={cn("flex-1 min-w-0", panelCardClass)}>
          <CardHeader className={cn(panelCardHeaderClass, "grid grid-rows-[auto] grid-cols-[1fr_auto_1fr] gap-3 min-h-16 px-5 pt-4! pb-4!")}>
            <div className="flex items-center gap-2.5 shrink-0 justify-self-start">
              <SectionIcon><GraduationCap /></SectionIcon>
              <CardTitle>{t("title")}</CardTitle>
            </div>

            {/* Koʻrinish toggle — sarlavha va amallar orasida, markazda */}
            <ToggleGroup
              data-tour="classes-view-toggle"
              type="single"
              value={view}
              onValueChange={(v) => v && handleViewChange(v as ViewMode)}
              variant="outline"
              size="default"
              className="hidden sm:flex shadow-none justify-self-center"
            >
              <ToggleGroupItem value="grid" aria-label={t("gridViewAria")}>
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={t("listViewAria")}>
                <ListIcon className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label={t("tableViewAria")}>
                <TableIcon className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex items-center gap-2 justify-self-end">
              {/* Search */}
              <div className={cn("flex items-center transition-all duration-fast", searchOpen ? "w-52" : "w-8")}>
                {searchOpen ? (
                  <div className="flex items-center w-full h-9 border border-border rounded-md px-3 gap-1.5 bg-background animate-in slide-in-from-right-2">
                    <Search className="size-4 text-muted-foreground shrink-0" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onBlur={() => !search && setSearchOpen(false)}
                      placeholder={t("searchPlaceholder")}
                      className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                    {search && (
                      <button onClick={() => { setSearch(""); setSearchOpen(false); }} className="text-muted-foreground hover:text-foreground">
                        <XIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                    <Search className="size-4" />
                  </Button>
                )}
              </div>

              {/* Sort */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ArrowUpDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    {sortKey === "name" ? t("sortShortName") : sortKey === "students" ? t("sortShortStudents") : t("sortShortLessons")}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <DropdownMenuRadioItem value="name">{t("sortFullName")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="students">{t("sortFullStudents")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="lessons">{t("sortFullLessons")}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New class */}
              <Button data-tour="classes-add" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                <PlusIcon className="size-4" />
                {t("newClass")}
              </Button>
            </div>
          </CardHeader>

          {/* Scrollable content */}
          <CardContent className={cn(panelCardContentClass, "relative")}>
            {view === "table" && selectedIds.size > 0 && (
              /* Guruhaviy amallar — header bilan joy talashmasin deb roʻyxat
                 ustiga suzuvchi panel sifatida chiqadi (Gmail/Linear naqshi). */
              <BulkActionBar>
                <BulkActionCount>{t("selectedCount", { count: selectedIds.size })}</BulkActionCount>
                <BulkActionDivider />
                <BulkActionButton
                  icon={<ArchiveIcon className="size-4" />}
                  onClick={() => handleBulkArchive(filteredAndSorted.filter((c) => selectedIds.has(c.id)))}
                >
                  {t("archive")}
                </BulkActionButton>
                <BulkActionButton
                  icon={<TrashIcon className="size-4" />}
                  variant="destructive"
                  onClick={() => setDeleteTargets(filteredAndSorted.filter((c) => selectedIds.has(c.id)))}
                >
                  {t("delete")}
                </BulkActionButton>
                <BulkActionDivider />
                <BulkActionButton onClick={() => setSelectedIds(new Set())}>
                  {t("cancel")}
                </BulkActionButton>
              </BulkActionBar>
            )}
            <div className={panelScrollInnerClass}>
              {loading ? (
                <div className={cn(
                  "grid gap-5",
                  collapsed
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2"
                )}>
                  {Array.from({ length: 6 }).map((_, i) => <ClassCardSkeleton key={i} index={i} />)}
                </div>
              ) : liveClassesDisplay.length === 0 ? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia><Illustration name="15" className="h-32 text-black dark:text-white" /></EmptyMedia>
                    <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                    <EmptyDescription>
                      {t("emptyDescription")}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                      <PlusIcon className="size-4" />
                      {t("emptyAddClass")}
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : filteredAndSorted.length === 0 ? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia><Illustration name="14" className="h-32 text-black dark:text-white" /></EmptyMedia>
                    <EmptyTitle>{t("notFoundTitle")}</EmptyTitle>
                    <EmptyDescription>{t("notFoundDescription", { search })}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div key={view} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-fast">
                  {view === "grid" ? (
                    <div className={cn(
                      "grid gap-5",
                      collapsed
                        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2"
                    )}>
                      {filteredAndSorted.map((cls, i) => (
                        <ClassGridCard
                          key={cls.id}
                          cls={cls}
                          index={i}
                          disabled={isDemoMode}
                          onEdit={() => setEditTarget(cls)}
                          onArchive={() => handleArchive(cls)}
                          onDelete={() => setDeleteTargets([cls])}
                        />
                      ))}
                      <AddClassCard onClick={() => setIsCreateModalOpen(true)} />
                    </div>
                  ) : view === "list" ? (
                    <div className="flex flex-col gap-2">
                      {filteredAndSorted.map((cls, i) => (
                        <ClassListRow
                          key={cls.id}
                          cls={cls}
                          index={i}
                          disabled={isDemoMode}
                          onEdit={() => setEditTarget(cls)}
                          onArchive={() => handleArchive(cls)}
                          onDelete={() => setDeleteTargets([cls])}
                        />
                      ))}
                    </div>
                  ) : (
                    <ClassesDataTable
                      rows={filteredAndSorted}
                      disabled={isDemoMode}
                      selectedIds={selectedIds}
                      onToggleSelect={(id) =>
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        })
                      }
                      onToggleSelectAll={() =>
                        setSelectedIds((prev) =>
                          prev.size === filteredAndSorted.length
                            ? new Set()
                            : new Set(filteredAndSorted.map((c) => c.id))
                        )
                      }
                      onEdit={setEditTarget}
                      onArchive={handleArchive}
                      onDelete={(cls) => setDeleteTargets([cls])}
                    />
                  )}
                </div>
              )}

              {/* Arxivlangan sinflar — asosiy roʻyxatdan yashirin, tiklash mumkin */}
              {!loading && !isDemoMode && archivedClasses.length > 0 && (
                <ArchivedClassesSection classes={archivedClasses} onRestore={handleRestore} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Overview sidebar ── */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col">
          <Card data-tour="classes-stats" className={cn(panelCardClass)}>
            <CardHeader className={cn(panelCardHeaderClass, "items-center gap-2 min-h-16 px-5 pt-4! pb-4!")}>
              <SectionIcon><BarChart3 /></SectionIcon>
              <CardTitle>{t("statsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className={panelCardContentClass}>
              {totals.classes === 0 ? (
                <div className={cn(panelScrollInnerClass, "flex h-full items-center justify-center text-center")}>
                  <TypographyMuted className="text-sm">
                    {t("statsEmpty")}
                  </TypographyMuted>
                </div>
              ) : (
                <div className={cn(panelScrollInnerClass, "flex flex-col gap-4")}>
                  <OverviewStat
                    icon={<GraduationCap className="size-4" />}
                    color="amber"
                    value={totals.classes}
                    label={t("statClasses")}
                    unit={t("statUnit")}
                  />
                  <OverviewStat
                    icon={<Users className="size-4" />}
                    color="violet"
                    value={totals.students}
                    label={t("statStudents")}
                    unit={t("statUnit")}
                  />
                  <OverviewStat
                    icon={<BookOpen className="size-4" />}
                    color="sky"
                    value={totals.lessons}
                    label={t("statLessons")}
                    unit={t("statUnit")}
                  />
                  <OverviewStat
                    icon={<ClipboardList className="size-4" />}
                    color="green"
                    value={totals.assignments}
                    label={t("statAssignments")}
                    unit={t("statUnit")}
                  />
                  <Button
                    variant="ghost"
                    className="mt-2 justify-start gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => router.push("/dashboard/statistics")}
                  >
                    {t("viewFullStats")}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isCreateModalOpen && (
        <ClassFormModal
          mode="create"
          onSubmit={handleCreate}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {editTarget && (
        <ClassFormModal
          mode="edit"
          initial={{
            ...classFormInitial(editTarget.info),
            color: editTarget.color,
            icon: (editTarget.info.icon as ClassIconKey | undefined),
            slots: [],
          }}
          onSubmit={handleEditSubmit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <AlertDialog open={!!deleteTargets} onOpenChange={(o) => !o && setDeleteTargets(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets && deleteTargets.length > 1
                ? t("deleteDialogBulk", {
                    count: deleteTargets.length,
                    students: deleteTargets.reduce((s, c) => s + c.students, 0),
                  })
                : deleteTargets && deleteTargets[0].students > 0
                ? t("deleteDialogWithStudents", { name: deleteTargets[0].name, count: deleteTargets[0].students })
                : t("deleteDialogWithoutStudents", { name: deleteTargets?.[0]?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPage>
  );
}

/* ─────────────────────────── Overview Stat ─────────────────────────── */

function OverviewStat({
  icon,
  color,
  value,
  label,
  unit,
}: {
  icon: React.ReactNode;
  color: ClassColor;
  value: number;
  label: string;
  unit?: string;
}) {
  const tints = classTints(color);
  const c = classColorValue(color);
  const iconBgLight = { backgroundColor: `color-mix(in oklch, ${c} 9%, var(--background))` };

  return (
    <div className="flex items-center gap-3">
      <div style={iconBgLight} className="flex items-center justify-center size-9 rounded-lg shrink-0">
        <span style={tints.iconText} className="flex items-center justify-center">{icon}</span>
      </div>
      <p className="flex-1 min-w-0 truncate text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums leading-none shrink-0">
        {value}{unit ? <span className="text-xs font-medium text-muted-foreground"> {unit}</span> : null}
      </p>
    </div>
  );
}

/* ─────────────────────────── Grid Card ─────────────────────────── */

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/** Ikonka tanlanmagan sinf uchun avatar monogrammasi: nomdan 1-2 belgi. */
function classMonogram(name: string): string {
  const base = name.split("(")[0].trim();
  const alnum = base.replace(/[^\p{L}\p{N}]/gu, "");
  return alnum.slice(0, 2).toUpperCase() || "?";
}

/** Yuklanish skeleti — ClassGridCard tarkibini aks ettiradi. */
function ClassCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="animate-fade-slide-up rounded-2xl border overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Skeleton className="h-[86px] w-full rounded-none" />
      <div className="px-5 pb-5 flex flex-col items-center gap-4">
        <Skeleton className="-mt-10 size-[84px] rounded-full border-4 border-card" />
        <div className="flex flex-col items-center gap-2 w-full -mt-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-14 rounded-full mt-1" />
        </div>
        <div className="flex w-full gap-3 border-t border-border pt-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="size-[18px] rounded" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClassGridCard({
  cls,
  index,
  disabled,
  onEdit,
  onArchive,
  onDelete,
}: {
  cls: LiveClass;
  index: number;
  disabled?: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("ClassesPage");
  const hex = CLASS_COLOR_HEX[cls.color];
  const rgb = hexToRgb(hex);
  // Dars rejasi progressi: oʻtilgan mavzular / rejadagi mavzular
  const progress = Math.round((cls.coveredLessons / Math.max(cls.lessons, 1)) * 100);
  const Icon = classIcon(cls.info.icon);
  // Halqa boʻsh holatdan boshlanib, joylashgach toʻladi (animatsiya)
  const RING_C = 251.33;
  const [ringFilled, setRingFilled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRingFilled(true), 80);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className={cn(
        "class-card animate-fade-slide-up group rounded-2xl border overflow-hidden flex flex-col relative transition-all duration-base",
        disabled
          ? "cursor-default"
          : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--card-hex)]/30"
      )}
      style={{ animationDelay: `${index * 40}ms`, "--card-rgb": rgb, "--card-hex": hex } as React.CSSProperties}
      onClick={disabled ? undefined : () => router.push(`/dashboard/classes/${cls.id}`)}
    >
      {/* Rangli cover band — gradient + striped tekstura */}
      <div
        className="relative h-[86px] shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, rgba(${rgb}, 0.20), rgba(${rgb}, 0.06))` }}
      >
        <StripedPattern
          className="opacity-50"
          style={{ color: `rgba(${rgb}, 0.5)` }}
        />
      </div>

      {/* ── Tepa ikonlar: chapda strelka (ochish), oʻngda 3-nuqta menu — ikkalasi ham ghost, faqat hover ── */}
      {!disabled && (
      <div className="absolute top-3 left-3 z-20">
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label={t("openClassAria")}
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/classes/${cls.id}`); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>
      )}
      {!disabled && (
      <div className="absolute top-3 right-3 z-20">
        <ClassCardMenu onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
      </div>
      )}

      <div className="relative px-5 pb-5 flex flex-col items-center gap-4">
        {/* Avatar + progress halqasi — bandning chegarasida, oʻrtaga tekislangan */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={(e) => e.stopPropagation()}
              className="-mt-10 relative size-[84px] cursor-help transition-transform duration-base group-hover:scale-105"
            >
              {/* Progress halqasi (SVG) */}
              <svg viewBox="0 0 84 84" className="absolute inset-0 size-full -rotate-90">
                <circle cx="42" cy="42" r="40" fill="none" strokeWidth="3" style={{ stroke: `rgba(${rgb}, 0.16)` }} />
                <circle
                  cx="42" cy="42" r="40" fill="none" strokeWidth="3" strokeLinecap="round"
                  style={{ stroke: hex, strokeDasharray: RING_C, strokeDashoffset: ringFilled ? RING_C * (1 - progress / 100) : RING_C, transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }}
                />
              </svg>
              {/* Avatar */}
              <div
                className="absolute inset-0 m-auto flex size-[68px] items-center justify-center rounded-full border-2 border-card shadow-sm"
                style={{ backgroundColor: hex }}
              >
                {cls.info.icon ? (
                  <Icon className="size-8 text-white" />
                ) : (
                  <span className="text-xl font-bold text-white tracking-tight select-none">{classMonogram(cls.name)}</span>
                )}
              </div>
              {/* Foiz badge */}
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border bg-card px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums shadow-sm"
                style={{ color: hex }}
              >
                {progress}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="font-semibold">{t("lessonPlanTooltipTitle")}</p>
            <p className="text-background/70">
              {t("lessonPlanTooltipBody", { lessons: cls.lessons, covered: cls.coveredLessons })}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Nom + jadval — oʻrtaga tekislangan */}
        <div className="flex flex-col items-center text-center min-w-0 w-full">
          <p className="font-bold text-base leading-tight truncate max-w-full text-foreground transition-colors duration-fast group-hover:text-[var(--card-hex)]">
            {cls.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cls.schedule ?? cls.subject ?? t("scheduleNotSet")}
          </p>
        </div>

        {/* Statistika — ikonali 3 ustun, vertikal ajratgichlar bilan */}
        <div className="flex w-full border-t border-border pt-3.5">
          <div className="flex flex-1 flex-col items-center text-center gap-1.5 pr-3 border-r border-border">
            <Users className="size-[18px] text-muted-foreground" />
            <span className="text-xs font-semibold">{t("studentsCount", { count: cls.students })}</span>
          </div>
          <div className="flex flex-1 flex-col items-center text-center gap-1.5 px-3 border-r border-border">
            <BookOpen className="size-[18px] text-muted-foreground" />
            <span className="text-xs font-semibold">{t("lessonsCount", { count: cls.lessons })}</span>
          </div>
          <div className="flex flex-1 flex-col items-center text-center gap-1.5 pl-3">
            <ClipboardList className="size-[18px] text-muted-foreground" />
            <span className="text-xs font-semibold">{t("assignmentsCount", { count: cls.assignments })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Karta uchun 3-nuqta DropdownMenu ── */
function ClassCardMenu({ onEdit, onArchive, onDelete }: { onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  const t = useTranslations("ClassesPage");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <PencilIcon className="size-4 text-muted-foreground" />
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
        >
          <ArchiveIcon className="size-4 text-muted-foreground" />
          {t("archive")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <TrashIcon className="size-4" />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─────────────────────────── Add Card ─────────────────────────── */

function AddClassCard({ onClick }: { onClick?: () => void }) {
  const t = useTranslations("ClassesPage");
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-dashed border-border hover:border-foreground/30 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-3 min-h-[160px] cursor-pointer group"
    >
      <div className="size-11 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted-foreground/10 transition-colors">
        <PlusIcon className="size-5 text-muted-foreground" strokeWidth={2} />
      </div>
      <TypographySmall className="text-muted-foreground">{t("addClassCard")}</TypographySmall>
    </button>
  );
}

/* ─────────────────────────── Arxivlangan sinflar ─────────────────────────── */

function ArchivedClassesSection({
  classes,
  onRestore,
}: {
  classes: LiveClass[];
  onRestore: (id: string) => void;
}) {
  const t = useTranslations("ClassesPage");
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 border-t border-border pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArchiveIcon className="size-4" />
        {t("archivedSection")}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{classes.length}</span>
        <ChevronDownIcon className={cn("ml-auto size-4 transition-transform duration-fast ease-standard", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {classes.map((cls) => {
            const hex = CLASS_COLOR_HEX[cls.color];
            return (
              <div
                key={cls.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.12)` }}
                >
                  <GraduationCap className="size-4" style={{ color: hex }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{cls.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("archivedStudentsCount", { count: cls.students })}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => onRestore(cls.id)}>
                  <ArchiveRestore className="size-4" />
                  {t("restore")}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Data Table ─────────────────────────── */

/** Sinflar jadval koʻrinishi — statistikadagi ClassesTable naqshiga
 * moslangan (butun qator bosiladi), lekin bu yerda haqiqiy CRUD amallar
 * bor, shuning uchun oxirgi ustunda ClassCardMenu saqlanadi. */
function ClassesDataTable({
  rows,
  disabled,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onArchive,
  onDelete,
}: {
  rows: LiveClass[];
  disabled?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (cls: LiveClass) => void;
  onArchive: (cls: LiveClass) => void;
  onDelete: (cls: LiveClass) => void;
}) {
  const router = useRouter();
  const t = useTranslations("ClassesPage");
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Sarlavha qatorini scroll konteynerga nisbatan qotiradi (statistikadagi
  // ClassesTable bilan bir xil naqsh) — pastga siljitilganda ustunlar
  // koʻrinishda qoladi. Jadval oʻzi emas, uni oʻrab turgan CardContent
  // (panelCardContentClass, overflow-y-auto) scroll boʻladi — shuning
  // uchun soya holati shu eng yaqin scroll ota-elementini topib kuzatiladi.
  const [scrolled, setScrolled] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  useEffect(() => {
    const scrollEl = tableRef.current?.closest<HTMLElement>(".overflow-y-auto");
    if (!scrollEl) return;
    const onScroll = () => setScrolled(scrollEl.scrollTop > 0);
    onScroll();
    scrollEl.addEventListener("scroll", onScroll);
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);
  const stickyHead = cn(
    "sticky top-0 z-20 bg-card after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-linear-to-b after:from-black/4 after:to-transparent after:transition-opacity",
    scrolled ? "after:opacity-100" : "after:opacity-0"
  );

  return (
    <table ref={tableRef} className="w-full min-w-3xl caption-bottom text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-fast">
      <TableHeader>
        <TableRow className="hover:bg-transparent! border-b-0!">
          {!disabled && (
            <TableHead className={cn(stickyHead, "w-11 px-4 py-3")}>
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label={t("selectAllAria")}
                className="cursor-pointer"
              />
            </TableHead>
          )}
          <TableHead className={cn(stickyHead, "pr-3 py-3 min-w-48", disabled ? "pl-4" : "pl-0")}>{t("columnClass")}</TableHead>
          <TableHead className={cn(stickyHead, "px-3 py-3")}>{t("columnStudents")}</TableHead>
          <TableHead className={cn(stickyHead, "px-3 py-3")}>{t("columnLessons")}</TableHead>
          <TableHead className={cn(stickyHead, "px-3 py-3 min-w-40")}>{t("columnLessonPlan")}</TableHead>
          {!disabled && <TableHead className={cn(stickyHead, "w-10 px-4 py-3")} />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((cls, i) => {
          const hex = CLASS_COLOR_HEX[cls.color];
          const progress = Math.round((cls.coveredLessons / Math.max(cls.lessons, 1)) * 100);
          return (
            <TableRow
              key={cls.id}
              className={cn(
                "group animate-fade-slide-up",
                disabled ? "cursor-default" : "cursor-pointer",
                selectedIds.has(cls.id) && "bg-muted/40"
              )}
              style={{ animationDelay: `${i * 25}ms` } as React.CSSProperties}
              onClick={disabled ? undefined : () => router.push(`/dashboard/classes/${cls.id}`)}
            >
              {!disabled && (
                <TableCell className="px-4 py-3.5">
                  <Checkbox
                    checked={selectedIds.has(cls.id)}
                    onCheckedChange={() => onToggleSelect(cls.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </TableCell>
              )}
              <TableCell className={cn("whitespace-nowrap py-3.5 pr-3", disabled ? "pl-4" : "pl-0")}>
                <div className="flex items-center gap-3">
                  <div
                    className="size-9 shrink-0 rounded-full flex items-center justify-center text-white"
                    style={classTints(cls.color).gradientTile}
                  >
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{cls.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cls.schedule ?? cls.subject ?? t("scheduleNotSet")}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="whitespace-nowrap px-3 py-3.5 text-sm tabular-nums text-muted-foreground">
                {t("studentsCount", { count: cls.students })}
              </TableCell>

              <TableCell className="whitespace-nowrap px-3 py-3.5 text-sm tabular-nums text-muted-foreground">
                {t("lessonsCount", { count: cls.lessons })}
              </TableCell>

              <TableCell className="whitespace-nowrap px-3 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Progress
                    value={progress}
                    indicatorColor={hex}
                    className="w-full h-1.5 max-w-28"
                    style={{ backgroundColor: `color-mix(in srgb, ${hex} 16%, transparent)` }}
                  />
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{progress}%</span>
                </div>
              </TableCell>

              {!disabled && (
                <TableCell className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center justify-end">
                    <ClassCardMenu
                      onEdit={() => onEdit(cls)}
                      onArchive={() => onArchive(cls)}
                      onDelete={() => onDelete(cls)}
                    />
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </table>
  );
}

/* ─────────────────────────── List Row ─────────────────────────── */

function ClassListRow({
  cls,
  index,
  disabled,
  onEdit,
  onArchive,
  onDelete,
}: {
  cls: LiveClass;
  index: number;
  disabled?: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("ClassesPage");
  const hex = CLASS_COLOR_HEX[cls.color];
  const initials = cls.initials;
  const overflow = Math.max(cls.students - initials.length, 0);

  return (
    <div
      className={cn("list-card animate-fade-slide-up group flex items-center gap-3 px-4 py-4", disabled ? "cursor-default" : "cursor-pointer")}
      style={{ animationDelay: `${index * 25}ms`, ["--card-accent" as string]: hex }}
      onClick={disabled ? undefined : () => router.push(`/dashboard/classes/${cls.id}`)}
    >
      {/* Rangli ikoncha */}
      <div
        className="list-card-icon size-11 rounded-full flex items-center justify-center shrink-0 text-white"
        style={classTints(cls.color).gradientTile}
      >
        <GraduationCap className="size-5" />
      </div>

      {/* Nom + jadval */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-none truncate transition-colors duration-fast group-hover:text-primary">
          {cls.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {cls.schedule ?? cls.subject ?? t("scheduleNotSet")}
        </p>
      </div>

      {/* Statistika */}
      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <span className="font-medium text-foreground">{t("lessonsCount", { count: cls.lessons })}</span>
        <span className="text-border">·</span>
        <span className="font-medium text-foreground">{t("assignmentsCount", { count: cls.assignments })}</span>
      </div>

      {/* Avatarlar */}
      <div className="hidden lg:flex -space-x-2 shrink-0">
        {initials.map((init, i) => (
          <Avatar key={i} className="size-8 ring-2 ring-background">
            <AvatarFallback className="text-[10px] font-semibold text-white" style={{ backgroundColor: hex }}>
              {init}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && (
          <Avatar className="size-8 ring-2 ring-background">
            <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
              +{overflow}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* 3-nuqta menu */}
      {!disabled && <ClassCardMenu onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />}
    </div>
  );
}
