import {
  isSchoolDay,
  type AcademicYearCalendar, type DateRange,
} from "@/lib/academic-calendar";
import {
  resolveVersionForDate, type TimetableVersion,
} from "@/lib/timetable-versions";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";

// Davomat holati — QULFLANGAN toʻplam: faqat 4 ta built-in (Keldi/Kelmadi/
// Kechikdi/Sababli). Maxsus status yoʻq — real foydalanuvchilar soʻrasa
// qoʻshiladi. Yozuvlarda satr tipida saqlanadi ("unmarked" — sentinel).
export type AttendanceStatus = string;

/**
 * Holatning davomat foiziga taʼsiri — vazn siyosati (SIS'lardagi "presence
 * value" modeli): full=×1, half=×0.5, none=×0 (maxrajga kiradi),
 * excluded=hisobga umuman kirmaydi (maxrajdan chiqariladi).
 */
export type ScoreImpact = "full" | "half" | "none" | "excluded";

/** Vazn siyosati → sonli vazn; `null` = maxrajdan chiqariladi. */
export const IMPACT_WEIGHT: Record<ScoreImpact, number | null> = {
  full: 1,
  half: 0.5,
  none: 0,
  excluded: null,
};

export const IMPACT_LABELS: Record<ScoreImpact, string> = {
  full: "Ijobiy",
  half: "Qisman",
  none: "Salbiy",
  excluded: "Betaraf",
};

/**
 * Davomat holati taʼrifi. 4 ta built-in holat semantik tokenlardan
 * (success/destructive/warning/info) rang oladi. Oʻqituvchi faqat
 * `active` va `scoreImpact`ni oʻzgartiradi — label/icon/tone kod
 * manbasidan (BUILTIN_STATUSES) keladi.
 */
export type AttendanceStatusDef = {
  key: string;
  label: string;
  /** Lucide ikona nomi — UI qatlamida komponentga map qilinadi */
  icon: string;
  scoreImpact: ScoreImpact;
  active: boolean;
  builtIn: boolean;
  tone: "success" | "destructive" | "warning" | "info";
};

/** Har sinf shu 4 ta built-in holatdan boshlanadi (referens bilan bir xil) */
export const BUILTIN_STATUSES: AttendanceStatusDef[] = [
  { key: "present", label: "Keldi", icon: "check", scoreImpact: "full", active: true, builtIn: true, tone: "success" },
  { key: "absent", label: "Kelmadi", icon: "x", scoreImpact: "none", active: true, builtIn: true, tone: "destructive" },
  { key: "late", label: "Kechikdi", icon: "clock", scoreImpact: "half", active: true, builtIn: true, tone: "warning" },
  { key: "excused", label: "Sababli", icon: "file", scoreImpact: "none", active: true, builtIn: true, tone: "info" },
];

const IMPACT_VALUES = new Set<string>(["full", "half", "none", "excluded"]);

/**
 * DB'dan kelgan scoreImpact'ni normalize qilish. Eski uch qiymatli model
 * (positive/negative/neutral) hech qachon hisobda ishlatilmagan — haqiqiy
 * vaznlar qattiq kodlangan edi. Shuning uchun legacy qiymat koʻrilsa,
 * holat kalitiga mos ESKI AMALDAGI vazn tiklanadi (foizlar oʻzgarmaydi):
 * present→full, late→half, absent/excused→none. Nomaʼlum kalit → none.
 */
export function normalizeScoreImpact(key: string, raw: string): ScoreImpact {
  if (IMPACT_VALUES.has(raw)) return raw as ScoreImpact;
  const builtin = BUILTIN_STATUSES.find((s) => s.key === key);
  return builtin ? builtin.scoreImpact : "none";
}

/** Statuslar roʻyxati → kalit→vazn xaritasi (weightedRate uchun). */
export function statusWeights(
  statuses: AttendanceStatusDef[]
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const s of statuses) out[s.key] = IMPACT_WEIGHT[s.scoreImpact];
  return out;
}

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
 * Vaznli davomat foizi — konstrukt: "Oʻrganish imkoniyati"
 * (docs/attendance-model.md). Vaznlar endi holat sozlamalaridan keladi
 * (`statusWeights`): standart Keldi=1, Kechikdi=0.5, Sababli/Kelmadi=0;
 * `null` vaznli (excluded) holat maxrajga kirmaydi. `dates` berilsa —
 * faqat shu sanalar (oylik/choraklik). `absents` — surunkali holatni
 * aniqlash uchun "Kelmadi" soni. Yozuv yoʻq → null.
 */
export function weightedRate(
  records: AttendanceRecord[],
  studentId: string,
  weights: Record<string, number | null>,
  dates?: Set<string>
): { pct: number; counted: number; absents: number } | null {
  let counted = 0;
  let sum = 0;
  let absents = 0;
  for (const r of records) {
    if (r.studentId !== studentId) continue;
    if (r.status === "unmarked") continue;
    if (dates && !dates.has(r.date)) continue;
    if (r.status === "absent") absents++;
    const w = weights[r.status];
    // undefined (oʻchirilgan/nomaʼlum holat) yoki null (excluded) → maxrajdan tashqarida
    if (w == null) continue;
    counted++;
    sum += w;
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

export const DAY_NAMES_SHORT = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];
// Oy nomlari — kanonik manba `lib/localization.ts`da (bu yerda backward-compat re-export).
export { MONTHS_UZ as MONTH_NAMES } from "./localization";
