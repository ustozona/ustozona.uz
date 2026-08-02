import { MONTHS_UZ } from "@/lib/localization";
import { dateKeyToDate, addDaysKey } from "@/lib/date-keys";

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
/** Bloklangan kun turi — faqat YORLIQ (rang/ikonka) uchun; hisob-kitobda
    uchalasi bir xil: dars kuni emas. Ed-Fi School Calendar domenidagi
    CalendarEvent turlari (Holiday / Teacher only day / Weather day) bilan
    bir xil yondashuv. Yoʻq boʻlsa "vacation" deb qaraladi. */
export type BlockedKind = "vacation" | "holiday" | "other";

/** Bloklangan kunlar diapazoni (taʼtil, bayram, boshqa dars boʻlmaydigan kun). */
export type Holiday = { id: string; name: string; range: DateRange; kind?: BlockedKind };

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

/** Kalendar sozlanganmi — FAQAT yil chegarasi talab qilinadi.
    Baholash davrlari (chorak/semestr) IXTIYORIY: davrsiz ishlaydigan
    oʻqituvchi ham (kurs, toʻgarak, repetitorlik) toʻliq funksiyani
    oladi — jurnal butun yilni bitta davr deb hisoblaydi. */
export function isCalendarConfigured(cal: AcademicYearCalendar): boolean {
  return Boolean(cal.range.start && cal.range.end);
}

/* ── Baholash davrlari (chorak / semestr / trimestr) ─────────────────── */

/** Davr shabloni. "none" — davrsiz: jurnal butun oʻquv yilini bitta davr
    sifatida koʻradi (Google Classroom'dagi "grading periods" ixtiyoriyligi
    bilan bir xil yondashuv). */
export type PeriodPreset = "quarters" | "semesters" | "trimesters" | "none";

/** Har shablon uchun davrlar soni va oʻzbekcha nom shakli. */
const PRESET_SPECS: Record<Exclude<PeriodPreset, "none">, { count: number; unit: string }> = {
  quarters: { count: 4, unit: "chorak" },
  semesters: { count: 2, unit: "semestr" },
  trimesters: { count: 3, unit: "trimestr" },
};

/** Berilgan oraliqni shablon boʻyicha teng davrlarga boʻladi.
    Sanalar taqvim kunlari boʻyicha teng taqsimlanadi — oʻqituvchi keyin
    har chegarani qoʻlda aniqlashtiradi (taʼtillarga moslash uchun).
    "none" → boʻsh roʻyxat. */
