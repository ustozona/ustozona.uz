"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { gradeBadgeClass as gradeBadge, attendanceBadgeClass as attendanceBadge } from "@/lib/score-colors";
import { classColor, type Student } from "@/lib/grades-data";
import { studentSummary } from "@/lib/grades-stats";
import { studentStats } from "@/lib/attendance-data";
import { useClassStore } from "@/store/useClassStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import ClassListPanel from "@/components/ClassListPanel";
import { cn } from "@/lib/utils";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
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
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import CreateStudentModal, { type NewStudentInput } from "./_components/CreateStudentModal";
import ImportStudentsModal from "./_components/ImportStudentsModal";
import {
  Users, User, Plus, Search, Filter, ArrowUp, Trash2, ChevronDown,
  TrendingUp, CalendarCheck, Phone, MessageCircle, ExternalLink, Pen, Upload, Download,
  Eye, NotebookPen, Clock, Archive, GraduationCap,
} from "lucide-react";

// ─── Tiplar ────────────────────────────────────────────────────────────────
type Status = "active" | "away" | "archived";
type StudentRow = {
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

const SORT_LABELS: Record<SortKey, string> = {
  name: "Ism",
  grade: "Oʻrtacha baho",
  attendance: "Davomat",
};

// ─── Yordamchilar ────────────────────────────────────────────────────────────
/** Ism + familiyadan bosh harflar ("Abdulloh Xasanov" → "AX"). */
function makeInitials(firstName: string, lastName: string): string {
  return (
    ((firstName[0] ?? "") + (lastName[0] ?? firstName[1] ?? "")).toUpperCase() || "?"
  );
}

const STATUS_PILL: Record<
  Status,
  { cls: string; dot: string; label: string; icon: React.ComponentType<{ className?: string }>; iconColor: string }
> = {
  active: {
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    label: "Oʻqimoqda",
    icon: GraduationCap,
    iconColor: "text-emerald-500",
  },
  away: {
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
    label: "Taʼtilda",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  archived: {
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
    label: "Chiqib ketgan",
    icon: Archive,
    iconColor: "text-slate-400",
  },
};

const badgeBase =
  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";

// ─── Sahifa ──────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  // Sinf tanlash — lokal holat. null = hech narsa tanlanmagan (Sinflar ustuni keng).
  // Tanlangach store ham yangilanadi (boshqa sahifalar bilan sinxron).
  const router = useRouter();
  const openProfile = (id: string) => router.push(`/dashboard/students/${encodeURIComponent(id)}`);
  const setStoreClassId = useClassStore((s) => s.setSelectedClassId);
  const [selectedClassId, setSelectedClassIdState] = useState<string | null>(null);
  const handleSelectClass = (id: string) => { setSelectedClassIdState(id); setStoreClassId(id); };

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("grade");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);

  // Jonli manba: roster/baholar — useGradesStore, davomat — useAttendanceStore.
  // Yozishlar updateClass orqali → GradesServerSync serverga sinxronlaydi.
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const attendanceRecords = useAttendanceStore((s) =>
    selectedClassId ? s.recordsByClass[selectedClassId] : undefined
  );

  // Sinf almashganda preview yopiladi
  useEffect(() => {
    setSelectedStudentId(null);
    setSearch("");
  }, [selectedClassId]);

  const selectedInfo = selectedClassId ? classDataMap[selectedClassId]?.info : undefined;
  const selColor = selectedInfo ? classColor(selectedInfo) : "blue";
  const selHex = CLASS_COLOR_HEX[selColor];
  const tint = (pct: number) => `color-mix(in srgb, ${selHex} ${pct}%, transparent)`;
  const firstLiveClassId = Object.keys(classDataMap)[0];

  // Sinf oʻquvchilarini jonli maʼlumotdan quramiz
  const allStudents = useMemo<StudentRow[]>(() => {
    if (!selectedClassId) return [];
    const data = classDataMap[selectedClassId];
    if (!data) return [];
    const records = attendanceRecords ?? [];
    return data.students.map((s, i) => {
      const att = studentStats(records, s.id);
      const attTotal = att.present + att.absent + att.late + att.excused;
      return {
        id: s.id,
        name: s.name,
        initials: s.initials,
        studentId: `ID-${1001 + i}`,
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
    let list = allStudents;
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
    const sorted = [...list];
    if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "grade") sorted.sort((a, b) => a.grade - b.grade);
    else sorted.sort((a, b) => a.attendance - b.attendance);
    return sorted;
  }, [allStudents, statusFilter, search, sortKey]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;
  const filterActive = statusFilter !== "all" || search.trim().length > 0;
  const noClass = !selectedClassId;

  /* Ustun nisbatlari (lessons usuli) — sidebardan tashqari maydon flex-grow bilan boʻlinadi:
       sinf tanlanmagan → sinflar keng; oʻquvchi tanlangan → 25/50/25; aks holda preview yopiq. */
  const grow = noClass
    ? { classes: 2, list: 3 }
    : { classes: 1, list: 2 };

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

  const deleteStudent = (id: string) => {
    if (!selectedClassId) return;
    // Baholari ham birga tozalanadi (serverda FK cascade, klientda qoʻlda)
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      students: cd.students.filter((s) => s.id !== id),
      grades: cd.grades.filter((g) => g.studentId !== id),
    }));
    if (selectedStudentId === id) setSelectedStudentId(null);
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
    toast.success("Oʻquvchi qoʻshildi");
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
    toast.success(`${rows.length} ta oʻquvchi qoʻshildi`);
  };

  // Joriy sinf oʻquvchilarini CSV faylga eksport qilish (Excelʼda UTF-8 uchun BOM bilan)
  const handleExport = () => {
    if (allStudents.length === 0) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ["Toʻliq ism", "Oʻquvchi ID", "Oʻrtacha baho (%)", "Davomat (%)", "Holat"];
    const lines = allStudents.map((s) =>
      [s.name, s.studentId, s.grade, s.attendance, STATUS_PILL[s.status].label].map(esc).join(",")
    );
    const csv = "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedInfo?.name ?? "sinf"}-oquvchilar.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Oʻquvchilar roʻyxati eksport qilindi");
  };

  // Header toolbar tugmasi — outline, tekis (soyasiz), 36px. CTA (Yangi oʻquvchi) primary.
  const toolbarBtn = "size-9 shadow-none";

  return (
    <>
      <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden p-4 md:p-6">
        {/* ── Ustun 1: Sinflar ── */}
        <div className="hidden lg:block min-w-0 min-h-0 h-full" style={{ flexGrow: grow.classes, flexBasis: 0 }}>
          <ClassListPanel page="students" selectedClassId={selectedClassId ?? ""} onSelect={handleSelectClass} />
        </div>

        {/* ── Ustun 2: Oʻquvchilar roʻyxati ── */}
        <div className="@container flex min-w-0 min-h-0 h-full flex-col overflow-hidden rounded-xl bg-card card-elevation" style={{ flexGrow: grow.list, flexBasis: 0 }}>
          {noClass ? (
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Users /></EmptyMedia>
                <EmptyTitle>Sinf tanlanmagan</EmptyTitle>
                <EmptyDescription>Oʻquvchilarni koʻrish uchun sinf tanlang</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
          {/* Header / toolbar */}
          <div className="flex min-h-[4.5rem] shrink-0 items-center gap-2.5 border-b border-border px-5 py-5">
            <SectionIcon><Users /></SectionIcon>
            <CardTitle className="truncate">Oʻquvchilar</CardTitle>
            <TypographyMuted className="hidden shrink-0 text-sm md:inline">({students.length})</TypographyMuted>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2.5">
              {/* Qidiruv */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Qidirish" className={cn(toolbarBtn, search.trim() && "ring-2 ring-primary ring-offset-2")}>
                    <Search className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ism yoki ID boʻyicha qidirish…"
                      className="h-9 pl-9"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Filtr */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Holat boʻyicha filtrlash" className={cn(toolbarBtn, statusFilter !== "all" && "ring-2 ring-primary ring-offset-2")}>
                    <Filter className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56">
                  <p className="mb-2 text-sm font-medium">Holat boʻyicha</p>
                  <div className="flex flex-col gap-1">
                    {([
                      ["all", "Hammasi"],
                      ["active", "Oʻqimoqda"],
                      ["away", "Taʼtilda"],
                      ["archived", "Chiqib ketgan"],
                    ] as [StatusFilter, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setStatusFilter(val)}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                          statusFilter === val ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                        )}
                      >
                        {label}
                        {statusFilter === val && <span className="size-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Saralash */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-9 px-0 font-semibold shadow-none @[700px]:w-auto @[700px]:px-4">
                    <ArrowUp className="size-4 @[700px]:mr-2" />
                    <span className="hidden @[700px]:inline">Saralash: {SORT_LABELS[sortKey]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Saralash</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <DropdownMenuRadioItem value="grade">Oʻrtacha baho (pastdan)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="attendance">Davomat (pastdan)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name">Ism (A–Z)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Yangi oʻquvchi — tor rejimda (3 ustun ochiq) ikonka + menyu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="font-semibold @[700px]:hidden">
                    <Plus className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
                    <Plus className="size-4" /> Yangi oʻquvchi
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                    <Upload className="size-4" /> Import
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleExport} disabled={allStudents.length === 0}>
                    <Download className="size-4" /> Eksport
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Keng rejim — split button */}
              <div className="hidden @[700px]:flex">
                <Button onClick={() => setCreateOpen(true)} className="rounded-r-none px-4 font-semibold">
                  <Plus className="mr-1 size-4" />
                  Yangi oʻquvchi
                </Button>
                <div className="w-px bg-primary-foreground/30" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="rounded-l-none px-2 font-semibold">
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setImportOpen(true)}>
                      <Upload className="size-4" /> Import
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleExport} disabled={allStudents.length === 0}>
                      <Download className="size-4" /> Eksport
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Roʻyxat */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-card to-transparent" />
            {students.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Users /></EmptyMedia>
                  <EmptyTitle>
                    {filterActive ? "Mos oʻquvchi topilmadi" : "Bu sinfda hali oʻquvchi yoʻq"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {filterActive
                      ? "Filtr yoki qidiruvni oʻzgartirib koʻring."
                      : "Birinchi oʻquvchini qoʻshing yoki tayyor roʻyxatni import qiling."}
                  </EmptyDescription>
                </EmptyHeader>
                {!filterActive && (
                  <EmptyContent>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus className="size-4" /> Yangi oʻquvchi
                      </Button>
                      <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2 shadow-none">
                        <Upload className="size-4" /> Import
                      </Button>
                    </div>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <ScrollArea className="h-full w-full">
                <div className="space-y-3 px-5 pt-5 pb-5">
                  {students.map((s) => {
                    const isSelected = s.id === selectedStudentId;
                    const pill = STATUS_PILL[s.status];
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
                              className="list-card-icon flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-semibold text-white"
                              style={{ backgroundColor: s.avatarColor ?? selHex }}
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
                              <p className="mt-0.5 text-xs text-muted-foreground/60">Oʻquvchi ID: {s.studentId}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className={cn(badgeBase, gradeBadge(s.grade))}>
                                <TrendingUp className="size-3 shrink-0" />
                                {s.grade}%
                              </span>
                              <span className={cn(badgeBase, attendanceBadge(s.attendance))}>
                                <CalendarCheck className="size-3 shrink-0" />
                                {s.attendance}%
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleStatus(s.id, s.status); }}
                              title={s.status === "active" ? "Yoʻq deb belgilash" : "Faol deb belgilash"}
                              className={cn(badgeBase, "shrink-0 cursor-pointer transition-all hover:opacity-80 active:scale-95", pill.cls)}
                            >
                              <span className={cn("size-1.5 shrink-0 rounded-full", pill.dot)} />
                              {pill.label}
                            </button>
                          </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <ContextMenuItem onSelect={() => openProfile(s.id)}>
                            <Eye className="size-4" /> Profilni koʻrish
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => setSelectedStudentId(s.id)}>
                            <Pen className="size-4" /> Tahrirlash
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => setSelectedStudentId(s.id)}>
                            <NotebookPen className="size-4 shrink-0" /> Izoh qoʻshish
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="gap-2">
                              {(() => {
                                const StatusIcon = STATUS_PILL[s.status].icon;
                                return <StatusIcon className={cn("size-4 shrink-0", STATUS_PILL[s.status].iconColor)} />;
                              })()}
                              Holati
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                              <ContextMenuRadioGroup
                                value={s.status}
                                onValueChange={(v) => setStatus(s.id, v as Status)}
                              >
                                <ContextMenuRadioItem value="active">
                                  <GraduationCap className={cn("size-4 shrink-0", STATUS_PILL.active.iconColor)} /> Oʻqimoqda
                                </ContextMenuRadioItem>
                                <ContextMenuRadioItem value="away">
                                  <Clock className={cn("size-4 shrink-0", STATUS_PILL.away.iconColor)} /> Taʼtilda
                                </ContextMenuRadioItem>
                                <ContextMenuRadioItem value="archived">
                                  <Archive className={cn("size-4 shrink-0", STATUS_PILL.archived.iconColor)} /> Chiqib ketgan
                                </ContextMenuRadioItem>
                              </ContextMenuRadioGroup>
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                          <ContextMenuSeparator />
                          <ContextMenuItem variant="destructive" onSelect={() => setDeleteTarget(s)}>
                            <Trash2 className="size-4" /> Oʻchirish
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
          <div className="hidden min-w-0 min-h-0 h-full lg:block" style={{ flexGrow: 1, flexBasis: 0 }}>
            <div className="h-full overflow-hidden rounded-xl bg-card card-elevation">
              <PreviewCard
                key={selectedStudent.id}
                student={selectedStudent}
                className={selectedInfo?.name ?? ""}
                hex={selHex}
                tint={tint}
                onToggleStatus={() => toggleStatus(selectedStudent.id, selectedStudent.status)}
                onViewProfile={() => openProfile(selectedStudent.id)}
              />
            </div>
          </div>
        )}
      </div>

      <CreateStudentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultClassId={selectedClassId ?? firstLiveClassId ?? ""}
        onCreate={handleCreate}
      />

      <ImportStudentsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        className={selectedInfo?.name ?? ""}
        onImport={handleImport}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Oʻquvchini oʻchirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `«${deleteTarget.name}» ` : ""}oʻquvchisi va uning barcha baholari butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteStudent(deleteTarget.id);
                  toast.success("Oʻquvchi oʻchirildi");
                }
                setDeleteTarget(null);
              }}
            >
              Oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Preview kartasi ──────────────────────────────────────────────────────────
