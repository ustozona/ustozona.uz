"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS_UZ } from "@/lib/localization";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor, CLASSES } from "@/lib/grades-data";
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
  const cls = CLASSES.find((c) => c.id === classId);
  const hex = cls ? CLASS_COLOR_HEX[classColor(cls)] : "var(--primary)";
  // Bugungi versiya boʻyicha jadval bor-yoʻqligi (checkbox holati uchun)
  const hasTimetable = useMemo(() => weeklySlotsForClass(classId).length > 0, [classId]);

  const initial = value ? dateKeyToDate(value.date) : new Date();
  const [viewY, setViewY] = useState(initial.getFullYear());
  const [viewM, setViewM] = useState(initial.getMonth());
  const [selectedKey, setSelectedKey] = useState<string | null>(value?.date ?? null);
  const [useClassSchedule, setUseClassSchedule] = useState(hasTimetable);
  // Jadval rejimi: bir kunda bir nechta vaqt tanlanishi mumkin (kalit: "start-end").
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // Qoʻlda rejim: bitta boshlanish/tugash.
  const [startMin, setStartMin] = useState<number | null>(value?.startMin ?? null);
  const [endMin, setEndMin] = useState<number | null>(value?.endMin ?? null);
  const slotKey = (s: { startMin: number; endMin: number }) => `${s.startMin}-${s.endMin}`;

  const todayKey = dateToKey(new Date());

  // Oyning kunlar toʻri (oldingi/keyingi oy bilan toʻldirilgan, 6 qator)
  const cells = useMemo(() => {
    const first = new Date(viewY, viewM, 1);
    const startOffset = first.getDay(); // 0=Ya
    const out: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(viewY, viewM, 1 - startOffset + i);
      out.push({ date: d, inMonth: d.getMonth() === viewM });
    }
    return out;
  }, [viewY, viewM]);

  // Har sana OʻZ versiyasining slotlarini koʻradi (versiya chegarasi oyning
  // oʻrtasiga tushishi mumkin) — koʻrinayotgan 42 kun uchun bir marta hisoblanadi.
  const slotsByKey = useMemo(() => {
    const m = new Map<string, ReturnType<typeof slotsOnDate>>();
    for (const { date } of cells) m.set(dateToKey(date), slotsOnDate(classId, date));
    return m;
  }, [cells, classId]);

  const selectedDate = selectedKey ? dateKeyToDate(selectedKey) : null;
  const daySlots = selectedKey
    ? slotsByKey.get(selectedKey) ?? (selectedDate ? slotsOnDate(classId, selectedDate) : [])
    : [];

  const prevMonth = () => { const m = viewM - 1; if (m < 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(m); };
  const nextMonth = () => { const m = viewM + 1; if (m > 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(m); };

  const pickDay = (d: Date) => {
    const key = dateToKey(d);
    setSelectedKey(key);
    if (useClassSchedule) {
      // Sukut boʻyicha oʻsha kunning barcha darslarini belgilab qoʻyamiz.
      setPicked(new Set((slotsByKey.get(key) ?? slotsOnDate(classId, d)).map(slotKey)));
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
      {/* Oy navigatsiyasi */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <CalendarDays className="size-4 text-muted-foreground" />
          {MONTHS_UZ[viewM]} <span className="text-muted-foreground font-medium">{viewY}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ChevronLeft className="size-4" /></button>
          <button onClick={nextMonth} className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Hafta sarlavhalari */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-semibold text-muted-foreground/70 py-1">{w}</div>
        ))}
      </div>

      {/* Kunlar */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date, inMonth }, i) => {
          const key = dateToKey(date);
          const hasSlot = inMonth && (slotsByKey.get(key)?.length ?? 0) > 0;
          const isSel = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <button
              key={i}
              onClick={() => pickDay(date)}
              className={cn(
                "relative h-8 rounded-md text-xs flex items-center justify-center transition-colors",
                !inMonth && "text-muted-foreground/30",
                inMonth && !isSel && "text-foreground hover:bg-muted",
                isToday && !isSel && "ring-1 ring-border",
              )}
              style={isSel ? { backgroundColor: hex, color: "#fff" } : hasSlot ? { backgroundColor: `color-mix(in srgb, ${hex} 14%, transparent)` } : undefined}
            >
              {date.getDate()}
              {hasSlot && !isSel && (
                <span className="absolute bottom-1 size-1 rounded-full" style={{ backgroundColor: hex }} />
              )}
            </button>
          );
        })}
      </div>

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
        Sinf jadvalidan
        {!hasTimetable && <span className="text-xs text-muted-foreground">(jadval yoʻq)</span>}
      </label>

      {/* Vaqt tanlash */}
      {useClassSchedule ? (
        <div className="mt-2.5">
          {!selectedKey ? (
            <p className="text-xs text-muted-foreground py-2">Kun tanlang — jadvaldagi darslar chiqadi.</p>
          ) : daySlots.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Bu kuni bu sinfda dars yoʻq. Boshqa kun tanlang yoki belgini olib qoʻlda kiriting.</p>
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
          <label className="text-xs text-muted-foreground">Boshlanish
            <select value={startMin ?? ""} onChange={(e) => setStartMin(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground">
              <option value="" disabled>Tanlang</option>
              {MANUAL_TIMES.map((m) => <option key={m} value={m}>{fmtClock(m)}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Tugash
            <select value={endMin ?? ""} onChange={(e) => setEndMin(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground">
              <option value="" disabled>Tanlang</option>
              {MANUAL_TIMES.map((m) => <option key={m} value={m}>{fmtClock(m)}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* Amallar */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors">Bekor</button>
        <button
          disabled={!canAdd}
          onClick={submit}
          className="px-3.5 py-1.5 rounded-md text-sm font-medium text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: hex }}
        >
          {useClassSchedule && picked.size > 1 ? `Qoʻshish (${picked.size})` : "Qoʻshish"}
        </button>
      </div>
    </div>
  );
}
