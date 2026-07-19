import type { ClassData, Student, Assignment, GradingScale, ClassColor } from "@/lib/grades-data";
import type { AttendanceRecord } from "@/lib/attendance-data";
import type { BehaviorEvent } from "@/lib/behavior-data";
import type { AcademicYearCalendar, DateRange, Quarter } from "@/lib/academic-calendar";
import { getQuarterForDate } from "@/lib/academic-calendar";
import { studentSummary, studentTrend, gradePercent } from "@/lib/grades-stats";
import { weightedRate, percentile } from "@/lib/attendance-data";
import { eventStats, skillBreakdown, type SkillSlice } from "@/lib/behavior-data";
import { getScaleBoundaries, FIVE_CUTS, type LabelStyle } from "@/lib/grade-scale";
import type { AttentionSignal } from "@/lib/attention";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   STATISTIKA — sof agregatsiya qatlami (Umumiy + Sinf koʻrinishlari).

   Kontrakt `grades-stats.ts` bilan bir xil: store import YOʻQ, React YOʻQ,
   barcha natija turlari JSON-serializable — kelajakda PDF tabel/
   Sertifikatlash/Telegram mini-app/server API shu funksiyalarni
   oʻzgarishsiz chaqira oladi. Ichkarida faqat mavjud pure helperlar
   (studentSummary/studentTrend/weightedRate/eventStats) chaqiriladi —
   matematika bu yerda qayta yozilmaydi.
   ════════════════════════════════════════════════════════════════════ */

export const STAT_DEADBAND_PP = 3;
export const MIN_SCORED_STUDENTS = 5;
export const MIN_TREND_WEEKS = 3;
export const MIN_ATTENDANCE_DAYS = 5;
export const WATCH_ABSENCE_PCT = 3;
export const CHRONIC_ABSENCE_PCT = 10;

/* ── Davr modeli ─────────────────────────────────────────────────────── */

export type StatPeriod = { kind: "quarter" | "year"; id: string; label: string; range: DateRange };

/** Tanlash uchun davrlar roʻyxati: har chorak + "Butun oʻquv yili".
    Kalendar sozlanmagan boʻlsa boʻsh massiv qaytadi (chaqiruvchi selektorni yashiradi). */
export function statPeriods(cal: AcademicYearCalendar): StatPeriod[] {
  if (!cal.range.start || !cal.range.end || cal.quarters.length === 0) return [];
  const quarters: StatPeriod[] = cal.quarters.map((q: Quarter) => ({
    kind: "quarter",
    id: q.id,
    label: q.name,
    range: q.range,
  }));
  return [
    ...quarters,
    { kind: "year", id: "year", label: "Butun oʻquv yili", range: cal.range },
  ];
}

/** Bugungi sanaga mos joriy davr (chorak topilmasa yil qamrovi). */
export function currentStatPeriod(cal: AcademicYearCalendar, todayKey: string): StatPeriod | null {
  const periods = statPeriods(cal);
  if (periods.length === 0) return null;
  const q = getQuarterForDate(cal, todayKey);
  if (q) return periods.find((p) => p.id === q.id) ?? null;
  return periods.find((p) => p.kind === "year") ?? null;
}

/** Joriy davrdan oldingi taqqoslash davri (Δ hisoblash uchun).
    Chorak → undan oldingi chorak; yil → null (taqqoslanadigan oldingi yoʻq). */
export function previousStatPeriod(cal: AcademicYearCalendar, period: StatPeriod): StatPeriod | null {
  if (period.kind !== "quarter") return null;
  const idx = cal.quarters.findIndex((q) => q.id === period.id);
  if (idx <= 0) return null;
  const prev = cal.quarters[idx - 1];
  return { kind: "quarter", id: prev.id, label: prev.name, range: prev.range };
}

/* ── Davr qamrovi ────────────────────────────────────────────────────── */

