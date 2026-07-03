"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { gradeBadgeClass as gradeBadge, attendanceBadgeClass as attendanceBadge } from "@/lib/score-colors";
import type { ClassData } from "@/lib/grades-data";
import { studentSummary } from "@/lib/grades-stats";
import { deriveLessonDays, weightedRate } from "@/lib/attendance-data";
import { todayKey } from "@/lib/date-keys";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useMounted } from "@/lib/use-mounted";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users, User, Plus, Search, ArrowUp, TrendingUp, CalendarCheck, Phone, MessageCircle,
  ExternalLink,
} from "lucide-react";
import type { ClassIdentity } from "@/lib/class-id";

/* ── Tiplar va yordamchilar (students sahifasi bilan bir xil mantiq) ── */
type Status = "active" | "away" | "archived";
type StudentRow = {
  id: string;
  name: string;
  initials: string;
  studentId: string;
  grade: number;
  /** Haqiqiy davomat foizi; bu sinf-oʻquvchi uchun yozuv boʻlmasa null ("—"). */
  attendance: number | null;
  status: Status;
};
type SortKey = "name" | "grade" | "attendance";

const SORT_LABELS: Record<SortKey, string> = { name: "Ism", grade: "Oʻrtacha baho", attendance: "Davomat" };

/** Oʻquvchining jurnal bahosi (% — Baholar jurnali bilan bir formula:
    summativ, toifa-vaznli, foiz-normallashgan). [[grades-v1-model]] */
function computeGrade(data: ClassData | undefined, studentId: string): number {
  if (!data) return 0;
  return Math.round(
    studentSummary(studentId, data.assignments, data.grades, data.topics).summative
  );
}

