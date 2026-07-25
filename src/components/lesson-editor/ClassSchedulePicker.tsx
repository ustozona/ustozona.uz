"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useMemo, useState } from "react";
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
  slotsOnDate, dateToKey, dateKeyToDate, fmtClock,
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
    ikki-ustunli qolipi). Kun tanlangach, sinfning haftalik jadvalidagi
    vaqt(lar) taklif sifatida koʻrsatiladi ("Shu vaqtni olish" bosilsa
    pastdagi Boshlanish/Tugash maydonlari toʻldiriladi); qoʻlda kiritish
    maydonlari har doim ochiq — rejim almashtirish shart emas. */
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

  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Tasdiq/qoʻlda-kiritish holati — Start/End tanlanadigan sessiya.
  const [draft, setDraft] = useState<Session | null>(null);

  const selectedDate = selectedKey ? dateKeyToDate(selectedKey) : undefined;

  // Barcha biriktirilgan sinflarning shu kundagi jadval taklifi (vaqt boʻyicha tartiblangan).
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
    setDraft(null);
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
        {!selectedDate ? (
          <p className="text-xs text-muted-foreground">{t("pickDayHint")}</p>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
            <span className="text-sm font-semibold text-foreground">
              {t("daySelected", { date: `${selectedDate.getDate()}-${MONTHS_UZ_SHORT[selectedDate.getMonth()]}` })}
            </span>

            {/* Jadval taklifi — bosilsa pastdagi vaqt maydonlari toʻldiriladi */}
            {daySlots.length > 0 && (
              <div className="space-y-1.5">
                {daySlots.map((s) => {
                  const hex = hexOf(s.classId);
                  const active = draft?.classId === s.classId && draft.startMin === s.startMin && draft.endMin === s.endMin;
                  return (
                    <div key={`${s.classId}-${s.startMin}`}
                      className="rounded-lg border px-3 py-2"
                      style={active ? { borderColor: hex, backgroundColor: `color-mix(in srgb, ${hex} 8%, transparent)` } : { borderColor: "var(--border)" }}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <ClassSwatch hex={hex} className="size-2.5 shrink-0" /> {t("scheduleSuggestion", { class: nameOf(s.classId) })}
                      </span>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{fmtClock(s.startMin)} – {fmtClock(s.endMin)}</span>
                        <button type="button" onClick={() => setDraft(s)}
                          className="shrink-0 text-xs font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
                          style={{ color: hex }}
                        >
                          {t("useThisTime")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Qoʻlda kiritish — doim mavjud */}
            <div className="space-y-2.5">
              <span className="text-xs text-muted-foreground">
                {daySlots.length > 0 ? t("orEnterTime") : null}
              </span>

              {classIds.length > 1 && (
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
              )}

              <div className="flex items-center gap-2">
                <Select
                  value={draft?.startMin ? String(draft.startMin) : undefined}
                  onValueChange={(v) => setDraft((prev) => ({ classId: prev?.classId ?? classIds[0], startMin: Number(v), endMin: prev?.endMin ?? 0 }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder={t("start")} /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {MANUAL_TIMES.map((m) => <SelectItem key={m} value={String(m)}>{fmtClock(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground shrink-0">–</span>
                <Select
                  value={draft?.endMin ? String(draft.endMin) : undefined}
                  onValueChange={(v) => setDraft((prev) => ({ classId: prev?.classId ?? classIds[0], startMin: prev?.startMin ?? 0, endMin: Number(v) }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder={t("end")} /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {MANUAL_TIMES.map((m) => <SelectItem key={m} value={String(m)}>{fmtClock(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