/** Berilgan davrga tushadigan topshiriqlar. Sanasiz assignment (date va
    dueDate ikkalasi ham yoʻq) faqat "Butun oʻquv yili" davrida hisobga
    kiradi (home-metrics konvensiyasi). */
export function assignmentsInRange(
  assignments: Assignment[],
  range: DateRange,
  isYear: boolean
): Assignment[] {
  return assignments.filter((a) => {
    const key = a.date ?? a.dueDate;
    if (!key) return isYear;
    return key >= range.start && key <= range.end;
  });
}

export function datesInRange(records: AttendanceRecord[], range: DateRange): Set<string> {
  return new Set(
    records.map((r) => r.date).filter((d) => d >= range.start && d <= range.end)
  );
}

/* ── ATOM: har oʻquvchi uchun davr xulosasi ─────────────────────────── */

export type AbsenceTier = "ok" | "watch" | "chronic" | null;

export function absenceTier(attendancePct: number | null): AbsenceTier {
  if (attendancePct === null) return null;
  const absencePct = 100 - attendancePct;
  if (absencePct >= CHRONIC_ABSENCE_PCT) return "chronic";
  if (absencePct >= WATCH_ABSENCE_PCT) return "watch";
  return "ok";
}

export type StudentPeriodSummary = {
  studentId: string;
  name: string;
  gender?: "male" | "female";
  summative: number | null;
  formative: number | null;
  gradeCount: number;
  missingCount: number;
  attendancePct: number | null;
  absenceTier: AbsenceTier;
  behaviorEarned: number;
  behaviorLost: number;
  behaviorPositivePct: number | null;
  trendDelta: number | null;
};

/** Har oʻquvchi uchun davr xulosasi — kelajakdagi Sertifikatlash/PDF
    tabel kirdisi boʻladigan yagona ATOM. Arxiv oʻquvchilar chiqariladi. */
export function studentPeriodSummaries(input: {
  classData: ClassData;
  records: AttendanceRecord[];
  events: BehaviorEvent[];
  weights: Record<string, number | null>;
  range: DateRange;
  isYear: boolean;
}): StudentPeriodSummary[] {
  const { classData, records, events, weights, range, isYear } = input;
  const students = classData.students.filter((s) => s.status !== "archived");
  const assignments = assignmentsInRange(classData.assignments, range, isYear);
  const dates = datesInRange(records, range);
  const eventsInRange = events.filter((e) => e.date >= range.start && e.date <= range.end);

  return students.map((s: Student) => {
    const summary = studentSummary(s.id, assignments, classData.grades, classData.topics);
    const rate = weightedRate(records, s.id, weights, dates);
    const behavior = eventStats(eventsInRange.filter((e) => e.studentId === s.id));
    const trend = studentTrend(s.id, assignments, classData.grades);
    return {
      studentId: s.id,
      name: s.name,
      gender: s.gender,
      summative: summary.summativeCount > 0 ? summary.summative : null,
      formative: summary.formativeCount > 0 ? summary.formative : null,
      gradeCount: summary.summativeCount + summary.formativeCount,
      missingCount: summary.missingCount,
      attendancePct: rate?.pct ?? null,
      absenceTier: absenceTier(rate?.pct ?? null),
      behaviorEarned: behavior.earned,
      behaviorLost: behavior.lost,
      behaviorPositivePct: behavior.positivePct,
      trendDelta: trend,
    };
  });
}

/* ── Sinf-darajali KPI ───────────────────────────────────────────────── */

export type ClassPeriodSummary = {
  summativeAvg: number | null;
  summativeMedian: number | null;
  summativeDelta: number | null;
  scoredCount: number;
  totalCount: number;
  attendanceAvg: number | null;
  attendanceDelta: number | null;
  positivePct: number | null;
};

