// Ustozona — diagnostik yadro (P0)
// Toʻliq dizayn: docs/ustozona-v1.md. UI yoʻq — sof data modeli + mantiq.
// Falsafa: formativ != summativ; oʻqituvchi ball qoʻymaydi, tizim hisoblaydi.

import { CLASS_DATA, type Student } from "@/lib/grades-data";

// ─── Konstantalar (Daisy tasdigʻi) ──────────────────────────────────────────
export const MASTERY_THRESHOLD = 0.75; // ≥75% toʻgʻri = oʻzlashtirdi
export const MIN_ITEMS = 10; // ishonchlilik uchun minimal savol soni
export const RETRIEVAL_THRESHOLD_DAYS = 14; // 14–21 oraligʻi; unutish signali
export const CLASS_MISCONCEPTION_RATIO = 0.3; // sinfning ≥30% = sinf xatosi

// ─── Turlar ─────────────────────────────────────────────────────────────────
export type AssessmentPurpose = "formative" | "summative";

export type Misconception = {
  id: string;
  label: string; // "Email'ni ogʻzaki muloqot deb oʻylaydi"
  remediationRef?: string; // reteach qoʻllanma / slayd havolasi (retsept)
};

export type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
  misconceptionId?: string; // notoʻgʻri variant → qaysi tushunmovchilik
};

export type Question = {
  id: string;
  standardId: string;
  stem: string;
  type: "mcq";
  options: Option[];
  source: "ai" | "bank" | "teacher";
  approved: boolean;
};

export type Assessment = {
  id: string;
  classId: string;
  standardId: string;
  date: string; // YYYY-MM-DD
  purpose: AssessmentPurpose; // YADRO AJRATUVCHI
  questionIds: string[];
  scaleMax?: number; // summativ jurnal uchun (100|10|5), ixtiyoriy
};

export type Response = {
  assessmentId: string;
  studentId: string;
  questionId: string;
  optionId: string | null; // null = javob berilmagan
};

export type Standard = {
  id: string;
  code: string;
  desc: string;
  prerequisites: string[]; // bilim grafi (A'siz B yoʻq)
};

// CJ (ochiq ishlar) — turlar v1 da, oqim P2 da
export type OpenTask = { id: string; classId: string; standardId: string; prompt: string; date: string };
export type Script = { id: string; openTaskId: string; studentId: string; content: string };
export type Anchor = { id: string; standardId: string; content: string; level: number };
export type Judgement = { id: string; openTaskId: string; leftId: string; rightId: string; winnerId: string };

// ─── Sof funksiyalar (UI shularni chaqiradi) ────────────────────────────────

export type MasteryState = "mastered" | "not-mastered" | "untested";

/** Oʻquvchi standartni oʻzlashtirganmi? ≥75%, kamida MIN_ITEMS savol. */
export function mastery(
  responses: Response[],
  questions: Question[],
  studentId: string,
  standardId: string
): { state: MasteryState; ratio: number; answered: number } {
  const qOfStd = questions.filter((q) => q.standardId === standardId);
  const qIds = new Set(qOfStd.map((q) => q.id));
  const mine = responses.filter((r) => r.studentId === studentId && qIds.has(r.questionId) && r.optionId);
  const answered = mine.length;
  if (answered < MIN_ITEMS) return { state: "untested", ratio: 0, answered };

  const byId = new Map(qOfStd.map((q) => [q.id, q]));
  let correct = 0;
  for (const r of mine) {
    const q = byId.get(r.questionId);
    if (q?.options.find((o) => o.id === r.optionId)?.isCorrect) correct++;
  }
  const ratio = correct / answered;
  return { state: ratio >= MASTERY_THRESHOLD ? "mastered" : "not-mastered", ratio, answered };
}

export type DecayLevel = "fresh" | "fading" | "stale";

/** Bilim vaqt oʻtishi bilan yemiriladi → rang + "muddati keldi" signali. */
export function decay(
  lastAssessedDate: string | null,
  today: string = new Date().toISOString().slice(0, 10)
): { level: DecayLevel; days: number; due: boolean } {
  if (!lastAssessedDate) return { level: "stale", days: Infinity, due: true };
  const days = Math.max(0, Math.round((Date.parse(today) - Date.parse(lastAssessedDate)) / 86_400_000));
  const level: DecayLevel = days <= RETRIEVAL_THRESHOLD_DAYS ? "fresh" : days <= RETRIEVAL_THRESHOLD_DAYS * 2 ? "fading" : "stale";
  return { level, days, due: days > RETRIEVAL_THRESHOLD_DAYS };
}

export type ClassMisconception = {
  misconception: Misconception;
  studentIds: string[];
  count: number;
  ratio: number; // sinfdagi ulush
};

