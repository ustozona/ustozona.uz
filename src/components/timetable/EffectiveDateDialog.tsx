"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { fmtDayMonthUz } from "@/lib/academic-calendar";
import { nextMonday } from "@/lib/timetable-versions";
import { dateKeyToDate, dateToKey } from "@/lib/date-keys";
import { MONTHS_UZ, DAYS_UZ_SUN_SHORT } from "@/lib/localization";
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
  const t = useTranslations("EffectiveDateDialog");
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
  const withDate = (key: string, text: string) => {
    const date = fmtDayMonthUz(key);
    const idx = text.indexOf("{date}");
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-medium text-foreground">{date}</span>
        {text.slice(idx + "{date}".length)}
      </>
    );
  };

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
      title: t("options.monday.title"),
      caption: mondayTaken
        ? t("dateAlreadyTaken")
        : withDate(monday, t("options.monday.caption")),
      disabled: mondayTaken,
    },
    {
      key: "today",
      icon: <CalendarDays className="size-4" />,
      title: t("options.today.title"),
      caption: todayTaken
        ? t("dateAlreadyTaken")
        : withDate(todayKey, t("options.today.caption")),
      disabled: todayTaken,
    },
    {
      key: "custom",
      icon: <CalendarSearch className="size-4" />,
      title: t("options.custom.title"),
      caption: customDate
        ? withDate(customDate, t("options.custom.caption"))
        : t("options.custom.pickFromCalendar"),
    },
    ...(allowInPlace
      ? [
          {
            key: "in-place" as const,
            icon: <Wrench className="size-4" />,
            title: t("options.inPlace.title"),
            caption: t("options.inPlace.caption"),
          },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-0 overflow-hidden p-0 bg-card top-[8vh] translate-y-0"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionIcon className="shrink-0">
              <CalendarCog />
            </SectionIcon>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogTitle asChild>
                <CardTitle>{t("title")}</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
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
              <Label>{t("effectiveDateLabel")}</Label>
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
                    {customDate ? fmtDayMonthUz(customDate) : t("pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={uz}
                    formatters={{
                      formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                      formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
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
                <p className="text-xs text-destructive">{t("dateAlreadyTakenFull")}</p>
              )}
              {!customTaken && customPast && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {t("pastDateWarning")}
                </p>
              )}
            </div>
          )}

          {kind !== "in-place" && (
            <div className="space-y-1.5 pt-4">
              <Label htmlFor="version-note">{t("noteLabel")}</Label>
              <Input
                id="version-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("notePlaceholder")}
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
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
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