export function classPeriodSummary(input: {
  classData: ClassData;
  records: AttendanceRecord[];
  events: BehaviorEvent[];
  weights: Record<string, number | null>;
  range: DateRange;
  prevRange: DateRange | null;
  isYear: boolean;
}): ClassPeriodSummary {
  const { classData, records, events, weights, range, prevRange, isYear } = input;
  const summaries = studentPeriodSummaries({ classData, records, events, weights, range, isYear });
  const scored = summaries.filter((s) => s.summative !== null);
  const attended = summaries.filter((s) => s.attendancePct !== null);
  const eventsInRange = events.filter((e) => e.date >= range.start && e.date <= range.end);
  const behavior = eventStats(eventsInRange);

  const avg = (vals: number[]) => (vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length);
  const summativeAvg = avg(scored.map((s) => s.summative!));
  const summativeMedian = percentile(scored.map((s) => s.summative!), 50);
  const attendanceAvg = avg(attended.map((s) => s.attendancePct!));

  let summativeDelta: number | null = null;
  let attendanceDelta: number | null = null;
  if (prevRange) {
    const prevSummaries = studentPeriodSummaries({
      classData, records, events, weights, range: prevRange, isYear: false,
    });
    const prevScored = prevSummaries.filter((s) => s.summative !== null);
    const prevAttended = prevSummaries.filter((s) => s.attendancePct !== null);
    const prevSummativeAvg = avg(prevScored.map((s) => s.summative!));
    const prevAttendanceAvg = avg(prevAttended.map((s) => s.attendancePct!));
    if (summativeAvg !== null && prevSummativeAvg !== null) summativeDelta = summativeAvg - prevSummativeAvg;
    if (attendanceAvg !== null && prevAttendanceAvg !== null) attendanceDelta = attendanceAvg - prevAttendanceAvg;
  }

  return {
    summativeAvg,
    summativeMedian,
    summativeDelta,
    scoredCount: scored.length,
    totalCount: summaries.length,
    attendanceAvg,
    attendanceDelta,
    positivePct: behavior.positivePct,
  };
}

/* ── Baholar taqsimoti ───────────────────────────────────────────────── */

export type DistributionBin = { min: number; label: string; count: number; studentIds: string[] };

/** Kamida MIN_SCORED_STUDENTS baholangan oʻquvchi boʻlmasa `null`
    (chaqiruvchi "Maʼlumot yetarli emas" holatini koʻrsatadi). */
export function gradeDistribution(
  summaries: StudentPeriodSummary[],
  scaleKind: GradingScale,
  labelStyle: LabelStyle = "number"
): DistributionBin[] | null {
  const scored = summaries.filter((s) => s.summative !== null);
  if (scored.length < MIN_SCORED_STUDENTS) return null;

  const boundaries = getScaleBoundaries(scaleKind, labelStyle) ??
    FIVE_CUTS.map((t) => ({ min: t.min, label: labelStyle === "word" ? t.word : t.number }));
  const sorted = [...boundaries].sort((a, b) => b.min - a.min);

  const bins: DistributionBin[] = sorted.map((b) => ({ min: b.min, label: b.label, count: 0, studentIds: [] }));
  for (const s of scored) {
    const bin = bins.find((b) => s.summative! >= b.min);
    if (bin) {
      bin.count++;
      bin.studentIds.push(s.studentId);
    }
  }
  return bins.reverse(); // past → yuqori tartibda koʻrsatish uchun
}

/* ── Mavzu oʻzlashtirish ─────────────────────────────────────────────── */

export type TopicMasteryRow = { topicId: string; name: string; avg: number; lowCount: number; isFormative: boolean };

