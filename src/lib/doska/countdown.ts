import {
  diffDaysKeys,
  schoolDaysInRange,
  type AcademicYearCalendar,
} from "@/lib/academic-calendar";
import { addDaysKey } from "@/lib/calendar-core/date-math";

/* ════════════════════════════════════════════════════════════════════
   VOQEA SANOGʻI — «Kuzgi taʼtilgacha 12 kun» (docs/doska-referens-koriklari.md
   R407). Sof hisob, React va serversiz.

   Voqealar QOʻLDA kiritilmaydi — oʻqituvchining oʻquv kalendaridan
   olinadi: taʼtil va bayram boshlanishi, chorak oxiri, oʻquv yili oxiri.
   Kirmagan (mehmon) yoki kalendarsiz oʻqituvchi esa oʻz voqeasini yozadi
   (nom + sana).

   ⚠️ Tiplar SHU YERDA, server amalida emas: `"use server"` fayldan tip
   eksport qilib boʻlmaydi (AGENTS.md).
   ════════════════════════════════════════════════════════════════════ */

export type CountdownEvent = {
  /** Barqaror kalit — vidjet holatida saqlanadi (`eventId`). */
  id: string;
  name: string;
  /** Voqea kuni — "YYYY-MM-DD" (taʼtil/bayram boshlanishi, chorak oxiri). */
  date: string;
};

/** Server javobi: kalendar yoki «yoʻq» (mehmon / sozlanmagan). */
export type DoskaCalendarResult =
  | { status: "ok"; calendar: AcademicYearCalendar }
  | { status: "none" };

/**
 * Kalendardan kelgusi voqealar, sana boʻyicha. Bugun boshlanganlar ham
 * kiradi («bugun!»), oʻtganlari — yoʻq.
 */
export function upcomingEvents(
  cal: AcademicYearCalendar,
  today: string,
  labels: { quarterEnd: (name: string) => string; yearEnd: string },
): CountdownEvent[] {
  const out: CountdownEvent[] = [];
  for (const h of cal.holidays) out.push({ id: `h:${h.id}`, name: h.name, date: h.range.start });
  for (const q of cal.quarters) out.push({ id: `q:${q.id}`, name: labels.quarterEnd(q.name), date: q.range.end });
  if (cal.range.end) out.push({ id: "year-end", name: labels.yearEnd, date: cal.range.end });
  return out.filter((e) => e.date && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Voqeagacha qolgan kunlar. `schoolOnly` — faqat dars kunlari (yakshanba
 * va taʼtilsiz; kalendar boʻlsa). Bugun hisobga kirmaydi, voqea kuni ham:
 * «ertaga taʼtil» = 0 dars kuni qoldi emas, 1 kun qoldi.
 */
export function daysUntil(
  today: string,
  date: string,
  schoolOnly: boolean,
  cal: AcademicYearCalendar | null,
): number {
  const total = diffDaysKeys(today, date);
  if (total <= 0) return 0;
  if (!schoolOnly) return total;
  if (cal) return schoolDaysInRange(cal, { start: addDaysKey(today, 1), end: addDaysKey(date, -1) });
  // Kalendarsiz — faqat yakshanbalar chiqariladi.
  let n = 0;
  for (let d = addDaysKey(today, 1); d < date; d = addDaysKey(d, 1)) {
    if (new Date(`${d}T12:00:00`).getDay() !== 0) n++;
  }
  return n;
}
