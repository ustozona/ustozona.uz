// Standartlar sahifasi ⇄ dalil-engine (diagnostics.ts) koʻprigi.
// v3 §9: Mastery = dalilga asoslangan, sinf darajasida agregatlangan, 3 daraja.
// MVP: bir-nuqtali (single-point) — takroriy retrieval (Q1.c) keyingi iteratsiyada.

import { CLASS_DATA } from "@/lib/grades-data";
import {
  mastery,
  decay,
  lastAssessedDate,
  classMisconceptions,
  QUESTIONS,
  RESPONSES,
  MISCONCEPTIONS,
  type DecayLevel,
  type ClassMisconception,
} from "@/lib/diagnostics";

/** v3 §9 Q1 — oʻzlashtirish darajalari (ratio chegaralari). */
export const MASTERY_SECURE = 0.8; // ≥80% → mustahkam
export const MASTERY_DEVELOPING = 0.5; // 50–80% → shakllanmoqda; <50% → boshlangʻich

export type MasteryLevel = "secure" | "developing" | "beginning";

export interface ClassStandardMastery {
  /** Bu sinf+standart boʻyicha dalil (quiz natijasi) bormi? */
  tested: boolean;
  /** Baholangan (yetarli savolga javob bergan) oʻquvchilar soni */
  total: number;
  /** Mustahkam (≥80%) */
  secure: number;
  /** Shakllanmoqda (50–80%) */
  developing: number;
  /** Boshlangʻich (<50%) */
  beginning: number;
  /** Mustahkam % (baholanganlardan) — sarlavha koʻrsatkichi */
  masteredPct: number;
  /** Oxirgi baholangandan beri kunlar (null = dalil yoʻq). v3 §9 Q5 — retrieval. */
  daysSinceAssessed: number | null;
  /** Unutish darajasi: fresh/fading/stale. */
  decayLevel: DecayLevel;
  /** Takrorlash (retrieval) muddati keldimi? */
  retrievalDue: boolean;
}

const EMPTY: ClassStandardMastery = {
  tested: false,
  total: 0,
  secure: 0,
  developing: 0,
  beginning: 0,
  masteredPct: 0,
  daysSinceAssessed: null,
  decayLevel: "stale",
  retrievalDue: false,
};

function levelOf(ratio: number): MasteryLevel {
  if (ratio >= MASTERY_SECURE) return "secure";
  if (ratio >= MASTERY_DEVELOPING) return "developing";
  return "beginning";
}

/** Sinf boʻyicha bitta standartning oʻzlashtirilishini hisoblaydi (dalildan, 3 daraja). */
export function classStandardMastery(classId: string, standardId: string): ClassStandardMastery {
  const students = CLASS_DATA[classId]?.students ?? [];
  const hasQuestions = QUESTIONS.some((q) => q.standardId === standardId);
  if (!hasQuestions || students.length === 0) return EMPTY;

  let total = 0;
  let secure = 0;
  let developing = 0;
  let beginning = 0;
  for (const s of students) {
    const m = mastery(RESPONSES, QUESTIONS, s.id, standardId);
    if (m.state === "untested") continue;
    total++;
    const lvl = levelOf(m.ratio);
    if (lvl === "secure") secure++;
    else if (lvl === "developing") developing++;
    else beginning++;
  }

  // Retrieval/decay — faqat dalil bor boʻlganda mazmunli (v3 §9 Q5).
  const lastAssessed = lastAssessedDate(standardId);
  const d = decay(lastAssessed);

  return {
    tested: total > 0,
    total,
    secure,
    developing,
    beginning,
    masteredPct: total ? Math.round((secure / total) * 100) : 0,
    daysSinceAssessed: lastAssessed ? d.days : null,
    decayLevel: d.level,
    retrievalDue: total > 0 && d.due,
  };
}

export type { ClassMisconception } from "@/lib/diagnostics";

/** Sinf boʻyicha bitta standartdagi keng tarqalgan tushunmovchiliklar (dalildan). */
export function classStandardMisconceptions(classId: string, standardId: string): ClassMisconception[] {
  const students = CLASS_DATA[classId]?.students ?? [];
  if (students.length === 0) return [];
  return classMisconceptions(RESPONSES, QUESTIONS, MISCONCEPTIONS, standardId, students.length);
}

export interface SetMasterySummary {
  /** Toʻplamда dalili bor standart bormi? */
  tested: boolean;
  /** Dalili bor standartlar soni */
  testedStandards: number;
  /** Oʻrtacha mustahkam % (faqat dalili bor standartlar boʻyicha) */
  avgSecurePct: number;
}

/** Toʻplam (papka) darajasidagi oʻzlashtirish xulosasi — sinf boʻyicha. */
export function setMasterySummary(classId: string, standardIds: string[]): SetMasterySummary {
  let sum = 0;
  let n = 0;
  for (const id of standardIds) {
    const m = classStandardMastery(classId, id);
    if (!m.tested) continue;
    sum += m.masteredPct;
    n++;
  }
  return {
    tested: n > 0,
    testedStandards: n,
    avgSecurePct: n ? Math.round(sum / n) : 0,
  };
}
