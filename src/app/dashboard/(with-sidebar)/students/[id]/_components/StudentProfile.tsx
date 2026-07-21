"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getStudentProfile, locateStudent } from "@/lib/student-profile";
import { useGradesStore } from "@/store/useGradesStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { deriveLessonDays, statusWeights, type AttendanceRecord } from "@/lib/attendance-data";
import { useStudentNotesStore, formatNoteTime } from "@/store/useStudentNotesStore";
import { MONTHS_UZ, DAYS_UZ_SUN_SHORT } from "@/lib/localization";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { uz } from "date-fns/locale";
import { ClassSwatch } from "@/components/ClassSwatch";
import RelativesSection from "./RelativesSection";
import OverviewTab from "./OverviewTab";
import AssignmentsTab from "./AssignmentsTab";
import NotesTab, { type Note } from "./NotesTab";
import type { Visibility } from "@/store/useStudentNotesStore";
import BehaviorTab from "./BehaviorTab";
import type { NewStudentInput } from "../../_components/CreateStudentModal";
import { toast } from "sonner";
import {
  ChevronsUpDown, ChevronLeft, ChevronRight, ArrowLeft, Check,
  Phone, MessageCircle, Pen, BarChart3, ClipboardList,
  StickyNote, Cake, Mars, Venus, Award, CalendarDays,
} from "lucide-react";

type Gender = "male" | "female";

