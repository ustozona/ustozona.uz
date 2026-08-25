"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { uz } from "date-fns/locale";
import { CalendarClock, Moon, Sun, Sunrise, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker";
import { cn } from "@/lib/utils";
import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";
import { MONTHS_UZ, DAYS_UZ_SUN_SHORT } from "@/lib/localization";
import { formatDateGroupLabel } from "@/lib/tasks-data";

/* ════════════════════════════════════════════════════════════════════
   TaskTimeCard — Sana/Davomiylik ikki-tabli muddat muharriri.

   4 vaqt holatini bitta modelga sigʻdiradi (Task.dueDate/dueMin/dueEndMin):
   sanasiz · faqat sana · sana+bir vaqt · sana+oraliq. Ikkinchi tab shu
   modelning "boshlanish—tugash" koʻrinishi — alohida maydon qoʻshilmaydi.
   Faqat manual vazifalarda ishlatiladi (avto-manba vazifalar read-only).
   ════════════════════════════════════════════════════════════════════ */

export type TaskTimeValue = {
  dueDate: string | null;
  dueMin?: number | null;
  dueEndMin?: number | null;
};

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMin(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Gʻildirak-tanlagich variantlari: 0–23 soat, 5 daqiqalik qadam bilan minut. */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, "0"),
  value: String(i),
}));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: String(i * 5).padStart(2, "0"),
  value: String(i * 5),
}));

export function TaskTimeCard({
  value,
  onChange,
  trigger,
}: {
  value: TaskTimeValue;
  onChange: (patch: TaskTimeValue) => void;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("TasksPage.detail.timeCard");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"date" | "duration">("date");

  const [dueDate, setDueDate] = useState<string | null>(value.dueDate);
  const [startMin, setStartMin] = useState<number | null>(value.dueMin ?? null);
  const [endMin, setEndMin] = useState<number | null>(value.dueEndMin ?? null);
  const [endDate, setEndDate] = useState<string | null>(value.dueDate);

  useEffect(() => {
    if (!open) return;
    setDueDate(value.dueDate);
    setStartMin(value.dueMin ?? null);
    setEndMin(value.dueEndMin ?? null);
    setEndDate(value.dueDate);
    setTab(value.dueMin != null && value.dueEndMin != null ? "duration" : "date");
  }, [open, value.dueDate, value.dueMin, value.dueEndMin]);

  const commit = (patch: TaskTimeValue) => {
    onChange(patch);
    setOpen(false);
  };

  const applyQuick = (dateKey: string, min: number | null) => {
    setDueDate(dateKey);
    setEndDate(dateKey);
    setStartMin(min);
    setEndMin(null);
    commit({ dueDate: dateKey, dueMin: min, dueEndMin: null });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={12}
        className="max-h-[var(--radix-popover-content-available-height)] w-[280px] scrollbar-hover overflow-y-auto p-0"
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as "date" | "duration")} className="gap-0">
          <div className="p-3 pb-0">
            <TabsList className="w-full">
              <TabsTrigger value="date">{t("dateTab")}</TabsTrigger>
              <TabsTrigger value="duration">{t("durationTab")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="date" className="mt-0 p-3">
            <div className="mb-2 flex items-center justify-between">
              <QuickButton
                icon={<Sun className="size-4" />}
                label={t("quickToday")}
                onClick={() => applyQuick(todayKey(), startMin)}
              />
              <QuickButton
                icon={<Sunrise className="size-4" />}
                label={t("quickTomorrow")}
                onClick={() => applyQuick(addDaysKey(todayKey(), 1), startMin)}
              />
              <QuickButton
                icon={<CalendarClock className="size-4" />}
                label={t("quickNextWeek")}
                onClick={() => applyQuick(addDaysKey(todayKey(), 7), startMin)}
              />
              <QuickButton
                icon={<Moon className="size-4" />}
                label={t("quickEvening")}
                onClick={() => applyQuick(dueDate ?? todayKey(), 18 * 60)}
              />
            </div>

            <Calendar
              mode="single"
              locale={uz}
              formatters={{
                formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
              }}
              selected={dueDate ? dateKeyToDate(dueDate) : undefined}
              onSelect={(d) => {
                if (!d) return;
                const key = dateToKey(d);
                setDueDate(key);
                setEndDate(key);
              }}
              captionLayout="dropdown"
              startMonth={new Date(2020, 0)}
              endMonth={new Date(2035, 11)}
              className="mx-auto p-0"
            />

            <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5">
              <span className="shrink-0 text-sm text-muted-foreground">{t("timeLabel")}</span>
              <div className="flex items-center gap-1">
                <CompactTimePill min={startMin} onChange={setStartMin} placeholder={t("noTime")} />
                {startMin != null && (
                  <button
                    type="button"
                    onClick={() => setStartMin(null)}
                    aria-label={t("noTime")}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <CardFooter
              onClear={() => commit({ dueDate: null, dueMin: null, dueEndMin: null })}
              onOk={() => commit({ dueDate, dueMin: startMin, dueEndMin: null })}
              t={t}
            />
          </TabsContent>

          <TabsContent value="duration" className="mt-0 space-y-3 p-3">
            <DurationRow
              label={t("startLabel")}
              dateKey={dueDate}
              min={startMin}
              onDateChange={(key) => {
                setDueDate(key);
                if (endDate && endDate < key) setEndDate(key);
              }}
              onMinChange={setStartMin}
            />
            <DurationRow
              label={t("endLabel")}
              dateKey={endDate}
              min={endMin}
              onDateChange={setEndDate}
              onMinChange={setEndMin}
              minDate={dueDate ?? undefined}
            />

            <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-2">
              <span className="text-sm">{t("allDay")}</span>
              <Switch
                checked={startMin == null && endMin == null}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStartMin(null);
                    setEndMin(null);
                  } else {
                    setStartMin(9 * 60);
                    setEndMin(10 * 60);
                  }
                }}
              />
            </div>

            <CardFooter
              onClear={() => commit({ dueDate: null, dueMin: null, dueEndMin: null })}
              onOk={() => {
                const finalEndMin =
                  endMin != null && (endDate ?? dueDate) === dueDate && startMin != null && endMin <= startMin
                    ? startMin + 1
                    : endMin;
                commit({ dueDate, dueMin: startMin, dueEndMin: finalEndMin });
              }}
              t={t}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function QuickButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
    </button>
  );
}

