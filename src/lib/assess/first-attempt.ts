/* ════════════════════════════════════════════════════════════════════
   BIRINCHI URINISH — jurnal bahosi qaysi javobdan hisoblanadi.

   Bitta bola bitta savolga bir necha marta javob berishi mumkin va bu
   xato emas, oqimning tabiiy holati:
     • oʻz tezligidagi testda sahifa yangilansa test boshidan ochiladi —
       bola allaqachon javob bergan savolga yana javob beradi;
     • oʻyin qobigʻi (Arqon) savollar tugasa ularni qayta aylantiradi;
     • bola havolani boshqa qurilmada ochsa — yangi ishtirokchi qatori.

   Ilgari `publish.ts` ishtirokchining BARCHA javoblarini qoʻshardi:
   10 savolni ikki marta yechgan bola 20/10 = 200% olardi, ikki
   qurilmadan kirgan bolaning bahosini esa oxirgi qator tasodifan
   ustidan yozardi.

   Qoida (docs/ost-loyihalar-arxitektura.md, `attempt_no`: «v1 —
   birinchi urinish»): har (oʻquvchi × savol) juftligi uchun FAQAT
   ENG BIRINCHI javob hisoblanadi — qurilmadan qatʼi nazar. Sahifani
   yangilab bahoni «yaxshilab» boʻlmaydi, oʻyin takrori ballni
   koʻpaytirmaydi.

   Yagona istisno — qoʻlda baholanadigan (ochiq) javob: oʻqituvchi
   baholagan urinish baholanmaganidan ustun. Aks holda bola birinchi
   marta boʻsh yuborib, keyin toʻliq yozgan javobi — oʻqituvchi aynan
   shuni baholagan boʻlsa ham — jurnalga 0 boʻlib tushardi.

   SOF modul: jurnalga yozish (`dal/assess/publish.ts`) ham, natija
   ekrani (`dal/assess/runs.ts`) ham SHU funksiyani chaqiradi — ikki
   joyda ikki xil hisob boʻlsa ekrandagi foiz jurnaldagidan farq qilardi.
   ════════════════════════════════════════════════════════════════════ */

export type AttemptRow = {
  studentId: string;
  itemId: string;
  attemptNo: number;
  answeredAt: Date;
  /** 0..1 — qisman ball (R26); `null` — ball yozilmagan. */
  score: number | null;
  /** `null` — avtomatik baholanmaydi (ochiq javob) yoki hali baholanmagan. */
  isCorrect: boolean | null;
};

export type StudentTotal = {
  /** Toʻplangan xom ball (har savol 0..1). */
  earned: number;
  /** Nechta baholanadigan savolga javob bergan. */
  answered: number;
};

/** Javobning ball qiymati — qisman ball boʻlsa oʻsha, aks holda toʻgʻri = 1. */
export function responseValue(r: { score: number | null; isCorrect: boolean | null }): number {
  if (r.score !== null) return r.score;
  return r.isCorrect ? 1 : 0;
}

/** Baholanganmi — avtomatik (isCorrect) yoki qoʻlda (score). */
function isGraded(r: AttemptRow): boolean {
  return r.isCorrect !== null || r.score !== null;
}

/** `a` urinishi `b` dan ustunmi (hisobga olinadigan javob sifatida). */
function outranks(a: AttemptRow, b: AttemptRow): boolean {
  const ga = isGraded(a);
  const gb = isGraded(b);
  if (ga !== gb) return ga;
  const ta = a.answeredAt.getTime();
  const tb = b.answeredAt.getTime();
  if (ta !== tb) return ta < tb;
  return a.attemptNo < b.attemptNo;
}

/**
 * Har oʻquvchi boʻyicha jami — faqat birinchi urinishlardan.
 *
 * Chaqiruvchi qatorlarni oldindan BAHOLANADIGAN savollar bilan
 * cheklashi shart (`graded-items.ts`) — soʻrovnoma javobi bu yerga
 * kelsa «javob bergan savollar» soni ortib ketadi.
 */
export function firstAttemptTotals(rows: AttemptRow[]): Map<string, StudentTotal> {
  const chosen = new Map<string, AttemptRow>();
  for (const row of rows) {
    const key = `${row.studentId}\u0000${row.itemId}`;
    const current = chosen.get(key);
    if (!current || outranks(row, current)) chosen.set(key, row);
  }

  const totals = new Map<string, StudentTotal>();
  for (const row of chosen.values()) {
    const total = totals.get(row.studentId) ?? { earned: 0, answered: 0 };
    total.earned += responseValue(row);
    total.answered += 1;
    totals.set(row.studentId, total);
  }
  return totals;
}