const STATUS_PILL: Record<Status, { cls: string; dot: string; label: string }> = {
  active: { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Oʻqimoqda" },
  away: { cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800", dot: "bg-amber-500", label: "Taʼtilda" },
  archived: { cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700", dot: "bg-slate-400", label: "Chiqib ketgan" },
};
const badgeBase = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";

export function StudentsSection({ identity }: { identity: ClassIdentity }) {
  const router = useRouter();
  const classId = identity.id;
  const hex = CLASS_COLOR_HEX[identity.color];
  const tint = (pct: number) => `color-mix(in srgb, ${hex} ${pct}%, transparent)`;

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("grade");
  const [statusOverride, setStatusOverride] = useState<Record<string, Status>>({});

  // Jonli manbalar — Baholar jurnali va Davomat bilan bir xil store
  // (server-backed). Hydration'gacha roʻyxat boʻsh boʻlib turadi.
  const mounted = useMounted();
  const liveGrades = useGradesStore((s) => s.classDataMap[classId]);
  const storedRecords = useAttendanceStore((s) => s.recordsByClass[classId]);
  const calendar = useCalendarStore((s) => s.calendar);
  const versions = useTimetableStore((s) => s.versions);

  useEffect(() => { setSelectedStudentId(null); setSearch(""); }, [classId]);

  const openProfile = (id: string) => router.push(`/dashboard/students/${encodeURIComponent(id)}`);

  const allStudents = useMemo<StudentRow[]>(() => {
    const data = mounted ? liveGrades : undefined;
    // Davomat — haqiqiy yozuvlardan, dars kunlari boʻyicha vaznli foiz.
    // Dars kunlari jadval+kalendar store'laridan hisoblanadi — SSR bilan
    // mos boʻlishi uchun mount'gacha boʻsh (foiz "—" boʻlib turadi).
    const records = (mounted ? storedRecords : undefined) ?? [];
    const today = todayKey();
    const end = today < calendar.range.end ? today : calendar.range.end;
    const lessonDates = mounted
      ? new Set(
          deriveLessonDays(classId, { start: calendar.range.start, end }, calendar, versions)
            .map((d) => d.date)
        )
      : new Set<string>();
    return (data?.students ?? []).map((s, i) => ({
      id: s.id,
      name: s.name,
      initials: s.initials,
      studentId: `ID-${1001 + i}`,
      grade: computeGrade(data, s.id),
      attendance: weightedRate(records, s.id, lessonDates)?.pct ?? null,
      status: (statusOverride[s.id] ?? s.status ?? "active") as Status,
    }));
  }, [classId, statusOverride, mounted, liveGrades, storedRecords, calendar, versions]);

  const students = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? allStudents.filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
      : allStudents;
    list = [...list];
    if (sortKey === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "grade") list.sort((a, b) => a.grade - b.grade);
    else list.sort((a, b) => (a.attendance ?? Infinity) - (b.attendance ?? Infinity));
    return list;
  }, [allStudents, search, sortKey]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;
  const toggleStatus = (id: string, current: Status) =>
    setStatusOverride((prev) => ({ ...prev, [id]: current === "active" ? "away" : "active" }));

  const toolbarBtn = "size-9 shadow-none";

  return (
    <div className="flex h-full min-h-0 gap-6 overflow-hidden">
      {/* ── Roʻyxat ── */}
      <div
        className="@container flex min-w-0 min-h-0 h-full flex-col overflow-hidden rounded-xl bg-card card-elevation"
        style={{ flexGrow: selectedStudent ? 3 : 5, flexBasis: 0 }}
      >
        {/* Header / toolbar */}
        <div className="flex min-h-[4.5rem] shrink-0 items-center gap-2.5 border-b border-border px-5 py-5">
          <SectionIcon><Users /></SectionIcon>
          <CardTitle className="truncate">Oʻquvchilar</CardTitle>
          <TypographyMuted className="hidden shrink-0 text-sm md:inline">({students.length})</TypographyMuted>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className={cn(toolbarBtn, search.trim() && "ring-2 ring-primary ring-offset-2")}>
                  <Search className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki ID boʻyicha qidirish…" className="h-9 pl-9" />
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 w-9 px-0 font-semibold shadow-none @[640px]:w-auto @[640px]:px-4">
                  <ArrowUp className="size-4 @[640px]:mr-2" />
                  <span className="hidden @[640px]:inline">Saralash: {SORT_LABELS[sortKey]}</span>
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

            <Button className="font-semibold" disabled title="Tez orada">
              <Plus className="size-4 @[640px]:mr-1" />
              <span className="hidden @[640px]:inline">Yangi oʻquvchi</span>
            </Button>
          </div>
        </div>

        {/* Roʻyxat */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl">
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-card to-transparent" />
          {students.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Users className="size-8" />
              </div>
              <div className="max-w-xs">
                <p className="text-base font-semibold text-foreground">
                  {search.trim() ? "Mos oʻquvchi topilmadi" : "Bu sinfda hali oʻquvchi yoʻq"}
                </p>
                <TypographyMuted className="mt-1.5 text-sm">
                  {search.trim() ? "Qidiruvni oʻzgartirib koʻring." : "Oʻquvchilarni qoʻshing."}
                </TypographyMuted>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="space-y-3 px-5 pt-5 pb-5">
                {students.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  const pill = STATUS_PILL[s.status];
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStudentId(isSelected ? null : s.id)}
                      className="list-card group block w-full cursor-pointer p-4 text-left"
                      data-active={isSelected || undefined}
                      style={{
                        ["--card-accent" as string]: hex,
                        ...(isSelected ? { backgroundColor: `color-mix(in oklch, ${hex} 7%, var(--card))` } : {}),
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="list-card-icon flex size-14 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white" style={{ backgroundColor: hex }}>
                          {s.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="heading-small truncate transition-colors group-hover:text-primary">{s.name}</h4>
                          <p className="mt-0.5 text-xs text-muted-foreground/60">Oʻquvchi ID: {s.studentId}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className={cn(badgeBase, gradeBadge(s.grade))}>
                            <TrendingUp className="size-3 shrink-0" />
                            {s.grade}%
                          </span>
                          <span className={cn(badgeBase, s.attendance == null ? "bg-muted text-muted-foreground border-border" : attendanceBadge(s.attendance))}>
                            <CalendarCheck className="size-3 shrink-0" />
                            {s.attendance == null ? "—" : `${s.attendance}%`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleStatus(s.id, s.status); }}
                          title={s.status === "active" ? "Yoʻq deb belgilash" : "Faol deb belgilash"}
                          className={cn(badgeBase, "hidden shrink-0 cursor-pointer transition-all hover:opacity-80 active:scale-95 @[560px]:inline-flex", pill.cls)}
                        >
                          <span className={cn("size-1.5 shrink-0 rounded-full", pill.dot)} />
                          {pill.label}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* ── Preview (oʻquvchi tanlanganda) ── */}
      {selectedStudent && (
        <div className="hidden min-w-0 min-h-0 h-full xl:block" style={{ flexGrow: 2, flexBasis: 0 }}>
          <div className="h-full overflow-hidden rounded-xl bg-card card-elevation">
            <PreviewCard
              key={selectedStudent.id}
              student={selectedStudent}
              className={identity.name}
              hex={hex}
              tint={tint}
              onToggleStatus={() => toggleStatus(selectedStudent.id, selectedStudent.status)}
              onViewProfile={() => openProfile(selectedStudent.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Preview kartasi (students sahifasidagi dizayn) ── */
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

  return (
    <div className="group/card flex h-full w-full flex-col">
      <div className="relative h-32 shrink-0 overflow-hidden" style={{ background: `linear-gradient(${tint(27)}, ${tint(33)})` }}>
        <div className="absolute -right-6 -top-6 size-24 rounded-full" style={{ backgroundColor: tint(19) }} />
        <div className="absolute right-4 top-10 size-12 rounded-full" style={{ backgroundColor: tint(31) }} />
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 400 24" preserveAspectRatio="none" style={{ height: 24 }}>
          <path d="M0,24 L0,20 Q200,0 400,20 L400,24 Z" className="fill-card" />
        </svg>
        <button onClick={onViewProfile} className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-foreground/70 opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-foreground group-hover/card:opacity-100" aria-label="Toʻliq profil">
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      <div className="relative z-20 -mt-16 mb-4 flex shrink-0 justify-center px-6">
        <div className="size-28 overflow-hidden rounded-full border-4 border-card bg-card shadow-md">
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-white" style={{ backgroundColor: hex }}>
            {student.initials}
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-h-full flex-col px-6 pb-6">
          <div className="mb-4 space-y-2 text-center">
            <div className="flex justify-center">
              <button type="button" onClick={onToggleStatus} className={cn(badgeBase, "cursor-pointer transition-all hover:opacity-80 active:scale-95", pill.cls)}>
                <span className={cn("size-1.5 rounded-full", pill.dot)} />
                {pill.label}
              </button>
            </div>
            <CardTitle className="text-xl">{student.name}</CardTitle>
            <TypographyMuted className="text-sm">{student.studentId}</TypographyMuted>
          </div>

          <Button onClick={onViewProfile} className="mb-6 h-9 w-full rounded-lg font-semibold text-white transition-all hover:brightness-110" style={{ backgroundColor: hex }}>
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
            <div className="flex flex-col items-start gap-2.5 rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" />
                <TypographyMuted>Aloqa maʼlumoti kiritilmagan</TypographyMuted>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 shadow-none" disabled title="Tez orada">
                <Plus className="size-3.5" /> Qoʻshish
              </Button>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 pt-6">
            <Button variant="outline" disabled title="Tez orada" className="h-9 flex-1 rounded-lg shadow-none">
              <Phone className="mr-2 size-4" /> Qoʻngʻiroq
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
