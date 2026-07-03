import type { TimetableEvent } from "@/lib/timetable";
import { schoolClassForGradesId } from "@/lib/class-bridge";
import { getTimetableForDate } from "@/store/useTimetableStore";
import { dateToKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   DARS REJALASHTIRISH KOʻPRIGI

   Dars muharriridagi "Jadval" boʻlimi uchun: oʻqituvchining haftalik
   jadvalidagi (timetable) slotlarni grades-data sinf idʼsi boʻyicha
   oʻqiydi. Jadval endi VERSIYALANGAN (useTimetableStore) — sana
   berilsa oʻsha kuni amalda boʻlgan versiya slotlari qaytadi;
   class-bridge orqali matnli id ("9-a") ↔ raqamli sinf bogʻlanadi.
   ════════════════════════════════════════════════════════════════════ */

// Sana yordamchilari kanonik joyi — lib/date-keys.ts (bu yerda back-compat re-export).
export { dateKeyToDate, dateToKey } from "@/lib/date-keys";

/** Sanada amalda boʻlgan jadval hodisalari (default: bugun). */
export function readTimetableEvents(dateKey?: string): TimetableEvent[] {
  return getTimetableForDate(dateKey ?? dateToKey(new Date()));
}

/** Berilgan grades-sinf ("9-a") uchun haftalik slotlar (day: 1=Du…6=Sh).
    `dateKey` berilsa — oʻsha kuni amalda boʻlgan versiya jadvalidan. */
export function weeklySlotsForClass(gradesClassId: string, dateKey?: string): TimetableEvent[] {
  const sc = schoolClassForGradesId(gradesClassId);
  if (!sc) return [];
  return readTimetableEvents(dateKey)
    .filter((e) => e.classId === sc.id)
    .sort((a, b) => a.day - b.day || a.startMin - b.startMin);
}

/** Berilgan kunda (JS Date) shu sinfga mos slotlar (day === getDay, Du..Sh=1..6).
    `slots` berilmasa OʻSHA SANA versiyasidan olinadi — versiya chegarasidan
    oldingi/keyingi kunlar har xil jadval koʻrishi mumkin. */
export function slotsOnDate(gradesClassId: string, date: Date, slots?: TimetableEvent[]): TimetableEvent[] {
  const wk = slots ?? weeklySlotsForClass(gradesClassId, dateToKey(date));
  const day = date.getDay(); // 0=Yakshanba … 1=Dushanba … 6=Shanba
  return wk.filter((e) => e.day === day);
}

/** Daqiqa → "9:00 AM" koʻrinishi. */
export function fmtClock(min: number): string {
  let h = Math.floor(min / 60);
  const mm = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ap}`;
}
