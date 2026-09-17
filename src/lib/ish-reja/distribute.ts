import type { TimetableEvent } from "@/lib/timetable";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   MAVZULARNI JADVALGA TAQSIMLASH — sof funksiya.

   Tartib raqami qoidasi: N-mavzu sinfning `fromKey` dan keyingi N-boʻsh
   dars slotiga tushadi. Kunlar ketma-ket koʻriladi; slotlar oʻsha kuni
   amalda boʻlgan jadval versiyasidan olinadi. Oʻquv yilidan tashqari,
   taʼtil va allaqachon band (boshqa dars joylangan) slotlar oʻtkaziladi.
   ════════════════════════════════════════════════════════════════════ */

export type PlannedSlot = { date: string; startMin: number; endMin: number };

export type DistributeInput = {
  classId: string;
  count: number;
  /** Birinchi koʻriladigan kun ("YYYY-MM-DD"). */
  fromKey: string;
  /** Oxirgi kun (odatda oʻquv yili tugashi). */
  toKey: string;
  /** Sanada amalda boʻlgan jadval hodisalari. */
  eventsForDate: (dateKey: string) => TimetableEvent[];
  isHoliday: (dateKey: string) => boolean;
  /** Band slot kaliti: `slotKey(date, startMin)`. */
  occupied: Set<string>;
};

export const slotKey = (date: string, startMin: number) => `${date}|${startMin}`;

/** Sinfning shu kundagi jadval slotlari (vaqt boʻyicha). Jadval: day 1=Du … 6=Sha. */
export function classSlotsOn(events: TimetableEvent[], classId: string, dateKey: string): TimetableEvent[] {
  const jsDay = dateKeyToDate(dateKey).getDay();
  return events
    .filter((e) => e.classId === classId && e.day === jsDay)
    .sort((a, b) => a.startMin - b.startMin);
}

/** Har mavzu uchun slot yoki `null` (sigʻmadi). Uzunligi = `count`. */
export function distributeTopics(input: DistributeInput): (PlannedSlot | null)[] {
  const { classId, count, fromKey, toKey, eventsForDate, isHoliday, occupied } = input;
  const out: PlannedSlot[] = [];
  if (fromKey && toKey) {
    for (let key = fromKey; key <= toKey && out.length < count; key = addDaysKey(key, 1)) {
      if (isHoliday(key)) continue;
      for (const e of classSlotsOn(eventsForDate(key), classId, key)) {
        if (out.length >= count) break;
        if (occupied.has(slotKey(key, e.startMin))) continue;
        out.push({ date: key, startMin: e.startMin, endMin: e.endMin });
      }
    }
  }
  return Array.from({ length: count }, (_, i) => out[i] ?? null);
}
