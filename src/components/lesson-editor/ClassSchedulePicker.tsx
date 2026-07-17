"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { MONTHS_UZ } from "@/lib/localization";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor } from "@/lib/grades-data";
import { useLiveClassInfo } from "@/hooks/useLiveClasses";
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

type Value = { date: string; startMin: number; endMin: number };

export default function ClassSchedulePicker({
  classId, value, onSubmit, onCancel,
}: {
  classId: string;
  value?: Value;
  onSubmit: (date: string, sessions: { startMin: number; endMin: number }[]) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("ClassSchedulePicker");
  const cls = useLiveClassInfo(classId);
  const hex = cls ? CLASS_COLOR_HEX[classColor(cls)] : "var(--primary)";
  // Bugungi versiya boʻyicha jadval bor-yoʻqligi (checkbox holati uchun)
  const hasTimetable = useMemo(() => weeklySlotsForClass(classId).length > 0, [classId]);

  const initial = value ? dateKeyToDate(value.date) : new Date();
  const [viewMonth, setViewMonth] = useState<Date>(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(value?.date ?? null);
  const [useClassSchedule, setUseClassSchedule] = useState(hasTimetable);
  // Jadval rejimi: bir kunda bir nechta vaqt tanlanishi mumkin (kalit: "start-end").
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // Qoʻlda rejim: bitta boshlanish/tugash.
  const [startMin, setStartMin] = useState<number | null>(value?.startMin ?? null);
  const [endMin, setEndMin] = useState<number | null>(value?.endMin ?? null);
  const slotKey = (s: { startMin: number; endMin: number }) => `${s.startMin}-${s.endMin}`;

  const selectedDate = selectedKey ? dateKeyToDate(selectedKey) : undefined;
  const daySlots = selectedDate ? slotsOnDate(classId, selectedDate) : [];

  // Kalendar modifikatori: sinf jadvalida dars boʻlgan kunlar (har sana OʻZ
  // versiyasining slotlarini koʻradi — versiya chegarasi oy oʻrtasiga tushishi mumkin).
  const hasSlotOnDate = (date: Date) => slotsOnDate(classId, date).length > 0;

  const pickDay = (d: Date) => {
    const key = dateToKey(d);
    setSelectedKey(key);
    if (useClassSchedule) {
      // Sukut boʻyicha oʻsha kunning barcha darslarini belgilab qoʻyamiz.
      setPicked(new Set(slotsOnDate(classId, d).map(slotKey)));
    }
  };
  const toggleSlot = (s: { startMin: number; endMin: number }) =>
    setPicked((prev) => { const n = new Set(prev); const k = slotKey(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const canAdd = useClassSchedule
    ? !!selectedKey && picked.size > 0
    : !!selectedKey && startMin != null && endMin != null && endMin > startMin;
  const submit = () => {
    if (!canAdd || !selectedKey) return;
    const sessions = useClassSchedule
      ? [...picked].map((k) => { const [a, b] = k.split("-").map(Number); return { startMin: a, endMin: b }; })
      : [{ startMin: startMin!, endMin: endMin! }];
    onSubmit(selectedKey, sessions);
  };

  return (
    <div className="w-[300px] p-3">
      {/* Kalendar — sinf jadvalida dars boʻlgan kunlar sinf rangida ajratiladi */}
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
        modifiers={{ hasSlot: hasSlotOnDate }}
        components={{
          DayButton: (p: React.ComponentProps<typeof CalendarDayButton>) => {
            const isSel = !!p.modifiers.selected;
            const hasSlot = !!p.modifiers.hasSlot;
            return (
              <CalendarDayButton
                {...p}
                style={
                  isSel
                    ? { backgroundColor: hex, color: "#fff" }
                    : hasSlot
                      ? { backgroundColor: `color-mix(in srgb, ${hex} 14%, transparent)` }
                      : undefined
                }
              >
                {p.children}
                {hasSlot && !isSel && (
                  <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full" style={{ backgroundColor: hex }} />
                )}
              </CalendarDayButton>
            );
          },
        }}
        className="w-full p-0 [--cell-size:--spacing(8)]"
      />

      {/* Jadval rejimi */}
      <label className={cn("flex items-center gap-2 mt-3 text-sm select-none", hasTimetable ? "cursor-pointer" : "opacity-40 cursor-not-allowed")}>
        <span
          className={cn("size-4 rounded border flex items-center justify-center shrink-0", useClassSchedule ? "border-transparent" : "border-border")}
          style={useClassSchedule ? { backgroundColor: hex } : undefined}
        >
          {useClassSchedule && <Check className="size-3 text-white" />}
        </span>
        <input type="checkbox" className="sr-only" checked={useClassSchedule} disabled={!hasTimetable}
          onChange={(e) => setUseClassSchedule(e.target.checked)} />
        {t("fromClassSchedule")}
        {!hasTimetable && <span className="text-xs text-muted-foreground">{t("noSchedule")}</span>}
      </label>

      {/* Vaqt tanlash */}
      {useClassSchedule ? (
        <div className="mt-2.5">
          {!selectedKey ? (
            <p className="text-xs text-muted-foreground py-2">{t("pickDayHint")}</p>
          ) : daySlots.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">{t("noLessonThisDay")}</p>
          ) : (
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {daySlots.map((s) => {
                const on = picked.has(slotKey(s));
                return (
                  <button key={s.id}
                    onClick={() => toggleSlot(s)}
                    className={cn("w-full flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                      on ? "border-transparent text-white" : "border-border hover:bg-muted text-foreground")}
                    style={on ? { backgroundColor: hex } : undefined}
                  >
                    <span>{fmtClock(s.startMin)} – {fmtClock(s.endMin)}</span>
                    {on && <Check className="size-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">{t("start")}
            <select value={startMin ?? ""} onChange={(e) => setStartMin(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground">
              <option value="" disabled>{t("select")}</option>
              {MANUAL_TIMES.map((m) => <option key={m} value={m}>{fmtClock(m)}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">{t("end")}
            <select value={endMin ?? ""} onChange={(e) => setEndMin(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground">
              <option value="" disabled>{t("select")}</option>
              {MANUAL_TIMES.map((m) => <option key={m} value={m}>{fmtClock(m)}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* Amallar */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors">{t("cancel")}</button>
        <button
          disabled={!canAdd}
          onClick={submit}
          className="px-3.5 py-1.5 rounded-md text-sm font-medium text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: hex }}
        >
          {useClassSchedule && picked.size > 1 ? t("addCount", { count: picked.size }) : t("add")}
        </button>
      </div>
    </div>
  );
}
