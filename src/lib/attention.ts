import type { ClassData } from "@/lib/grades-data";
import type { AttendanceRecord } from "@/lib/attendance-data";
import type { BehaviorEvent } from "@/lib/behavior-data";
import type { TimetableVersion } from "@/lib/timetable-versions";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { weightedRate } from "@/lib/attendance-data";
import { studentTrend } from "@/lib/grades-stats";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   EʼTIBOR SIGNALLARI — bosh sahifa "Eʼtibor kerak" bloki uchun sof
   derive funksiyalar (EWS "ABC": Attendance / Behavior / Course).

   Storelarga bogʻlanmaydi — chaqiruvchi (AttentionSection) jonli
   maʼlumotni uzatadi. Chegaralar ATTENTION_DEFAULTS'da (kelgusida
   sozlanadigan qilinishi mumkin). Deadband konvensiyalari mavjud
   sahifalar bilan bir xil: baho trendi ±3pp (Holat ustuni), davomat
   foizi weightedRate (Sozlamalar > Davomat vaznlari).

   CJ (kutayotgan solishtirishlar) signali YOʻQ: CJ sessiya holati
   faqat modal ichida yashaydi, storeda saqlanmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type AttentionThresholds = {
  /** Ketma-ket "kelmadi" belgilangan dars kunlari soni. */
  absentStreak: number;
  /** Vaznli davomat foizi past chegarasi. */
  attendanceMinPct: number;
  /** Davomat foizi signal berishi uchun minimal belgilangan kunlar. */
  attendanceMinCounted: number;
  /** Baho trendi tushish chegarasi (foiz punkt, musbat son). */
  gradeDropPp: number;
  /** Salbiy avto-ball oynasi (kun). */
  behaviorWindowDays: number;
  /** Oynadagi salbiy avto-ball soni chegarasi. */
  behaviorNegCount: number;
};

export const ATTENTION_DEFAULTS: AttentionThresholds = {
  absentStreak: 3,
  attendanceMinPct: 80,
  attendanceMinCounted: 5,
  gradeDropPp: 3,
  behaviorWindowDays: 7,
  behaviorNegCount: 3,
};

export type AttentionSeverity = "warning" | "destructive";

export type AttentionSignal = {
  /** Barqaror kalit — kunlik "koʻrdim" dismiss shu id bilan saqlanadi. */
  id: string;
  severity: AttentionSeverity;
  classId: string;
} & (
  | { kind: "absent-streak"; studentId: string; studentName: string; days: number }
  | { kind: "low-attendance"; studentId: string; studentName: string; pct: number }
  | { kind: "grade-drop"; studentId: string; studentName: string; delta: number }
  | { kind: "behavior-cluster"; studentId: string; studentName: string; count: number }
  | { kind: "attendance-missing"; date: string }
);

const KIND_RANK: Record<AttentionSignal["kind"], number> = {
  "absent-streak": 0,
  "low-attendance": 1,
  "grade-drop": 2,
  "behavior-cluster": 3,
  "attendance-missing": 4,
};

export type AttentionInput = {
  classDataMap: Record<string, ClassData | undefined>;
  recordsByClass: Record<string, AttendanceRecord[]>;
  eventsByClass: Record<string, BehaviorEvent[]>;
  versions: TimetableVersion[];
  calendar: AcademicYearCalendar;
  /** Holat kaliti → vazn (statusWeights(statuses) natijasi). */
  weights: Record<string, number | null>;
  todayKey: string;
  thresholds?: Partial<AttentionThresholds>;
};

/** Barcha signallar — jiddiylik va tur boʻyicha tartiblangan (limit YOʻQ,
    koʻrsatish limiti UI'da). Deterministik: bir xil kirish → bir xil chiqish. */
