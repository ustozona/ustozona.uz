"use client";

import * as React from "react";
import { CalendarPlus, Sparkles, CopyPlus, CalendarRange, CalendarOff, TriangleAlert } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeaderBar, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { cn } from "@/lib/utils";
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  makeCalendarForRange, shiftCalendarYears, isCalendarConfigured,
  type AcademicYearCalendar, type DateRange,
} from "@/lib/academic-calendar";
import { applyYearActivationSideEffects } from "@/lib/year-side-effects";
import YearStrip from "./YearStrip";

/* ════════════════════════════════════════════════════════════════════
   YANGI OʻQUV YILI — ikki panelli modal

   Chapda forma (rejim + yil davri), oʻngda jonli sharh (YearStrip +
   xulosa). Ikki rejim:
     · "Boshidan boshlash" — rasmiy shablon (makeCalendarForRange).
     · "Oldingidan nusxa"  — joriy kalendarning choraklari va taʼtillari
        yangi yilga suriladi (shiftCalendarYears), oʻqituvchi moslamalari
        saqlanadi. Joriy kalendar sozlanmagan boʻlsa oʻchirilgan.

   Yaratish yangi oʻquv yilini roʻyxatga QOʻSHADI va FAOL qiladi (eskisini
   almashtirmaydi) — CalendarServerSync serverga sinxronlaydi.
   ════════════════════════════════════════════════════════════════════ */

type Mode = "fresh" | "copy";

/** Boshlanish sanasidan oʻquv-yili boshlanish yilini aniqlaydi (iyundan keyin — shu yil). */
function startYearOf(startKey: string): number {
  const [y, m] = startKey.split("-").map(Number);
  return m >= 6 ? y : y - 1;
}

