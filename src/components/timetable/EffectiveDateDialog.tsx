"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { fmtDayMonthUz } from "@/lib/academic-calendar";
import { nextMonday } from "@/lib/timetable-versions";
import { addDaysKey, dateKeyToDate, dateToKey } from "@/lib/date-keys";
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
import { Label } from "@/components/ui/label";
import { CalendarClock, CalendarCog, CalendarSearch, Layers, TriangleAlert, X } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   "QACHONDAN AMAL QILSIN?" DIALOGI

   Ikki kirish nuqtasi, ikki rejim:

   • "decide" — paneldan "Saqlash" bosilганда FAQAT oʻzgarish oʻtgan
     davomatga taʼsir qilishi mumkin boʻlsa ochiladi (aks holda modal
     yoʻq — oʻzgarish jimgina joriy versiyaga yoziladi). Ikki yoʻl:
       – "Bugundan"  → yangi versiya, oldingi kunlar eski jadvalda (default
                       — oʻtgan davomat saqlanadi, xavfsiz);
       – "Boshidan"  → joriy versiya qayta yoziladi (xatoni toʻgʻrilash),
                       ogohlantirish bilan.
     Sana tanlash YOʻQ — "aniq kelajak sana" boshqa niyat, uning uchun
     versiyalar roʻyxatidagi "Yangi sanadan…" bor.

   • "pick-date" — versiyalar roʻyxatidagi "Yangi sanadan dars jadvali
     tuzish…" dan. Bu yerda kalendar KERAK (kelgusi chorak sanasi). Faqat
     yangi versiya — "Boshidan" varianti chiqmaydi.

   Header — ilova standarti (SectionIcon + CardTitle + size-9 yopish).
   Bekor qilish qoralamaga TEGMAYDI — dialog shunchaki yopiladi.
   Izoh maydoni ATAYLAB yoʻq — hozircha hech qayerda koʻrsatilmaydi;
   real foydalanuvchi soʻrasa qoʻshiladi.
   ════════════════════════════════════════════════════════════════════ */

export type EffectiveChoice =
  | { kind: "new"; effectiveFrom: string }
  | { kind: "in-place" };

export default function EffectiveDateDialog({
  open,
  todayKey,
  takenDates,
  mode = "decide",
  attendanceAtRisk = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  todayKey: string;
  /** Mavjud versiyalarning effectiveFrom sanalari — dublikat guard. */
  takenDates: string[];
  /** "decide" — Bugundan / Boshidan; "pick-date" — kalendar. */
  mode?: "decide" | "pick-date";
  /** Joriy versiya oraligʻida oʻtgan davomat yozuvi bor — "Boshidan"
      tanlansa ogohlantirish koʻrsatiladi (yil boshi/sozlash paytida — yoʻq). */
  attendanceAtRisk?: boolean;
  onConfirm: (choice: EffectiveChoice) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("EffectiveDateDialog");
  const monday = nextMonday(todayKey);

  // decide rejimi: default "new" (oʻtgan davomatni saqlaydi — xavfsiz);
  // "Boshidan" ni oʻqituvchi ongli ravishda tanlaydi.
  const [kind, setKind] = useState<"new" | "fix">("new");
  // pick-date rejimi: boʻsh → keyingi dushanba
  const [customDate, setCustomDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setKind("new");
      setCustomDate("");
      setCalendarOpen(false);
    }
  }, [open]);

  /** Default sana — keyingi dushanba; agar unga versiya allaqachon boʻlsa,
      keyingi BOʻSH kunga suriladi. Aks holda dialog band sana bilan ochilib,
      "Saqlash" darhol nofaol boʻlardi (foydalanuvchi tanlamagan sana uchun). */
  const defaultDate = useMemo(() => {
    let d = monday;
    for (let i = 0; i < 366 && takenDates.includes(d); i += 1) d = addDaysKey(d, 1);
    return d;
  }, [monday, takenDates]);

  const pickedDate = customDate || defaultDate;
  const pickedTaken = takenDates.includes(pickedDate);
  const pickedPast = pickedDate < todayKey;

  const confirm = () => {
    if (mode === "pick-date") {
      onConfirm({ kind: "new", effectiveFrom: pickedDate });
      return;
    }
    onConfirm(kind === "fix" ? { kind: "in-place" } : { kind: "new", effectiveFrom: todayKey });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden p-0 bg-card top-[12vh] translate-y-0"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionIcon className="shrink-0">
              <CalendarCog />
            </SectionIcon>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogTitle asChild>
                <CardTitle>{mode === "pick-date" ? t("pickTitle") : t("title")}</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                {mode === "pick-date" ? t("pickDescription") : t("description")}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-2 scrollbar-hover overflow-y-auto scrollbar-thin p-5">
          {mode === "decide" ? (
            <>
              {([
                {
                  key: "new" as const,
                  icon: <CalendarClock className="size-4" />,
                  title: t("options.new.title"),
                  caption: t("options.new.caption"),
                },
                {
                  key: "fix" as const,
                  icon: <Layers className="size-4" />,
                  title: t("options.fix.title"),
                  caption: t("options.fix.caption"),
                },
              ]).map((o) => {
                const selected = kind === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setKind(o.key)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
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

              {kind === "fix" && attendanceAtRisk && (
                <p className="flex items-start gap-1.5 px-1 text-xs text-amber-600 dark:text-amber-500">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {t("attendanceWarning")}
                </p>
              )}
            </>
          ) : (
            <>
              <Label>{t("effectiveDateLabel")}</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-card font-normal shadow-xs">
                    <CalendarSearch className="mr-2 size-4 shrink-0 text-muted-foreground" />
                    {fmtDayMonthUz(pickedDate)}
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
                    selected={dateKeyToDate(pickedDate)}
                    defaultMonth={dateKeyToDate(pickedDate)}
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
              {pickedTaken && <p className="px-1 text-xs text-destructive">{t("dateAlreadyTaken")}</p>}
              {!pickedTaken && pickedPast && (
                <p className="flex items-start gap-1.5 px-1 text-xs text-amber-600 dark:text-amber-500">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {t("pastDateWarning")}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button disabled={mode === "pick-date" && pickedTaken} onClick={confirm}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
