"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CLASS_COLOR_HEX, classTints } from "@/lib/class-colors";
import { gradeBadgeClass as gradeBadge } from "@/lib/score-colors";
import { classColor, type Student } from "@/lib/grades-data";
import { studentSummary } from "@/lib/grades-stats";
import { studentStats } from "@/lib/attendance-data";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeStudentsTourDemo, makeStudentsTourDemoClasses, STUDENTS_TOUR_DEMO_CLASS_ID,
} from "@/components/tour/students-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn, panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { ClassSwatch } from "@/components/ClassSwatch";
import { StripedPattern } from "@/components/ui/striped-pattern";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { studentBalance } from "@/lib/behavior-data";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
  ContextMenuRadioGroup, ContextMenuRadioItem,
} from "@/components/ui/context-menu";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import CreateStudentModal, { type NewStudentInput } from "./_components/CreateStudentModal";
import AddStudentModal from "./_components/AddStudentModal";
import StudentsDataTable from "./_components/StudentsDataTable";
import { BulkActionBar, BulkActionButton, BulkActionCount, BulkActionDivider } from "@/components/BulkActionBar";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import {
  Users, User, Plus, Search, ListFilter, ArrowUpDown, Trash2, X,
  TrendingUp, Phone, MessageCircle, Pen, Download, ChevronDown, MoreHorizontal,
  Eye, NotebookPen, Clock, Archive, GraduationCap, LayoutGrid, Table as TableIcon,
  CalendarCheck, Award,
} from "lucide-react";

// ─── Tiplar ────────────────────────────────────────────────────────────────
export type Status = "active" | "away" | "archived";
export type StudentRow = {
  id: string;
  name: string;
  initials: string;
  studentId: string;
  grade: number;
  attendance: number;
  status: Status;
  avatarColor?: string;
  avatarImage?: string;
  gender?: "male" | "female";
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  studentPhone?: string;
};

type SortKey = "name" | "grade" | "attendance";
type StatusFilter = "all" | "active" | "away" | "archived";
type ViewMode = "card" | "table";
const STUDENTS_VIEW_STORAGE_KEY = "students-view-mode";

// ─── Yordamchilar ────────────────────────────────────────────────────────────
/** Ism + familiyadan bosh harflar ("Abdulloh Xasanov" → "AX"). */
function makeInitials(firstName: string, lastName: string): string {
  return (
    ((firstName[0] ?? "") + (lastName[0] ?? firstName[1] ?? "")).toUpperCase() || "?"
  );
}

export const STATUS_META: Record<
  Status,
  { cls: string; dot: string; icon: React.ComponentType<{ className?: string }>; iconColor: string }