export default function CreateSemesterModal({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const current = useCalendarStore((s) => s.calendar);
  const years = useCalendarStore((s) => s.years);
  const addYear = useCalendarStore((s) => s.addYear);
  const canCopy = isCalendarConfigured(current);

  // Standart: joriy yildan keyingi oʻquv yili (sozlangan boʻlsa), aks holda bugungi asosda.
  const defaultRange = React.useMemo<DateRange>(() => {
    if (canCopy) {
      const next = shiftCalendarYears(current, 1);
      return next.range;
    }
    const y = new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const fresh = makeCalendarForRange(`${y + 1}-09-02`, `${y + 2}-05-25`);
    return fresh.range;
  }, [canCopy, current]);

  const [mode, setMode] = React.useState<Mode>(canCopy ? "copy" : "fresh");
  const [range, setRange] = React.useState<DateRange>(defaultRange);

  // Modal har ochilganda standart holatga qaytadi.
  React.useEffect(() => {
    if (open) {
      setMode(canCopy ? "copy" : "fresh");
      setRange(defaultRange);
    }
  }, [open, canCopy, defaultRange]);

  // Sharh kalendari — rejim + davrga qarab hisoblanadi.
  const preview = React.useMemo<AcademicYearCalendar>(() => {
    if (mode === "copy" && canCopy) {
      const delta = startYearOf(range.start) - startYearOf(current.range.start);
      const shifted = shiftCalendarYears(current, delta);
      // Yil chegaralari foydalanuvchi tanlagan aniq sanalardan.
      const y1 = range.start.slice(0, 4);
      const y2 = range.end.slice(0, 4);
      return { ...shifted, range, yearLabel: y1 === y2 ? y1 : `${y1}–${y2}` };
    }
    return makeCalendarForRange(range.start, range.end);
  }, [mode, canCopy, range, current]);

  const valid = Boolean(range.start && range.end && range.end > range.start);

  // Mavjud yillar bilan davr kesishuvi — bloklamaydi, faqat ogohlantiradi
  // (bir sana ikki yilga tegishli boʻlishi mumkin, lekin odatda xato).
  const overlaps = React.useMemo(
    () =>
      valid
        ? years.filter(
            (y) =>
              y.calendar.range.start &&
              y.calendar.range.end &&
              y.calendar.range.start <= range.end &&
              range.start <= y.calendar.range.end
          )
        : [],
    [years, range, valid]
  );

  const handleCreate = () => {
    if (!valid) return;
    // Almashtirmaydi — roʻyxatga qoʻshadi va faollashtiradi.
    addYear(preview);
    // Jadval yil boshini qoplasin + bugun yangi yil ichida boʻlsa xulq langari surilsin.
    applyYearActivationSideEffects(preview);
    onOpenChange(false);
  };

  const modes: { id: Mode; icon: React.ReactNode; title: string; desc: string; disabled?: boolean }[] = [
    {
      id: "copy",
      icon: <CopyPlus className="size-4" />,
      title: "Oldingidan nusxa",
      desc: "Joriy yil choraklari va taʼtillarini yangi yilga koʻchiradi.",
      disabled: !canCopy,
    },
    {
      id: "fresh",
      icon: <Sparkles className="size-4" />,
      title: "Boshidan boshlash",
      desc: "Rasmiy 4 chorak va taʼtil shabloni bilan toza yil.",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} width="60rem" className="gap-0 overflow-hidden p-0">
        <DialogHeaderBar
          icon={<CalendarPlus className="size-[18px]" />}
          title="Yangi oʻquv yili"
          description="Rejim va yil davrini tanlang — oʻng tomonda jonli sharh."
        />

        <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ── Chap panel: forma ── */}
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Rejim</Label>
              <div className="space-y-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={m.disabled}
                    onClick={() => setMode(m.id)}
                    aria-pressed={mode === m.id}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      mode === m.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                        mode === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.icon}
                    </span>
                    <span className="min-w-0 space-y-0.5">
                      <span className="block text-sm font-medium text-foreground">{m.title}</span>
                      <span className="block text-xs text-muted-foreground">{m.desc}</span>
                      {m.disabled && (
                        <span className="block text-xs text-amber-600 dark:text-amber-400">
                          Joriy kalendar hali sozlanmagan.
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Yil davri</Label>
              <div className="flex items-center gap-1.5">
                <DateKeyPicker
                  value={range.start}
                  onChange={(v) => setRange((r) => ({ ...r, start: v }))}
                  ariaLabel="Boshlanish sanasi"
                  className="flex-1"
                />
                <span className="text-muted-foreground">—</span>
                <DateKeyPicker
                  value={range.end}
                  onChange={(v) => setRange((r) => ({ ...r, end: v }))}
                  ariaLabel="Tugash sanasi"
                  className="flex-1"
                />
              </div>
              {!valid && (
                <p className="text-xs text-destructive">Tugash sanasi boshlanishdan keyin boʻlishi kerak.</p>
              )}
            </div>
          </div>

          {/* ── Oʻng panel: jonli sharh ── */}
          <div className="border-t border-border bg-muted/20 p-6 sm:border-t-0 sm:border-l">
            <div className="mb-3 flex items-center gap-2">
              <CalendarRange className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {preview.yearLabel || "Oʻquv yili"}
              </span>
            </div>

            {valid ? (
              <div className="space-y-4">
                <YearStrip calendar={preview} />
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                    <p className="text-lg font-bold leading-none text-foreground">{preview.quarters.length}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Chorak</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                    <p className="text-lg font-bold leading-none text-foreground">{preview.holidays.length}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Taʼtil</p>
                  </div>
                </div>
                {overlaps.length > 0 && (
                  <div className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Bu davr {overlaps.map((y) => y.calendar.yearLabel || "nomsiz yil").join(", ")}
                      {" "}bilan kesishadi. Yaratsa boʻladi, lekin sanalar ikki yilga tegishli boʻladi.
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Yaratgach yangi oʻquv yili qoʻshiladi va FAOL boʻladi — eski yil roʻyxatda qoladi. Choraklar va taʼtillarni keyin «Oʻquv yili» sozlamalarida aniqlashtirasiz.
                </p>
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
                <CalendarOff className="size-6 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Sharh uchun yaroqli davr kiriting.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Bekor qilish</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={!valid} className="gap-1.5">
            <CalendarPlus className="size-4" />
            Yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
