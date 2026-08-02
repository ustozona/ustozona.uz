"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { TrashIcon, Plus, RotateCcw, TriangleAlert, CalendarCheck, History, LayoutTemplate, ChevronDown, CalendarOff, Check, Pencil, CalendarRange, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionIcon } from "@/components/ui/section-icon";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DateKeyRangePicker } from "@/components/ui/date-key-picker";
import {
  Dialog,
  DialogContent,
  DialogHeaderBar,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  validateCalendar,
  fmtDayMonthUz,
  diffDaysKeys,
  findAdjacentHoliday,
  inRange,
  isCalendarConfigured,
  makePeriodsForRange,
  type BlockedKind,
  type CalendarIssue,
  type DateRange,
  type PeriodPreset,
} from "@/lib/academic-calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { applyYearActivationSideEffects } from "@/lib/year-side-effects";
import { todayKey, addDaysKey } from "@/lib/date-keys";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { SettingsCard, SettingRow } from "./SettingsShared";
import YearStrip from "./YearStrip";
import CreateSemesterModal from "./CreateSemesterModal";
import RolloverWizard from "./RolloverWizard";

/* ════════════════════════════════════════════════════════════════════
   "OʻQUV YILI" SOZLAMALARI — kalendar boshqaruvi

   Yil chegaralari, 4 chorak va taʼtillar shu yerda tahrirlanadi
   (2025–2026 rasmiy sanalari default). Planner, davomat va baholar
   "Choraklik" davri shu kalendardan oʻqiydi. Validatsiya yumshoq —
   kesishish/diapazon buzilishi bloklamaydi, faqat ogohlantiradi.
   ════════════════════════════════════════════════════════════════════ */

/** Rasmiy bayramlar — "Tezkor qoʻshish" chiplari uchun sana kalitini hisoblaydi
    (oʻquv yili boshlanish yiliga nisbatan: iyundan oldingi oylar keyingi kalendar yiliga tushadi). */
