import type { PultQuestion } from "@/lib/launch-types";

/* ════════════════════════════════════════════════════════════════════
   SINF TESTI — QR-karta va radio pult bilan butun sinf bitta ekranda.

   docs/sinf-testi-spec.md. Ikki manba, bitta dvigatel:
     • `cards` — oʻquvchi kartani buradi, oʻqituvchi telefon kamerasi
       bilan sinfni skanerlaydi, har tasdiqlangan javob Doskaga jonli
       keladi (ustoz pulti kanali);
     • `pult`  — radio pult, kompyuterga USB qabul qilgich (Web Serial).

   Javob modeli ikkalasida bir xil: savol raqami → oʻquvchi tartib
   raqami → harf. Tartib raqami = jurnal roʻyxatidagi oʻrni (karta, pult
   va varaq QR'i bilan bir qoida), savol raqami = qogʻoz varaq raqami
   (`buildPultPlan`). Jurnalga yozish ham varaq bilan bitta yoʻldan
   (`/api/baholash/scan/apply` → `applyOmrScan`).

   Toʻgʻri javob faqat OʻQITUVCHI ekranida (Doska, cookie sessiyasi) —
   telefon kanalga faqat harf yuboradi, kalitni bilmaydi.

   Neytral modul: hisob-kitob toza funksiyalar, React yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export type ClassTestSource = "cards" | "pult";

/** lobby — roʻyxat va sozlama; question — savol; results — savol
    natijasi; final — yakuniy natijalar. */
export type ClassTestPhase = "lobby" | "question" | "results" | "final";

/** savol raqami → oʻquvchi tartib raqami → harf */
export type ClassTestAnswers = Record<number, Record<number, string>>;

export type ClassTestSettings = {
  /** Savol taymeri, soniya. 0 — taymersiz. */
  timerSec: number;
  /** Har savoldan keyin toʻgʻri javob va taqsimot koʻrsatilsinmi. */
  showResults: boolean;
};

export const DEFAULT_CLASS_TEST_SETTINGS: ClassTestSettings = { timerSec: 30, showResults: true };
export const MAX_TIMER_SEC = 600;

export const TEST_LETTERS = ["A", "B", "C", "D"] as const;

export function isTestLetter(v: unknown): v is (typeof TEST_LETTERS)[number] {
  return v === "A" || v === "B" || v === "C" || v === "D";
}

export function isCorrectLetter(q: Pick<PultQuestion, "correct">, letter: string | undefined): boolean {
  return Boolean(letter) && q.correct.includes(letter!);
}

export type QuestionStat = {
  /** Javob berganlar. */
  total: number;
  correct: number;
  /** Harf → necha kishi tanladi. */
  counts: Record<string, number>;
  /** Toʻgʻri javob foizi (0..100), javob boʻlmasa 0. */
  accuracy: number;
};

export function questionStat(q: PultQuestion, perStudent: Record<number, string> | undefined): QuestionStat {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let total = 0;
  let correct = 0;
  for (const letter of Object.values(perStudent ?? {})) {
    total++;
    counts[letter] = (counts[letter] ?? 0) + 1;
    if (isCorrectLetter(q, letter)) correct++;
  }
  return { total, correct, counts, accuracy: total ? Math.round((correct / total) * 100) : 0 };
}

/** Oʻquvchi tartib raqami → toʻgʻri javoblar soni. */
export function studentScores(questions: PultQuestion[], answers: ClassTestAnswers): Map<number, number> {
  const scores = new Map<number, number>();
  for (const q of questions) {
    for (const [no, letter] of Object.entries(answers[q.no] ?? {})) {
      if (isCorrectLetter(q, letter)) scores.set(Number(no), (scores.get(Number(no)) ?? 0) + 1);
    }
  }
  return scores;
}

export type RankedStudent<T> = { student: T; score: number; rank: number };

/** Ball boʻyicha tartib. Teng ball — bir oʻrin (1, 2, 2, 3), ichida — ism. */
export function rankStudents<T extends { no: number; name: string }>(
  roster: T[],
  scores: Map<number, number>,
): RankedStudent<T>[] {
  const sorted = [...roster].sort(
    (a, b) => (scores.get(b.no) ?? 0) - (scores.get(a.no) ?? 0) || a.name.localeCompare(b.name),
  );
  let rank = 0;
  let prev = -1;
  return sorted.map((student) => {
    const score = scores.get(student.no) ?? 0;
    if (score !== prev) {
      rank++;
      prev = score;
    }
    return { student, score, rank };
  });
}

/** Butun test boʻyicha toʻgʻri javob foizi (berilgan javoblar ichida). */
export function overallAccuracy(questions: PultQuestion[], answers: ClassTestAnswers): number {
  let total = 0;
  let correct = 0;
  for (const q of questions) {
    const s = questionStat(q, answers[q.no]);
    total += s.total;
    correct += s.correct;
  }
  return total ? Math.round((correct / total) * 100) : 0;
}

/** Jurnalga yoziladigan varaqlar: oʻquvchi → {savol raqami: harf}.
    Allaqachon kiritilgan va roʻyxatda yoʻq raqamlar tashlanadi. */
export function answersToSheets(
  answers: ClassTestAnswers,
  roster: { no: number; id: string }[],
  entered: Set<string>,
): { studentId: string; answers: Record<string, string> }[] {
  const byNo = new Map(roster.map((r) => [r.no, r]));
  const rows = new Map<number, Record<string, string>>();
  for (const [qNo, perStudent] of Object.entries(answers)) {
    for (const [no, letter] of Object.entries(perStudent)) {
      const row = rows.get(Number(no)) ?? {};
      row[qNo] = letter;
      rows.set(Number(no), row);
    }
  }
  return [...rows.entries()].flatMap(([no, row]) => {
    const student = byNo.get(no);
    return student && !entered.has(student.id) ? [{ studentId: student.id, answers: row }] : [];
  });
}
