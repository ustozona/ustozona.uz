/**
 * Jurnal statistikasi — YAGONA HAQIQAT MANBAI.
 *
 * Prinsip: har bir baho ichkarida `0..1` (normallashgan foiz) sifatida
 * hisoblanadi (`score / maxScore`). Panel, jadval, o‘rtacha — hammasi shu
 * yerdan keladi. Boshqa joyda mustaqil hisob qilinmaydi.
 *
 * Model (grades-v1-spec):
 *  - `maxScore` faqat texnik shkala — vaznga ta'sir qilmaydi (foiz-normalizatsiya).
 *  - Bir darajali vazn: faqat TOIFA %. Toifa ichida hamma topshiriq TENG tortadi.
 *  - Yakuniy = Σ(toifa_o‘rtachasi × toifa_normallashgan_vazni) summativ toifalar bo‘yicha.
 *  - Q (absent) / T (unsubmitted) o‘rtachadan CHIQARILADI (dalil yo‘qligi).
 *  - Formativ TOIFA "Jami"ga KIRMAYDI (faqat signal).
 */
import type { Assignment, Grade, Student, Topic, TopicPurpose } from "@/lib/grades-data";

/** Toifa baholash turi (undefined => summative). */
export function topicPurpose(t: Topic | undefined): TopicPurpose {
  return t?.purpose ?? "summative";
}

function topicMapOf(topics?: Topic[]): Map<string, Topic> {
  const m = new Map<string, Topic>();
  topics?.forEach((t) => m.set(t.id, t));
  return m;
}

/** Baho o‘rtachaga kirmaydimi (Q/T yoki ball yo‘q). */
export function isExcluded(g: Grade | undefined): boolean {
  if (!g) return true;
  if (g.missing || g.isMissing) return true;
  return g.score === null || g.score === undefined;
}

/** Bitta bahoning normallashgan foizi (0..100), yoki null. */
export function gradePercent(
  g: Grade | undefined,
  a: Assignment
): number | null {
  if (isExcluded(g)) return null;
  const max = a.maxScore > 0 ? a.maxScore : 100;
  return (g!.score! / max) * 100;
}

/** Topshiriq bo‘yicha sinf o‘rtachasi (normallashgan, Q/T chiqarilgan). */
export function assignmentAverage(a: Assignment, grades: Grade[]): number {
  const pcts = grades
    .filter((g) => g.assignmentId === a.id)
    .map((g) => gradePercent(g, a))
    .filter((p): p is number => p !== null);
  if (pcts.length === 0) return 0;
  return pcts.reduce((s, p) => s + p, 0) / pcts.length;
}

/** Bir o‘quvchining topshiriqlarini topicId bo‘yicha foiz to‘plamiga ajratadi. */
function bucketByTopic(
  studentId: string,
  assignments: Assignment[],
  grades: Grade[]
): { byKey: Map<string, Grade>; byTopic: Map<string, { id: string; pct: number }[]>; missing: number } {
  const byKey = new Map<string, Grade>();
  grades.forEach((g) => {
    if (g.studentId === studentId) byKey.set(g.assignmentId, g);
  });
  const byTopic = new Map<string, { id: string; pct: number }[]>();
  let missing = 0;
  for (const a of assignments) {
    const g = byKey.get(a.id);
    if (g && (g.missing || g.isMissing)) {
      missing++;
      continue;
    }
    const pct = gradePercent(g, a);
    if (pct === null || !a.topicId) continue;
    const arr = byTopic.get(a.topicId) ?? [];
    arr.push({ id: a.id, pct });
    byTopic.set(a.topicId, arr);
  }
  return { byKey, byTopic, missing };
}

/**
 * O‘quvchining har bir SUMMATIV bahosining yakuniy "Jami"ga hissasi (foiz punkt).
 * Toifa ichida hamma topshiriq teng: hissa = normToifaVazn × (pct / toifaSoni).
 * Barcha hissalar yig‘indisi = summativ o‘rtacha. Jadvalda "vaznli foiz" rejimi.
 */
