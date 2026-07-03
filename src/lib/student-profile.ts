/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI PROFILI — maʼlumot agregatsiyasi (yagona manba)

   CLASS_DATA (baholar) va seed-asosidagi davomatdan oʻquvchi profili uchun
   barcha hosilalarni hisoblaydi. Hammasi DETERMINISTIK (id'dan seed) —
   SSR/CSR mos keladi, hydration mismatch boʻlmaydi. Davomat foizi
   oʻquvchilar roʻyxati kartasidagi bilan AYNAN mos (seededAttendancePct).
   Bitta istisno: "Choraklik" trend chegaralari oʻquv yili kalendaridan
   (localStorage, SSR'da defaultlar) — chart recharts ichida boʻlgani uchun
   serverda baribir chizilmaydi.
   ════════════════════════════════════════════════════════════════════ */

import {
  CLASS_DATA,
  classColor,
  TOPIC_COLOR_HEX,
  type ClassData,
  type ClassInfo,
  type Topic,
  type Assignment,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { BLOOM_LEVELS } from "@/lib/standards-data";
import { getQuarterForDate } from "@/lib/academic-calendar";
import { getCurrentCalendar } from "@/store/useCalendarStore";
import { dateToKey } from "@/lib/date-keys";

// ─── Tiplar ──────────────────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type RosterEntry = { id: string; name: string; initials: string };

export type StudentLocation = {
  classId: string;
  classInfo: ClassInfo;
  hex: string;
  /** Joriy oʻquvchining roʻyxatdagi oʻrni (0-asosli) */
  index: number;
  roster: RosterEntry[];
  prevId: string | null;
  nextId: string | null;
};

export type TopicBreakdown = {
  topic: Topic;
  avg: number | null;
  count: number;
  hex: string;
};

export type AssignmentRow = {
  assignment: Assignment;
  topic: Topic;
  score: number | null;
  pct: number | null;
  status: "graded" | "missing" | "ungraded";
};

export type BloomBreakdown = { id: string; label: string; value: number };

export type TrendPoint = {
  label: string;
  pct: number;   // davr ICHIDAGI oʻrtacha baho (asosiy chiziq)
  cum: number;   // boshidan beri kumulyativ oʻrtacha (ikkilamchi yoʻnaltiruvchi)
  count: number; // davrdagi baholar soni (tooltip + ishonchlilik uchun)
};

/** Baho dinamikasi vaqt darajasi (oʻquv yili boʻyicha) */
export type Granularity = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type DatedScore = { date: Date; pct: number };

export const GRANULARITY_LABELS: Record<Granularity, string> = {
  daily: "Kunlik",
  weekly: "Haftalik",
  monthly: "Oylik",
  quarterly: "Choraklik",
  yearly: "Yillik",
};

export type AttendanceDay = { date: string; label: string; status: AttendanceStatus };

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  pct: number;
  /** Butun oʻquv yili dars kunlari (oraliq boʻyicha agregatsiya uchun) */
  days: AttendanceDay[];
};

/** Tanlangan vaqt oraligʻi uchun davomat xulosasi */
export type AttendanceWindow = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  pct: number;
};

export type RiskReason = { kind: "attendance" | "grade" | "missing"; text: string };
export type Risk = { level: "ok" | "watch" | "risk"; reasons: RiskReason[] };

export type StudentProfile = {
  location: StudentLocation;
  id: string;
  name: string;
  initials: string;
  studentCode: string;
  gender?: "male" | "female";
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  studentPhone?: string;
  overallGrade: number;
  topics: TopicBreakdown[];
  bloom: BloomBreakdown[];
  assignments: AssignmentRow[];
  gradedCount: number;
  missingCount: number;
  datedScores: DatedScore[];
  attendance: AttendanceSummary;
  risk: Risk;
};

// ─── Joylashuv: studentId → sinf + roʻyxat ───────────────────────────────────

export function locateStudent(studentId: string): StudentLocation | null {
  for (const [classId, data] of Object.entries(CLASS_DATA)) {
    const index = data.students.findIndex((s) => s.id === studentId);
    if (index === -1) continue;
    const roster: RosterEntry[] = data.students.map((s) => ({
      id: s.id,
      name: s.name,
      initials: s.initials,
    }));
    return {
      classId,
      classInfo: data.info,
      hex: CLASS_COLOR_HEX[classColor(data.info)],
      index,
      roster,
      prevId: index > 0 ? roster[index - 1].id : null,
      nextId: index < roster.length - 1 ? roster[index + 1].id : null,
    };
  }
  return null;
}

// ─── Seed yordamchilari (deterministik) ──────────────────────────────────────

function seedFromId(id: string): number {
  return Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** Oʻquvchilar roʻyxati kartasi bilan AYNAN mos davomat foizi (84..100) */
export function seededAttendancePct(id: string): number {
  return 84 + (seedFromId(id) % 17);
}

// ─── Topic boʻyicha oʻrtacha (Category Strengths) ────────────────────────────

function buildTopics(data: ClassData, studentId: string): TopicBreakdown[] {
  return data.topics
    .filter((t) => t.weightPercent > 0)
    .map((topic) => {
      const aIds = new Set(
        data.assignments.filter((a) => a.topicId === topic.id).map((a) => a.id)
      );
      const scores = data.grades
        .filter((g) => g.studentId === studentId && aIds.has(g.assignmentId) && g.score !== null)
        .map((g) => g.score as number);
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      return { topic, avg, count: scores.length, hex: TOPIC_COLOR_HEX[topic.color] };
    });
}

/** Ogʻirlikka koʻra umumiy baho (faqat bahosi bor topiclar boʻyicha) */
function weightedOverall(topics: TopicBreakdown[]): number {
  const valid = topics.filter((t) => t.avg !== null);
  const totalW = valid.reduce((s, t) => s + t.topic.weightPercent, 0);
  if (!totalW) return 0;
  return Math.round(
    valid.reduce((s, t) => s + (t.avg as number) * t.topic.weightPercent, 0) / totalW
  );
}

// ─── Blum darajalari boʻyicha oʻzlashtirish (deterministik) ──────────────────

/** Umumiy bahodan kelib chiqib, har bir Blum darajasi uchun oʻzlashtirish (30..100).
 *  Yuqori darajalar (tahlil/baholash/yaratish) biroz qiyinroq; seed bilan variatsiya. */
function buildBloom(studentId: string, overall: number): BloomBreakdown[] {
  const base = seedFromId(studentId);
  return BLOOM_LEVELS.map((lvl, i) => {
    const variance = ((base * (i + 7) * 31) % 29) - 14; // -14..+14, har daraja uchun har xil
    const difficulty = i * 4; // yuqori darajalar (tahlil/baholash/yaratish) qiyinroq
    const value = Math.max(30, Math.min(100, overall + variance - difficulty));
    return { id: lvl.id, label: lvl.label, value };
  });
}

// ─── Topshiriqlar ────────────────────────────────────────────────────────────

function buildAssignments(data: ClassData, studentId: string): AssignmentRow[] {
  const topicMap = new Map(data.topics.map((t) => [t.id, t]));
  return data.assignments.map((assignment) => {
    const g = data.grades.find(
      (gr) => gr.studentId === studentId && gr.assignmentId === assignment.id
    );
    const topic = topicMap.get(assignment.topicId)!;
    const score = g?.score ?? null;
    const pct = score === null ? null : Math.round((score / assignment.maxScore) * 100);
    const status: AssignmentRow["status"] =
      score !== null ? "graded" : g?.isMissing ? "missing" : "ungraded";
    return { assignment, topic, score, pct, status };
  });
}

// ─── Sana yordamchilari (anchor — fixed, hydration uchun) ────────────────────

const ANCHOR = new Date(2026, 5, 12); // 2026-06-12 (juma) — barqaror tayanch
const YEAR_START = new Date(2025, 8, 2); // 2025-09-02 — oʻquv yili boshi

const UZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

function pad2(n: number): number | string {
  return n < 10 ? `0${n}` : n;
}
function fmt(d: Date): string {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
}

// ─── Baho dinamikasi (oʻquv yili boʻyicha) ───────────────────────────────────

/** Baholangan ishlarni oʻquv yili (Sen–Iyn) boʻylab tekis taqsimlab, sana beradi */
function buildDatedScores(rows: AssignmentRow[]): DatedScore[] {
  const graded = rows.filter((r) => r.pct !== null);
  const n = graded.length;
  if (n === 0) return [];
  const span = ANCHOR.getTime() - YEAR_START.getTime();
  return graded.map((r, i) => ({
    date: new Date(YEAR_START.getTime() + (span * i) / Math.max(1, n - 1)),
    pct: r.pct as number,
  }));
}

/** Oy→chorak FALLBACK mapping — sana kalendar choraklariga tushmaganda
    (taʼtil/oraliq kunlari) yaqin chorakka biriktirish uchun. Asosiy manba —
    Sozlamalardagi oʻquv yili kalendari (getQuarterForDate). */
function academicQuarter(d: Date): number {
  const m = d.getMonth();
  if (m === 8 || m === 9) return 1;
  if (m === 10 || m === 11) return 2;
  if (m >= 0 && m <= 2) return 3;
  return 4;
}

/** Dushanba-boshli hafta kaliti */
function weekStart(d: Date): Date {
  const dt = new Date(d);
  const off = (dt.getDay() + 6) % 7; // Du=0
  dt.setDate(dt.getDate() - off);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function trendKey(date: Date, g: Granularity): { key: string; label: string; sort: number } {
  if (g === "daily") {
    return { key: date.toISOString().slice(0, 10), label: fmt(date), sort: date.getTime() };
  }
  if (g === "weekly") {
    const w = weekStart(date);
    return { key: w.toISOString().slice(0, 10), label: fmt(w), sort: w.getTime() };
  }
  if (g === "monthly") {
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: UZ_MONTHS[date.getMonth()],
      sort: date.getFullYear() * 12 + date.getMonth(),
    };
  }
  if (g === "quarterly") {
    // Chorak chegaralari — Sozlamalardagi oʻquv yili kalendaridan; taʼtil/oraliq
    // sanalari (chorakka tushmaydi) oy boʻyicha fallback bilan yaqin chorakka
    // qoʻshiladi (default id'lar q1..q4 boʻlgani uchun bucket birlashadi).
    const cal = getCurrentCalendar();
    const q = getQuarterForDate(cal, dateToKey(date));
    if (q) {
      const idx = cal.quarters.findIndex((x) => x.id === q.id);
      return { key: q.id, label: q.name, sort: idx >= 0 ? idx + 1 : 1 };
    }
    const fq = academicQuarter(date);
    return { key: `q${fq}`, label: `${fq}-chorak`, sort: fq };
  }
  return { key: "year", label: getCurrentCalendar().yearLabel, sort: 0 };
}

/**
 * Baho dinamikasi — har bir davr (oy/chorak/hafta) uchun OʻSHA DAVR ICHIDAGI
 * oʻrtacha baho. Bu haqiqiy dinamika: davrdan-davrga oʻzgarishni koʻrsatadi
 * (kumulyativ oʻrtachadan farqli — u oʻzgarishni suyultirib yashirardi).
 *
 * Qoʻshimcha `cum` maydoni — boshidan beri kumulyativ oʻrtacha; chartda ochroq
 * yoʻnaltiruvchi chiziq sifatida koʻrsatiladi (yakuniy bahoga moyillik).
 *
 * Boʻsh davrlar TOʻLDIRILMAYDI (interpolatsiya yoʻq) — baho boʻlmagan davr
 * uchun soxta qiymat chizilmaydi; faqat haqiqatan baho boʻlgan davrlar nuqta.
 */
export function aggregateTrend(scores: DatedScore[], g: Granularity): TrendPoint[] {
  if (scores.length === 0) return [];
  const sorted = [...scores].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Har bir davrni alohida guruhlaymiz — davr ichidagi baholar yigʻindisi va soni.
  const map = new Map<string, { sort: number; label: string; sum: number; count: number }>();
  for (const s of sorted) {
    const { key, label, sort } = trendKey(s.date, g);
    const cur = map.get(key);
    if (cur) {
      cur.sum += s.pct;
      cur.count += 1;
    } else {
      map.set(key, { sort, label, sum: s.pct, count: 1 });
    }
  }

  const buckets = [...map.values()].sort((a, b) => a.sort - b.sort);

  // Kumulyativ oʻrtachani davrlar boʻyicha hisoblab boramiz (ikkilamchi chiziq).
  let runSum = 0;
  let runCount = 0;
  return buckets.map((b) => {
    runSum += b.sum;
    runCount += b.count;
    return {
      label: b.label,
      pct: Math.round(b.sum / b.count),   // davr ichidagi oʻrtacha
      cum: Math.round(runSum / runCount), // boshidan beri kumulyativ
      count: b.count,
    };
  });
}

// ─── Davomat (deterministik generatsiya) ─────────────────────────────────────

/** Oʻquv yili dars kunlari — haftada 2 marta (chorshanba=3, juma=5) */
function lessonDays(): Date[] {
  const out: Date[] = [];
  const d = new Date(YEAR_START);
  while (d <= ANCHOR) {
    if (d.getDay() === 3 || d.getDay() === 5) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function buildAttendance(studentId: string): AttendanceSummary {
  const pct = seededAttendancePct(studentId);
  const dates = lessonDays();
  const total = dates.length;
  const present = Math.round((total * pct) / 100);
  const remaining = total - present;
  const late = Math.round(remaining * 0.25);
  const excused = Math.round(remaining * 0.15);
  const absent = Math.max(0, remaining - late - excused);

  // Status multiset → deterministik tarqatish (seed bilan tartiblaymiz)
  const pool: AttendanceStatus[] = [
    ...Array<AttendanceStatus>(present).fill("present"),
    ...Array<AttendanceStatus>(absent).fill("absent"),
    ...Array<AttendanceStatus>(late).fill("late"),
    ...Array<AttendanceStatus>(excused).fill("excused"),
  ];
  const base = seedFromId(studentId);
  const order = pool
    .map((status, i) => ({ status, k: (base * 31 + i * 17) % 997 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.status);

  const days: AttendanceDay[] = dates.map((dt, i) => ({
    date: dt.toISOString().slice(0, 10),
    label: fmt(dt),
    status: order[i] ?? "present",
  }));

  return { total, present, absent, late, excused, pct, days };
}

// Oraliq → oxirgi N dars kuni (yillik = hammasi)
const LESSON_WINDOW: Record<Granularity, number> = {
  daily: 1,
  weekly: 2,
  monthly: 8,
  quarterly: 26,
  yearly: Number.MAX_SAFE_INTEGER,
};

/** Davomatni tanlangan oraliq (oxirgi N dars kuni) boʻyicha jamlaydi */
export function aggregateAttendance(days: AttendanceDay[], g: Granularity): AttendanceWindow {
  const sel = g === "yearly" ? days : days.slice(-LESSON_WINDOW[g]);
  const c = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const d of sel) c[d.status] += 1;
  const total = sel.length;
  const pct = total ? Math.round((c.present / total) * 100) : 0;
  return { total, ...c, pct };
}

// ─── Risk (ABC ostonalari — tadqiqotga asoslangan) ───────────────────────────

function computeRisk(overall: number, attendancePct: number, missing: number): Risk {
  const reasons: RiskReason[] = [];
  if (attendancePct < 90)
    reasons.push({ kind: "attendance", text: `Davomat past (${attendancePct}%)` });
  if (overall < 60) reasons.push({ kind: "grade", text: `Oʻzlashtirish past (${overall}%)` });
  if (missing >= 3) reasons.push({ kind: "missing", text: `${missing} ta topshiriq topshirilmagan` });
  const level: Risk["level"] = reasons.length === 0 ? "ok" : reasons.length === 1 ? "watch" : "risk";
  return { level, reasons };
}

// ─── Asosiy: toʻliq profil ───────────────────────────────────────────────────

export function getStudentProfile(studentId: string): StudentProfile | null {
  const location = locateStudent(studentId);
  if (!location) return null;
  const data = CLASS_DATA[location.classId];
  const student = data.students[location.index];

  const topics = buildTopics(data, studentId);
  const overallGrade = weightedOverall(topics);
  const bloom = buildBloom(studentId, overallGrade);
  const assignments = buildAssignments(data, studentId);
  const gradedCount = assignments.filter((a) => a.status === "graded").length;
  const missingCount = assignments.filter((a) => a.status === "missing").length;
  const datedScores = buildDatedScores(assignments);
  const attendance = buildAttendance(studentId);
  const risk = computeRisk(overallGrade, attendance.pct, missingCount);

  return {
    location,
    id: student.id,
    name: student.name,
    initials: student.initials,
    studentCode: `ID-${1001 + location.index}`,
    gender: student.gender,
    birthDate: student.birthDate,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    studentPhone: student.studentPhone,
    overallGrade,
    topics,
    bloom,
    assignments,
    gradedCount,
    missingCount,
    datedScores,
    attendance,
    risk,
  };
}
