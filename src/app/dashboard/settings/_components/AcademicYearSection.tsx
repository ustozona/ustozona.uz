"use client";

import * as React from "react";
import { TrashIcon, Plus, RotateCcw, TriangleAlert, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
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
  schoolDaysInRange,
  daysInRange,
  fmtDayMonthUz,
  diffDaysKeys,
  findAdjacentHoliday,
  type CalendarIssue,
  type DateRange,
} from "@/lib/academic-calendar";
import { todayKey, addDaysKey } from "@/lib/date-keys";
import { SettingsGroup, SettingRow, SaveSignalPing } from "./SettingsShared";
import YearStrip from "./YearStrip";
import CreateSemesterModal from "./CreateSemesterModal";

/* ════════════════════════════════════════════════════════════════════
   "OʻQUV YILI" SOZLAMALARI — kalendar boshqaruvi

   Yil chegaralari, 4 chorak va taʼtillar shu yerda tahrirlanadi
   (2025–2026 rasmiy sanalari default). Planner, davomat va baholar
   "Choraklik" davri shu kalendardan oʻqiydi. Validatsiya yumshoq —
   kesishish/diapazon buzilishi bloklamaydi, faqat ogohlantiradi.
   ════════════════════════════════════════════════════════════════════ */

/** Ikki sana tanlagich (shadcn) — SettingRow oʻng sloti uchun. */
function RangeInputs({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <DateKeyPicker
        value={range.start}
        onChange={(v) => onChange({ ...range, start: v })}
        ariaLabel="Boshlanish sanasi"
        className="w-[9.5rem]"
      />
      <span className="text-muted-foreground">—</span>
      <DateKeyPicker
        value={range.end}
        onChange={(v) => onChange({ ...range, end: v })}
        ariaLabel="Tugash sanasi"
        className="w-[9.5rem]"
      />
    </div>
  );
}

/** Rasmiy bayramlar — "Tezkor qoʻshish" chiplari uchun sana kalitini hisoblaydi
    (oʻquv yili boshlanish yiliga nisbatan: iyundan oldingi oylar keyingi kalendar yiliga tushadi). */
