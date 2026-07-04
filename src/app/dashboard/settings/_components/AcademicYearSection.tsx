"use client";

import * as React from "react";
import { TrashIcon, Plus, RotateCcw, TriangleAlert, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { inRange, type DateRange } from "@/lib/academic-calendar";
import { todayKey } from "@/lib/date-keys";
import { SettingsGroup, SettingRow, SavedIndicator } from "./SettingsShared";
import YearStrip from "./YearStrip";
import CreateSemesterModal from "./CreateSemesterModal";

/* ════════════════════════════════════════════════════════════════════
   "OʻQUV YILI" SOZLAMALARI — kalendar boshqaruvi

   Yil chegaralari, 4 chorak va taʼtillar shu yerda tahrirlanadi
   (2025–2026 rasmiy sanalari default). Planner, davomat va baholar
   "Choraklik" davri shu kalendardan oʻqiydi. Validatsiya yumshoq —
   kesishish/diapazon buzilishi bloklamaydi, faqat ogohlantiradi.
   ════════════════════════════════════════════════════════════════════ */

/** Ikki sana inputi — SettingRow oʻng sloti uchun. */
function RangeInputs({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="date"
        value={range.start}
        onChange={(e) => e.target.value && onChange({ ...range, start: e.target.value })}
        className="w-[8.7rem]"
      />
      <span className="text-muted-foreground">—</span>
      <Input
        type="date"
        value={range.end}
        onChange={(e) => e.target.value && onChange({ ...range, end: e.target.value })}
        className="w-[8.7rem]"
      />
    </div>
  );
}

function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start <= b.end && b.start <= a.end;
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
  const resetDefaults = useCalendarStore((s) => s.resetDefaults);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />;
  }

  // Yumshoq validatsiya — bloklamaydi, ogohlantiradi
  const warnings: string[] = [];
  for (const q of calendar.quarters) {
    if (!inRange(q.range.start, calendar.range) || !inRange(q.range.end, calendar.range))
      warnings.push(`${q.name} oʻquv yili chegarasidan chiqib ketgan.`);
    if (q.range.end < q.range.start) warnings.push(`${q.name} tugashi boshlanishidan oldin.`);
  }
  for (let i = 0; i < calendar.quarters.length; i++)
    for (let j = i + 1; j < calendar.quarters.length; j++)
      if (rangesOverlap(calendar.quarters[i].range, calendar.quarters[j].range))
        warnings.push(
          `${calendar.quarters[i].name} va ${calendar.quarters[j].name} kesishyapti.`
        );
  for (const h of calendar.holidays)
    if (h.range.end < h.range.start) warnings.push(`«${h.name}» tugashi boshlanishidan oldin.`);

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
        description="Choraklar va taʼtillar butun ilova (jadval, davomat, baholar) uchun yagona manba."
        action={
          <div className="flex items-center gap-2">
            <SavedIndicator signal={calendar} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <CalendarPlus className="size-4" />
              Yangi oʻquv yili
            </Button>
          </div>
        }
      >
        <YearStrip calendar={calendar} />
        {warnings.length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5">
            {warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
        <SettingRow title="Yil davri" description="Oʻquv yilining boshlanishi va tugashi.">
          <RangeInputs range={calendar.range} onChange={handleYearRange} />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Choraklar" description="Baholardagi «Choraklik» davri shu sanalardan olinadi.">
        {calendar.quarters.map((q) => (
          <SettingRow key={q.id} title={q.name}>
            <RangeInputs range={q.range} onChange={(r) => setQuarterRange(q.id, r)} />
          </SettingRow>
        ))}
      </SettingsGroup>

      <SettingsGroup
        title="Taʼtillar"
        description="Taʼtil kunlarida dars boʻlmaydi — planner va davomatda avtomatik hisobga olinadi."
      >
        {calendar.holidays.map((h) => (
          <div
            key={h.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3"
          >
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
        ))}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => addHoliday("Yangi taʼtil", { start: todayKey(), end: todayKey() })}
        >
          <Plus className="size-4" />
          Taʼtil qoʻshish
        </Button>
      </SettingsGroup>

      <div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-4" />
          Standart qiymatlarga qaytarish
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kalendarni tiklash?</AlertDialogTitle>
            <AlertDialogDescription>
              Yil chegaralari, choraklar va taʼtillar 2025–2026 rasmiy qiymatlariga qaytariladi.
              Kiritgan oʻzgarishlaringiz yoʻqoladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetDefaults(); setResetOpen(false); }}>
              Tiklash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateSemesterModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
