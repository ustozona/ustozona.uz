"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useMemo, useState } from "react";
import { Check, Clock } from "lucide-react";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MONTHS_UZ } from "@/lib/localization";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  weeklySlotsForClass, slotsOnDate, dateToKey, dateKeyToDate, fmtClock,
} from "@/lib/lesson-schedule";

const WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

/** 07:00–19:00 oraligʻida 15 daqiqalik qadamli vaqt variantlari (qoʻlda rejim uchun). */
const MANUAL_TIMES = (() => {
  const out: number[] = [];
  for (let m = 7 * 60; m <= 19 * 60; m += 15) out.push(m);
  return out;
})();

type Session = { classId: string; startMin: number; endMin: number };

/** Sana-tanlash paneli — chapda kalendar, oʻngda vaqt-panel (EMStudio
    ikki-ustunli qolipi). Bir nechta sinfning jadval vaqtlari birga
    koʻrsatiladi ("Available Times"), tanlangach Boshlanish/Tugash oldindan
    toʻldiriladi va bittalab, tez ketma-ket qoʻshiladi. */
export default function ClassSchedulePicker({
  classIds, onAdd, onDone,
}: {
  classIds: string[];
  /** Bitta sessiya tasdiqlangan zahoti chaqiriladi (popover ochiq qoladi). */
  onAdd: (date: string, session: Session) => void;
  /** Foydalanuvchi panelni yopadi (Bekor qilish yoki tashqariga bosish). */
  onDone: () => void;
}) {
  const t = useTranslations("ClassSchedulePicker");
  const liveClasses = useLiveClasses();
  const classes = classIds
    .map((id) => liveClasses.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const hexOf = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? CLASS_COLOR_HEX[classColor(c)] : "var(--primary)";
  };
  const nameOf = (id: string) => classes.find((x) => x.id === id)?.name ?? "";

  const hasTimetable = useMemo(
    () => classIds.some((id) => weeklySlotsForClass(id).length > 0),
    [classIds],
  );

  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [useClassSchedule, setUseClassSchedule] = useState(hasTimetable);
  // Tasdiq/qoʻlda-kiritish holati — Start/End tanlanadigan sessiya.
  const [draft, setDraft] = useState<Session | null>(null);

  const selectedDate = selectedKey ? dateKeyToDate(selectedKey) : undefined;

  // Barcha biriktirilgan sinflarning shu kundagi slotlari, vaqt boʻyicha tartiblangan.
  const daySlots = useMemo<Session[]>(() => {
    if (!selectedDate) return [];
    const out: Session[] = [];
    classIds.forEach((id) => {
      slotsOnDate(id, selectedDate).forEach((s) => out.push({ classId: id, startMin: s.startMin, endMin: s.endMin }));
    });
    return out.sort((a, b) => a.startMin - b.startMin);
  }, [selectedDate, classIds]);

  const showList = useClassSchedule && !!selectedKey && daySlots.length > 1 && !draft;

  // Kalendar kunlarida — shu kuni dars boʻlgan sinflarning ranglari (koʻp boʻlsa boʻlingan fon).
  const classesOnDate = (date: Date) => {
    const ids = new Set<string>();
    classIds.forEach((id) => { if (slotsOnDate(id, date).length > 0) ids.add(id); });
    return [...ids];
  };

  const pickDay = (d: Date) => {
    setSelectedKey(dateToKey(d));
    if (useClassSchedule) {
      const slots: Session[] = [];
      classIds.forEach((id) => {
        slotsOnDate(id, d).forEach((s) => slots.push({ classId: id, startMin: s.startMin, endMin: s.endMin }));
      });
      // Shu kuni faqat bitta dars boʻlsa — roʻyxatsiz, toʻgʻridan-toʻgʻri
      // Boshlanish/Tugash oldindan toʻldiriladi (EMStudio: bitta slot uchun
      // qoʻshimcha bosish shart emas). Bir nechta boʻlsa — "Available Times".
      setDraft(slots.length === 1 ? slots[0] : null);
    } else {
      setDraft(null);
    }
  };

  const canConfirm = !!draft && !!draft.classId && draft.endMin > draft.startMin;
  const submit = () => {
    if (!canConfirm || !selectedKey || !draft) return;
    onAdd(selectedKey, draft);
    setDraft(null);
  };

  return (
    <div className="flex">
      {/* Chap — kalendar */}
      <div className="w-[280px] p-3">
        <Calendar
          mode="single"
          locale={uz}
          month={viewMonth}
          onMonthChange={setViewMonth}
          selected={selectedDate}
          onSelect={(d) => d && pickDay(d)}
          formatters={{
            formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
            formatWeekdayName: (date) => WEEKDAYS[date.getDay()],
          }}
          components={{
            DayButton: (p: React.ComponentProps<typeof CalendarDayButton>) => {
              const isSel = !!p.modifiers.selected;
              const dayClasses = classesOnDate(p.day.date);
              const hexes = dayClasses.map(hexOf);
              // Doira fon — sinf(lar) rangida tint; bir nechta sinf boʻlsa
              // doira teng boʻlaklarga boʻlinadi (pitsa-boʻlak uslubi).
              const n = hexes.length;
              const dayStyle: React.CSSProperties | undefined = isSel
                ? { backgroundColor: "var(--foreground)", color: "var(--background)" }
                : n === 1
                  ? { backgroundColor: `color-mix(in srgb, ${hexes[0]} 22%, transparent)` }
                  : n > 1
                    ? { backgroundImage: `conic-gradient(${hexes.map((h, i) => `color-mix(in srgb, ${h} 26%, transparent) ${(i * 360) / n}deg ${((i + 1) * 360) / n}deg`).join(", ")})` }
                    : undefined;
              return (
                <CalendarDayButton
                  {...p}
                  style={dayStyle}
                >
                  {p.children}
                </CalendarDayButton>
              );
            },
          }}
          className="w-full p-0 [--cell-size:--spacing(8)]"
        />
      </div>

      {/* Oʻng — sozlamalar paneli */}
      <div className="w-[240px] shrink-0 border-l border-border p-4 flex flex-col gap-4">
        <label className={cn("flex items-center gap-2 text-sm font-medium select-none", hasTimetable ? "cursor-pointer text-foreground" : "opacity-40 cursor-not-allowed text-muted-foreground")}>
          <span className={cn("size-4 rounded border flex items-center justify-center shrink-0", useClassSchedule ? "border-transparent bg-foreground" : "border-border")}>
            {useClassSchedule && <Check className="size-3 text-background" />}
          </span>
          <input type="checkbox" className="sr-only" checked={useClassSchedule} disabled={!hasTimetable}
            onChange={(e) => { setUseClassSchedule(e.target.checked); setDraft(null); }} />
          {t("fromClassSchedule")}
          {!hasTimetable && <span className="text-xs text-muted-foreground font-normal">{t("noSchedule")}</span>}
        </label>

        {showList ? (
          /* "Available Times" — barcha sinflar jadvali shu kun uchun (ikki qatorli karta) */
          <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto">
            <span className="text-overline text-muted-foreground">{t("availableTimes")}</span>
            {daySlots.map((s) => {
              const hex = hexOf(s.classId);
              return (
                <button key={`${s.classId}-${s.startMin}`}
                  onClick={() => setDraft(s)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <ClassSwatch hex={hex} className="size-2.5 shrink-0" /> {nameOf(s.classId)}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{fmtClock(s.startMin)} – {fmtClock(s.endMin)}</span>
                </button>
              );
            })}
          </div>
        ) : !selectedKey ? (
          <p className="text-xs text-muted-foreground">{t("pickDayHint")}</p>
        ) : useClassSchedule && daySlots.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noLessonThisDay")}</p>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {classIds.length > 1 && draft?.classId ? (
              /* Roʻyxatdan tanlangan sinf — ajratib koʻrsatilgan karta */
              <button type="button" onClick={() => classIds.length > 1 && setDraft(null)}
                className="w-full rounded-lg border-2 px-3 py-2 text-left transition-colors"
                style={{ borderColor: hexOf(draft.classId), backgroundColor: `color-mix(in srgb, ${hexOf(draft.classId)} 8%, transparent)` }}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: hexOf(draft.classId) }}>
                  <ClassSwatch hex={hexOf(draft.classId)} className="size-2.5 shrink-0" /> {nameOf(draft.classId)}
                </span>
              </button>
            ) : classIds.length > 1 ? (
              /* Qoʻlda rejim — sinf tanlash kartalari */
              <div className="space-y-1.5">
                {classIds.map((id) => (
                  <button key={id} type="button"
                    onClick={() => setDraft({ classId: id, startMin: 0, endMin: 0 })}
                    className="w-full flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <ClassSwatch hex={hexOf(id)} className="size-2.5 shrink-0" /> {nameOf(id)}
                  </button>
                ))}
              </div>
            ) : null}
            <div>
              <span className="text-sm text-foreground flex items-center gap-1.5 mb-1">
                <Clock className="size-3.5 text-muted-foreground" /> {t("start")}
              </span>
              <Select
                value={draft?.startMin ? String(draft.startMin) : undefined}
                onValueChange={(v) => setDraft((prev) => ({ classId: prev?.classId ?? classIds[0], startMin: Number(v), endMin: prev?.endMin ?? 0 }))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder={t("select")} /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {MANUAL_TIMES.map((m) => <SelectItem key={m} value={String(m)}>{fmtClock(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-sm text-foreground flex items-center gap-1.5 mb-1">
                <Clock className="size-3.5 text-muted-foreground" /> {t("end")}
              </span>
              <Select
                value={draft?.endMin ? String(draft.endMin) : undefined}
                onValueChange={(v) => setDraft((prev) => ({ classId: prev?.classId ?? classIds[0], startMin: prev?.startMin ?? 0, endMin: Number(v) }))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder={t("select")} /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {MANUAL_TIMES.map((m) => <SelectItem key={m} value={String(m)}>{fmtClock(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Amallar — doim koʻrinadi (EMStudio: Cancel + Add pastda) */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Button variant="outline" className="flex-1" onClick={onDone}>
            {t("cancel")}
          </Button>
          <Button className="flex-1" disabled={!canConfirm} onClick={submit}>
            {t("add")}
          </Button>
        </div>
      </div>
    </div>
  );
}
