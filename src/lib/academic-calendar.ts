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

/** Boʻsh (hali sozlanmagan) kalendar — yangi foydalanuvchi shu holatdan
    boshlaydi. Onboarding sehrgari yoki Sozlamalar orqali toʻldiriladi.
    `isCalendarConfigured` shu holatni aniqlaydi. */
export const EMPTY_CALENDAR: AcademicYearCalendar = {
  yearLabel: "",
  range: { start: "", end: "" },
  quarters: [],
  holidays: [],
};

/** Kalendar sozlanganmi (yil chegarasi + kamida bitta chorak bor)?
    Boʻsh boʻlsa header/planner "sozlash" holatini koʻrsatadi. */
export function isCalendarConfigured(cal: AcademicYearCalendar): boolean {
  return Boolean(cal.range.start && cal.range.end && cal.quarters.length > 0);
}

/** Bugungi sanadan joriy oʻquv yilining boshlanish yili: iyun (6) va undan
    keyin — shu yil, aks holda oldingi yil. Eager-seed va onboarding sukut
    qiymati shu yordamchidan bitta manba sifatida foydalanadi. */
export function currentAcademicStartYear(now: Date = new Date()): number {
  return now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Berilgan boshlanish yiliga rasmiy struktura boʻyicha kalendar hosil qiladi:
    yil 2-sentabrdan keyingi 25-maygacha; kuzgi 4–9-noyabr, qishki 28-dekabrdan
    10-yanvargacha, bahorgi 21–27-mart taʼtillari; 4 chorak shular orasida.
    Onboarding sehrgari foydalanuvchi yilni tanlagach shu bilan toʻldiradi —
    keyin Sozlamalar → "Oʻquv yili"da tahrirlanadi. */
export function makeCalendarForYear(startYear: number): AcademicYearCalendar {
  const y = startYear;
  const n = startYear + 1;
  return {
    yearLabel: `${y}–${n}`,
    range: { start: `${y}-09-02`, end: `${n}-05-25` },
    quarters: [
      { id: "q1", name: "1-chorak", range: { start: `${y}-09-02`, end: `${y}-11-03` } },
      { id: "q2", name: "2-chorak", range: { start: `${y}-11-10`, end: `${y}-12-27` } },
      { id: "q3", name: "3-chorak", range: { start: `${n}-01-11`, end: `${n}-03-20` } },
      { id: "q4", name: "4-chorak", range: { start: `${n}-03-28`, end: `${n}-05-25` } },
    ],
    holidays: [
      { id: "h-kuz", name: "Kuzgi taʼtil", range: { start: `${y}-11-04`, end: `${y}-11-09` } },
      { id: "h-qish", name: "Qishki taʼtil", range: { start: `${y}-12-28`, end: `${n}-01-10` } },
      { id: "h-bahor", name: "Bahorgi taʼtil", range: { start: `${n}-03-21`, end: `${n}-03-27` } },
    ],
  };
}

/** Foydalanuvchi kalendarda belgilagan yil oraligʻidan kalendar hosil qiladi:
    yil chegaralari — aynan belgilangan boshlanish/tugash sanalari; choraklar
    va taʼtillar boshlanish yiliga qarab rasmiy struktura boʻyicha toʻldiriladi.
    Onboarding sehrgari ishlatadi (oʻqituvchi oʻzi kalendardan belgilaydi) —
    keyin Sozlamalar → "Oʻquv yili"da aniqlashtiriladi.
    startKey/endKey — "YYYY-MM-DD". */
export function makeCalendarForRange(startKey: string, endKey: string): AcademicYearCalendar {
  const [sy, sm] = startKey.split("-").map(Number);
  // Iyun (6) va undan keyin boshlansa — shu yil oʻquv yili boshi, aks holda oldingi yil.
  const startYear = sm >= 6 ? sy : sy - 1;
  const template = makeCalendarForYear(startYear);
  return {
    ...template,
    yearLabel: `${startYear}–${startYear + 1}`,
    range: { start: startKey, end: endKey },
  };
}

/** Kalendarni butun yillar soniga suradi — har sananing yil qismiga `delta`
    qoʻshadi (nom/tuzilma oʻzgarmaydi). "Oldingi oʻquv yilidan nusxa" oqimi
    oʻqituvchi moslashtirgan choraklar va taʼtillarni yangi yilga koʻchirish
    uchun ishlatadi. Sof — React/store'ga bogʻliq emas. */
export function shiftCalendarYears(cal: AcademicYearCalendar, delta: number): AcademicYearCalendar {
  const shiftKey = (k: string) => (k ? `${Number(k.slice(0, 4)) + delta}${k.slice(4)}` : k);
  const shiftRange = (r: DateRange): DateRange => ({ start: shiftKey(r.start), end: shiftKey(r.end) });
  const y1 = cal.range.start ? Number(cal.range.start.slice(0, 4)) + delta : 0;
  const y2 = cal.range.end ? Number(cal.range.end.slice(0, 4)) + delta : 0;
  return {
    yearLabel: y1 && y2 ? (y1 === y2 ? `${y1}` : `${y1}–${y2}`) : "",
    range: shiftRange(cal.range),
    quarters: cal.quarters.map((q) => ({ ...q, range: shiftRange(q.range) })),
    holidays: cal.holidays.map((h) => ({ ...h, range: shiftRange(h.range) })),
  };
}

/** 2025–2026 rasmiy defaultlar — Sozlamalardagi "Standart qiymatlarga qaytarish"
    va boshqa demo/seed kodi uchun. */
export const DEFAULT_CALENDAR_2025_2026: AcademicYearCalendar = makeCalendarForYear(2025);

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

