import { MONTHS_UZ } from "@/lib/localization";
import { dateKeyToDate } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI — yil chegaralari, 4 chorak, taʼtillar

   Sof (React'siz) tiplar va helperlar: store (useCalendarStore) shu
   modelni saqlaydi, isteʼmolchilar (planner, davomat, baholar) esa shu
   helperlar orqali "bu kun dars kunimi / qaysi chorak?" deb soʻraydi.

   Sana solishtirishlari faqat "YYYY-MM-DD" lexikografik tartibda —
   Date/toISOString aralashmaydi (UTC+5 off-by-one xavfi, date-keys.ts).
   ════════════════════════════════════════════════════════════════════ */

export type DateRange = { start: string; end: string }; // inklyuziv "YYYY-MM-DD"
export type Quarter = { id: string; name: string; range: DateRange };
export type Holiday = { id: string; name: string; range: DateRange };

export type AcademicYearCalendar = {
  yearLabel: string; // "2025–2026"
  range: DateRange;
  quarters: Quarter[];
  holidays: Holiday[];
};

/** 2025–2026 rasmiy defaultlar: yil 2-sentabrdan; kuzgi 4–9-noyabr,
    qishki 28-dekabrdan 14 kun, bahorgi 21-martdan 7 kun. */
export const DEFAULT_CALENDAR_2025_2026: AcademicYearCalendar = {
  yearLabel: "2025–2026",
  range: { start: "2025-09-02", end: "2026-05-25" },
  quarters: [
    { id: "q1", name: "1-chorak", range: { start: "2025-09-02", end: "2025-11-03" } },
    { id: "q2", name: "2-chorak", range: { start: "2025-11-10", end: "2025-12-27" } },
    { id: "q3", name: "3-chorak", range: { start: "2026-01-11", end: "2026-03-20" } },
    { id: "q4", name: "4-chorak", range: { start: "2026-03-28", end: "2026-05-25" } },
  ],
  holidays: [
    { id: "h-kuz", name: "Kuzgi taʼtil", range: { start: "2025-11-04", end: "2025-11-09" } },
    { id: "h-qish", name: "Qishki taʼtil", range: { start: "2025-12-28", end: "2026-01-10" } },
    { id: "h-bahor", name: "Bahorgi taʼtil", range: { start: "2026-03-21", end: "2026-03-27" } },
  ],
};

/** Sana diapazon ichidami (ikkala chegara ham inklyuziv). */
export function inRange(dateKey: string, r: DateRange): boolean {
  return dateKey >= r.start && dateKey <= r.end;
}

/** Sana qaysi chorakka tushadi (taʼtil/oraliq boʻlsa null). */
export function getQuarterForDate(cal: AcademicYearCalendar, dateKey: string): Quarter | null {
  return cal.quarters.find((q) => inRange(dateKey, q.range)) ?? null;
}

/** Sana taʼtilga tushadimi (taʼtil chorakdan USTUN tekshiriladi). */
export function getHolidayForDate(cal: AcademicYearCalendar, dateKey: string): Holiday | null {
  return cal.holidays.find((h) => inRange(dateKey, h.range)) ?? null;
}

/** Dars kunimi: oʻquv yili ichida, yakshanba emas va taʼtil emas.
    (Shanba dars kunimi-yoʻqligini jadvalning oʻzi hal qiladi.) */
export function isSchoolDay(cal: AcademicYearCalendar, dateKey: string): boolean {
  if (!inRange(dateKey, cal.range)) return false;
  if (dateKeyToDate(dateKey).getDay() === 0) return false;
  return !getHolidayForDate(cal, dateKey);
}

/** Choraklar roʻyxati (baholar "Choraklik" davri uchun). */
export function quarterRanges(cal: AcademicYearCalendar): Quarter[] {
  return cal.quarters;
}

/** Koʻrilayotgan oy (1-based) tegishli chorak: avval oyning 15-sanasi tushgan
    chorak (chegara oylarida kattaroq qismi qaysi chorakda boʻlsa — oʻsha),
    u boʻlmasa oy bilan kesishgan birinchi chorak. Hech biri boʻlmasa null. */
export function getQuarterForMonth(cal: AcademicYearCalendar, year: number, month: number): Quarter | null {
  const mm = String(month).padStart(2, "0");
  const byMid = getQuarterForDate(cal, `${year}-${mm}-15`);
  if (byMid) return byMid;
  const monthStart = `${year}-${mm}-01`;
  const monthEnd = `${year}-${mm}-31`; // lexikografik yuqori chegara sifatida yetarli
  return cal.quarters.find((q) => q.range.start <= monthEnd && q.range.end >= monthStart) ?? null;
}

/** "2025-09-16" → "16-sentabr". */
export function fmtDayMonthUz(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  const month = MONTHS_UZ[(m || 1) - 1] ?? "";
  return `${d || 1}-${month.toLowerCase()}`;
}

