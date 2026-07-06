"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStudentProfile } from "@/lib/student-profile";
import { useGradesStore } from "@/store/useGradesStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { ClassSwatch } from "@/components/ClassSwatch";
import RelativesSection from "./RelativesSection";
import OverviewTab from "./OverviewTab";
import AssignmentsTab from "./AssignmentsTab";
import NotesTab, { type Note, type Sentiment } from "./NotesTab";
import CreateStudentModal, { type NewStudentInput } from "../../_components/CreateStudentModal";
import { toast } from "sonner";
import {
  ChevronsUpDown, ChevronLeft, ChevronRight, ArrowLeft, Check, AlertTriangle,
  Phone, MessageCircle, Pen, BarChart3, ClipboardList,
  StickyNote, Cake, Mars, Venus,
} from "lucide-react";

type TabId = "overview" | "assignments" | "notes";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

// Deterministik boshlangʻich qayd (demo uchun, soatga bogʻliq emas)
function seedNotes(grade: number, riskLevel: string, name: string): Note[] {
  const first = name.split(" ")[0];
  if (riskLevel !== "ok")
    return [{ id: "seed", text: `${first} bilan qoʻshimcha ishlash kerak.`, sentiment: "concern", time: "2 kun oldin" }];
  if (grade >= 85)
    return [{ id: "seed", text: `${first} darslarda faol va tirishqoq.`, sentiment: "positive", time: "3 kun oldin" }];
  return [];
}

