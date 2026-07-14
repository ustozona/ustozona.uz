"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  LayoutGrid, List as ListIcon, PencilIcon, Trash2 as TrashIcon,
  GraduationCap, Search, ArrowUpDown, BarChart3, Users, BookOpen,
  ClipboardList, MoreHorizontal, ArrowRight, Archive as ArchiveIcon, ArchiveRestore,
} from "lucide-react";
import { CLASS_COLOR_HEX, classTints, classColorValue, type ClassColor } from "@/lib/class-colors";
import { classIcon, type ClassIconKey } from "@/lib/class-icons";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { lessonClassIds } from "@/lib/lessons-data";
import { classInfoFromForm, useCreateClass } from "@/hooks/useLiveClasses";
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
type ViewMode = "grid" | "list";

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
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LiveClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LiveClass | null>(null);

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
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setClassDataMap((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
    setDeleteTarget(null);
    toast.success(`«${name}» sinfi oʻchirildi`);
  };

  // Arxivlash — sinf pickerlardan yashirin boʻladi, lekin id/tarixi saqlanadi.
  const handleArchive = (cls: LiveClass) => {
    updateClass(cls.id, (cd) => ({
      ...cd,
      info: { ...cd.info, archivedAt: new Date().toISOString() },
    }));
    toast.success(`«${cls.name}» arxivlandi`, {
      action: { label: "Qaytarish", onClick: () => handleRestore(cls.id) },
    });
  };

  const handleRestore = (id: string) => {
    updateClass(id, (cd) => {
      if (!cd.info.archivedAt) return cd;
      const info = { ...cd.info };
      delete info.archivedAt;
      return { ...cd, info };
    });
    toast.success("Sinf tiklandi");
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
      {/* ── Two-column layout: main card + overview sidebar ── */}
      <div className="flex flex-1 min-h-0 gap-6">

        {/* ── Main: classes panel ── */}
        <Card data-tour="classes-list" className={cn("flex-1 min-w-0", panelCardClass)}>
          <CardHeader className={cn(panelCardHeaderClass, "justify-between gap-3 min-h-[4.5rem] px-5 py-5!")}>
            <div className="flex items-center gap-2.5 shrink-0">
              <SectionIcon><GraduationCap /></SectionIcon>
              <CardTitle>Mening sinflarim</CardTitle>
            </div>

            <div className="flex items-center gap-2">
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
                      placeholder="Sinf nomi..."
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

              {/* Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1.5 shadow-none">
                    <ChevronDownIcon className="size-4" />
                    <span className="hidden sm:inline">Filtr</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <DropdownMenuRadioItem value="name">Barcha sinflar</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="students">Oʻquvchisi koʻp</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="lessons">Darslari koʻp</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1.5 shadow-none">
                    <ArrowUpDown className="size-4" />
                    <span className="hidden sm:inline">
                      {sortKey === "name" ? "Alifbo boʻyicha" : sortKey === "students" ? "Oʻquvchilar soni" : "Darslar soni"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <DropdownMenuRadioItem value="name">Alifbo boʻyicha (A–Z)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="students">Oʻquvchilar soni boʻyicha</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="lessons">Darslar soni boʻyicha</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New class */}
              <Button data-tour="classes-add" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                <PlusIcon className="size-4" />
                Yangi sinf
              </Button>

              {/* View toggle - ToggleGroup (outline/sm — Filter va Sort bilan bir xil) */}
              <ToggleGroup
                data-tour="classes-view-toggle"
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as ViewMode)}
                variant="outline"
                size="default"
                className="hidden sm:flex shadow-none"
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <ListIcon className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>

          {/* Scrollable content */}
          <CardContent className={panelCardContentClass}>
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
                    <EmptyTitle>Hozircha sinflar yoʻq</EmptyTitle>
                    <EmptyDescription>
                      Birinchi sinfingizni qoʻshing va oʻquvchilar roʻyxati, davomat hamda baholashni yuritishni boshlang.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                      <PlusIcon className="size-4" />
                      Yangi sinf qoʻshish
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : filteredAndSorted.length === 0 ? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia><Illustration name="14" className="h-32 text-black dark:text-white" /></EmptyMedia>
                    <EmptyTitle>Topilmadi</EmptyTitle>
                    <EmptyDescription>«{search}» boʻyicha hech narsa yoʻq</EmptyDescription>
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
                          onDelete={() => setDeleteTarget(cls)}
                        />
                      ))}
                      <AddClassCard onClick={() => setIsCreateModalOpen(true)} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredAndSorted.map((cls, i) => (
                        <ClassListRow
                          key={cls.id}
                          cls={cls}
                          index={i}
                          disabled={isDemoMode}
                          onEdit={() => setEditTarget(cls)}
                          onArchive={() => handleArchive(cls)}
                          onDelete={() => setDeleteTarget(cls)}
                        />
                      ))}
                    </div>
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
            <CardHeader className={cn(panelCardHeaderClass, "items-center gap-2 min-h-[4.5rem] px-5 py-5!")}>
              <SectionIcon><BarChart3 /></SectionIcon>
              <CardTitle>Statistika</CardTitle>
            </CardHeader>
            <CardContent className={panelCardContentClass}>
              {totals.classes === 0 ? (
                <div className={cn(panelScrollInnerClass, "flex h-full items-center justify-center text-center")}>
                  <TypographyMuted className="text-sm">
                    Sinf qoʻshgach statistikangiz shu yerda koʻrinadi
                  </TypographyMuted>
                </div>
              ) : (
                <div className={cn(panelScrollInnerClass, "flex flex-col gap-4")}>
                  <OverviewStat
                    icon={<GraduationCap className="size-4" />}
                    color="amber"
                    value={totals.classes}
                    label="Sinflar"
                  />
                  <OverviewStat
                    icon={<Users className="size-4" />}
                    color="violet"
                    value={totals.students}
                    label="Oʻquvchilar"
                  />
                  <OverviewStat
                    icon={<BookOpen className="size-4" />}
                    color="sky"
                    value={totals.lessons}
                    label="Darslar"
                  />
                  <OverviewStat
                    icon={<ClipboardList className="size-4" />}
                    color="green"
                    value={totals.assignments}
                    label="Topshiriqlar"
                  />
                  <Button
                    variant="ghost"
                    className="mt-2 justify-start gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => toast("Toʻliq statistika sahifasi tez orada qoʻshiladi")}
                  >
                    Toʻliq statistikani koʻrish
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
            name: editTarget.info.name,
            grade: editTarget.info.grade ?? null,
            subject: editTarget.info.subject ?? "",
            color: editTarget.color,
            icon: (editTarget.info.icon as ClassIconKey | undefined),
            description: editTarget.info.description ?? "",
            slots: [],
          }}
          onSubmit={handleEditSubmit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sinfni oʻchirish</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name}» sinfi
              {deleteTarget && deleteTarget.students > 0
                ? `, uning ${deleteTarget.students} ta oʻquvchisi va barcha baholari`
                : " va unga tegishli barcha maʼlumotlar"}{" "}
              butunlay oʻchiriladi. Bu amalni ortga qaytarib boʻlmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Oʻchirish
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
}: {
  icon: React.ReactNode;
  color: ClassColor;
  value: number;
  label: string;
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
        {value} <span className="text-xs font-medium text-muted-foreground">ta</span>
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
          aria-label="Sinfni ochish"
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
            <p className="font-semibold">Dars rejasi</p>
            <p className="text-background/70">
              {cls.lessons} mavzudan <b className="font-semibold text-background tabular-nums">{cls.coveredLessons}</b> tasi oʻtilgan
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Nom + jadval — oʻrtaga tekislangan */}
        <div className="flex flex-col items-center text-center min-w-0 w-full">
          <p className="font-bold text-base leading-tight truncate max-w-full text-foreground transition-colors duration-fast group-hover:text-[var(--card-hex)]">
            {cls.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cls.schedule ?? cls.subject ?? "Jadval belgilanmagan"}
          </p>
        </div>

        {/* Statistika — ikonali 3 ustun, vertikal ajratgichlar bilan */}
        <div className="flex w-full border-t border-border pt-3.5">
          <div className="flex flex-1 flex-col items-center text-center gap-1.5 pr-3 border-r border-border">
            <Users className="size-[18px] text-muted-foreground" />
            <span className="text-xs"><b className="font-semibold">{cls.students}</b> ta oʻquvchi</span>
          </div>
          <div className="flex flex-1 flex-col items-center text-center gap-1.5 px-3 border-r border-border">
            <BookOpen className="size-[18px] text-muted-foreground" />
            <span className="text-xs"><b className="font-semibold">{cls.lessons}</b> ta mavzu</span>
          </div>
          <div className="flex flex-1 flex-col items-center text-center gap-1.5 pl-3">
            <ClipboardList className="size-[18px] text-muted-foreground" />
            <span className="text-xs"><b className="font-semibold">{cls.assignments}</b> ta topshiriq</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ── Karta uchun 3-nuqta DropdownMenu ── */