function quickHolidays(
  startYear: number,
  names: { independence: string; navruz: string; memory: string }
): { name: string; dateKey: string }[] {
  const defs = [
    { name: names.independence, month: 9, day: 1 },
    { name: names.navruz, month: 3, day: 21 },
    { name: names.memory, month: 5, day: 9 },
  ];
  return defs.map((h) => {
    const year = h.month >= 6 ? startYear : startYear + 1;
    return { name: h.name, dateKey: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}` };
  });
}

/** Yil davri yorligʻi: "2-sentabr — 25-may" (boʻsh boʻlsa maʼlumot). */
function periodLabel(range: DateRange, unsetLabel: string): string {
  return range.start && range.end
    ? `${fmtDayMonthUz(range.start)} — ${fmtDayMonthUz(range.end)}`
    : unsetLabel;
}

/** Davrdan avtomatik yorliq: "2026–2027" (yagona yil boʻlsa — "2026"). */
function autoYearLabel(r: DateRange): string {
  if (!r.start || !r.end) return "";
  const y1 = r.start.slice(0, 4);
  const y2 = r.end.slice(0, 4);
  return y1 === y2 ? y1 : `${y1}–${y2}`;
}

/** Faol oʻquv yili nomi va davrini tahrirlash modali — Yil almashtirgichdagi
    qalam tugmasi ochadi (faqat FAOL yil uchun, chunki setYearRange/setYearLabel
    doim faol yozuvga yoziladi). */
function EditYearDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("AcademicYearSection");
  const calendar = useCalendarStore((s) => s.calendar);
  const setYearRange = useCalendarStore((s) => s.setYearRange);
  const setYearLabel = useCalendarStore((s) => s.setYearLabel);
  const [range, setRange] = React.useState<DateRange>(calendar.range);
  const [name, setName] = React.useState(calendar.yearLabel);

  React.useEffect(() => {
    if (open) {
      setRange(calendar.range);
      setName(calendar.yearLabel);
    }
  }, [open, calendar.range, calendar.yearLabel]);

  const valid = Boolean(range.start && range.end && range.end > range.start);

  const handleSave = () => {
    if (!valid) return;
    setYearRange(range);
    setYearLabel(name || autoYearLabel(range));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} width="26rem" className="gap-0 p-0">
        <DialogHeaderBar
          icon={<Pencil className="size-[18px]" />}
          title={t("editYearTitle")}
        />
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="edit-year-name" className="text-xs font-medium text-muted-foreground">
              {t("yearLabelTitle")}
            </Label>
            <Input
              id="edit-year-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("yearLabelPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{t("yearDurationTitle")}</Label>
            <DateKeyRangePicker range={range} onChange={setRange} className="w-full" />
            {!valid && <p className="text-xs text-destructive">{t("periodInvalid")}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!valid}>
            {t("saveButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Chorak/davr nomi va oralig'ini tahrirlash modali — kartadagi qalam
    tugmasi ochadi. Toʻgʻridan-toʻgʻri kartada tahrirlanmaydi, ataylab
    alohida modal orqali — tasodifiy sana bosilib ketishining oldini oladi. */
function EditPeriodDialog({
  open, onOpenChange, initialName, initialRange, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName: string;
  initialRange: DateRange;
  onSave: (name: string, range: DateRange) => void;
}) {
  const t = useTranslations("AcademicYearSection");
  const [name, setName] = React.useState(initialName);
  const [range, setRange] = React.useState<DateRange>(initialRange);

  React.useEffect(() => {
    if (open) {
      setName(initialName);
      setRange(initialRange);
    }
  }, [open, initialName, initialRange]);

  const valid = Boolean(range.start && range.end && range.end > range.start);

  const handleSave = () => {
    if (!valid) return;
    onSave(name, range);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} width="26rem" className="gap-0 p-0">
        <DialogHeaderBar icon={<Pencil className="size-[18px]" />} title={t("editPeriodTitle")} />
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="edit-period-name" className="text-xs font-medium text-muted-foreground">
              {t("periodNameLabel")}
            </Label>
            <Input
              id="edit-period-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("periodNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{t("periodRangeLabel")}</Label>
            <DateKeyRangePicker range={range} onChange={setRange} className="w-full" />
            {!valid && <p className="text-xs text-destructive">{t("periodInvalid")}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!valid}>
            {t("saveButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Yil almashtirgich — combobox: tugma joriy oʻquv yilini koʻrsatadi, ochilganda
    barcha yillar roʻyxati (belgi + davr), pastda "Yangi oʻquv yili" bandi.
    Faollashtirish davomat/planner oynasini oʻsha yilga koʻchiradi. */
function YearSwitcher({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("AcademicYearSection");
  const years = useCalendarStore((s) => s.years);
  const activateYear = useCalendarStore((s) => s.activateYear);
  const deleteYear = useCalendarStore((s) => s.deleteYear);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const active = years.find((y) => y.isActive) ?? years[0];

  const handleActivate = (id: string) => {
    const target = years.find((y) => y.id === id);
    if (!target) return;
    setOpen(false);
    if (target.isActive) return;
    activateYear(id);
    applyYearActivationSideEffects(target.calendar);
    toast.success(t("toastYearActivated", { year: target.calendar.yearLabel || t("defaultYearName") }));
  };

  const pending = years.find((y) => y.id === deleteId) ?? null;

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="min-w-[10.5rem] justify-between gap-2 font-normal">
            <span className="flex min-w-0 items-center gap-2">
              <CalendarCheck className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{active?.calendar.yearLabel || t("unnamedYear")}</span>
            </span>
            <ChevronDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1">
          {years.map((y) => (
            <div
              key={y.id}
              role="menuitem"
              tabIndex={-1}
              onClick={() => handleActivate(y.id)}
              className="group/item flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
            >
              <Check className={cn("size-3.5 shrink-0", y.isActive ? "opacity-100" : "opacity-0")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  {y.calendar.yearLabel || t("unnamedYear")}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {periodLabel(y.calendar.range, t("periodUnset"))}
                </span>
              </span>
              {y.isActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("editYearAria")}
                  className="shrink-0 text-muted-foreground opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
              ) : (
                <button
                  type="button"
                  aria-label={t("deleteYearAria")}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    setDeleteId(y.id);
                  }}
                >
                  <TrashIcon className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onCreate();
            }}
            className="gap-2 font-medium"
          >
            <Plus className="size-4" />
            {t("addYearButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteYearDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending
                ? t("deleteYearDialogDescription", { year: pending.calendar.yearLabel || t("unnamedYear") })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteYear(deleteId);
                setDeleteId(null);
              }}
            >
              {t("deleteButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditYearDialog open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

/** Bugungi sana faol yildan tashqarida boʻlsa banner — foydalanuvchi arxiv/kelgusi
    yilni koʻrayotganini eslatadi. Bugunni qamrovchi yil mavjud boʻlsa "joriy yilga
    qaytish" tugmasi oʻsha yilni faollashtiradi. */
function ArchiveYearBanner() {
  const t = useTranslations("AcademicYearSection");
  const years = useCalendarStore((s) => s.years);
  const calendar = useCalendarStore((s) => s.calendar);
  const activateYear = useCalendarStore((s) => s.activateYear);
  const today = todayKey();

  if (!isCalendarConfigured(calendar)) return null;
  if (inRange(today, calendar.range)) return null; // faol yil bugunni qamraydi — banner shart emas

  const todayYear = years.find((y) => !y.isActive && inRange(today, y.calendar.range));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
      <History className="size-4 shrink-0 text-warning" />
      <p className="min-w-0 flex-1 text-sm text-warning">
        {t("archiveBannerText", {
          year: calendar.yearLabel || t("defaultOtherYear"),
          date: fmtDayMonthUz(today),
        })}
      </p>
      {todayYear && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            activateYear(todayYear.id);
            applyYearActivationSideEffects(todayYear.calendar);
            toast.success(t("toastYearActivated", { year: todayYear.calendar.yearLabel || t("currentYearFallback") }));
          }}
        >
          {t("backToCurrentYear")}
        </Button>
      )}
    </div>
  );
}

export default function AcademicYearSection() {
  const t = useTranslations("AcademicYearSection");
  const calendar = useCalendarStore((s) => s.calendar);
  const hydrated = useCalendarStore((s) => s._hasHydrated);
  const setQuarterRange = useCalendarStore((s) => s.setQuarterRange);
  const addHoliday = useCalendarStore((s) => s.addHoliday);
  const updateHoliday = useCalendarStore((s) => s.updateHoliday);
  const removeHoliday = useCalendarStore((s) => s.removeHoliday);
  const setQuarterName = useCalendarStore((s) => s.setQuarterName);
  const setQuarters = useCalendarStore((s) => s.setQuarters);
  const addQuarter = useCalendarStore((s) => s.addQuarter);
  const removeQuarter = useCalendarStore((s) => s.removeQuarter);
  const resetToOfficialTemplate = useCalendarStore((s) => s.resetToOfficialTemplate);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editQuarterId, setEditQuarterId] = React.useState<string | null>(null);
  const [rolloverOpen, setRolloverOpen] = React.useState(false);
  const activeClasses = useLiveClasses();
  const [highlighted, setHighlighted] = React.useState<string | null>(null);
  const rowRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  // Lentada segment bosilganda tegishli qatorga scroll qilib, qisqa vaqt yoritadi.
  const scrollToRow = (kind: "quarter" | "holiday", id: string) => {
    const key = `${kind}-${id}`;
    const el = rowRefs.current.get(key);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlighted(key);
    setTimeout(() => setHighlighted((cur) => (cur === key ? null : cur)), 1600);
  };

  // Chorak chegarasi surilganda, unga bevosita tutashgan taʼtilni ham surish taklif qilinadi
  // (avtomatik emas — oʻqituvchi toast ichidagi tugma bilan tasdiqlaydi).
  const handleQuarterRange = (qId: string, newRange: DateRange) => {
    const quarter = calendar.quarters.find((q) => q.id === qId);
    setQuarterRange(qId, newRange);
    if (!quarter) return;

    if (newRange.start !== quarter.range.start) {
      const holiday = findAdjacentHoliday(calendar, quarter.range, "start");
      if (holiday) {
        const delta = diffDaysKeys(quarter.range.start, newRange.start);
        const nextEnd = addDaysKey(holiday.range.end, delta);
        toast(t("toastShiftHolidayTitle", { holiday: holiday.name }), {
          description: t("toastNewEndDate", { date: fmtDayMonthUz(nextEnd) }),
          action: {
            label: t("toastShiftAction"),
            onClick: () => updateHoliday(holiday.id, { range: { ...holiday.range, end: nextEnd } }),
          },
        });
      }
    }
    if (newRange.end !== quarter.range.end) {
      const holiday = findAdjacentHoliday(calendar, quarter.range, "end");
      if (holiday) {
        const delta = diffDaysKeys(quarter.range.end, newRange.end);
        const nextStart = addDaysKey(holiday.range.start, delta);
        toast(t("toastShiftHolidayTitle", { holiday: holiday.name }), {
          description: t("toastNewStartDate", { date: fmtDayMonthUz(nextStart) }),
          action: {
            label: t("toastShiftAction"),
            onClick: () => updateHoliday(holiday.id, { range: { ...holiday.range, start: nextStart } }),
          },
        });
      }
    }
  };

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />;
  }

  const issues = validateCalendar(calendar);
  const issuesFor = (target: CalendarIssue["target"]): string[] =>
    issues
      .filter((i) => {
        if (i.target.kind !== target.kind) return false;
        if (i.target.kind === "quarter" && target.kind === "quarter") return i.target.id === target.id;
        if (i.target.kind === "holiday" && target.kind === "holiday") return i.target.id === target.id;
        return true;
      })
      .map((i) => i.message);

  const startYear = calendar.range.start
    ? Number(calendar.range.start.slice(0, 4)) - (Number(calendar.range.start.slice(5, 7)) >= 6 ? 0 : 1)
    : new Date().getFullYear();
  const existingHolidayNames = new Set(calendar.holidays.map((h) => h.name));
  const suggestions = quickHolidays(startYear, {
    independence: t("holidayIndependence"),
    navruz: t("holidayNavruz"),
    memory: t("holidayMemory"),
  }).filter((h) => !existingHolidayNames.has(h.name));

  // Joriy davrlar soniga qarab qaysi shablon amalda ekanini taxmin qiladi
  // (oʻqituvchi chegaralarni qoʻlda tuzatgan boʻlsa ham son mos kelsa yetarli).
  const currentPreset: PeriodPreset =
    calendar.quarters.length === 0
      ? "none"
      : calendar.quarters.length === 2
        ? "semesters"
        : calendar.quarters.length === 3
          ? "trimesters"
          : "quarters";

  // Shablon qoʻllash — mavjud davrlar almashtiriladi (nomlar/sanalar qayta
  // hosil boʻladi), keyin oʻqituvchi har chegarani qoʻlda aniqlashtiradi.
  const applyPreset = (preset: PeriodPreset) => {
    setQuarters(makePeriodsForRange(calendar.range, preset));
    toast.success(preset === "none" ? t("toastPeriodsCleared") : t("toastPresetApplied"));
  };

  // Yangi davr — oxirgi davrdan keyingi kundan yil oxirigacha (davr boʻlmasa
  // butun yil); oʻqituvchi sanalarni darhol tuzatishi mumkin.
  const handleAddPeriod = () => {
    const last = calendar.quarters[calendar.quarters.length - 1];
    const start = last ? addDaysKey(last.range.end, 1) : calendar.range.start;
    const end = calendar.range.end;
    addQuarter(t("newPeriodName", { n: calendar.quarters.length + 1 }), {
      start: start && start <= end ? start : end,
      end,
    });
  };

  return (
    <>
      <ArchiveYearBanner />

      <SettingsCard
        title={
          <>
            {t("yearSectionTitleShort")}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{t("yearSectionDescription")}</TooltipContent>
            </Tooltip>
          </>
        }
        action={<YearSwitcher onCreate={() => setCreateOpen(true)} />}
      >
        <YearStrip calendar={calendar} onSegmentClick={({ kind, id }) => scrollToRow(kind, id)} />

        {issuesFor({ kind: "year" }).length > 0 && (
          <div className="space-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5">
            {issuesFor({ kind: "year" }).map((w, i) => (
              <p key={i} className="flex items-start gap-1.5 text-xs text-warning">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title={
          <>
            {t("quartersTitle")}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{t("quartersDescription")}</TooltipContent>
            </Tooltip>
          </>
        }
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LayoutTemplate className="size-4" />
                {t(`preset_${currentPreset}`)}
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["quarters", "semesters", "trimesters", "none"] as PeriodPreset[]).map((p) => (
                <DropdownMenuItem key={p} onClick={() => applyPreset(p)} className="gap-2">
                  <Check className={cn("size-3.5 shrink-0", p === currentPreset ? "opacity-100" : "opacity-0")} />
                  {t(`preset_${p}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {calendar.quarters.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            {t("noPeriods")}
          </p>
        )}
        {calendar.quarters.map((q) => {
          const qIssues = issuesFor({ kind: "quarter", id: q.id });
          const key = `quarter-${q.id}`;
          return (
            <div
              key={q.id}
              ref={(el) => {
                if (el) rowRefs.current.set(key, el);
                else rowRefs.current.delete(key);
              }}
              className={cn(
                "space-y-1.5 rounded-lg transition-shadow",
                highlighted === key && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                <SectionIcon size="default" className="rounded-full">
                  <CalendarRange />
                </SectionIcon>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{q.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {periodLabel(q.range, t("periodUnset"))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("editPeriodAria")}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditQuarterId(q.id)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("deletePeriodAria")}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeQuarter(q.id)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </div>
              {qIssues.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 pl-1 text-xs text-warning">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          );
        })}
        <div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddPeriod}>
            <Plus className="size-4" />
            {t("addPeriodButton")}
          </Button>
        </div>
      </SettingsCard>

      <EditPeriodDialog
        open={editQuarterId !== null}
        onOpenChange={(o) => !o && setEditQuarterId(null)}
        initialName={calendar.quarters.find((q) => q.id === editQuarterId)?.name ?? ""}
        initialRange={calendar.quarters.find((q) => q.id === editQuarterId)?.range ?? { start: "", end: "" }}
        onSave={(name, range) => {
          if (!editQuarterId) return;
          setQuarterName(editQuarterId, name);
          handleQuarterRange(editQuarterId, range);
        }}
      />

      <div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-4" />
          {t("resetButton")}
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("resetDialogDescription", { year: calendar.yearLabel || t("resetCurrentYearFallback") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetToOfficialTemplate(); setResetOpen(false); }}>
              {t("resetConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateSemesterModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          // Sinf boʻlsa — rollover sehrgarini ochamiz (nomlarni koʻchirish/arxivlash).
          if (activeClasses.length > 0) setRolloverOpen(true);
        }}
      />
      <RolloverWizard open={rolloverOpen} onOpenChange={setRolloverOpen} />
    </>
  );
}
