"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { uz } from "date-fns/locale";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MONTHS_UZ, MONTHS_UZ_SHORT } from "@/lib/localization";
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
    ikki-ustunli qolipi). Agar biriktirilgan sinf(lar)da haftalik jadval
    boʻlsa — kalendarda FAQAT shu jadvalga mos kunlar tanlanadi (boshqa
    kunlar oʻchiq), vaqt avtomatik jadvaldan olinadi. Hech bir sinfda
    jadval boʻlmasagina qoʻlda sana/vaqt kiritishga ruxsat beriladi. */
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

  // Biriktirilgan sinflardan hech boʻlmasa bittasida haftalik jadval bormi?
  // Bor boʻlsa — kalendar shu jadvalga "qulflanadi" (faqat mos kunlar tanlanadi).
  const hasTimetable = useMemo(
    () => classIds.some((id) => weeklySlotsForClass(id).length > 0),
    [classIds],
  );

  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Tasdiq/qoʻlda-kiritish holati — Start/End tanlanadigan sessiya.
  const [draft, setDraft] = useState<Session | null>(null);

  const selectedDate = selectedKey ? dateKeyToDate(selectedKey) : undefined;

  // Barcha biriktirilgan sinflarning shu kundagi jadval slotlari (vaqt boʻyicha tartiblangan).
  const daySlots = useMemo<Session[]>(() => {
    if (!selectedDate) return [];
    const out: Session[] = [];
    classIds.forEach((id) => {
      slotsOnDate(id, selectedDate).forEach((s) => out.push({ classId: id, startMin: s.startMin, endMin: s.endMin }));
    });
    return out.sort((a, b) => a.startMin - b.startMin);
  }, [selectedDate, classIds]);

  // Kalendar kunlarida — shu kuni dars boʻlgan sinflarning ranglari (koʻp boʻlsa boʻlingan fon).
  const classesOnDate = (date: Date) => {
    const ids = new Set<string>();
    classIds.forEach((id) => { if (slotsOnDate(id, date).length > 0) ids.add(id); });
    return [...ids];
  };

  const pickDay = (d: Date) => {
    setSelectedKey(dateToKey(d));
    if (hasTimetable) {
      // Jadval bor — vaqt(lar) avtomatik olinadi. Bitta boʻlsa toʻgʻridan-toʻgʻri
      // tanlanadi, bir nechta boʻlsa (masalan koʻp sinf) roʻyxatdan tanlash kerak.
      const slots: Session[] = [];
      classIds.forEach((id) => {
        slotsOnDate(id, d).forEach((s) => slots.push({ classId: id, startMin: s.startMin, endMin: s.endMin }));
      });
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
          disabled={hasTimetable ? (date: Date) => classesOnDate(date).length === 0 : undefined}
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
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
          {selectedDate && (
            <span className="text-sm font-semibold text-foreground">
              {t("daySelected", { date: `${selectedDate.getDate()}-${MONTHS_UZ_SHORT[selectedDate.getMonth()]}` })}
            </span>
          )}

          {/* "Available Times" — shu kuni bir nechta dars (koʻp sinf) boʻlsa, birini tanlash. */}
          {selectedDate && hasTimetable && !draft && daySlots.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-overline text-muted-foreground">{t("availableTimes")}</span>
              {daySlots.map((s) => {
                const hex = hexOf(s.classId);
                return (
                  <button key={`${s.classId}-${s.startMin}`} type="button" onClick={() => setDraft(s)}
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
          )}

          {/* Sinf koʻrsatkichi — faqat bir nechta sinf boʻlsa kerak. */}
          {(!selectedDate || !hasTimetable || draft || daySlots.length <= 1) && classIds.length > 1 && (
            hasTimetable && draft && daySlots.length > 1 ? (
              /* Roʻyxatdan tanlangan sinf — ajratib koʻrsatilgan karta, bosilsa roʻyxatga qaytadi. */
              <button type="button" onClick={() => setDraft(null)}
                className="w-full rounded-lg border-2 px-3 py-2 text-left transition-colors"
                style={{ borderColor: hexOf(draft.classId), backgroundColor: `color-mix(in srgb, ${hexOf(draft.classId)} 8%, transparent)` }}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: hexOf(draft.classId) }}>
                  <ClassSwatch hex={hexOf(draft.classId)} className="size-2.5 shrink-0" /> {nameOf(draft.classId)}
                </span>
              </button>
            ) : !hasTimetable ? (
              /* Jadvalsiz koʻp-sinfli holat — erkin almashtiriladigan chiplar. */
              <div className="flex flex-wrap gap-1.5">
                {classIds.map((id) => {
                  const hex = hexOf(id);
                  const on = (draft?.classId ?? classIds[0]) === id;
                  return (
                    <button key={id} type="button"
                      onClick={() => setDraft((prev) => ({ classId: id, startMin: prev?.startMin ?? 0, endMin: prev?.endMin ?? 0 }))}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors"
                      style={on
                        ? { borderColor: hex, backgroundColor: `color-mix(in srgb, ${hex} 12%, transparent)`, color: hex }
                        : { borderColor: "var(--border)" }}
                    >
                      <ClassSwatch hex={hex} className="size-2 shrink-0" /> {nameOf(id)}
                    </button>
                  );
                })}
              </div>
            ) : null
          )}

          {/* Start time / End time — "Available Times" roʻyxati ochiq boʻlmasa doim koʻrinadi, sinf/kun tanlangach avtomatik toʻldiriladi, hamon qoʻlda oʻzgartsa boʻladi. */}
          {!(selectedDate && hasTimetable && !draft && daySlots.length > 1) && (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-foreground flex items-center gap-1.5 mb-1">
                  <Clock className="size-3.5 text-muted-foreground" /> {t("start")}
                </span>
                <Select
                  disabled={!selectedDate}
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
                  disabled={!selectedDate}
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
        </div>

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