/** Native `<input type="date">` oʻrnini bosadi — "mm/dd/yyyy" segmentlari
    torroq qatorlarda sigʻmay tashqariga chiqib ketardi (browser intrinsic
    kengligi CSS bilan siqilmaydi). Oʻrniga kompakt pill + ichma-ich Popover. */
function CompactDatePill({
  value,
  onChange,
  minDate,
  className,
}: {
  value: string | null;
  onChange: (key: string) => void;
  minDate?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 truncate rounded-md border border-border bg-transparent px-2 text-left text-sm outline-none hover:bg-muted",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? formatDateGroupLabel(value) : "—"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={uz}
          formatters={{
            formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
            formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
          }}
          selected={value ? dateKeyToDate(value) : undefined}
          disabled={minDate ? { before: dateKeyToDate(minDate) } : undefined}
          onSelect={(d) => {
            if (!d) return;
            onChange(dateToKey(d));
            setOpen(false);
          }}
          defaultMonth={value ? dateKeyToDate(value) : undefined}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2035, 11)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** Native `<input type="time">` oʻrnini bosadi (brauzer soat ikonkasi/spinneri
    dizayn tizimidan tashqarida koʻrinardi). Oʻrniga soat/minut gʻildirak-tanlagich
    — TaskDetail'dagi pomodoro sozlamalari bilan bir xil komponent. */
function CompactTimePill({
  min,
  onChange,
  placeholder,
  className,
}: {
  min: number | null;
  onChange: (min: number | null) => void;
  placeholder: string;
  className?: string;
}) {
  const t = useTranslations("TasksPage.detail.timeCard");
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(min != null ? Math.floor(min / 60) : 9);
  const [minute, setMinute] = useState(min != null ? Math.round((min % 60) / 5) * 5 : 0);

  useEffect(() => {
    if (!open) return;
    setHour(min != null ? Math.floor(min / 60) : 9);
    setMinute(min != null ? Math.round((min % 60) / 5) * 5 : 0);
  }, [open, min]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-transparent px-2 text-sm tabular-nums outline-none hover:bg-muted",
            min == null && "text-muted-foreground",
            className
          )}
        >
          {min != null ? minToHHMM(min) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex items-center gap-1">
          <WheelPickerWrapper className="w-12 rounded-xl bg-muted/50 px-2 py-1">
            <WheelPicker
              options={HOUR_OPTIONS}
              value={String(hour)}
              onValueChange={(v) => setHour(Number(v))}
              visibleCount={12}
              optionItemHeight={28}
              infinite
            />
          </WheelPickerWrapper>
          <span className="text-muted-foreground">:</span>
          <WheelPickerWrapper className="w-12 rounded-xl bg-muted/50 px-2 py-1">
            <WheelPicker
              options={MINUTE_OPTIONS}
              value={String(minute)}
              onValueChange={(v) => setMinute(Number(v))}
              visibleCount={12}
              optionItemHeight={28}
              infinite
            />
          </WheelPickerWrapper>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <X className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => {
              onChange(hour * 60 + minute);
              setOpen(false);
            }}
          >
            {t("ok")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DurationRow({
  label,
  dateKey,
  min,
  onDateChange,
  onMinChange,
  minDate,
}: {
  label: string;
  dateKey: string | null;
  min: number | null;
  onDateChange: (key: string) => void;
  onMinChange: (min: number | null) => void;
  minDate?: string;
}) {
  const tCard = useTranslations("TasksPage.detail.timeCard");
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <CompactDatePill value={dateKey} onChange={onDateChange} minDate={minDate} className="flex-1" />
        <CompactTimePill min={min} onChange={onMinChange} placeholder={tCard("noTime")} className="w-[84px] shrink-0" />
      </div>
    </div>
  );
}

function CardFooter({
  onClear,
  onOk,
  t,
}: {
  onClear: () => void;
  onOk: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClear}>
        {t("clear")}
      </Button>
      <Button type="button" size="sm" className="flex-1" onClick={onOk}>
        {t("ok")}
      </Button>
    </div>
  );
}