/** yyyy-mm-dd ↔ Date (timezone-xavfsiz, lokal) */
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function fromISO(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

type TabId = "overview" | "assignments" | "notes" | "behavior";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

const EMPTY_RECORDS: AttendanceRecord[] = [];

const TAB_IDS: TabId[] = ["overview", "assignments", "notes", "behavior"];
function normalizeTab(t?: string): TabId {
  return TAB_IDS.includes(t as TabId) ? (t as TabId) : "overview";
}

export default function StudentProfile({
  studentId,
  initialTab,
}: {
  studentId: string;
  initialTab?: string;
}) {
  const t = useTranslations("StudentProfile");
  const router = useRouter();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const hydrated = useGradesStore((s) => s._hasHydrated);

  // Davomat — jonli manba (Davomat sahifasi bilan bir xil: recordsByClass +
  // real dars kunlari + vaznlar). classId oʻquvchi joylashuvidan aniqlanadi.
  const classId = useMemo(() => locateStudent(classDataMap, studentId)?.classId, [classDataMap, studentId]);
  const attendanceRecords = useAttendanceStore((s) => (classId ? s.recordsByClass[classId] : undefined)) ?? EMPTY_RECORDS;
  const attendanceStatuses = useAttendanceStore((s) => s.statuses);
  const calendar = useCalendarStore((s) => s.calendar);
  const timetableVersions = useTimetableStore((s) => s.versions);
  const lessonDays = useMemo(() => {
    if (!classId) return [];
    return deriveLessonDays(classId, { start: calendar.range.start, end: calendar.range.end }, calendar, timetableVersions);
  }, [classId, calendar, timetableVersions]);
  const attendanceWeights = useMemo(() => statusWeights(attendanceStatuses), [attendanceStatuses]);

  const profile = useMemo(
    () =>
      getStudentProfile(classDataMap, studentId, {
        records: attendanceRecords,
        lessonDays,
        weights: attendanceWeights,
      }),
    [classDataMap, studentId, attendanceRecords, lessonDays, attendanceWeights]
  );

  // Active tab URL'da (`?tab=`) saqlanadi — oʻquvchilar orasida oʻtganda saqlanib qoladi
  const [tab, setTabState] = useState<TabId>(() => normalizeTab(initialTab));
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const noteEntries = useStudentNotesStore((s) => s.items);
  const addNoteEntry = useStudentNotesStore((s) => s.addNote);
  const updateNoteEntry = useStudentNotesStore((s) => s.updateNote);
  const deleteNoteEntry = useStudentNotesStore((s) => s.deleteNote);
  // Profil tahriri (sessiya ichida) — boshqa oʻquvchiga oʻtganda tozalanadi
  const [override, setOverride] = useState<Partial<NewStudentInput>>({});
  const [nameOverride, setNameOverride] = useState<string | undefined>(undefined);
  useEffect(() => { setOverride({}); setNameOverride(undefined); }, [studentId]);

  // Yagona tahrirlash rejimi — bitta "Tahrirlash" tugma bilan boshlanadi,
  // BARCHA maydonlar (ism, jinsi, tugʻilgan sana, aloqa) shu paytda tahrirlanadigan
  // boʻladi, faqat "Saqlash" bosilganda commit qilinadi (avto-saqlash yoʻq).
  const [cardEditing, setCardEditing] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    gender?: Gender;
    birthDate?: string;
    parentName?: string;
    parentPhone?: string;
    studentPhone?: string;
  }>({ name: "" });

  const setTab = useCallback((next: TabId) => {
    setTabState(next);
    // Yengil URL sinxronizatsiyasi (yangilashda/almashishda saqlanadi)
    const url = next === "overview"
      ? window.location.pathname
      : `${window.location.pathname}?tab=${next}`;
    window.history.replaceState(null, "", url);
  }, []);

  const go = useCallback(
    (id: string | null) => {
      if (id) {
        const q = tab === "overview" ? "" : `?tab=${tab}`;
        router.push(`/dashboard/students/${encodeURIComponent(id)}${q}`);
      }
    },
    [router, tab]
  );

  const prevId = profile?.location.prevId ?? null;
  const nextId = profile?.location.nextId ?? null;

  // Klaviatura: ← / → bilan oʻquvchilar orasida oʻtish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(prevId);
      else if (e.key === "ArrowRight") go(nextId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, prevId, nextId]);

  const notes = useMemo<Note[]>(
    () =>
      noteEntries
        .filter((n) => n.studentId === studentId)
        .map((n) => ({
          id: n.id,
          title: n.title,
          text: n.text,
          tags: n.tags,
          visibility: n.visibility,
          time: formatNoteTime(n.createdAt),
          createdAt: n.createdAt,
          authorName: n.authorName,
          authorAvatarUrl: n.authorAvatarUrl,
        })),
    [noteEntries, studentId]
  );

  const addNote = useCallback(
    (text: string, tags: string[], visibility: Visibility, title?: string | null) =>
      addNoteEntry(studentId, text, tags, visibility, title),
    [addNoteEntry, studentId]
  );
  const updateNote = useCallback(
    (id: string, text: string, tags: string[], title?: string | null) =>
      updateNoteEntry(id, text, tags, title),
    [updateNoteEntry]
  );
  const deleteNote = useCallback((id: string) => deleteNoteEntry(id), [deleteNoteEntry]);

  // ── Server hydration tugamagan — hali "topilmadi" deb boʻlmaydi ──
  if (!profile && !hydrated) {
    return (
      <div className="flex flex-1 min-h-0 gap-6 p-6">
        <Skeleton className="w-72 shrink-0 rounded-2xl" />
        <Skeleton className="flex-1 rounded-2xl" />
      </div>
    );
  }

  // ── Topilmadi ──
  if (!profile) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia><Illustration name="14" className="h-32 text-black dark:text-white" /></EmptyMedia>
          <EmptyTitle>{t("notFoundTitle")}</EmptyTitle>
          <EmptyDescription>{t("notFoundDescription")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => router.push("/dashboard/students")} variant="outline" className="shadow-none">
            <ArrowLeft className="size-4" /> {t("backToStudents")}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const { location, name: baseName, initials: baseInitials, studentCode } = profile;
  const name = nameOverride ?? baseName;
  const initials = nameOverride
    ? nameOverride
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : baseInitials;
  const hex = location.hex;
  const pos = location.index + 1;
  const total = location.roster.length;

  // Tahrir override profil ustiga (sessiya ichida)
  const info = {
    gender: override.gender ?? profile.gender,
    birthDate: override.birthDate ?? profile.birthDate,
    parentName: override.parentName ?? profile.parentName,
    parentPhone: override.parentPhone ?? profile.parentPhone,
    studentPhone: override.studentPhone ?? profile.studentPhone,
  };

  // Profil maʼlumotlari (oʻquvchi yaratish maydonlaridan) — panel uchun formatlash
  const age = info.birthDate
    ? (() => {
        const b = new Date(info.birthDate);
        const now = new Date();
        let a = now.getFullYear() - b.getFullYear();
        const m = now.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
        return a;
      })()
    : undefined;
  const genderLabel = info.gender ? (info.gender === "male" ? t("genderMale") : t("genderFemale")) : undefined;
  // Tugʻilgan sana — "2016-yil 9-yanvar" koʻrinishida
  const birthDateText = info.birthDate
    ? (() => {
        const [y, m, d] = info.birthDate.split("-").map(Number);
        return `${y}-yil ${d}-${UZ_MONTHS[m - 1]}`;
      })()
    : undefined;
  // Tugʻilgan kunigacha qancha qolgani
  const birthdayCountdown = info.birthDate
    ? (() => {
        const b = new Date(info.birthDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
        if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
        const days = Math.round((next.getTime() - today.getTime()) / 86_400_000);
        if (days === 0) return t("birthdayToday");
        if (days === 1) return t("birthdayTomorrow");
        if (days < 30) return t("birthdayDays", { days });
        const months = Math.round(days / 30);
        return t("birthdayMonths", { months });
      })()
    : undefined;

  // Bitta "Tahrirlash" tugmasi — butun kartani (ism + shaxsiy + aloqa) draft
  // holatiga oʻtkazadi; hech narsa saqlanmaydi toki "Saqlash" bosilmaguncha.
  const startCardEdit = () => {
    setDraft({
      name,
      gender: info.gender,
      birthDate: info.birthDate,
      parentName: info.parentName,
      parentPhone: info.parentPhone,
      studentPhone: info.studentPhone,
    });
    setCardEditing(true);
  };

  const cancelCardEdit = () => {
    setCardEditing(false);
    setGenderOpen(false);
    setBirthDateOpen(false);
  };

  const saveCardEdit = () => {
    const trimmedName = draft.name.trim() || name;
    const [fn, ...rest] = trimmedName.split(" ");
    const ln = rest.join(" ");
    setNameOverride(trimmedName);
    setOverride({
      gender: draft.gender,
      birthDate: draft.birthDate,
      parentName: draft.parentName?.trim() || undefined,
      parentPhone: draft.parentPhone?.trim() || undefined,
      studentPhone: draft.studentPhone?.trim() || undefined,
    });
    if (location?.classId) {
      updateClass(location.classId, (cd) => ({
        ...cd,
        students: cd.students.map((s) =>
          s.id === studentId ? {
            ...s,
            name: trimmedName,
            initials: (fn[0] + (ln[0] || "")).toUpperCase(),
            gender: draft.gender,
            birthDate: draft.birthDate,
            parentName: draft.parentName?.trim() || undefined,
            parentPhone: draft.parentPhone?.trim() || undefined,
            studentPhone: draft.studentPhone?.trim() || undefined,
          } : s
        ),
      }));
    }
    setCardEditing(false);
    setGenderOpen(false);
    setBirthDateOpen(false);
    toast.success(t("toastSaved"));
  };

  const TABS: { id: TabId; label: string; sub: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "overview", label: t("tabOverview"), sub: t("tabOverviewSub"), icon: BarChart3 },
    { id: "assignments", label: t("tabAssignments"), sub: t("tabAssignmentsSub"), icon: ClipboardList, count: profile.assignments.length },
    { id: "notes", label: t("tabNotes"), sub: t("tabNotesSub"), icon: StickyNote, count: notes.length },
    { id: "behavior", label: t("tabBehavior"), sub: t("tabBehaviorSub"), icon: Award },
  ];

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden py-4 pl-4 md:py-6 md:pl-6">
      {/* ── Chap panel — bitta karta, ichida boʻlimlar ── */}
      <aside className="hidden w-[360px] shrink-0 flex-col overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm lg:flex">
        {/* Oʻquvchi + switcher (sarlavha boʻlimi) */}
        <div className="shrink-0 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ backgroundColor: hex }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                {cardEditing ? (
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="h-7 min-w-0 px-1.5 py-0 text-lg font-bold tracking-tight"
                    autoFocus
                  />
                ) : (
                  <span className="truncate text-lg font-bold tracking-tight">{name}</span>
                )}
                <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className="group shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground">
                      <ChevronsUpDown className="size-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0">
                  <Command>
                    <CommandInput placeholder={t("searchPlaceholder")} />
                    <CommandList>
                      <CommandEmpty>{t("notFound")}</CommandEmpty>
                      <CommandGroup heading={location.classInfo.name}>
                        {location.roster.map((r) => (
                          <CommandItem
                            key={r.id}
                            value={r.name}
                            onSelect={() => { setSwitcherOpen(false); if (r.id !== studentId) go(r.id); }}
                          >
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: hex }}>
                              {r.initials}
                            </div>
                            <span className="truncate">{r.name}</span>
                            {r.id === studentId && <Check className="ml-auto size-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <TypographyMuted className="mt-0.5 inline-flex items-center gap-1.5">
                <ClassSwatch hex={hex} className="size-2.5" />
                {location.classInfo.name} · {studentCode}
              </TypographyMuted>
            </div>
            {!cardEditing && (
              <Button
                variant="outline"
                size="icon"
                onClick={startCardEdit}
                className="size-8 shrink-0 shadow-none"
                aria-label={t("edit")}
                title={t("edit")}
              >
                <Pen className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Boʻlimlar — bitta karta ichida, chiziq bilan ajratilgan (scroll) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Shaxsiy maʼlumotlar */}
          <div className="border-b border-border p-5">
            <TypographyLabel className="mb-4 block">{t("personalInfo")}</TypographyLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Jinsi — faqat tahrirlash rejimida oʻzgartiriladi */}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("gender")}</p>
                {cardEditing ? (
                  <DropdownMenu open={genderOpen} onOpenChange={setGenderOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "mt-1 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium cursor-pointer transition-opacity hover:opacity-80",
                          draft.gender === "male"
                            ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : draft.gender === "female"
                            ? "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {draft.gender === "male" ? <Mars className="size-3.5" /> : draft.gender === "female" ? <Venus className="size-3.5" /> : null}
                        {draft.gender ? (draft.gender === "male" ? t("genderMale") : t("genderFemale")) : t("addValue")}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[140px]">
                      <DropdownMenuItem onClick={() => setDraft((d) => ({ ...d, gender: "male" }))} className="gap-2">
                        <Mars className="size-4 text-sky-500" />
                        <span>{t("genderMale")}</span>
                        {draft.gender === "male" && <Check className="ml-auto size-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDraft((d) => ({ ...d, gender: "female" }))} className="gap-2">
                        <Venus className="size-4 text-pink-500" />
                        <span>{t("genderFemale")}</span>
                        {draft.gender === "female" && <Check className="ml-auto size-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : info.gender ? (
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium",
                      info.gender === "male"
                        ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        : "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400"
                    )}
                  >
                    {info.gender === "male" ? <Mars className="size-3.5" /> : <Venus className="size-3.5" />}
                    {genderLabel}
                  </span>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                )}
              </div>
              {/* Yoshi — tugʻilgan kunigacha qolgan vaqt tooltipda (Sinfi endi faqat sarlavhada — takror emas) */}
              {age != null ? (
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("age")}</p>
                  {birthdayCountdown ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:underline">
                          {t("ageValue", { age })}
                          <Cake className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{t("birthdayCountdownTooltip", { countdown: birthdayCountdown })}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="mt-1 truncate text-sm font-medium">{t("ageValue", { age })}</p>
                  )}
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("age")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                </div>
              )}
              {/* Tavallud sanasi — faqat tahrirlash rejimida taqvim popover orqali oʻzgartiriladi */}
              <div className="col-span-2 min-w-0">
                <p className="text-xs text-muted-foreground">{t("birthDate")}</p>
                {cardEditing ? (
                  <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                    <PopoverTrigger asChild>
                      {draft.birthDate ? (
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary cursor-pointer whitespace-nowrap"
                        >
                          <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {(() => {
                              const [y, m, d] = draft.birthDate.split("-").map(Number);
                              return `${y}-yil ${d}-${UZ_MONTHS[m - 1]}`;
                            })()}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="mt-1 block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t("addValue")}
                        </button>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={uz}
                        formatters={{
                          formatMonthDropdown: (date: Date) => MONTHS_UZ[date.getMonth()],
                          formatWeekdayName: (date: Date) => DAYS_UZ_SUN_SHORT[date.getDay()],
                        }}
                        selected={fromISO(draft.birthDate ?? "")}
                        defaultMonth={fromISO(draft.birthDate ?? "") ?? new Date(2012, 0)}
                        captionLayout="dropdown"
                        startMonth={new Date(2000, 0)}
                        endMonth={new Date(2027, 11)}
                        onSelect={(d) => {
                          if (d) { setDraft((prev) => ({ ...prev, birthDate: toISO(d) })); setBirthDateOpen(false); }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : birthDateText ? (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground whitespace-nowrap">
                    <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{birthDateText}</span>
                  </span>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Qarindoshlar — bogʻlangan aka/uka/opa/singil, bosilganda profilga oʻtadi */}
          <RelativesSection studentId={studentId} onNavigate={go} />

          {/* Aloqa — faqat tahrirlash rejimida oʻzgartiriladi (bitta Saqlash bilan) */}
          <div className="p-5">
            <TypographyLabel className="mb-4 block">{t("contact")}</TypographyLabel>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <ContactField
                className="col-span-2"
                label={t("parentName")}
                value={info.parentName}
                editing={cardEditing}
                draftValue={draft.parentName ?? ""}
                onDraftChange={(v) => setDraft((d) => ({ ...d, parentName: v }))}
                placeholder={t("parentNamePlaceholder")}
              />
              <ContactField
                label={t("parentPhone")}
                value={info.parentPhone}
                editing={cardEditing}
                draftValue={draft.parentPhone ?? ""}
                onDraftChange={(v) => setDraft((d) => ({ ...d, parentPhone: v }))}
                placeholder={t("parentPhonePlaceholder")}
                inputType="tel"
              />
              <ContactField
                label={t("studentPhone")}
                value={info.studentPhone}
                editing={cardEditing}
                draftValue={draft.studentPhone ?? ""}
                onDraftChange={(v) => setDraft((d) => ({ ...d, studentPhone: v }))}
                placeholder={t("studentPhonePlaceholder")}
                inputType="tel"
              />
            </div>
          </div>
        </div>

        {/* Footer boʻlimi — odatda telefon/chat, tahrirlash rejimida Bekor qilish/Saqlash */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border p-4">
          {cardEditing ? (
            <>
              <Button variant="outline" onClick={cancelCardEdit} className="h-9 flex-1 shadow-none">
                {t("cancel")}
              </Button>
              <Button onClick={saveCardEdit} className="h-9 flex-1 font-semibold">
                {t("save")}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="icon" disabled={!info.parentPhone} className="size-9 shadow-none" aria-label={t("callParentAria")}>
                <a href={info.parentPhone ? `tel:${info.parentPhone.replace(/\s/g, "")}` : undefined}>
                  <Phone className="size-4" />
                </a>
              </Button>
              <Button className="h-9 flex-1 font-semibold"><MessageCircle className="size-4" /> {t("chat")}</Button>
            </>
          )}
        </div>
      </aside>

      {/* ── Asosiy maydon ── */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header card — bir qatorda: breadcrumb · boʻlim tablari · oʻquvchilar paginatsiyasi */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabId)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="mb-4 mr-4 shrink-0 rounded-xl bg-card px-3 py-2 border border-border/50 shadow-sm md:mr-6">
            <div className="flex items-center gap-3">
              {/* Boʻlim tablari — Statistika sahifasidagi pill-tab uslubi (StatsTabs) */}
              <div role="tablist" className="flex items-center gap-1.5">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const isActive = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {t.label}
                      {t.count !== undefined && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                            isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {t.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1" />

              {/* Oʻquvchilar orasida navigatsiya — oʻng tomonda, icon-only */}
              <StudentPager
                pos={pos}
                total={total}
                prevId={prevId}
                nextId={nextId}
                go={go}
                className="shrink-0"
              />
            </div>
          </div>

          {tab === "assignments" ? (
            // Topshiriqlar: toolbar qotib turadi, faqat roʻyxat ichkarida scroll boʻladi
            <div className="flex min-h-0 flex-1 flex-col pr-4 md:pr-6">
              <AssignmentsTab profile={profile} />
            </div>
          ) : tab === "notes" ? (
            // Qaydlar: bitta karta ichida, roʻyxat kartaning oʻzida scroll boʻladi
            <div className="flex min-h-0 flex-1 flex-col pb-6 pr-4 md:pr-6">
              <NotesTab notes={notes} onAdd={addNote} onUpdate={updateNote} onDelete={deleteNote} />
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="pb-6 pr-4 md:pr-6">
                <TabsContent value="overview"><OverviewTab profile={profile} /></TabsContent>
                <TabsContent value="behavior">
                  <BehaviorTab classId={location.classId} studentId={studentId} />
                </TabsContent>
              </div>
            </ScrollArea>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// Oʻquvchilar orasida oldingi/keyingi navigatsiya — icon-only, tooltipli.
// `pos / total` oʻqlar orasida koʻrsatiladi.
function StudentPager({
  pos, total, prevId, nextId, go, className,
}: {
  pos: number;
  total: number;
  prevId: string | null;
  nextId: string | null;
  go: (id: string | null) => void;
  className?: string;
}) {
  const t = useTranslations("StudentProfile");
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-8 shadow-none"
              disabled={!prevId}
              onClick={() => prevId && go(prevId)}
              aria-label={t("prevStudent")}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("prevStudent")}</TooltipContent>
        </Tooltip>
        <span className="px-1.5 text-sm tabular-nums text-muted-foreground">{pos} / {total}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-8 shadow-none"
              disabled={!nextId}
              onClick={() => nextId && go(nextId)}
              aria-label={t("nextStudent")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("nextStudent")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function Field({
  label, value, onAdd, className,
}: {
  label: string;
  value?: string;
  onAdd?: () => void;
  className?: string;
}) {
  const t = useTranslations("StudentProfile");
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value ? (
        <p className="mt-1 truncate text-sm font-medium">{value}</p>
      ) : onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("addValue")}
        </button>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

/** Aloqa maydoni — faqat kartaning yagona tahrirlash rejimida (`cardEditing`)
    Input'ga aylanadi; oʻzgarish darhol saqlanmaydi, faqat draft holatida
    turadi — "Saqlash" bosilganda barcha maydonlar bilan birga commit boʻladi. */
function ContactField({
  label,
  value,
  editing,
  draftValue,
  onDraftChange,
  placeholder,
  inputType = "text",
  className,
}: {
  label: string;
  value?: string;
  editing: boolean;
  draftValue: string;
  onDraftChange: (value: string) => void;
  placeholder?: string;
  inputType?: string;
  className?: string;
}) {
  if (editing) {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Input
          type={inputType}
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value ? (
        <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}