export function topicMastery(classData: ClassData, range: DateRange, isYear: boolean): TopicMasteryRow[] {
  const assignments = assignmentsInRange(classData.assignments, range, isYear);
  const students = classData.students.filter((s) => s.status !== "archived");
  const rows: TopicMasteryRow[] = [];

  for (const topic of classData.topics) {
    const topicAssignments = assignments.filter((a) => a.topicId === topic.id);
    if (topicAssignments.length === 0) continue;
    const pcts: number[] = [];
    let lowCount = 0;
    for (const s of students) {
      const perStudentPcts: number[] = [];
      for (const a of topicAssignments) {
        const g = classData.grades.find((gr) => gr.studentId === s.id && gr.assignmentId === a.id);
        if (!g || g.missing || g.isMissing || g.score === null || g.score === undefined) continue;
        const max = a.maxScore > 0 ? a.maxScore : 100;
        perStudentPcts.push((g.score / max) * 100);
      }
      if (perStudentPcts.length === 0) continue;
      const studentAvg = perStudentPcts.reduce((a, b) => a + b, 0) / perStudentPcts.length;
      pcts.push(studentAvg);
      if (studentAvg < 50) lowCount++;
    }
    if (pcts.length === 0) continue;
    rows.push({
      topicId: topic.id,
      name: topic.name,
      avg: pcts.reduce((a, b) => a + b, 0) / pcts.length,
      lowCount,
      isFormative: topic.purpose === "formative",
    });
  }

  return rows.sort((a, b) => a.avg - b.avg);
}

/* ── Umumiy koʻrinish: sinf qatorlari ───────────────────────────────── */

export type ClassOverviewRow = {
  classId: string;
  name: string;
  color?: ClassColor;
  studentCount: number;
  students: { id: string; name: string }[];
  summativeAvg: number | null;
  summativeDelta: number | null;
  attendanceAvg: number | null;
  signalCount: number;
};