function ClassCardMenu({ onEdit, onArchive, onDelete }: { onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
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
          Tahrirlash
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
        >
          <ArchiveIcon className="size-4 text-muted-foreground" />
          Arxivlash
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <TrashIcon className="size-4" />
          Oʻchirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─────────────────────────── Add Card ─────────────────────────── */

function AddClassCard({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-dashed border-border hover:border-foreground/30 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-3 min-h-[160px] cursor-pointer group"
    >
      <div className="size-11 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted-foreground/10 transition-colors">
        <PlusIcon className="size-5 text-muted-foreground" strokeWidth={2} />
      </div>
      <TypographySmall className="text-muted-foreground">Yangi sinf qoʻshish</TypographySmall>
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
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 border-t border-border pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArchiveIcon className="size-4" />
        Arxivlangan sinflar
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
                    {cls.students} ta oʻquvchi · arxivda
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => onRestore(cls.id)}>
                  <ArchiveRestore className="size-4" />
                  Tiklash
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
  const hex = CLASS_COLOR_HEX[cls.color];
  const initials = cls.initials;
  const overflow = Math.max(cls.students - initials.length, 0);

  return (
    <div
      className={cn("list-card animate-fade-slide-up group flex items-center gap-4 px-4 py-4", disabled ? "cursor-default" : "cursor-pointer")}
      style={{ animationDelay: `${index * 25}ms`, ["--card-accent" as string]: hex }}
      onClick={disabled ? undefined : () => router.push(`/dashboard/classes/${cls.id}`)}
    >
      {/* Rangli ikoncha */}
      <div
        className="list-card-icon size-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.12)` }}
      >
        <GraduationCap className="size-5" style={{ color: hex }} />
      </div>

      {/* Nom + jadval */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-none truncate transition-colors duration-fast group-hover:text-primary">
          {cls.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {cls.schedule ?? cls.subject ?? "Jadval belgilanmagan"}
        </p>
      </div>

      {/* Statistika */}
      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <span><b className="font-medium text-foreground">{cls.students}</b> ta oʻquvchi</span>
        <span className="text-border">·</span>
        <span><b className="font-medium text-foreground">{cls.lessons}</b> ta mavzu</span>
        <span className="text-border">·</span>
        <span><b className="font-medium text-foreground">{cls.assignments}</b> ta topshiriq</span>
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