/** Notoʻgʻri javoblarni misconception boʻyicha guruhlash → sinf xatosi. */
export function classMisconceptions(
  responses: Response[],
  questions: Question[],
  misconceptions: Misconception[],
  standardId: string,
  classSize: number
): ClassMisconception[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const mById = new Map(misconceptions.map((m) => [m.id, m]));
  const groups = new Map<string, Set<string>>(); // misconceptionId → studentIds

  for (const r of responses) {
    const q = byId.get(r.questionId);
    if (!q || q.standardId !== standardId || !r.optionId) continue;
    const opt = q.options.find((o) => o.id === r.optionId);
    if (!opt || opt.isCorrect || !opt.misconceptionId) continue;
    if (!groups.has(opt.misconceptionId)) groups.set(opt.misconceptionId, new Set());
    groups.get(opt.misconceptionId)!.add(r.studentId);
  }

  const out: ClassMisconception[] = [];
  for (const [mid, students] of groups) {
    const m = mById.get(mid);
    if (!m) continue;
    const ratio = classSize ? students.size / classSize : 0;
    if (ratio >= CLASS_MISCONCEPTION_RATIO) {
      out.push({ misconception: m, studentIds: [...students], count: students.size, ratio });
    }
  }
  return out.sort((a, b) => b.count - a.count);
}

// ─── Seed maʼlumot (demo: 9-B, Informatika) ─────────────────────────────────

export const STANDARDS: Standard[] = [
  { id: "DT.01", code: "DT.01", desc: "Oʻquvchi fayllarni yaratish, nomlash va papkalarga ajratish amallarini bajara oladi.", prerequisites: [] },
  { id: "DT.02", code: "DT.02", desc: "Oʻquvchi matnli hujjatlarni saqlay oladi va .docx kengaytmasini biladi.", prerequisites: ["DT.01"] },
  { id: "DT.04", code: "DT.04", desc: "Oʻquvchi elektron pochtani yozma muloqot turi sifatida maqsadli ishlata oladi.", prerequisites: ["DT.02"] },
];

export const MISCONCEPTIONS: Misconception[] = [
  { id: "m-file-app", label: "Faylni uni ochadigan dastur bilan adashtiradi (fayl = dastur).", remediationRef: "Slayd: Fayl vs dastur" },
  { id: "m-ext-docx", label: ".docx ni rasm/boshqa kengaytma bilan aralashtiradi.", remediationRef: "Slayd: Kengaytmalar" },
  { id: "m-email-oral", label: "Email'ni ogʻzaki muloqot (qoʻngʻiroq) deb oʻylaydi.", remediationRef: "Slayd: Yozma vs ogʻzaki muloqot" },
  { id: "m-email-instant", label: "Email'ni darhol yetib boradigan jonli chat deb tasavvur qiladi.", remediationRef: "Slayd: Email qanday ishlaydi" },
];

// Standartga bogʻlangan misconception'lar (distraktorlar uchun)
const STD_MISCON: Record<string, string[]> = {
  "DT.01": ["m-file-app"],
  "DT.02": ["m-ext-docx", "m-file-app"],
  "DT.04": ["m-email-oral", "m-email-instant"],
};

// Har standartga MIN_ITEMS ta MCQ (demo generator: 1 toʻgʻri + 3 distraktor)
function makeQuestions(std: Standard): Question[] {
  const miscIds = STD_MISCON[std.id] ?? [];
  return Array.from({ length: MIN_ITEMS }, (_, i) => {
    const n = i + 1;
    const opts: Option[] = [
      { id: `${std.id}-q${n}-a`, text: "Toʻgʻri javob", isCorrect: true },
      { id: `${std.id}-q${n}-b`, text: "Notoʻgʻri (tushunmovchilik 1)", isCorrect: false, misconceptionId: miscIds[0] },
      { id: `${std.id}-q${n}-c`, text: "Notoʻgʻri (tushunmovchilik 2)", isCorrect: false, misconceptionId: miscIds[1] ?? miscIds[0] },
      { id: `${std.id}-q${n}-d`, text: "Notoʻgʻri (tasodifiy)", isCorrect: false },
    ];
    return {
      id: `${std.id}-q${n}`,
      standardId: std.id,
      stem: `${std.code} — diagnostik savol ${n}`,
      type: "mcq" as const,
      options: opts,
      source: "ai" as const,
      approved: true,
    };
  });
}

export const QUESTIONS: Question[] = STANDARDS.flatMap(makeQuestions);

// Demo sinf: 9-B oʻquvchilari (grades-data dan)
const SEED_CLASS_ID = "9-b";
const seedStudents: Student[] = CLASS_DATA[SEED_CLASS_ID]?.students ?? [];