export function studentContributions(
  studentId: string,
  assignments: Assignment[],
  grades: Grade[],
  topics?: Topic[]
): Map<string, number> {
  const tmap = topicMapOf(topics);
  const { byTopic } = bucketByTopic(studentId, assignments, grades);

  // Ishtirok etuvchi summativ toifalar (vazni > 0, kamida 1 baho).
  const parts: { topicId: string; items: { id: string; pct: number }[]; w: number }[] = [];
  let wTot = 0;
  for (const [topicId, items] of byTopic) {
    const t = tmap.get(topicId);
    if (topicPurpose(t) === "formative") continue;
    const w = topics ? Math.max(t?.weightPercent ?? 0, 0) : 1;
    if (w <= 0 || items.length === 0) continue;
    parts.push({ topicId, items, w });
    wTot += w;
  }

  const out = new Map<string, number>();
  if (wTot <= 0) return out;
  for (const { items, w } of parts) {
    const normW = w / wTot;
    for (const { id, pct } of items) {
      out.set(id, normW * (pct / items.length));
    }
  }
  return out;
}

export type StudentSummary = {
  /** Summativ o‘rtacha (rasmiy attainment, "Jami"). */
  summative: number;
  summativeCount: number;
  /** Formativ o‘rtacha (tushunish signali). */
  formative: number;
  formativeCount: number;
  /** O‘rtachadan chiqarilgan Q/T soni. */
  missingCount: number;
};

/**
 * Bitta o‘quvchining formativ/summativ o‘rtachalari.
 * Summativ = Σ(toifa_o‘rtacha × normToifaVazn). Formativ = formativ toifalardagi
 * barcha baholarning oddiy o‘rtachasi (signal). topics berilmasa summativ ham
 * oddiy o‘rtacha bo‘ladi (teng vazn).
 */
export function studentSummary(
  studentId: string,
  assignments: Assignment[],
  grades: Grade[],
  topics?: Topic[]
): StudentSummary {
  const tmap = topicMapOf(topics);
  const { byTopic, missing } = bucketByTopic(studentId, assignments, grades);

  let wSum = 0,
    wTot = 0,
    cntS = 0,
    sumF = 0,
    cntF = 0;

  for (const [topicId, items] of byTopic) {
    const t = tmap.get(topicId);
    const topicAvg = items.reduce((s, x) => s + x.pct, 0) / items.length;
    if (topicPurpose(t) === "formative") {
      // Formativ: har bir baho teng (signal).
      sumF += items.reduce((s, x) => s + x.pct, 0);
      cntF += items.length;
      continue;
    }
    const w = topics ? Math.max(t?.weightPercent ?? 0, 0) : 1;
    cntS += items.length;
    if (w <= 0) continue;
    wSum += topicAvg * w;
    wTot += w;
  }

  return {
    summative: wTot > 0 ? wSum / wTot : 0,
    summativeCount: cntS,
    formative: cntF > 0 ? sumF / cntF : 0,
    formativeCount: cntF,
    missingCount: missing,
  };
}

/**
 * O‘quvchi trendi (↗/↘) — sana bo‘yicha tartiblangan barcha (formativ+summativ)
 * normallashgan baholarning so‘nggi yarmi vs oldingi yarmi farqi (foiz punkt).
 * Kamida 2 ta baho kerak, aks holda null. Trend ≠ baho (teng vazn).
 */
export function studentTrend(
  studentId: string,
  assignments: Assignment[],
  grades: Grade[]
): number | null {
  const byKey = new Map<string, Grade>();
  grades.forEach((g) => {
    if (g.studentId === studentId) byKey.set(g.assignmentId, g);
  });
  const ordered = [...assignments].sort((a, b) =>
    (a.date ?? a.id).localeCompare(b.date ?? b.id)
  );
  const pts: number[] = [];
  for (const a of ordered) {
    const pct = gradePercent(byKey.get(a.id), a);
    if (pct !== null) pts.push(pct);
  }
  if (pts.length < 2) return null;
  const mid = Math.floor(pts.length / 2);
  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  return avg(pts.slice(mid)) - avg(pts.slice(0, mid));
}

/** Sinfning summativ o‘rtachasi = ball olgan o‘quvchilarning summativ o‘rtachasi. */
export function classSummativeAverage(
  students: Student[],
  assignments: Assignment[],
  grades: Grade[],
  topics?: Topic[]
): number {
  const scored = students
    .map((s) => studentSummary(s.id, assignments, grades, topics))
    .filter((sm) => sm.summativeCount > 0);
  if (scored.length === 0) return 0;
  return scored.reduce((s, sm) => s + sm.summative, 0) / scored.length;
}