export function deriveAttentionSignals(input: AttentionInput): AttentionSignal[] {
  const th = { ...ATTENTION_DEFAULTS, ...input.thresholds };
  const signals: AttentionSignal[] = [];

  for (const [classId, cd] of Object.entries(input.classDataMap)) {
    if (!cd) continue;
    const students = cd.students.filter((s) => s.status !== "archived");
    if (students.length === 0) continue;
    const records = input.recordsByClass[classId] ?? [];

    // ── A: davomat — ketma-ket yoʻqlik yoki past foiz ──
    const markedDates = [...new Set(records.map((r) => r.date))]
      .filter((d) => d <= input.todayKey)
      .sort();
    const statusByKey = new Map<string, string>();
    for (const r of records) statusByKey.set(`${r.date}:${r.studentId}`, r.status);

    for (const st of students) {
      let streak = 0;
      for (let i = markedDates.length - 1; i >= 0; i--) {
        if (statusByKey.get(`${markedDates[i]}:${st.id}`) === "absent") streak++;
        else break;
      }
      if (streak >= th.absentStreak) {
        signals.push({
          kind: "absent-streak",
          id: `absent-streak:${classId}:${st.id}`,
          severity: "destructive",
          classId,
          studentId: st.id,
          studentName: st.name,
          days: streak,
        });
        continue; // past foiz signali shu oʻquvchi uchun ortiqcha shovqin
      }
      const rate = weightedRate(records, st.id, input.weights);
      if (rate && rate.counted >= th.attendanceMinCounted && rate.pct < th.attendanceMinPct) {
        signals.push({
          kind: "low-attendance",
          id: `low-attendance:${classId}:${st.id}`,
          severity: rate.pct < 60 ? "destructive" : "warning",
          classId,
          studentId: st.id,
          studentName: st.name,
          pct: rate.pct,
        });
      }
    }

    // ── C: baho — davr-oʻrtacha tushishi (Holat ustuni deadband bilan bir xil) ──
    for (const st of students) {
      const trend = studentTrend(st.id, cd.assignments, cd.grades);
      if (trend !== null && trend <= -th.gradeDropPp) {
        signals.push({
          kind: "grade-drop",
          id: `grade-drop:${classId}:${st.id}`,
          severity: trend <= -10 ? "destructive" : "warning",
          classId,
          studentId: st.id,
          studentName: st.name,
          delta: Math.round(trend * 10) / 10,
        });
      }
    }

    // ── B: xulq — salbiy avto-ball klasteri (bha: semantikaga tegilmaydi,
    //    faqat oʻqiladi: source bor va points < 0) ──
    const windowStart = addDaysKey(input.todayKey, -(th.behaviorWindowDays - 1));
    const negCount = new Map<string, number>();
    for (const ev of input.eventsByClass[classId] ?? []) {
      if (!ev.source || ev.points >= 0) continue;
      if (ev.date < windowStart || ev.date > input.todayKey) continue;
      negCount.set(ev.studentId, (negCount.get(ev.studentId) ?? 0) + 1);
    }
    for (const st of students) {
      const count = negCount.get(st.id) ?? 0;
      if (count >= th.behaviorNegCount) {
        signals.push({
          kind: "behavior-cluster",
          id: `behavior-cluster:${classId}:${st.id}`,
          severity: "warning",
          classId,
          studentId: st.id,
          studentName: st.name,
          count,
        });
      }
    }
  }

  // ── Data-hygiene: kechagi darslarda davomat kiritilmagan ──
  const yesterday = addDaysKey(input.todayKey, -1);
  const yDow = dateKeyToDate(yesterday).getDay();
  if (yDow !== 0 && !getHolidayForDate(input.calendar, yesterday)) {
    const version = resolveVersionForDate(input.versions, yesterday);
    if (version) {
      const classesWithLessons = new Set(
        version.events.filter((e) => e.day === yDow).map((e) => e.classId)
      );
      for (const classId of classesWithLessons) {
        const cd = input.classDataMap[classId];
        if (!cd || cd.students.every((s) => s.status === "archived")) continue;
        const records = input.recordsByClass[classId] ?? [];
        if (!records.some((r) => r.date === yesterday)) {
          signals.push({
            kind: "attendance-missing",
            id: `attendance-missing:${classId}:${yesterday}`,
            severity: "warning",
            classId,
            date: yesterday,
          });
        }
      }
    }
  }

  return signals.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "destructive" ? -1 : 1;
    if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    return a.id.localeCompare(b.id);
  });
}
