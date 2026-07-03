"use client";

import { useEffect, useState } from "react";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { fmtDayMonthUz } from "@/lib/academic-calendar";
import { nextMonday } from "@/lib/timetable-versions";
import { dateKeyToDate, dateToKey } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarClock, CalendarCog, CalendarDays, CalendarSearch,
  Wrench, TriangleAlert, X,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   "QACHONDAN KUCHGA KIRADI?" DIALOGI

   Joriy jadval tahrirlanganda ochiladi: oʻzgarish YANGI VERSIYA boʻlib
   tanlangan sanadan amal qiladimi (tarix saqlanadi), yoki bu XATONI
   TUZATISH — joriy versiyaning oʻzi oʻzgaradimi (oʻtmish ham shu jadval
   bilan koʻrinadi). Variant-kartalar radio oʻrnida (PlannerView'dagi
   tanlov-kartalar uslubi).

   Header — ilova standarti (SectionIcon + CardTitle + size-9 yopish),
   sana tanlagich — standart Calendar (Popover ichida), native <input
   type=date> emas (u brauzer/OS temasiga ergashib begona koʻrinardi).
   ════════════════════════════════════════════════════════════════════ */

const UZ_WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

export type EffectiveChoice =
  | { kind: "new"; effectiveFrom: string; note?: string }
  | { kind: "in-place" };

type OptionKind = "monday" | "today" | "custom" | "in-place";

export default function EffectiveDateDialog({
  open,
  todayKey,
  takenDates,
  allowInPlace = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  todayKey: string;
  /** Mavjud versiyalarning effectiveFrom sanalari — dublikat guard. */
  takenDates: string[];
  /** false — faqat yangi versiya (masalan, dropdown'dan "Yangi versiya…"). */
  allowInPlace?: boolean;
  onConfirm: (choice: EffectiveChoice) => void;
  onCancel: () => void;
}) {
  const monday = nextMonday(todayKey);
  const [kind, setKind] = useState<OptionKind>("monday");
  const [customDate, setCustomDate] = useState("");
  const [note, setNote] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Har ochilishda toza holatdan boshlanadi
  useEffect(() => {
    if (open) {
      setKind("monday");
      setCustomDate("");
      setNote("");
      setCalendarOpen(false);
    }
  }, [open]);

  const todayTaken = takenDates.includes(todayKey);
  const mondayTaken = takenDates.includes(monday);
  const customTaken = customDate !== "" && takenDates.includes(customDate);
  const customPast = customDate !== "" && customDate < todayKey;

  const effectiveFrom =
    kind === "monday" ? monday : kind === "today" ? todayKey : customDate;

  const confirmDisabled =
    kind === "custom" ? customDate === "" || customTaken : kind === "monday" && mondayTaken;

  // Caption ichida asosiy maʼlumot — SANA — urgʻulanadi (foreground + 500),
  // qolgani muted; tez skanerlash uchun.
  const dateCaption = (key: string) => (
    <>
      <span className="font-medium text-foreground">{fmtDayMonthUz(key)}</span>dan kuchga
      kiradi
    </>
  );

  const options: {
    key: OptionKind;
    icon: React.ReactNode;
    title: string;
    caption: React.ReactNode;
    disabled?: boolean;
  }[] = [
    {
      key: "monday",
      icon: <CalendarClock className="size-4" />,
      title: "Keyingi dushanbadan",
      caption: mondayTaken ? "Bu sanada allaqachon versiya bor" : dateCaption(monday),
      disabled: mondayTaken,
    },
    {
      key: "today",
      icon: <CalendarDays className="size-4" />,
      title: "Bugundan",
      caption: todayTaken ? "Bu sanada allaqachon versiya bor" : dateCaption(todayKey),
      disabled: todayTaken,
    },
    {
      key: "custom",
      icon: <CalendarSearch className="size-4" />,
      title: "Boshqa sana…",
      caption: customDate ? dateCaption(customDate) : "Sanani oʻzingiz tanlaysiz",
    },
    ...(allowInPlace
      ? [
          {
            key: "in-place" as const,
            icon: <Wrench className="size-4" />,
            title: "Bu xatoni tuzatish",
            caption: "Yangi versiya yaratilmaydi — oʻtgan kunlar ham shu jadval bilan koʻrinadi",
          },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl gap-0 overflow-hidden p-0 bg-card top-[8vh] translate-y-0"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <SectionIcon>
              <CalendarCog />
            </SectionIcon>
            <div className="flex flex-col">
              <DialogTitle asChild>
                <CardTitle>Oʻzgarish qachondan kuchga kiradi?</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                Yangi sana tanlansa, avvalgi kunlar eski jadval bilan qoladi
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">Yopish</span>
          </DialogClose>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto scrollbar-thin p-5">
          {options.map((o) => {
            const selected = kind === o.key;
            return (
              <button
                key={o.key}
                type="button"
                disabled={o.disabled}
                onClick={() => setKind(o.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  o.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {o.icon}
                </span>
                <span className="min-w-0">
                  <span className="block heading-small">{o.title}</span>
                  <span className="mt-0.5 block text-caption">{o.caption}</span>
                </span>
              </button>
            );
          })}

          {kind === "custom" && (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
              <Label>Amal qilish sanasi</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start bg-card font-normal shadow-xs",
                      !customDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarSearch className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    {customDate ? fmtDayMonthUz(customDate) : "Sanani tanlang"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={uz}
                    formatters={{
                      formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                      formatWeekdayName: (date) => UZ_WEEKDAYS[date.getDay()],
                    }}
                    selected={customDate ? dateKeyToDate(customDate) : undefined}
                    defaultMonth={customDate ? dateKeyToDate(customDate) : dateKeyToDate(todayKey)}
                    captionLayout="dropdown"
                    startMonth={new Date(2024, 0)}
                    endMonth={new Date(2028, 11)}
                    disabled={(d) => takenDates.includes(dateToKey(d))}
                    onSelect={(d) => {
                      if (d) setCustomDate(dateToKey(d));
                      setCalendarOpen(false);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {customTaken && (
                <p className="text-xs text-destructive">Bu sanada allaqachon versiya bor.</p>
              )}
              {!customTaken && customPast && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  Oʻtmishdagi sana — shu kundan keyingi kunlar tarixi ham yangi jadval bilan
                  koʻrsatiladi.
                </p>
              )}
            </div>
          )}

          {kind !== "in-place" && (
            <div className="space-y-1.5 pt-4">
              <Label htmlFor="version-note">Nima oʻzgardi? (ixtiyoriy)</Label>
              <Input
                id="version-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Masalan: 7-B juma kuniga koʻchdi"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-5 py-4">
          <Button variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button
            disabled={confirmDisabled}
            onClick={() =>
              onConfirm(
                kind === "in-place"
                  ? { kind: "in-place" }
                  : { kind: "new", effectiveFrom, note: note.trim() || undefined }
              )
            }
          >
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