// Formativ quizlar — turli sanalarda (decay namoyishi uchun)
export const ASSESSMENTS: Assessment[] = [
  { id: "as-dt01", classId: SEED_CLASS_ID, standardId: "DT.01", date: "2026-04-10", purpose: "formative", questionIds: QUESTIONS.filter((q) => q.standardId === "DT.01").map((q) => q.id) },
  { id: "as-dt02", classId: SEED_CLASS_ID, standardId: "DT.02", date: "2026-05-20", purpose: "formative", questionIds: QUESTIONS.filter((q) => q.standardId === "DT.02").map((q) => q.id) },
  { id: "as-dt04", classId: SEED_CLASS_ID, standardId: "DT.04", date: "2026-06-12", purpose: "formative", questionIds: QUESTIONS.filter((q) => q.standardId === "DT.04").map((q) => q.id) },
];

// Deterministik javoblar: baʼzi oʻquvchilar tizimli ravishda bitta distraktorni tanlaydi
function seedNum(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const RESPONSES: Response[] = (() => {
  const out: Response[] = [];
  for (const as of ASSESSMENTS) {
    const qs = QUESTIONS.filter((q) => as.questionIds.includes(q.id));
    seedStudents.forEach((stu, si) => {
      // oʻquvchiga "moyillik": baʼzilari ko'p xato (misconception), baʼzilari yaxshi
      const bias = seedNum(stu.id + as.id) % 100;
      qs.forEach((q, qi) => {
        const r = (seedNum(stu.id + q.id) % 100);
        let optId: string | null;
        if (bias < 35 && r < 60) {
          // tushunmovchilikka moyil: 1-distraktorni tanlaydi
          optId = q.options.find((o) => !o.isCorrect && o.misconceptionId)?.id ?? q.options[1].id;
        } else if (r < 6) {
          optId = null; // javob bermagan
        } else if (r < 85) {
          optId = q.options.find((o) => o.isCorrect)!.id;
        } else {
          optId = q.options[(qi % 3) + 1].id; // tasodifiy xato
        }
        out.push({ assessmentId: as.id, studentId: stu.id, questionId: q.id, optionId: optId });
      });
      void si;
    });
  }
  return out;
})();

/** Demo sinf uchun yordamchi — UI uchun. */
export function seedClass() {
  return {
    classId: SEED_CLASS_ID,
    students: seedStudents,
    standards: STANDARDS,
    questions: QUESTIONS,
    misconceptions: MISCONCEPTIONS,
    assessments: ASSESSMENTS,
    responses: RESPONSES,
  };
}

/** Standart boʻyicha oxirgi baholangan sana (decay uchun). */
export function lastAssessedDate(standardId: string): string | null {
  const dates = ASSESSMENTS.filter((a) => a.standardId === standardId).map((a) => a.date).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// ─── Comparative Judgement (ochiq ish — insho) seed ─────────────────────────

export const OPEN_TASK: OpenTask = {
  id: "ot-1",
  classId: SEED_CLASS_ID,
  standardId: "DT.04",
  prompt: "Elektron pochta orqali oʻqituvchingizga darsdan qolgan mavzu yuzasidan rasmiy xat yozing.",
  date: "2026-06-14",
};

// Demo insho matnlari (turli sifat darajalari — oʻqituvchi taqqoslaydi)
const SCRIPT_BODIES = [
  "Assalomu alaykum, hurmatli ustoz. Kechagi darsda elektron pochta mavzusini tushunmadim. Iltimos, qaysi qismdan boshlab takrorlasak boʻladi? Hurmat bilan, oʻquvchingiz.",
  "Salom ustoz. Men kasal boʻlib darsga kelmadim. Mavzuni tushuntirib bera olasizmi? Rahmat.",
  "Hurmatli ustozim, sizga elektron pochta orqali murojaat qilmoqdaman. Oʻtgan darsdagi “yozma muloqot” mavzusi boʻyicha qoʻshimcha misollar kerak edi. Agar imkoningiz boʻlsa, materiallarni yuborsangiz. Hurmat ila, Oʻquvchingiz.",
  "ustoz mavzuni tushunmadim yordam kerak",
  "Assalomu alaykum. Men topshiriqni bajardim, lekin elektron tijorat qismini chala tushundim. Qachon maslahat olsam boʻladi? Oldindan rahmat, hurmat bilan.",
];

export const SCRIPTS: Script[] = seedStudents.map((s, i) => ({
  id: `sc-${s.id}`,
  openTaskId: OPEN_TASK.id,
  studentId: s.id,
  content: SCRIPT_BODIES[i % SCRIPT_BODIES.length],
}));
