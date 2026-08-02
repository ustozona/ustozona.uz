"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeaderBar, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateKeyRangePicker } from "@/components/ui/date-key-picker";
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  makeCalendarForRange, shiftCalendarYears, isCalendarConfigured,
  type AcademicYearCalendar, type DateRange,
} from "@/lib/academic-calendar";
import { applyYearActivationSideEffects } from "@/lib/year-side-effects";

/* ════════════════════════════════════════════════════════════════════
   YANGI OʻQUV YILI — bir ustunli oddiy modal (nomi + davri).

   Choraklar/taʼtillar avtomatik: joriy yil sozlangan boʻlsa undan
   suriladi (shiftCalendarYears — oʻqituvchi moslamalari saqlanadi),
   aks holda rasmiy 4 chorak shabloni. Oʻqituvchi buni keyin "Oʻquv
   yili" sozlamalarida aniqlashtiradi — shu sabab bu yerda tanlov
   koʻrsatilmaydi. Sinflarni koʻchirish/arxivlash alohida rollover
   sehrgarida (onCreated orqali AcademicYearSection ochadi).

   Yaratish yangi oʻquv yilini roʻyxatga QOʻSHADI va FAOL qiladi
   (eskisini almashtirmaydi) — CalendarServerSync serverga sinxronlaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Boshlanish sanasidan oʻquv-yili boshlanish yilini aniqlaydi (iyundan keyin — shu yil). */
function startYearOf(startKey: string): number {
  const [y, m] = startKey.split("-").map(Number);
  return m >= 6 ? y : y - 1;
}

/** Davrdan avtomatik yorliq: "2026–2027" (yagona yil boʻlsa — "2026"). */
function autoLabel(r: DateRange): string {
  if (!r.start || !r.end) return "";
  const y1 = r.start.slice(0, 4);
  const y2 = r.end.slice(0, 4);
  return y1 === y2 ? y1 : `${y1}–${y2}`;
}

export default function CreateSemesterModal({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Yil yaratilgach chaqiriladi — AcademicYearSection rollover sehrgarini ochadi. */
  onCreated?: () => void;
}) {
  const t = useTranslations("CreateSemesterModal");
  const current = useCalendarStore((s) => s.calendar);
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

  const [range, setRange] = React.useState<DateRange>(defaultRange);
  const [name, setName] = React.useState(autoLabel(defaultRange));

  // Modal har ochilganda standart holatga qaytadi.
  React.useEffect(() => {
    if (open) {
      setRange(defaultRange);
      setName(autoLabel(defaultRange));
    }
  }, [open, defaultRange]);

  // Davr oʻzgarganda nomni ham yangilaydi — LEKIN oʻqituvchi nomni qoʻlda
  // tahrirlagan boʻlsa (avtomatik qiymatdan farq qilsa) tegilmaydi.
  const handleRangeChange = (r: DateRange) => {
    const prevAuto = autoLabel(range);
    if (!name || name === prevAuto) setName(autoLabel(r));
    setRange(r);
  };

  const valid = Boolean(range.start && range.end && range.end > range.start);

  const handleCreate = () => {
    if (!valid) return;
    const next: AcademicYearCalendar = canCopy
      ? { ...shiftCalendarYears(current, startYearOf(range.start) - startYearOf(current.range.start)), range, yearLabel: name || autoLabel(range) }
      : { ...makeCalendarForRange(range.start, range.end), yearLabel: name || autoLabel(range) };
    // Almashtirmaydi — roʻyxatga qoʻshadi va faollashtiradi.
    addYear(next);
    // Jadval yil boshini qoplasin + bugun yangi yil ichida boʻlsa xulq langari surilsin.
    applyYearActivationSideEffects(next);
    onOpenChange(false);
    // Rollover sehrgari (sinf nomlarini koʻchirish/arxivlash) — parent ochadi.
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} width="26rem" className="gap-0 p-0">
        <DialogHeaderBar icon={<CalendarPlus className="size-[18px]" />} title={t("title")} />

        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="semester-name" className="text-xs font-medium text-muted-foreground">
              {t("nameLabel")}
            </Label>
            <Input
              id="semester-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{t("periodLabel")}</Label>
            <DateKeyRangePicker range={range} onChange={handleRangeChange} className="w-full" />
            {!valid && (
              <p className="text-xs text-destructive">{t("periodInvalid")}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col items-stretch gap-2 border-t border-border px-6 py-4 sm:flex-col">
          <Button onClick={handleCreate} disabled={!valid} className="w-full gap-1.5">
            <CalendarPlus className="size-4" />
            {t("createButton")}
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">
              {t("cancel")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