export function overviewRows(input: {
  classDataMap: Record<string, ClassData | undefined>;
  recordsByClass: Record<string, AttendanceRecord[]>;
  eventsByClass: Record<string, BehaviorEvent[]>;
  weights: Record<string, number | null>;
  range: DateRange;
  prevRange: DateRange | null;
  isYear: boolean;
  signalCounts: Record<string, number>;
}): ClassOverviewRow[] {
  const { classDataMap, recordsByClass, eventsByClass, weights, range, prevRange, isYear, signalCounts } = input;
  const rows: ClassOverviewRow[] = [];

  for (const [classId, cd] of Object.entries(classDataMap)) {
    if (!cd) continue;
    const students = cd.students.filter((s) => s.status !== "archived");
    if (students.length === 0) continue;
    const summary = classPeriodSummary({
      classData: cd,
      records: recordsByClass[classId] ?? [],
      events: eventsByClass[classId] ?? [],
      weights,
      range,
      prevRange,
      isYear,
    });
    rows.push({
      classId,
      name: cd.info.name,
      color: cd.info.color,
      studentCount: students.length,
      students: students.map((s) => ({ id: s.id, name: s.name })),
      summativeAvg: summary.summativeAvg,
      summativeDelta: summary.summativeDelta,
      attendanceAvg: summary.attendanceAvg,
      signalCount: signalCounts[classId] ?? 0,
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

/* ── Jins kesimi ─────────────────────────────────────────────────────── */

export type GenderBreakdown = {
  boys: number;
  girls: number;
  unspecified: number;
  total: number;
  boysPct: number | null;
  girlsPct: number | null;
};

/** Son VA foiz bilan (foizlar jami oʻquvchilar soniga nisbatan — belgilanmaganlar
    ham maxrajga kiradi, yashirilmaydi). Boʻsh sinfda foizlar `null`. */
export function genderBreakdown(students: Student[]): GenderBreakdown {
  const active = students.filter((s) => s.status !== "archived");
  const boys = active.filter((s) => s.gender === "male").length;
  const girls = active.filter((s) => s.gender === "female").length;
  const total = active.length;
  const unspecified = total - boys - girls;
  return {
    boys,
    girls,
    unspecified,
    total,
    boysPct: total > 0 ? Math.round((boys / total) * 100) : null,
    girlsPct: total > 0 ? Math.round((girls / total) * 100) : null,
  };
}

export type GenderPerformanceSplit = {
  boys: { gradeAvg: number | null; attendanceAvg: number | null };
  girls: { gradeAvg: number | null; attendanceAvg: number | null };
};

function avg(values: number[]): number | null {
  return values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null;
}

/** Jins boʻyicha oʻrtacha baho/davomat (DIF — differential item functioning
    naqshiga yaqin, lekin oddiy oʻrtacha taqqoslash) — kutilmagan farqni
    koʻrsatish uchun. Kichik namunada ham koʻrsatiladi (yashirilmaydi),
    maʼlumot yoʻq boʻlsa `null` qaytadi va chaqiruvchi "—" chizadi. */
export function genderPerformanceSplit(summaries: StudentPeriodSummary[]): GenderPerformanceSplit {
  const boys = summaries.filter((s) => s.gender === "male");
  const girls = summaries.filter((s) => s.gender === "female");
  const grades = (list: StudentPeriodSummary[]) => list.map((s) => s.summative).filter((v): v is number => v !== null);
  const attendance = (list: StudentPeriodSummary[]) => list.map((s) => s.attendancePct).filter((v): v is number => v !== null);
  return {
    boys: { gradeAvg: avg(grades(boys)), attendanceAvg: avg(attendance(boys)) },
    girls: { gradeAvg: avg(grades(girls)), attendanceAvg: avg(attendance(girls)) },
  };
}

/* ── Risk registri (attention.ts ga tegishmaydi, faqat qayta eksport shakl) ── */

export type ClassSignalCounts = Record<string, number>;

/** `deriveAttentionSignals` natijasidan sinf boʻyicha son — overviewRows kirishi. */
export function signalCountsByClass(signals: AttentionSignal[]): ClassSignalCounts {
  const out: ClassSignalCounts = {};
  for (const sig of signals) out[sig.classId] = (out[sig.classId] ?? 0) + 1;
  return out;
}

/* ════════════════════════════════════════════════════════════════════
   V2 — Trendlar va chuqurlik
   ════════════════════════════════════════════════════════════════════ */

/** Dushanba-boshlanuvchi hafta chegaralari roʻyxati — davr ichida, davr
    bilan kesishgan qismi (birinchi/oxirgi hafta qisqarishi mumkin). */
function weekBuckets(range: DateRange): { weekStart: string; range: DateRange }[] {
  const out: { weekStart: string; range: DateRange }[] = [];
  const startDow = dateKeyToDate(range.start).getDay(); // 0=Yak..6=Sha
  const mondayOffset = (startDow + 6) % 7; // Du=0
  let cursor = addDaysKey(range.start, -mondayOffset);
  while (cursor <= range.end) {
    const weekEnd = addDaysKey(cursor, 6);
    out.push({
      weekStart: cursor,
      range: { start: cursor > range.start ? cursor : range.start, end: weekEnd < range.end ? weekEnd : range.end },
    });
    cursor = addDaysKey(cursor, 7);
  }
  return out;
}

export type AttendanceWeekPoint = { weekStart: string; pct: number | null };

/** Sinf-darajali haftalik vaznli davomat foizi (barcha oʻquvchilar birga
    hisoblanadi). Kamida MIN_TREND_WEEKS hafta boʻlmasa chaqiruvchi
    "Maʼlumot yetarli emas" holatini koʻrsatishi mumkin. */
export function attendanceWeeklyTrend(
  records: AttendanceRecord[],
  weights: Record<string, number | null>,
  range: DateRange
): AttendanceWeekPoint[] {
  return weekBuckets(range).map(({ weekStart, range: wr }) => {
    const dates = datesInRange(records, wr);
    let counted = 0;
    let sum = 0;
    for (const r of records) {
      if (!dates.has(r.date) || r.status === "unmarked") continue;
      const w = weights[r.status];
      if (w == null) continue;
      counted++;
      sum += w;
    }
    return { weekStart, pct: counted > 0 ? Math.round((sum / counted) * 100) : null };
  });
}

export type BehaviorClimateTrend = {
  weeks: { weekStart: string; positivePct: number | null }[];
  topSkills: SkillSlice[];
  autoCount: number;
  manualCount: number;
};

/** Haftalik ijobiy ulush + top koʻnikmalar, avto/qoʻlda ajratilgan. */
export function behaviorClimateTrend(events: BehaviorEvent[], range: DateRange): BehaviorClimateTrend {
  const inRange = events.filter((e) => e.date >= range.start && e.date <= range.end);
  const weeks = weekBuckets(range).map(({ weekStart, range: wr }) => {
    const weekEvents = inRange.filter((e) => e.date >= wr.start && e.date <= wr.end);
    const stats = eventStats(weekEvents);
    return { weekStart, positivePct: stats.positivePct };
  });
  return {
    weeks,
    topSkills: skillBreakdown(inRange).slice(0, 5),
    autoCount: inRange.filter((e) => !!e.source).length,
    manualCount: inRange.filter((e) => !e.source).length,
  };
}

export type CompletionRate = { pct: number; unsubmittedCount: number; totalSlots: number };

/** Uy vazifa bajarilish % — `Grade.missing==="unsubmitted"` ulushiga
    asoslanadi (topshiriq × oʻquvchi jami slotidan). Maʼlumot yoʻq boʻlsa null. */
export function assignmentCompletionRate(
  classData: ClassData,
  range: DateRange,
  isYear: boolean
): CompletionRate | null {
  const assignments = assignmentsInRange(classData.assignments, range, isYear);
  const students = classData.students.filter((s) => s.status !== "archived");
  if (assignments.length === 0 || students.length === 0) return null;

  let unsubmitted = 0;
  const totalSlots = assignments.length * students.length;
  for (const a of assignments) {
    for (const s of students) {
      const g = classData.grades.find((gr) => gr.studentId === s.id && gr.assignmentId === a.id);
      if (g?.missing === "unsubmitted") unsubmitted++;
    }
  }
  return { pct: Math.round(((totalSlots - unsubmitted) / totalSlots) * 100), unsubmittedCount: unsubmitted, totalSlots };
}

export type UpcomingDeadline = { assignmentId: string; title: string; dueDate: string; topicName: string };

/** Yaqin (todayKey..todayKey+horizonDays) summativ muddatlar — eʼtibor
    kartasi uchun. Formativ toifalar chiqariladi (muddat bosim signali emas). */
export function upcomingDeadlines(
  classData: ClassData,
  todayKey: string,
  horizonDays: number = 14
): UpcomingDeadline[] {
  const horizon = addDaysKey(todayKey, horizonDays);
  const topicMap = new Map(classData.topics.map((t) => [t.id, t]));
  return classData.assignments
    .filter((a) => a.dueDate && a.dueDate >= todayKey && a.dueDate <= horizon)
    .filter((a) => (topicMap.get(a.topicId)?.purpose ?? "summative") === "summative")
    .map((a) => ({
      assignmentId: a.id,
      title: a.title,
      dueDate: a.dueDate!,
      topicName: topicMap.get(a.topicId)?.name ?? "",
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/* ════════════════════════════════════════════════════════════════════
   V3 — Topshiriq tahlili (psixometrika-lite)
   ════════════════════════════════════════════════════════════════════ */

export const MIN_STUDENTS_FOR_QUALITY = 6;
export const CEILING_PCT = 95;
export const FLOOR_PCT = 15;

export type AssignmentQuality = {
  assignmentId: string;
  title: string;
  topicName: string;
  /** Qiyinlik indeksi — sinf oʻrtacha foizi (0..100). Yuqori = oson. */
  p: number;
  /** Diskriminatsiya — yuqori/quyi uchdan bir guruh farqi (pp, -100..100).
      Guruhlash mezoni: davr summativ oʻrtachasi (item-total). Kamida
      2 talik uchdan bir guruh boʻlmasa `null`. */
  d: number | null;
  n: number;
  ceiling: boolean;
  floor: boolean;
};

/** Topshiriq sifati — qiyinlik(p)/diskriminatsiya(D)/ceiling-floor. Sinfda
    MIN_STUDENTS_FOR_QUALITY dan kam oʻquvchi boʻlsa boʻsh massiv (statistik
    imkonsiz — Komil taklifiga qarshi tanqidiy hukm, ASA VAM ogohlantirishi
    bilan bir xil ehtiyot). */
export function assignmentQuality(classData: ClassData, range: DateRange, isYear: boolean): AssignmentQuality[] {
  const students = classData.students.filter((s) => s.status !== "archived");
  if (students.length < MIN_STUDENTS_FOR_QUALITY) return [];

  const assignments = assignmentsInRange(classData.assignments, range, isYear);
  const topicMap = new Map(classData.topics.map((t) => [t.id, t]));

  const summaries = studentPeriodSummaries({ classData, records: [], events: [], weights: {}, range, isYear });
  const ranked = summaries.filter((s) => s.summative !== null).sort((a, b) => b.summative! - a.summative!);
  const third = Math.floor(ranked.length / 3);
  const topIds = new Set(ranked.slice(0, third).map((s) => s.studentId));
  const bottomIds = new Set(ranked.slice(-third).map((s) => s.studentId));

  const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;

  const rows: AssignmentQuality[] = [];
  for (const a of assignments) {
    const grades = classData.grades.filter((g) => g.assignmentId === a.id);
    const pcts = grades.map((g) => gradePercent(g, a)).filter((p): p is number => p !== null);
    if (pcts.length === 0) continue;

    let d: number | null = null;
    if (third >= 2) {
      const topPcts = grades.filter((g) => topIds.has(g.studentId)).map((g) => gradePercent(g, a)).filter((p): p is number => p !== null);
      const botPcts = grades.filter((g) => bottomIds.has(g.studentId)).map((g) => gradePercent(g, a)).filter((p): p is number => p !== null);
      if (topPcts.length > 0 && botPcts.length > 0) d = Math.round(avg(topPcts) - avg(botPcts));
    }

    const p = Math.round(avg(pcts));
    rows.push({
      assignmentId: a.id,
      title: a.title,
      topicName: topicMap.get(a.topicId)?.name ?? "",
      p,
      d,
      n: pcts.length,
      ceiling: p >= CEILING_PCT,
      floor: p <= FLOOR_PCT,
    });
  }

  return rows.sort((a, b) => a.p - b.p);
}

/* ── Topic × oʻquvchi issiqlik matritsasi ───────────────────────────── */

export type TopicStudentCell = { studentId: string; topicId: string; avg: number | null };
export type TopicStudentMatrix = {
  students: { id: string; name: string }[];
  topics: { id: string; name: string }[];
  cells: TopicStudentCell[];
};

export function topicStudentMatrix(classData: ClassData, range: DateRange, isYear: boolean): TopicStudentMatrix {
  const assignments = assignmentsInRange(classData.assignments, range, isYear);
  const students = classData.students.filter((s) => s.status !== "archived");
  const topicsWithData = classData.topics.filter((t) => assignments.some((a) => a.topicId === t.id));

  const cells: TopicStudentCell[] = [];
  for (const t of topicsWithData) {
    const topicAssignments = assignments.filter((a) => a.topicId === t.id);
    for (const s of students) {
      const pcts: number[] = [];
      for (const a of topicAssignments) {
        const g = classData.grades.find((gr) => gr.studentId === s.id && gr.assignmentId === a.id);
        const pct = gradePercent(g, a);
        if (pct !== null) pcts.push(pct);
      }
      cells.push({
        studentId: s.id,
        topicId: t.id,
        avg: pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null,
      });
    }
  }

  return {
    students: students.map((s) => ({ id: s.id, name: s.name })),
    topics: topicsWithData.map((t) => ({ id: t.id, name: t.name })),
    cells,
  };
}