function PreviewCard({
  student, className, hex, tint, onToggleStatus, onViewProfile,
}: {
  student: StudentRow;
  className: string;
  hex: string;
  tint: (pct: number) => string;
  onToggleStatus: () => void;
  onViewProfile: () => void;
}) {
  const pill = STATUS_PILL[student.status];
  const contacts: { icon: React.ReactNode; label: string; value?: string }[] = [
    { icon: <User className="size-4" />, label: "Ota yoki onasining ismi sharifi", value: student.parentName },
    { icon: <Phone className="size-4" />, label: "Ota-ona telefoni", value: student.parentPhone },
    { icon: <Phone className="size-4" />, label: "Oʻquvchi telefoni", value: student.studentPhone },
  ];

  return (
    <div className="group/card flex h-full w-full flex-col">
      {/* Gradient header */}
      <div
        className="relative h-32 shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(${tint(27)}, ${tint(33)})` }}
      >
        <div className="absolute -right-6 -top-6 size-24 rounded-full" style={{ backgroundColor: tint(19) }} />
        <div className="absolute right-4 top-10 size-12 rounded-full" style={{ backgroundColor: tint(31) }} />
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 400 24" preserveAspectRatio="none" style={{ height: 24 }}>
          <path d="M0,24 L0,20 Q200,0 400,20 L400,24 Z" className="fill-card" />
        </svg>
        <button className="absolute left-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-foreground/70 opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-foreground group-hover/card:opacity-100" aria-label="Tahrirlash">
          <Pen className="size-3.5" />
        </button>
        <button onClick={onViewProfile} className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-foreground/70 opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-foreground group-hover/card:opacity-100" aria-label="Toʻliq profil">
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      <div className="relative z-20 -mt-16 mb-4 flex shrink-0 justify-center px-6">
        <div className="size-28 overflow-hidden rounded-full border-4 border-card bg-card shadow-md">
          <div
            className="flex size-full items-center justify-center overflow-hidden text-2xl font-semibold text-white"
            style={{ backgroundColor: student.avatarColor ?? hex }}
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

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-h-full flex-col px-6 pb-6">
          <div className="mb-4 space-y-2 text-center">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onToggleStatus}
                className={cn(badgeBase, "cursor-pointer transition-all hover:opacity-80 active:scale-95", pill.cls)}
              >
                <span className={cn("size-1.5 rounded-full", pill.dot)} />
                {pill.label}
              </button>
            </div>
            <CardTitle className="text-xl">{student.name}</CardTitle>
            <TypographyMuted className="text-sm">{student.studentId}</TypographyMuted>
          </div>

          <Button
            onClick={onViewProfile}
            className="mb-6 h-9 w-full rounded-lg font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: hex }}
          >
            Profilni koʻrish
          </Button>

          <div className="mb-6">
            <TypographyLabel className="mb-3 block">Sinf</TypographyLabel>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: tint(13), color: hex }}>
                {className}
              </div>
            </div>
          </div>

          <div>
            <TypographyLabel className="mb-3 block">Aloqa</TypographyLabel>
            {contacts.every((c) => !c.value) ? (
              <div className="flex flex-col items-start gap-2.5 rounded-lg border border-dashed border-border p-4">
                <TypographyMuted>Aloqa maʼlumoti kiritilmagan</TypographyMuted>
                <Button variant="outline" size="sm" className="gap-1.5 shadow-none">
                  <Plus className="size-3.5" /> Qoʻshish
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {contacts.filter((c) => c.value).map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 rounded-lg p-2" style={{ backgroundColor: tint(13), color: hex }}>
                      {c.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <TypographyMuted>{c.label}</TypographyMuted>
                      <p className="text-sm">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center gap-2 pt-6">
            <Button
              variant="outline"
              disabled={!student.parentPhone}
              asChild={!!student.parentPhone}
              className="h-9 flex-1 rounded-lg shadow-none"
            >
              {student.parentPhone ? (
                <a href={`tel:${student.parentPhone}`}>
                  <Phone className="mr-2 size-4" /> Qoʻngʻiroq
                </a>
              ) : (
                <span><Phone className="mr-2 size-4" /> Qoʻngʻiroq</span>
              )}
            </Button>
            <Button variant="outline" disabled title="Tez orada" className="h-9 flex-1 rounded-lg shadow-none">
              <MessageCircle className="mr-2 size-4" /> Telegram
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
