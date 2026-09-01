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
  CalendarClock, CalendarCog, CalendarSearch,
  ChevronDown, Layers, TriangleAlert, X,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   "QACHONDAN KUCHGA KIRADI?" DIALOGI — qoralama QOʻLLANAYOTGANDA

   Tahrir paytida EMAS, foydalanuvchi «Qoʻllash…» bosganda ochiladi
   (qoralama → nashr naqshi): qaror nima oʻzgargani maʼlum boʻlgach,
   ish oxirida beriladi. Shu sabab bekor qilish qoralamaga TEGMAYDI —
   dialog shunchaki yopiladi.

   Tanlov MEXANIZM emas, NATIJA boʻyicha ikkiga qisqargan:
     • sanadan boshlab → yangi versiya, oʻtgan kunlar eski jadvalda;
     • hamma kunlarga  → versiya yaratilmaydi, oʻtmish ham yangilanadi.
   Uchinchi (kamroq kerak) yoʻl — «Boshqa sana…» havolasi ostidagi
   kalendar; u tanlansa birinchi karta oʻsha sanaga aylanadi.

   Header — ilova standarti (SectionIcon + CardTitle + size-9 yopish),
   sana tanlagich — standart Calendar (Popover ichida), native <input
   type=date> emas (u brauzer/OS temasiga ergashib begona koʻrinardi).
   ════════════════════════════════════════════════════════════════════ */

export type EffectiveChoice =
  | { kind: "new"; effectiveFrom: string; note?: string }
  | { kind: "in-place" };

type OptionKind = "date" | "in-place";

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
  const [kind, setKind] = useState<OptionKind>("date");
  /** Boʻsh boʻlsa — sana kartasi "keyingi dushanba"ni bildiradi. */
  const [customDate, setCustomDate] = useState("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Har ochilishda toza holatdan boshlanadi
  useEffect(() => {
    if (open) {
      setKind("date");
      setCustomDate("");
      setNote("");
      setNoteOpen(false);
      setCalendarOpen(false);
    }
  }, [open]);

  const effectiveFrom = customDate || monday;
  const dateTaken = takenDates.includes(effectiveFrom);
  const datePast = effectiveFrom < todayKey;

  const confirmDisabled = kind === "date" && dateTaken;

  const options: {
    key: OptionKind;
    icon: React.ReactNode;
    title: string;
    caption: string;
  }[] = [
    {
      key: "date",
      icon: <CalendarClock className="size-4" />,
      title: t("options.date.title", { date: fmtDayMonthUz(effectiveFrom) }),
      caption: dateTaken ? t("dateAlreadyTaken") : t("options.date.caption"),
    },
    ...(allowInPlace
      ? [
          {
            key: "in-place" as const,
            icon: <Layers className="size-4" />,
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
        className="max-w-lg gap-0 overflow-hidden p-0 bg-card top-[12vh] translate-y-0"
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

        <div className="flex max-h-[70vh] flex-col gap-2 scrollbar-hover overflow-y-auto scrollbar-thin p-5">
          {options.map((o) => {
            const selected = kind === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setKind(o.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
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

          {/* Ikkilamchi yoʻl — sana kartasining sanasini almashtiradi */}
          {kind === "date" && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pt-1">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md text-caption underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <CalendarSearch className="size-3.5" />
                    {t("otherDate")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={uz}
                    formatters={{
                      formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                      formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
                    }}
                    selected={dateKeyToDate(effectiveFrom)}
                    defaultMonth={dateKeyToDate(effectiveFrom)}
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
              {customDate !== "" && customDate !== monday && (
                <button
                  type="button"
                  onClick={() => setCustomDate("")}
                  className="text-caption underline-offset-4 hover:underline"
                >
                  {t("resetDate")}
                </button>
              )}
            </div>
          )}

          {kind === "date" && !dateTaken && datePast && (
            <p className="flex items-start gap-1.5 px-1 text-xs text-amber-600 dark:text-amber-500">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {t("pastDateWarning")}
            </p>
          )}

          {/* Izoh — modal qoidasi boʻyicha yigʻilgan holda (kamdan-kam kerak) */}
          {kind === "date" && (
            <div className="pt-2">
              {noteOpen ? (
                <div className="space-y-1.5">
                  <Label htmlFor="version-note">{t("noteLabel")}</Label>
                  <Input
                    id="version-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("notePlaceholder")}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md px-1 text-caption underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <ChevronDown className="size-3.5" />
                  {t("addNote")}
                </button>
              )}
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
