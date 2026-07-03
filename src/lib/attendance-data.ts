import type { ClassColor } from "@/lib/class-colors";
import {
  isSchoolDay,
  type AcademicYearCalendar, type DateRange,
} from "@/lib/academic-calendar";
import {
  resolveVersionForDate, type TimetableVersion,
} from "@/lib/timetable-versions";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";

// Davomat holati endi erkin satr — built-in + foydalanuvchi yaratgan maxsus
// holatlar bitta modelda. "unmarked" — yozuv yoʻqligini bildiruvchi sentinel.
export type AttendanceStatus = string;

/** Holatning davomat foiziga taʼsiri (referensdagi "score impact") */
export type ScoreImpact = "positive" | "negative" | "neutral";

/**
 * Davomat holati taʼrifi. Built-in 4 ta holat semantik tokenlardan
 * (success/destructive/warning/info) rang oladi; maxsus holatlar sinf rang
 * palitrasidan (ClassColor → classTints) — ikkalasi ham dizayn tizimida.
 */
export type AttendanceStatusDef = {
  key: string;
  label: string;
  /** Lucide ikona nomi — UI qatlamida komponentga map qilinadi */
  icon: string;
  scoreImpact: ScoreImpact;
  active: boolean;
  builtIn: boolean;
  /** Built-in uchun semantik tone, maxsus uchun ClassColor */
  tone: "success" | "destructive" | "warning" | "info" | ClassColor;
};

/** Har sinf shu 4 ta built-in holatdan boshlanadi (referens bilan bir xil) */
export const BUILTIN_STATUSES: AttendanceStatusDef[] = [
  { key: "present", label: "Keldi", icon: "check", scoreImpact: "positive", active: true, builtIn: true, tone: "success" },
  { key: "absent", label: "Kelmadi", icon: "x", scoreImpact: "negative", active: true, builtIn: true, tone: "destructive" },
  { key: "late", label: "Kechikdi", icon: "clock", scoreImpact: "positive", active: true, builtIn: true, tone: "warning" },
  { key: "excused", label: "Sababli", icon: "file", scoreImpact: "neutral", active: true, builtIn: true, tone: "info" },
];

export type AttendanceRecord = {
  studentId: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  note?: string;
};

export type LessonDay = {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0=Sun..6=Sat
};

// Sanani MAHALLIY kalendar boʻyicha "YYYY-MM-DD" ga formatlash.
// toISOString() UTC'ga oʻtkazadi → UTC+ mintaqalarda kun -1 ga suriladi
// (mas. 1-aprel → 31-mart), bu chorak chegarasini buzadi.
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Dars kunlarini JADVAL + KALENDARdan hisoblash: diapazondagi har bir kun uchun
 * (1) `isSchoolDay` — oʻquv yili ichida, yakshanba emas, taʼtil emas; va
 * (2) oʻsha SANADA amalda boʻlgan jadval versiyasida shu sinfning darsi bor —
 * ikkalasi ham bajarilsa kun roʻyxatga kiradi. Jadval versiyalangani uchun yil
 * oʻrtasida dars kuni koʻchsa (mas. chorshanba → payshanba) tarix buzilmaydi.
 * Jadval eventlari endi jonli sinf id'siga bogʻlangan — toʻgʻridan solishtiramiz.
 */
export function deriveLessonDays(
  classId: string,
  range: DateRange,
  calendar: AcademicYearCalendar,
  versions: TimetableVersion[]
): LessonDay[] {
  if (versions.length === 0 || range.start > range.end) return [];
  const days: LessonDay[] = [];
  for (let key = range.start; key <= range.end; key = addDaysKey(key, 1)) {
    if (!isSchoolDay(calendar, key)) continue;
    const dow = dateKeyToDate(key).getDay(); // Du..Sh = 1..6 — jadvaldagi `day` bilan bir xil
    const version = resolveVersionForDate(versions, key);
    if (version?.events.some((e) => e.classId === classId && e.day === dow)) {
      days.push({ date: key, dayOfWeek: dow });
    }
  }
  return days;
}

export function getStatus(
  records: AttendanceRecord[],
  studentId: string,
  date: string
): AttendanceStatus {
  return records.find((r) => r.studentId === studentId && r.date === date)?.status ?? "unmarked";
}

export function getNote(records: AttendanceRecord[], studentId: string, date: string): string {
  return records.find((r) => r.studentId === studentId && r.date === date)?.note ?? "";
}

export function studentStats(records: AttendanceRecord[], studentId: string) {
  const mine = records.filter((r) => r.studentId === studentId);
  return {
    present: mine.filter((r) => r.status === "present").length,
    absent:  mine.filter((r) => r.status === "absent").length,
    late:    mine.filter((r) => r.status === "late").length,
    excused: mine.filter((r) => r.status === "excused").length,
  };
}

/**
 * Holat ogʻirliklari — konstrukt: "Oʻrganish imkoniyati" (docs/attendance-model.md).
 * Keldi=1 toʻliq, Kechikdi=0.5 qisman, Sababli/Kelmadi=0 (ikkalasi ham kamaytiradi).
 * Belgilangan barcha kunlar hisobga kiradi (Sababli endi chiqarib tashlanmaydi).
 */
export const STATUS_WEIGHT: Record<string, number> = {
  present: 1, late: 0.5, excused: 0, absent: 0,
};

/**
 * Vaznli davomat foizi. `dates` berilsa — faqat shu sanalar (oylik/choraklik).
 * `absents` — surunkali holatni aniqlash uchun "Kelmadi" soni. Yozuv yoʻq → null.
 */
export function weightedRate(
  records: AttendanceRecord[],
  studentId: string,
  dates?: Set<string>
): { pct: number; counted: number; absents: number } | null {
  let counted = 0;
  let sum = 0;
  let absents = 0;
  for (const r of records) {
    if (r.studentId !== studentId) continue;
    if (r.status === "unmarked") continue;
    if (dates && !dates.has(r.date)) continue;
    counted++;
    sum += STATUS_WEIGHT[r.status] ?? 1;
    if (r.status === "absent") absents++;
  }
  if (counted === 0) return null;
  return { pct: Math.round((sum / counted) * 100), counted, absents };
}

/** Quyi pertsentil (mas. 25) qiymati — bo‘sh ro‘yxatda null. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

/** Oydagi BARCHA kunlar (showAllDays rejimi uchun) — dush–yak tartibida */
export function allDaysInMonth(year: number, month: number): LessonDay[] {
  const days: LessonDay[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push({ date: ymd(date), dayOfWeek: date.getDay() });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export const DAY_NAMES_SHORT = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];
// Oy nomlari — kanonik manba `lib/localization.ts`da (bu yerda backward-compat re-export).
export { MONTHS_UZ as MONTH_NAMES } from "./localization";