function quickHolidays(startYear: number): { name: string; dateKey: string }[] {
  const defs = [
    { name: "Mustaqillik kuni", month: 9, day: 1 },
    { name: "Navroʻz bayrami", month: 3, day: 21 },
    { name: "Xotira va qadrlash kuni", month: 5, day: 9 },
  ];
  return defs.map((h) => {
    const year = h.month >= 6 ? startYear : startYear + 1;
    return { name: h.name, dateKey: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}` };
  });
}

export default function AcademicYearSection() {
  const calendar = useCalendarStore((s) => s.calendar);
  const hydrated = useCalendarStore((s) => s._hasHydrated);
  const setYearRange = useCalendarStore((s) => s.setYearRange);
  const setYearLabel = useCalendarStore((s) => s.setYearLabel);
  const setQuarterRange = useCalendarStore((s) => s.setQuarterRange);
  const addHoliday = useCalendarStore((s) => s.addHoliday);
  const updateHoliday = useCalendarStore((s) => s.updateHoliday);
  const removeHoliday = useCalendarStore((s) => s.removeHoliday);
  const resetToOfficialTemplate = useCalendarStore((s) => s.resetToOfficialTemplate);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
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
        toast(`«${holiday.name}» taʼtilini ham suraymi?`, {
          description: `Yangi tugash sanasi: ${fmtDayMonthUz(nextEnd)}`,
          action: {
            label: "Ha, suray",
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
        toast(`«${holiday.name}» taʼtilini ham suraymi?`, {
          description: `Yangi boshlanish sanasi: ${fmtDayMonthUz(nextStart)}`,
          action: {
            label: "Ha, suray",
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

  const totalSchoolDays = schoolDaysInRange(calendar, calendar.range);
  const elapsedSchoolDays = schoolDaysInRange(calendar, {
    start: calendar.range.start,
    end: todayKey() < calendar.range.start ? calendar.range.start : todayKey() > calendar.range.end ? calendar.range.end : todayKey(),
  });
  const progressPct = totalSchoolDays > 0 ? Math.round((elapsedSchoolDays / totalSchoolDays) * 100) : 0;
  const totalHolidayDays = calendar.holidays.reduce((sum, h) => sum + daysInRange(h.range), 0);

  const startYear = calendar.range.start
    ? Number(calendar.range.start.slice(0, 4)) - (Number(calendar.range.start.slice(5, 7)) >= 6 ? 0 : 1)
    : new Date().getFullYear();
  const existingHolidayNames = new Set(calendar.holidays.map((h) => h.name));
  const suggestions = quickHolidays(startYear).filter((h) => !existingHolidayNames.has(h.name));

  const handleYearRange = (r: DateRange) => {
    setYearRange(r);
    // Yorliq yil chegaralaridan avtomatik: "2025–2026"
    const y1 = r.start.slice(0, 4);
    const y2 = r.end.slice(0, 4);
    setYearLabel(y1 === y2 ? y1 : `${y1}–${y2}`);
  };

  return (
    <>
      <SettingsGroup
        title={`Oʻquv yili · ${calendar.yearLabel}`}
        description="Chorak va taʼtil kunlari tizimdagi barcha jarayonlar (dars jadvali, davomat, jurnal) uchun asos hisoblanadi."
        action={
          <div className="flex items-center gap-2">
            <SaveSignalPing signal={calendar} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <CalendarPlus className="size-4" />
              Oʻquv yilini qoʻshish
            </Button>
          </div>
        }
      >
        <YearStrip calendar={calendar} onSegmentClick={({ kind, id }) => scrollToRow(kind, id)} />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Dars kunlari</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">≈ {totalSchoolDays}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Yil yakunlanishi</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{progressPct}%</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Choraklar</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{calendar.quarters.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Taʼtil kunlari</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{totalHolidayDays}</p>
          </div>
        </div>

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
        <SettingRow title="Oʻquv yili davomiyligi" description="Oʻquv yilining boshlanish va tugash sanalari.">
          <RangeInputs range={calendar.range} onChange={handleYearRange} />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup
        title="Choraklar"
        description="Choraklik baholar ushbu belgilangan muddatlar asosida hisoblanadi."
      >
        {calendar.quarters.map((q) => {
          const qIssues = issuesFor({ kind: "quarter", id: q.id });
          const days = daysInRange(q.range);
          const schoolDays = schoolDaysInRange(calendar, q.range);
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
              <SettingRow
                title={q.name}
                description={days > 0 ? `${Math.round(days / 7)} hafta · ${schoolDays} dars kuni` : undefined}
              >
                <RangeInputs range={q.range} onChange={(r) => handleQuarterRange(q.id, r)} />
              </SettingRow>
              {qIssues.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 pl-1 text-xs text-warning">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          );
        })}
      </SettingsGroup>

      <SettingsGroup
        title="Taʼtillar"
        description="Taʼtil kunlarida darslar rejalashtirilmaydi hamda davomat va rejalashtiruvchida avtomatik hisobga olinadi."
      >
        {calendar.holidays.map((h) => {
          const hIssues = issuesFor({ kind: "holiday", id: h.id });
          const key = `holiday-${h.id}`;
          return (
            <div
              key={h.id}
              ref={(el) => {
                if (el) rowRefs.current.set(key, el);
                else rowRefs.current.delete(key);
              }}
              className={cn(
                "space-y-1.5 rounded-lg transition-shadow",
                highlighted === key && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Input
                  value={h.name}
                  onChange={(e) => updateHoliday(h.id, { name: e.target.value })}
                  className="w-40 min-w-0 flex-1"
                  placeholder="Taʼtil nomi"
                />
                <RangeInputs range={h.range} onChange={(r) => updateHoliday(h.id, { range: r })} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Taʼtilni oʻchirish"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeHoliday(h.id)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
              {hIssues.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 pl-1 text-xs text-warning">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          );
        })}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => addHoliday("Yangi taʼtil", { start: todayKey(), end: todayKey() })}
          >
            <Plus className="size-4" />
            Yangi taʼtil qoʻshish
          </Button>
          {suggestions.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">Tezkor qoʻshish:</span>
              {suggestions.map((s) => (
                <Button
                  key={s.name}
                  variant="ghost"
                  size="sm"
                  className="gap-1 rounded-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => addHoliday(s.name, { start: s.dateKey, end: s.dateKey })}
                >
                  <Plus className="size-3" />
                  {s.name} ({fmtDayMonthUz(s.dateKey)})
                </Button>
              ))}
            </>
          )}
        </div>
      </SettingsGroup>

      <div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-4" />
          Dastlabki holatga qaytarish
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kalendarni tiklash?</AlertDialogTitle>
            <AlertDialogDescription>
              Yil chegaralari, choraklar va taʼtillar {calendar.yearLabel || "joriy yil"} rasmiy
              holatiga qaytariladi. Kiritgan oʻzgarishlaringiz yoʻqoladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetToOfficialTemplate(); setResetOpen(false); }}>
              Tiklash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateSemesterModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