export function makePeriodsForRange(range: DateRange, preset: PeriodPreset): Quarter[] {
  if (preset === "none" || !range.start || !range.end) return [];
  const { count, unit } = PRESET_SPECS[preset];
  const total = daysInRange(range);
  if (total < count) return [];
  const per = Math.floor(total / count);
  const out: Quarter[] = [];
  for (let i = 0; i < count; i++) {
    const start = addDaysKey(range.start, i * per);
    const end = i === count - 1 ? range.end : addDaysKey(range.start, (i + 1) * per - 1);
    out.push({ id: `p${i + 1}-${Date.now().toString(36)}`, name: `${i + 1}-${unit}`, range: { start, end } });
  }
  return out;
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

/** Ikki sana kaliti orasidagi kunlar soni (b − a, ishorali). */
export function diffDaysKeys(a: string, b: string): number {
  return Math.round((dateKeyToDate(b).getTime() - dateKeyToDate(a).getTime()) / 86_400_000);
}

/** Berilgan chorak chegarasi (`boundary`) bevosita yonidagi taʼtilni topadi —
    "start" bosilsa chorakdan OLDIN tugaydigan, "end" bosilsa chorakdan KEYIN
    boshlanadigan taʼtil. Chegara surilganda shu taʼtilni ham surish taklifi uchun. */
export function findAdjacentHoliday(
  cal: AcademicYearCalendar,
  quarterRange: DateRange,
  boundary: "start" | "end"
): Holiday | null {
  if (boundary === "start") {
    const dayBefore = addDaysKey(quarterRange.start, -1);
    return cal.holidays.find((h) => h.range.end === dayBefore) ?? null;
  }
  const dayAfter = addDaysKey(quarterRange.end, 1);
  return cal.holidays.find((h) => h.range.start === dayAfter) ?? null;
}

/* ── Bloklangan kunlar (taqvimdan belgilash) ─────────────────────────── */

/** Barcha bloklangan kun kalitlari (diapazonlar yoyilgan holda), tartiblangan.
    Taqvim koʻrinishida qaysi kun belgilanganini koʻrsatish uchun. */
export function blockedDateKeys(cal: AcademicYearCalendar): string[] {
  const out = new Set<string>();
  for (const h of cal.holidays) {
    if (!h.range.start || !h.range.end || h.range.end < h.range.start) continue;
    for (let k = h.range.start; k <= h.range.end; k = addDaysKey(k, 1)) out.add(k);
  }
  return [...out].sort();
}

/** Ketma-ket sana kalitlarini diapazonlarga birlashtiradi. */
function mergeKeysToRanges(keys: string[]): DateRange[] {
  const sorted = [...new Set(keys)].sort();
  const out: DateRange[] = [];
  for (const k of sorted) {
    const last = out[out.length - 1];
    if (last && addDaysKey(last.end, 1) === k) last.end = k;
    else out.push({ start: k, end: k });
  }
  return out;
}

/** Taqvimda belgilangan kunlar toʻplamini bloklangan diapazonlarga aylantiradi.

    Mavjud NOMLANGAN diapazonlar saqlanadi: har biri ichidagi hali belgilangan
    ketma-ket qismlarga qisqaradi (nom birinchi qismda qoladi), butunlay
    belgilanmagani esa oʻchadi. Hech qaysi mavjud diapazonga tegishli
    boʻlmagan yangi kunlar `defaultName` bilan yangi diapazonlarga birlashadi.

    Shu bois oʻqituvchi "Qishki taʼtil"dan bir kunni yechsa ham nom yoʻqolmaydi. */
export function applyBlockedDays(
  cal: AcademicYearCalendar,
  keys: string[],
  defaultName: string
): Holiday[] {
  const set = new Set(keys);
  const used = new Set<string>();
  const out: Holiday[] = [];

  for (const h of cal.holidays) {
    if (!h.range.start || !h.range.end || h.range.end < h.range.start) continue;
    const runs: DateRange[] = [];
    let start: string | null = null;
    let prev: string | null = null;
    for (let k = h.range.start; k <= h.range.end; k = addDaysKey(k, 1)) {
      if (set.has(k)) {
        if (start === null) start = k;
        prev = k;
        used.add(k);
      } else if (start !== null) {
        runs.push({ start, end: prev! });
        start = null;
      }
    }
    if (start !== null) runs.push({ start, end: prev! });
    runs.forEach((range, i) =>
      out.push({
        ...h,
        id: i === 0 ? h.id : `${h.id}-${i + 1}`,
        name: i === 0 ? h.name : `${h.name} (${i + 1})`,
        range,
      })
    );
  }

  const stamp = Date.now().toString(36);
  mergeKeysToRanges(keys.filter((k) => !used.has(k))).forEach((range, i) =>
    out.push({ id: `b-${stamp}-${i}`, name: defaultName, range, kind: "other" })
  );

  return out.sort((a, b) => a.range.start.localeCompare(b.range.start));
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

/** Diapazondagi kunlar soni (inklyuziv). */
export function daysInRange(r: DateRange): number {
  if (!r.start || !r.end) return 0;
  return Math.max(Math.round((dateKeyToDate(r.end).getTime() - dateKeyToDate(r.start).getTime()) / 86_400_000) + 1, 0);
}

/** Diapazondagi dars kunlari soni (taʼtil va yakshanbalarsiz, `cal.range` ichida). */
export function schoolDaysInRange(cal: AcademicYearCalendar, r: DateRange): number {
  if (!r.start || !r.end) return 0;
  let count = 0;
  let cursor = r.start;
  while (cursor <= r.end) {
    if (isSchoolDay(cal, cursor)) count++;
    cursor = addDaysKey(cursor, 1);
  }
  return count;
}

export type CalendarIssue = {
  message: string;
  /** Qaysi qatorga bogʻlanadi — SettingRow shu xabarni oʻz ichida koʻrsatadi. */
  target: { kind: "year" } | { kind: "quarter"; id: string } | { kind: "holiday"; id: string };
};

/** Kalendarni tekshiradi: chorak/taʼtil diapazon buzilishi, yil chegarasidan chiqish,
    choraklar orasidagi kesishuv, chorak↔taʼtil kesishuvi. Bloklamaydi — faqat ogohlantiradi,
    har xabar aynan aybdor qatorga bogʻlanadi (UI shu boʻyicha inline koʻrsatadi). */
export function validateCalendar(cal: AcademicYearCalendar): CalendarIssue[] {
  const issues: CalendarIssue[] = [];

  for (const q of cal.quarters) {
    if (q.range.end < q.range.start)
      issues.push({ message: "Tugash sanasi boshlanishidan oldin.", target: { kind: "quarter", id: q.id } });
    if (!inRange(q.range.start, cal.range) || !inRange(q.range.end, cal.range))
      issues.push({ message: "Oʻquv yili chegarasidan chiqib ketgan.", target: { kind: "quarter", id: q.id } });
  }
  for (let i = 0; i < cal.quarters.length; i++)
    for (let j = i + 1; j < cal.quarters.length; j++) {
      const a = cal.quarters[i];
      const b = cal.quarters[j];
      if (a.range.start <= b.range.end && b.range.start <= a.range.end) {
        issues.push({ message: `${b.name} bilan kesishyapti.`, target: { kind: "quarter", id: a.id } });
        issues.push({ message: `${a.name} bilan kesishyapti.`, target: { kind: "quarter", id: b.id } });
      }
    }
  for (const h of cal.holidays) {
    if (h.range.end < h.range.start)
      issues.push({ message: "Tugash sanasi boshlanishidan oldin.", target: { kind: "holiday", id: h.id } });
    for (const q of cal.quarters) {
      if (h.range.start <= q.range.end && q.range.start <= h.range.end)
        issues.push({ message: `${q.name} bilan kesishyapti.`, target: { kind: "holiday", id: h.id } });
    }
  }
  return issues;
}