> = {
  active: {
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: GraduationCap,
    iconColor: "text-emerald-500",
  },
  away: {
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  archived: {
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
    icon: Archive,
    iconColor: "text-slate-400",
  },
};

export const badgeBase =
  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";

// ─── Sahifa ──────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const t = useTranslations("StudentsPage");
  // Sinf tanlash — lokal holat. null = hech narsa tanlanmagan (Sinflar ustuni keng).
  // Tanlangach store ham yangilanadi (boshqa sahifalar bilan sinxron).
  const router = useRouter();
  const openProfile = (id: string) => router.push(`/dashboard/students/${encodeURIComponent(id)}`);
  const [selectedClassId, handleSelectClass] = useClassIdParam();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("grade");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<StudentRow[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("card");
  useEffect(() => {
    const stored = localStorage.getItem(STUDENTS_VIEW_STORAGE_KEY);
    if (stored === "card" || stored === "table") setView(stored);
  }, []);
  const handleViewChange = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(STUDENTS_VIEW_STORAGE_KEY, v);
  };
  /* Koʻrinish almashtirgichi ikki joyda joylashadi (panel KENGLIGIGA qarab,
     ekran kengligiga emas — panel yon menyu/profil paneliga qarab mustaqil
     torayadi): keng panelda markazda, tor panelda amallar guruhida. Bitta
     manba — ikki oʻramda CSS orqali almashtiriladi. */
  const viewToggle = (
    <SegmentedToggle
      value={view}
      onValueChange={handleViewChange}
      variant="pill"
      iconOnly
      options={[
        { value: "card", label: t("viewCardAria"), icon: <LayoutGrid className="size-4" /> },
        { value: "table", label: t("viewTableAria"), icon: <TableIcon className="size-4" /> },
      ]}
    />
  );
  // Jadval koʻrinishidagi qator belgilash; toʻliq tahrirlash alohida oynada (editTarget).
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [editTarget, setEditTarget] = useState<StudentRow | null>(null);

  // Jonli manba: roster/baholar — useGradesStore, davomat — useAttendanceStore.
  // Yozishlar updateClass orqali → GradesServerSync serverga sinxronlaydi.
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const attendanceRecords = useAttendanceStore((s) =>
    selectedClassId ? s.recordsByClass[selectedClassId] : undefined
  );

  // Tur (product tour) — hech qanday sinf/oʻquvchi qoʻshilmagan boʻlsa,
  // "Oʻquvchilar" turʼi boʻsh panellarni namunaviy maʼlumot bilan toʻldiradi
  // (faqat vizual, store'ga yozilmaydi — [[classes-tour-demo]] bilan bir xil naqsh).
  const tourActive = useTourRequest((s) => s.activeTourId === "students");
  const isDemoMode = tourActive && Object.keys(classDataMap).length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeStudentsTourDemoClasses() : null), [isDemoMode]);
  const demoClass = demoClasses?.[0] ?? null;
  const demoStudents = useMemo(() => (isDemoMode ? makeStudentsTourDemo() : null), [isDemoMode]);

  // Sinf almashganda preview yopiladi
  useEffect(() => {
    setSelectedStudentId(null);
    setSearch("");
    setSelectedRowIds(new Set());
  }, [selectedClassId]);

  const selectedInfo = isDemoMode
    ? demoClass!
    : selectedClassId
      ? classDataMap[selectedClassId]?.info
      : undefined;
  const selColor = selectedInfo ? classColor(selectedInfo) : "blue";
  const selHex = CLASS_COLOR_HEX[selColor];
  const selTints = classTints(selColor);
  const tint = (pct: number) => `color-mix(in srgb, ${selHex} ${pct}%, transparent)`;
  const firstLiveClassId = Object.keys(classDataMap)[0];

  // Sinf oʻquvchilarini jonli maʼlumotdan quramiz
  const allStudents = useMemo<StudentRow[]>(() => {
    if (!selectedClassId) return [];
    const data = classDataMap[selectedClassId];
    if (!data) return [];
    const records = attendanceRecords ?? [];
    return data.students.map((s) => {
      const att = studentStats(records, s.id);
      const attTotal = att.present + att.absent + att.late + att.excused;
      return {
        id: s.id,
        name: s.name,
        initials: s.initials,
        studentId: s.studentNumber != null ? `ID-${1000 + s.studentNumber}` : "—",
        // Jurnal bilan bir xil kanonik hisob (summativ, vaznli, Q/T chiqarilgan)
        grade: Math.round(
          studentSummary(s.id, data.assignments, data.grades, data.topics).summative
        ),
        attendance: attTotal ? Math.round((att.present / attTotal) * 100) : 100,
        status: (s.status ?? "active") as Status,
        gender: s.gender,
        birthDate: s.birthDate,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        studentPhone: s.studentPhone,
      };
    });
  }, [selectedClassId, classDataMap, attendanceRecords]);

  // Filtr + qidiruv + saralash
  const students = useMemo(() => {
    let list = isDemoMode ? ((demoStudents ?? []) as StudentRow[]) : allStudents;
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
    const sorted = [...list];
    if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "grade") sorted.sort((a, b) => a.grade - b.grade);
    else sorted.sort((a, b) => a.attendance - b.attendance);
    return sorted;
  }, [allStudents, isDemoMode, demoStudents, statusFilter, search, sortKey]);

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) ?? (isDemoMode ? students[0] ?? null : null);
  const filterActive = statusFilter !== "all" || search.trim().length > 0;
  const noClass = !selectedClassId && !isDemoMode;

  /* Ustun nisbatlari — sinf tanlanmagan → 50/50 (grades/standards bilan bir xil boʻsh holat);
     sinf tanlangan, preview yopiq → 25/75; oʻquvchi tanlangan → 25/50/25. */
  const columnsTemplate = selectedStudent
    ? "minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)"
    : noClass
      ? "minmax(0,1fr) minmax(0,1fr)"
      : "minmax(0,1fr) minmax(0,3fr)";

  // ── Amallar — hammasi useGradesStore'ga yoziladi (server sync avtomatik) ──
  const setStatus = (id: string, status: Status) => {
    if (!selectedClassId) return;
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      students: cd.students.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  };

  const toggleStatus = (id: string, current: Status) =>
    setStatus(id, current === "active" ? "away" : "active");

  // Guruhaviy holat oʻzgartirish — jadvalda bir nechta qator belgilanganda
  const handleBulkStatus = (status: Status) => {
    if (!selectedClassId || selectedRowIds.size === 0) return;
    const ids = selectedRowIds;
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      students: cd.students.map((s) => (ids.has(s.id) ? { ...s, status } : s)),
    }));
    setSelectedRowIds(new Set());
  };

  // Jadval "edit" rejimidagi qator belgilash (checkbox)
  const toggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAllRows = () => {
    setSelectedRowIds((prev) => (prev.size === students.length ? new Set() : new Set(students.map((s) => s.id))));
  };

  // Toʻliq tahrirlash — alohida oynada (CreateStudentModal, mode="edit")
  const handleEditSave = (data: NewStudentInput) => {
    if (!editTarget || !selectedClassId) return;
    const name = `${data.firstName} ${data.lastName}`.trim();
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      students: cd.students.map((s) =>
        s.id === editTarget.id
          ? {
              ...s,
              name,
              initials: makeInitials(data.firstName, data.lastName),
              gender: data.gender,
              birthDate: data.birthDate,
              parentName: data.parentName,
              parentPhone: data.parentPhone,
              studentPhone: data.studentPhone,
              avatarImage: data.avatarImage,
            }
          : s
      ),
    }));
    setEditTarget(null);
    toast.success(t("toastUpdated"));
  };

  const deleteStudents = (ids: string[]) => {
    if (!selectedClassId || ids.length === 0) return;
    const idSet = new Set(ids);
    // Baholari ham birga tozalanadi (serverda FK cascade, klientda qoʻlda)
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      students: cd.students.filter((s) => !idSet.has(s.id)),
      grades: cd.grades.filter((g) => !idSet.has(g.studentId)),
    }));
    if (selectedStudentId && idSet.has(selectedStudentId)) setSelectedStudentId(null);
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  const handleCreate = (data: NewStudentInput) => {
    const name = `${data.firstName} ${data.lastName}`.trim();
    const student: Student = {
      id: crypto.randomUUID(),
      name,
      initials: makeInitials(data.firstName, data.lastName),
      status: "active",
      ...(data.gender ? { gender: data.gender } : {}),
      ...(data.birthDate ? { birthDate: data.birthDate } : {}),
      ...(data.parentName ? { parentName: data.parentName } : {}),
      ...(data.parentPhone ? { parentPhone: data.parentPhone } : {}),
      ...(data.studentPhone ? { studentPhone: data.studentPhone } : {}),
    };
    updateClass(data.classId, (cd) => ({ ...cd, students: [student, ...cd.students] }));
    if (data.classId === selectedClassId) setSelectedStudentId(student.id);
    toast.success(t("toastCreated"));
  };

  // Roʻyxatdan bir nechta oʻquvchini joriy sinfga qoʻshish (faqat ism/familiya)
  const handleImport = (incoming: { firstName: string; lastName: string }[]) => {
    if (!selectedClassId || incoming.length === 0) return;
    const rows: Student[] = incoming.map((s) => ({
      id: crypto.randomUUID(),
      name: `${s.firstName} ${s.lastName}`.trim(),
      initials: makeInitials(s.firstName, s.lastName),
      status: "active",
    }));
    updateClass(selectedClassId, (cd) => ({ ...cd, students: [...rows, ...cd.students] }));
    toast.success(t("toastImported", { count: rows.length }));
  };

  // Joriy sinf oʻquvchilarini CSV faylga eksport qilish (Excelʼda UTF-8 uchun BOM bilan)
  const handleExport = () => {
    if (allStudents.length === 0) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = [
      t("csvHeaderName"), t("csvHeaderId"), t("csvHeaderGrade"), t("csvHeaderAttendance"), t("csvHeaderStatus"),
    ];
    const lines = allStudents.map((s) =>
      [s.name, s.studentId, s.grade, s.attendance, t(`status.${s.status}`)].map(esc).join(",")
    );
    const csv = "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedInfo?.name ?? "sinf"}-oquvchilar.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportToast"));
  };

  // Header toolbar tugmasi — outline, tekis (soyasiz), 36px. CTA (Yangi oʻquvchi) primary.
  const toolbarBtn = "size-9 shadow-none";

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0 gap-6 p-4 md:p-6">
      <TourDemoBanner tourId="students" active={isDemoMode} />
      <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden">
        {/* ── Ustun 1: Sinflar ── */}
        <DashboardColumn hideBelow="lg" data-tour="students-classes">
          <ClassListPanel
            page="students"
            selectedClassId={selectedClassId ?? (isDemoMode ? STUDENTS_TOUR_DEMO_CLASS_ID : "")}
            onSelect={handleSelectClass}
            demoClasses={demoClasses ?? undefined}
          />
        </DashboardColumn>

        {/* ── Ustun 2: Oʻquvchilar roʻyxati ── */}
        <div data-tour="students-list" className="@container flex min-w-0 min-h-0 h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
          {noClass ? (
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>{t("noClassTitle")}</EmptyTitle>
                <EmptyDescription>{t("noClassDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
          {/* Header / toolbar */}
          {/* Tor panelda — oddiy flex (sarlavha qisqaradi, toggle amallar
              guruhida). Panel yetarlicha kengaygandagina simmetrik 3-ustunli
              gridga oʻtadi va toggle haqiqiy markazda turadi: simmetrik
              ustunlar bir-biriga joy bera olmagani uchun, joy tor boʻlsa
              oʻng guruh sarlavha ustiga toshib ketardi. */}
          <div className={cn(
            panelHeaderClass,
            "flex items-center justify-between gap-3",
            "@[54rem]:grid @[54rem]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
          )}>
            <div className="flex min-w-0 items-center gap-2.5">
              <SectionIcon><Users /></SectionIcon>
              <CardTitle className="min-w-0 shrink truncate">{t("title")}</CardTitle>
              <TypographyMuted className="hidden shrink-0 text-sm md:inline">({students.length})</TypographyMuted>
              {statusFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="hidden shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15 lg:inline-flex"
                >
                  {t("filterChip", { label: t(`status.${statusFilter}`) })}
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Markaziy slot — grid ustuni sifatida JOY BAND QILADI, shuning
                uchun yon guruhlar uning ustiga chiqa olmaydi. */}
            <div className="hidden justify-self-center @[54rem]:flex">{viewToggle}</div>

            <div className="flex shrink-0 items-center gap-1.5 justify-self-end md:gap-2.5">
              {/* Panel markazga sigʻmaydigan darajada tor boʻlsa — shu yerda.
                  Ajratgich shart emas: pill oʻz border'iga ega. */}
              <div className="hidden sm:flex @[54rem]:hidden">{viewToggle}</div>

              {/* Qidiruv — popover emas, joyida kengayadigan input (Sinflar bilan bir xil naqsh) */}
              <div className={cn("flex items-center transition-all duration-fast", searchOpen ? "w-44 sm:w-56" : "w-9")}>
                {searchOpen ? (
                  <div className="flex h-9 w-full items-center gap-1.5 rounded-md border border-border bg-background px-3 animate-in slide-in-from-right-2">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onBlur={() => !search && setSearchOpen(false)}
                      placeholder={t("searchPlaceholder")}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {search && (
                      <button onClick={() => { setSearch(""); setSearchOpen(false); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" aria-label={t("searchAria")} className={toolbarBtn} onClick={() => setSearchOpen(true)}>
                    <Search className="size-4" />
                  </Button>
                )}
              </div>

              {/* Filtr — tor ekranda "···" ga yigʻiladi */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button data-tour="students-filter" variant="ghost" size="icon" aria-label={t("filterAria")} className={cn(toolbarBtn, "hidden sm:inline-flex", statusFilter !== "all" && "ring-2 ring-primary ring-offset-2")}>
                    <ListFilter className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56">
                  <p className="mb-2 text-sm font-medium">{t("filterByStatus")}</p>
                  <div className="flex flex-col gap-1">
                    {(["all", "active", "away", "archived"] as StatusFilter[]).map((val) => (
                      <button
                        key={val}
                        onClick={() => setStatusFilter(val)}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                          statusFilter === val ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                        )}
                      >
                        {val === "all" ? t("statusFilterAll") : t(`status.${val}`)}
                        {statusFilter === val && <span className="size-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Saralash — faqat karta koʻrinishida (jadvalda ustun sarlavhalari bosiladi) */}
              {view === "card" && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t("sortButton", { label: t(`sortLabels.${sortKey}`) })} className={cn(toolbarBtn, "hidden sm:inline-flex")}>
                          <ArrowUpDown className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{t("sortButton", { label: t(`sortLabels.${sortKey}`) })}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("sortMenuLabel")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                      <DropdownMenuRadioItem value="grade">{t("sortGrade")}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="attendance">{t("sortAttendance")}</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">{t("sortName")}</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Tor ekran: Filtr (+ karta koʻrinishida Saralash) shu yerga yigʻiladi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t("moreActionsAria")} className={cn(toolbarBtn, "sm:hidden", statusFilter !== "all" && "ring-2 ring-primary ring-offset-2")}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("filterByStatus")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <DropdownMenuRadioItem value="all">{t("statusFilterAll")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">{t("status.active")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="away">{t("status.away")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="archived">{t("status.archived")}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  {view === "card" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{t("sortMenuLabel")}</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                        <DropdownMenuRadioItem value="grade">{t("sortGrade")}</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="attendance">{t("sortAttendance")}</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="name">{t("sortName")}</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Yangi oʻquvchi — tanlov modalini ochadi (bitta / import); chevron = Eksport */}
              <div className="flex">
                <Button
                  onClick={() => setAddOpen(true)}
                  className={cn(
                    "rounded-r-none px-2.5 font-semibold",
                    !selectedStudent && "@[420px]:px-3 @[560px]:px-4"
                  )}
                >
                  <Plus className={cn("size-4 shrink-0", !selectedStudent && "@[420px]:mr-1")} />
                  {selectedStudent ? (
                    <span className="inline">{t("addShort")}</span>
                  ) : (
                    <>
                      <span className="hidden @[420px]:inline @[560px]:hidden">{t("addShort")}</span>
                      <span className="hidden @[560px]:inline">{t("newStudent")}</span>
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label={t("moreActionsAria")} className="rounded-l-none border-l border-primary-foreground/15 px-2">
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport} disabled={allStudents.length === 0} className="gap-2">
                      <Download className="size-4 text-muted-foreground" />
                      {t("exportCsv")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Roʻyxat */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-card to-transparent" />

            {view === "table" && selectedRowIds.size > 0 && (
              /* Guruhaviy amallar — header bilan joy talashmasin deb roʻyxat
                 ustiga suzuvchi panel sifatida chiqadi (Gmail/Linear naqshi). */
              <BulkActionBar>
                <BulkActionCount>{t("selectedCount", { count: selectedRowIds.size })}</BulkActionCount>
                <BulkActionDivider />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <BulkActionButton icon={<GraduationCap className="size-4" />} hasChevron>
                      {t("statusLabel")}
                    </BulkActionButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleBulkStatus("active")}>
                      <GraduationCap className={cn("size-4", STATUS_META.active.iconColor)} /> {t("status.active")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatus("away")}>
                      <Clock className={cn("size-4", STATUS_META.away.iconColor)} /> {t("status.away")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatus("archived")}>
                      <Archive className={cn("size-4", STATUS_META.archived.iconColor)} /> {t("status.archived")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <BulkActionButton
                  icon={<Trash2 className="size-4" />}
                  variant="destructive"
                  onClick={() => setDeleteTargets(students.filter((s) => selectedRowIds.has(s.id)))}
                >
                  {t("delete")}
                </BulkActionButton>
                <BulkActionDivider />
                <BulkActionButton onClick={() => setSelectedRowIds(new Set())}>
                  {t("cancel")}
                </BulkActionButton>
              </BulkActionBar>
            )}
            {students.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia><Illustration name="15" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>
                    {filterActive ? t("emptyFilteredTitle") : t("emptyTitle")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {filterActive
                      ? t("emptyFilteredDescription")
                      : t("emptyDescription")}
                  </EmptyDescription>
                </EmptyHeader>
                {!filterActive && (
                  <EmptyContent>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button onClick={() => setAddOpen(true)} className="gap-2">
                        <Plus className="size-4" /> {t("newStudent")}
                      </Button>
                    </div>
                  </EmptyContent>
                )}
              </Empty>
            ) : view === "table" ? (
              <StudentsDataTable
                students={students}
                selectedStudentId={selectedStudentId}
                onSelect={(id) => setSelectedStudentId((prev) => (prev === id ? null : id))}
                selectedIds={selectedRowIds}
                onToggleSelect={toggleRowSelect}
                onToggleSelectAll={toggleSelectAllRows}
                sortKey={sortKey}
                onSortChange={setSortKey}
                onToggleStatus={toggleStatus}
                onEdit={(row) => setEditTarget(row)}
                onDelete={(row) => setDeleteTargets([row])}
                hex={selHex}
              />
            ) : (
              <ScrollArea className="h-full w-full">
                <div className="space-y-3 px-5 pt-5 pb-5">
                  {students.map((s) => {
                    const isSelected = s.id === selectedStudentId;
                    const pill = STATUS_META[s.status];
                    return (
                      <ContextMenu key={s.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            onClick={() => setSelectedStudentId(isSelected ? null : s.id)}
                            className="list-card group block w-full cursor-pointer p-4 text-left"
                            data-active={isSelected || undefined}
                            style={{
                              ["--card-accent" as string]: selHex,
                              ...(isSelected
                                ? { backgroundColor: `color-mix(in oklch, ${selHex} 7%, var(--card))` }
                                : {}),
                            }}
                          >
                          <div className="flex items-center gap-3">
                            <div
                              className="list-card-icon flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white"
                              style={
                                s.avatarImage || s.avatarColor
                                  ? { backgroundColor: s.avatarColor ?? selHex }
                                  : selTints.gradientTile
                              }
                            >
                              {s.avatarImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.avatarImage} alt="" className="size-full object-cover" />
                              ) : (
                                s.initials
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="heading-small truncate transition-colors group-hover:text-primary">
                                {s.name}
                              </h4>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={cn(badgeBase, s.grade === 0 ? "bg-muted text-muted-foreground border-border" : gradeBadge(s.grade))}>
                                <TrendingUp className="size-3 shrink-0" />
                                {s.grade}%
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleStatus(s.id, s.status); }}
                                title={s.status === "active" ? t("markAway") : t("markActive")}
                                className={cn(badgeBase, "shrink-0 cursor-pointer transition-all hover:opacity-80 active:scale-95", pill.cls)}
                              >
                                <span className={cn("size-1.5 shrink-0 rounded-full", pill.dot)} />
                                {t(`status.${s.status}`)}
                              </button>
                            </div>
                          </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <ContextMenuItem onSelect={() => openProfile(s.id)}>
                            <Eye className="size-4" /> {t("viewProfile")}
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => setEditTarget(s)}>
                            <Pen className="size-4" /> {t("edit")}
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => setSelectedStudentId(s.id)}>
                            <NotebookPen className="size-4 shrink-0" /> {t("addNote")}
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="gap-2">
                              {(() => {
                                const StatusIcon = STATUS_META[s.status].icon;
                                return <StatusIcon className={cn("size-4 shrink-0", STATUS_META[s.status].iconColor)} />;
                              })()}
                              {t("statusLabel")}
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                              <ContextMenuRadioGroup
                                value={s.status}
                                onValueChange={(v) => setStatus(s.id, v as Status)}
                              >
                                <ContextMenuRadioItem value="active">
                                  <GraduationCap className={cn("size-4 shrink-0", STATUS_META.active.iconColor)} /> {t("status.active")}
                                </ContextMenuRadioItem>
                                <ContextMenuRadioItem value="away">
                                  <Clock className={cn("size-4 shrink-0", STATUS_META.away.iconColor)} /> {t("status.away")}
                                </ContextMenuRadioItem>
                                <ContextMenuRadioItem value="archived">
                                  <Archive className={cn("size-4 shrink-0", STATUS_META.archived.iconColor)} /> {t("status.archived")}
                                </ContextMenuRadioItem>
                              </ContextMenuRadioGroup>
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                          <ContextMenuSeparator />
                          <ContextMenuItem variant="destructive" onSelect={() => setDeleteTargets([s])}>
                            <Trash2 className="size-4" /> {t("delete")}
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
            </>
          )}
        </div>

        {/* ── Ustun 3: Preview (oʻquvchi tanlanganda) ── */}
        {selectedStudent && (
          <DashboardColumn hideBelow="lg" data-tour="students-preview">
            <div className="h-full overflow-hidden rounded-xl border border-border bg-card">
              <PreviewCard
                key={selectedStudent.id}
                student={selectedStudent}
                className={selectedInfo?.name ?? ""}
                classId={selectedClassId ?? ""}
                hex={selHex}
                tint={tint}
                onToggleStatus={() => toggleStatus(selectedStudent.id, selectedStudent.status)}
                onViewProfile={() => openProfile(selectedStudent.id)}
              />
            </div>
          </DashboardColumn>
        )}
      </DashboardColumns>

      <AddStudentModal
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultClassId={selectedClassId ?? firstLiveClassId ?? ""}
        onCreate={handleCreate}
        onImport={handleImport}
      />

      {/* Toʻliq tahrirlash — jadval "edit" rejimidagi qalam tugmasi va kontekst menyu shu oynani ochadi */}
      {editTarget && (() => {
        const [firstName, ...rest] = editTarget.name.trim().split(/\s+/);
        return (
          <CreateStudentModal
            open={!!editTarget}
            onOpenChange={(open) => { if (!open) setEditTarget(null); }}
            mode="edit"
            defaultClassId={selectedClassId ?? ""}
            initial={{
              firstName,
              lastName: rest.join(" "),
              classId: selectedClassId ?? "",
              gender: editTarget.gender,
              birthDate: editTarget.birthDate,
              parentName: editTarget.parentName,
              parentPhone: editTarget.parentPhone,
              studentPhone: editTarget.studentPhone,
              avatarColor: editTarget.avatarColor ?? selHex,
              avatarImage: editTarget.avatarImage,
            }}
            onCreate={handleEditSave}
          />
        );
      })()}

      <AlertDialog open={!!deleteTargets} onOpenChange={(open) => { if (!open) setDeleteTargets(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets && deleteTargets.length > 1
                ? t("deleteBulkDialogDescription", { count: deleteTargets.length })
                : t("deleteDialogDescription", { name: deleteTargets?.[0]?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTargets && deleteTargets.length > 0) {
                  deleteStudents(deleteTargets.map((s) => s.id));
                  toast.success(
                    deleteTargets.length > 1
                      ? t("toastDeletedBulk", { count: deleteTargets.length })
                      : t("toastDeleted")
                  );
                }
                setDeleteTargets(null);
              }}
            >
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

const EMPTY_BEHAVIOR_EVENTS: never[] = [];

// ─── Preview kartasi ──────────────────────────────────────────────────────────
function PreviewCard({
  student, className, classId, hex, tint, onToggleStatus, onViewProfile,
}: {
  student: StudentRow;
  className: string;
  classId: string;
  hex: string;
  tint: (pct: number) => string;
  onToggleStatus: () => void;
  onViewProfile: () => void;
}) {
  const t = useTranslations("StudentsPage");
  const attendancePct = Math.max(0, Math.min(100, student.attendance));
  const hasParent = !!(student.parentName || student.parentPhone);
  const rgb = hexToRgb(hex);

  const behaviorEvents = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_BEHAVIOR_EVENTS;
  const behaviorRedemptions = useBehaviorStore((s) => s.redemptions);
  const behaviorBalance = useMemo(
    () => studentBalance(behaviorEvents, behaviorRedemptions.filter((r) => r.classId === classId), student.id),
    [behaviorEvents, behaviorRedemptions, classId, student.id]
  );

  return (
    <div className="group/card flex h-full w-full flex-col">
      {/* Rangli cover band — Sinflar kartasidagi bilan bir xil naqsh; avatar teng yarmidan boʻladi */}
      <div
        className="relative h-24 shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, rgba(${rgb}, 0.20), rgba(${rgb}, 0.06))` }}
      >
        <StripedPattern className="opacity-50" style={{ color: `rgba(${rgb}, 0.5)` }} />
      </div>
      {/* Avatar (davomat foizini halqa sifatida koʻrsatadi) — ScrollArea'dan TASHQARIDA,
          aks holda uning overflow-hidden viewport'i negative-margin bilan chiqib turgan
          qismini kesib tashlaydi (Sinflar kartasida bu muammo yoʻq, chunki u ScrollArea ichida emas). */}
      <div className="flex shrink-0 justify-center px-5">
        <div
          className="relative -mt-12 size-24 shrink-0 rounded-full p-[3px]"
          style={{ background: `conic-gradient(${hex} ${attendancePct * 3.6}deg, ${tint(10)} 0deg)` }}
          title={t("attendanceRingTitle", { pct: attendancePct })}
        >
          <div className="flex size-full items-center justify-center overflow-hidden rounded-full border-[3px] border-card bg-card">
            <div
              className="flex size-full items-center justify-center overflow-hidden text-xl font-semibold text-white"
              style={{ backgroundImage: `linear-gradient(135deg, color-mix(in oklch, white 30%, ${student.avatarColor ?? hex}), ${student.avatarColor ?? hex})` }}
            >
              {student.avatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.avatarImage} alt="" className="size-full object-cover" />
              ) : (
                student.initials
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col items-center px-5 pb-6 pt-0 text-center">
          {/* 2. Ism va familiyasi — karta ichidagi ism = heading-small (dizayn tizimi) */}
          <p className="heading-small mt-4 text-foreground">{student.name}</p>

          {/* 4. Sinf — kvadrat-radiusli rangli belgi + nom */}
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium"
            style={{ backgroundColor: tint(13), color: hex }}
          >
            <ClassSwatch hex={hex} className="size-2" />
            {className}
          </div>

          {/* Oʻrtada: davomat / baholar / xulq — icon-box + raqam, izoh tooltip orqali */}
          <p className="text-label mt-9 w-full text-left text-muted-foreground">{t("statsLabel")}</p>
          <div className="mt-2 flex w-full items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-1 cursor-default flex-col items-center gap-1.5">
                  <div className="flex size-9 items-center justify-center rounded-full" style={{ backgroundColor: tint(13), color: hex }}>
                    <CalendarCheck className="size-4" />
                  </div>
                  <span className="text-sm font-semibold">{attendancePct}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("sortLabels.attendance")}</TooltipContent>
            </Tooltip>
            <div className="h-9 w-px shrink-0 bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-1 cursor-default flex-col items-center gap-1.5">
                  <div className="flex size-9 items-center justify-center rounded-full" style={{ backgroundColor: tint(13), color: hex }}>
                    <TrendingUp className="size-4" />
                  </div>
                  <span className="text-sm font-semibold">{student.grade}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("sortLabels.grade")}</TooltipContent>
            </Tooltip>
            <div className="h-9 w-px shrink-0 bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-1 cursor-default flex-col items-center gap-1.5">
                  <div className="flex size-9 items-center justify-center rounded-full" style={{ backgroundColor: tint(13), color: hex }}>
                    <Award className="size-4" />
                  </div>
                  <span className="text-sm font-semibold">{behaviorBalance}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("behaviorLabel")}</TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-7 flex w-full flex-col">
            <p className="text-label w-full text-left text-muted-foreground">{t("contactLabel")}</p>
            {/* 5. Ota-onasining ismi va telefon raqami */}
            {hasParent && (
              <div className="mt-2 flex w-full items-center gap-3 text-left">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tint(13), color: hex }}>
                  <User className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.parentName || t("noContact")}</p>
                  {student.parentPhone && <TypographyMuted className="text-xs">{student.parentPhone}</TypographyMuted>}
                </div>
              </div>
            )}

            {/* 6. Qoʻngʻiroq va chat */}
            <div className="mt-3 flex w-full items-center gap-3">
              <Button
                variant="outline"
                disabled={!student.parentPhone}
                asChild={!!student.parentPhone}
                className="h-9 min-w-0 flex-1 gap-1.5 rounded-lg px-2 shadow-none"
              >
                {student.parentPhone ? (
                  <a href={`tel:${student.parentPhone}`} className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap">
                    <Phone className="size-4 shrink-0" /> <span className="truncate">{t("call")}</span>
                  </a>
                ) : (
                  <span className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap">
                    <Phone className="size-4 shrink-0" /> <span className="truncate">{t("call")}</span>
                  </span>
                )}
              </Button>
              <Button variant="outline" disabled title={t("telegramSoon")} className="h-9 min-w-0 flex-1 gap-1.5 rounded-lg px-2 shadow-none">
                <MessageCircle className="size-4 shrink-0" /> <span className="truncate">{t("chat")}</span>
              </Button>
            </div>

          </div>
        </div>
      </ScrollArea>

      {/* 7. Profilga oʻtish — ScrollArea'dan TASHQARIDA, shrink-0 pastki panel: shu sabab
          balandlikdan qatʼi nazar doim kartaning tagida turadi (Radix ScrollArea Viewport
          balandligi notoʻgʻri hisoblanganda mt-auto ishonchsiz boʻladi). */}
      <div className="shrink-0 border-t border-border/60 px-5 py-4">
        <Button
          onClick={onViewProfile}
          className="h-9 w-full rounded-lg font-semibold text-white transition-all hover:brightness-110"
          style={{ backgroundColor: hex }}
        >
          {t("viewProfile")}
        </Button>
      </div>
    </div>
  );
}