const TAB_IDS: TabId[] = ["overview", "assignments", "notes"];
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
  const router = useRouter();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const hydrated = useGradesStore((s) => s._hasHydrated);
  const profile = useMemo(
    () => getStudentProfile(classDataMap, studentId),
    [classDataMap, studentId]
  );

  // Active tab URL'da (`?tab=`) saqlanadi — oʻquvchilar orasida oʻtganda saqlanib qoladi
  const [tab, setTabState] = useState<TabId>(() => normalizeTab(initialTab));
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [addedNotes, setAddedNotes] = useState<Record<string, Note[]>>({});
  // Profil tahriri (sessiya ichida) — boshqa oʻquvchiga oʻtganda tozalanadi
  const [editOpen, setEditOpen] = useState(false);
  const [override, setOverride] = useState<Partial<NewStudentInput>>({});
  useEffect(() => setOverride({}), [studentId]);

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

  const notes = useMemo<Note[]>(() => {
    if (!profile) return [];
    return [...(addedNotes[studentId] ?? []), ...seedNotes(profile.overallGrade, profile.risk.level, profile.name)];
  }, [addedNotes, studentId, profile]);

  const addNote = useCallback(
    (text: string, sentiment: Sentiment) => {
      setAddedNotes((prev) => ({
        ...prev,
        [studentId]: [{ id: `n-${Date.now()}`, text, sentiment, time: "Hozir" }, ...(prev[studentId] ?? [])],
      }));
    },
    [studentId]
  );

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
          <EmptyTitle>Oʻquvchi topilmadi</EmptyTitle>
          <EmptyDescription>Bu oʻquvchi mavjud emas yoki oʻchirilgan.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => router.push("/dashboard/students")} variant="outline" className="shadow-none">
            <ArrowLeft className="size-4" /> Oʻquvchilarga qaytish
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const { location, name, initials, studentCode } = profile;
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
  const genderLabel = info.gender ? (info.gender === "male" ? "Oʻgʻil" : "Qiz") : undefined;
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
        if (days === 0) return "Bugun! 🎉";
        if (days === 1) return "Ertaga";
        if (days < 30) return `${days} kun qoldi`;
        const months = Math.round(days / 30);
        return `~${months} oy qoldi`;
      })()
    : undefined;

  // Tahrirlash uchun joriy qiymatlar (ism/familiya ajratilgan)
  const [firstName, ...rest] = name.split(" ");
  const handleSaveEdit = (data: NewStudentInput) => {
    setOverride({
      gender: data.gender,
      birthDate: data.birthDate,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      studentPhone: data.studentPhone,
    });
    toast.success("Maʼlumot saqlandi");
  };

  const TABS: { id: TabId; label: string; sub: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "overview", label: "Umumiy", sub: "Baho, davomat va koʻrsatkichlar", icon: BarChart3 },
    { id: "assignments", label: "Topshiriqlar", sub: "Ishlar va natijalar", icon: ClipboardList, count: profile.assignments.length },
    { id: "notes", label: "Qaydlar", sub: "Kuzatuvlar va eslatmalar", icon: StickyNote, count: notes.length },
  ];

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden py-4 pl-4 md:py-6 md:pl-6">
      {/* ── Chap panel — bitta karta, ichida boʻlimlar ── */}
      <aside className="hidden w-[360px] shrink-0 flex-col overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm lg:flex">
        {/* Oʻquvchi + switcher (sarlavha boʻlimi) */}
        <div className="shrink-0 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ backgroundColor: hex }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
                <PopoverTrigger asChild>
                  <button className="group flex w-full items-center gap-1.5 text-left">
                    <span className="truncate text-lg font-bold tracking-tight">{name}</span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0">
                  <Command>
                    <CommandInput placeholder="Oʻquvchi qidirish…" />
                    <CommandList>
                      <CommandEmpty>Topilmadi</CommandEmpty>
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
              <TypographyMuted className="mt-0.5">{location.classInfo.name} · {studentCode}</TypographyMuted>
            </div>
          </div>

          {/* Risk statusi — doimiy, glanceable (banner oʻrniga) */}
          {profile.risk.level !== "ok" && (
            <div className="mt-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  profile.risk.level === "risk"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                )}
              >
                <AlertTriangle className="size-3.5" />
                {profile.risk.level === "risk" ? "Diqqat talab qiladi" : "Kuzatuvda"}
              </span>
              {profile.risk.reasons.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {profile.risk.reasons.map((r) => r.text).join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Boʻlimlar — bitta karta ichida, chiziq bilan ajratilgan (scroll) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Shaxsiy maʼlumotlar */}
          <div className="border-b border-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <TypographyLabel>Shaxsiy maʼlumotlar</TypographyLabel>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="h-7 gap-1.5 px-2 text-muted-foreground">
                <Pen className="size-3.5" /> Tahrirlash
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {/* Jins — modaldagidek rangli pill (oʻgʻil=koʻk, qiz=pushti) */}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Jins</p>
                {info.gender ? (
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
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="mt-1 block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    + Qoʻshish
                  </button>
                )}
              </div>
              {/* Yosh — tugʻilgan kunigacha qolgan vaqt tooltipda */}
              {age != null ? (
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Yosh</p>
                  {birthdayCountdown ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium decoration-muted-foreground/40 decoration-dotted underline-offset-4 hover:underline">
                          {age} yosh
                          <Cake className="size-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Tugʻilgan kunigacha {birthdayCountdown}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="mt-1 truncate text-sm font-medium">{age} yosh</p>
                  )}
                </div>
              ) : (
                <Field label="Yosh" value={undefined} onAdd={() => setEditOpen(true)} />
              )}
              <Field label="Tugʻilgan sana" value={birthDateText} onAdd={() => setEditOpen(true)} />
              {/* Sinf — modaldagidek rangli nuqtali badge */}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Sinf</p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <ClassSwatch hex={hex} className="size-2" />
                  {location.classInfo.name}
                </span>
              </div>
            </div>
          </div>

          {/* Qarindoshlar — bogʻlangan aka/uka/opa/singil, bosilganda profilga oʻtadi */}
          <RelativesSection studentId={studentId} onNavigate={go} />

          {/* Aloqa */}
          <div className="p-5">
            <TypographyLabel className="mb-4 block">Aloqa</TypographyLabel>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field className="col-span-2" label="Ota-ona" value={info.parentName} onAdd={() => setEditOpen(true)} />
              <Field label="Ota-ona telefoni" value={info.parentPhone} onAdd={() => setEditOpen(true)} />
              <Field label="Oʻquvchi telefoni" value={info.studentPhone} onAdd={() => setEditOpen(true)} />
            </div>
          </div>
        </div>

        {/* Footer boʻlimi — telefon va chat tugmalari */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border p-4">
          <Button asChild variant="outline" size="icon" disabled={!info.parentPhone} className="size-9 shadow-none" aria-label="Ota-onaga qoʻngʻiroq">
            <a href={info.parentPhone ? `tel:${info.parentPhone.replace(/\s/g, "")}` : undefined}>
              <Phone className="size-4" />
            </a>
          </Button>
          <Button className="h-9 flex-1 font-semibold"><MessageCircle className="size-4" /> Chat</Button>
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
              {/* Orqaga — roʻyxat sahifasiga (kompakt, tooltipli) */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/dashboard/students")}
                      className="-ml-1 shrink-0 gap-1.5 text-muted-foreground"
                    >
                      <ArrowLeft className="size-4" />
                      Oʻquvchilar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Oʻquvchilar roʻyxatiga qaytish</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Boʻlim tablari (markaz) */}
              <TabsList variant="line" className="mx-auto">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="gap-1.5 px-3"
                    >
                      <Icon />
                      {t.label}
                      {t.count !== undefined && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                          {t.count}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

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
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="pb-6 pr-4 md:pr-6">
                <TabsContent value="overview"><OverviewTab profile={profile} /></TabsContent>
                <TabsContent value="notes"><NotesTab notes={notes} onAdd={addNote} /></TabsContent>
              </div>
            </ScrollArea>
          )}
        </Tabs>
      </div>

      {/* Tahrirlash — yaratish modali edit rejimida (sessiya ichida saqlanadi) */}
      <CreateStudentModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        defaultClassId={location.classId}
        initial={{
          firstName,
          lastName: rest.join(" "),
          classId: location.classId,
          gender: info.gender,
          birthDate: info.birthDate,
          parentName: info.parentName,
          parentPhone: info.parentPhone,
          studentPhone: info.studentPhone,
          avatarColor: hex,
        }}
        onCreate={handleSaveEdit}
      />
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
              aria-label="Oldingi oʻquvchi"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Oldingi oʻquvchi</TooltipContent>
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
              aria-label="Keyingi oʻquvchi"
            >
              <ChevronRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyingi oʻquvchi</TooltipContent>
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
          + Qoʻshish
        </button>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}
