"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  XIcon, PlusIcon, ChevronDownIcon,
  LayoutGrid, List as ListIcon, PencilIcon, Trash2 as TrashIcon,
  GraduationCap, Search, ArrowUpDown, BarChart3, Users, BookOpen,
  ClipboardList, MoreHorizontal, ArrowRight,
} from "lucide-react";
import { CLASS_COLOR_HEX, classTints, classColorValue, type ClassColor } from "@/lib/class-colors";
import { classIcon, type ClassIconKey } from "@/lib/class-icons";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { lessonClassIds } from "@/lib/lessons-data";
import { classInfoFromForm, useCreateClass } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { useLessonStore } from "@/store/useLessonStore";
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
type LiveClass = {
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const hydrated = useGradesStore((s) => s._hasHydrated);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const allLessons = useLessonStore((s) => s.lessons);
  // Server hydration tugamaguncha skeleton
  const loading = !hydrated;

  const liveClasses = useMemo<LiveClass[]>(
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
    setClassDataMap((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
    setDeleteTarget(null);
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? liveClasses.filter((c) => c.name.toLowerCase().includes(q)) : liveClasses;
    return [...list].sort((a, b) => {
      if (sortKey === "students") return b.students - a.students;
      if (sortKey === "lessons") return b.lessons - a.lessons;
      return a.name.localeCompare(b.name);
    });
  }, [liveClasses, search, sortKey]);

  const totals = useMemo(() => ({
    classes: liveClasses.length,
    students: liveClasses.reduce((s, c) => s + c.students, 0),
    lessons: liveClasses.reduce((s, c) => s + c.lessons, 0),
    assignments: liveClasses.reduce((s, c) => s + c.assignments, 0),
  }), [liveClasses]);

  return (
    <DashboardPage>
      {/* ── Two-column layout: main card + overview sidebar ── */}
      <div className="flex flex-1 min-h-0 gap-6">

        {/* ── Main: classes panel ── */}
        <Card className={cn("flex-1 min-w-0", panelCardClass)}>
          <CardHeader className={cn(panelCardHeaderClass, "justify-between gap-3 min-h-[4.5rem] px-5 py-5!")}>
            <div className="flex items-center gap-2.5 shrink-0">
              <SectionIcon><GraduationCap /></SectionIcon>
              <CardTitle>Mening sinflarim</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className={cn("flex items-center transition-all duration-200", searchOpen ? "w-52" : "w-8")}>
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
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <DropdownMenuRadioItem value="name">Barcha sinflar</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="students">Koʻp oʻquvchi</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="lessons">Koʻp dars</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1.5 shadow-none">
                    <ArrowUpDown className="size-4" />
                    <span className="hidden sm:inline">
                      Sort: {sortKey === "name" ? "Nom" : sortKey === "students" ? "Oʻquvchi" : "Dars"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <DropdownMenuRadioItem value="name">Nom boʻyicha</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="students">Oʻquvchilar soni</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="lessons">Darslar soni</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New class */}
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                <PlusIcon className="size-4" />
                Yangi sinf
              </Button>

              {/* View toggle - ToggleGroup (outline/sm — Filter va Sort bilan bir xil) */}
              <ToggleGroup
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
              ) : liveClasses.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-2xl bg-muted">
                    <GraduationCap className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Hali sinf yoʻq</p>
                    <TypographyMuted className="text-xs mt-0.5">
                      Birinchi sinfingizni yarating — oʻquvchilar, baholar va davomat shu yerdan boshlanadi.
                    </TypographyMuted>
                  </div>
                  <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5">
                    <PlusIcon className="size-4" />
                    Yangi sinf yaratish
                  </Button>
                </div>
              ) : filteredAndSorted.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-muted">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Topilmadi</p>
                    <TypographyMuted className="text-xs mt-0.5">«{search}» boʻyicha hech narsa yoʻq</TypographyMuted>
                  </div>
                </div>
              ) : (
                <div key={view} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
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
                          onEdit={() => setEditTarget(cls)}
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
                          onEdit={() => setEditTarget(cls)}
                          onDelete={() => setDeleteTarget(cls)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Overview sidebar ── */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col">
          <Card className={cn(panelCardClass)}>
            <CardHeader className={cn(panelCardHeaderClass, "items-center gap-2 min-h-[4.5rem] px-5 py-5!")}>
              <SectionIcon><BarChart3 /></SectionIcon>
              <CardTitle>Statistika</CardTitle>
            </CardHeader>
            <CardContent className={panelCardContentClass}>
              <div className={cn(panelScrollInnerClass, "flex flex-col gap-2.5")}>
                <OverviewStat
                  icon={<GraduationCap className="size-4" />}
                  color="blue"
                  value={totals.classes}
                  label="Jami sinflar"
                />
                <OverviewStat
                  icon={<Users className="size-4" />}
                  color="teal"
                  value={totals.students}
                  label="Jami oʻquvchilar"
                />
                <OverviewStat
                  icon={<BookOpen className="size-4" />}
                  color="violet"
                  value={totals.lessons}
                  label="Jami mavzular"
                />
                <OverviewStat
                  icon={<ClipboardList className="size-4" />}
                  color="amber"
                  value={totals.assignments}
                  label="Jami topshiriqlar"
                />
              </div>
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
    <div className="flex items-center gap-4 rounded-xl bg-muted/30 px-4 py-3.5">
      <div style={iconBgLight} className="flex items-center justify-center size-10 rounded-lg shrink-0">
        <span style={tints.iconText} className="flex items-center justify-center">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground leading-none">{label}</p>
        <p className="text-xl font-bold tabular-nums leading-none mt-1.5">
          {value} <span className="text-sm font-medium text-muted-foreground">ta</span>
        </p>
      </div>
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
  onEdit,
  onDelete,
}: {
  cls: LiveClass;
  index: number;
  onEdit: () => void;
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
      className="class-card animate-fade-slide-up group rounded-2xl border overflow-hidden cursor-pointer flex flex-col relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--card-hex)]/30"
      style={{ animationDelay: `${index * 40}ms`, "--card-rgb": rgb, "--card-hex": hex } as React.CSSProperties}
      onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
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
      <div className="absolute top-3 right-3 z-20">
        <ClassCardMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="relative px-5 pb-5 flex flex-col items-center gap-4">
        {/* Avatar + progress halqasi — bandning chegarasida, oʻrtaga tekislangan */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={(e) => e.stopPropagation()}
              className="-mt-10 relative size-[84px] cursor-help transition-transform duration-300 group-hover:scale-105"
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
          <p className="font-bold text-base leading-tight truncate max-w-full text-foreground transition-colors duration-200 group-hover:text-[var(--card-hex)]">
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
function ClassCardMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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

/* ─────────────────────────── List Row ─────────────────────────── */

function ClassListRow({
  cls,
  index,
  onEdit,
  onDelete,
}: {
  cls: LiveClass;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const hex = CLASS_COLOR_HEX[cls.color];
  const initials = cls.initials;
  const overflow = Math.max(cls.students - initials.length, 0);

  return (
    <div
      className="list-card animate-fade-slide-up group flex items-center gap-4 px-4 py-4 cursor-pointer"
      style={{ animationDelay: `${index * 25}ms`, ["--card-accent" as string]: hex }}
      onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
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
        <p className="text-sm font-semibold leading-none truncate transition-colors duration-150 group-hover:text-primary">
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
      <ClassCardMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
