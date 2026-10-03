/* ════════════════════════════════════════════════════════════════════
   SINF SIGNALI — oxirgi test natijasi keyingi dars rejasiga
   (docs/natija-keyingi-dars.md).

   Maʼlumotga asoslangan rejalash: oʻqituvchi keyingi darsni rejalashtirayotganda
   sinfning OXIRGI tekshiruvi (qaysi savol qiyin boʻldi, sinf foizi, nechta
   bola orqada qoldi) Dars studiyasida koʻrinadi va AI rejani shunga moslaydi:
     • boshida 5–7 daqiqa — aynan qiyin boʻlgan tushunchani takrorlash;
     • tekshiruvda — oʻsha tushunchaga oʻxshash yangi savol;
     • faoliyatda — orqada qolganlar uchun yordamchi guruh (tabaqalashtirish).

   Ismlar AI ga YUBORILMAYDI — faqat sanoq. Savol matni (oʻqituvchining oʻz
   testi) yuboriladi: AI aynan qaysi tushuncha qiyin boʻlganini bilishi kerak.

   Neytral modul: server (DAL), mijoz (studiya) va AI tahlilchisi shu yerdan oladi.
   ════════════════════════════════════════════════════════════════════ */

export type ClassInsight = {
  sessionId: string;
  title: string;
  /** ISO — test qachon oʻtgan (oxirgi oʻzgarish). */
  at: string;
  classAccuracy: number;
  /** Qatnashganlar. */
  students: number;
  /** 50% dan past natija olganlar soni. */
  needHelp: number;
  hardest: { no: number; stem: string; accuracy: number }[];
};

/** AI soʻroviga ketadigan qism — sanoq va qiyin savollar, ismsiz. */
export type InsightForAi = {
  title: string;
  classAccuracy: number;
  students: number;
  needHelp: number;
  hardest: { stem: string; accuracy: number }[];
};

const clampInt = (v: unknown, lo: number, hi: number): number | null => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

const line = (v: unknown, max: number) =>
  (typeof v === "string" ? v : "").replace(/\s+/g, " ").trim().slice(0, max);

/** Mijozdan kelgan qiymatni tozalaydi (route ichida) — buzuq boʻlsa `undefined`. */
export function normalizeInsight(raw: unknown): InsightForAi | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const acc = clampInt(r.classAccuracy, 0, 100);
  const students = clampInt(r.students, 1, 500);
  const needHelp = clampInt(r.needHelp, 0, 500);
  if (acc === null || students === null || needHelp === null) return undefined;
  const hardest = (Array.isArray(r.hardest) ? r.hardest : [])
    .map((h) => {
      if (typeof h !== "object" || h === null) return null;
      const o = h as Record<string, unknown>;
      const a = clampInt(o.accuracy, 0, 100);
      const stem = line(o.stem, 200);
      return a === null || !stem ? null : { stem, accuracy: a };
    })
    .filter((h): h is { stem: string; accuracy: number } => !!h)
    .slice(0, 3);
  return { title: line(r.title, 120) || "Test", classAccuracy: acc, students, needHelp: Math.min(needHelp, students), hardest };
}

/** Studiya promptidagi qatorlar. */
export function insightPromptLines(i: InsightForAi): string[] {
  const lines = [
    `Sinfning oxirgi tekshiruvi («${i.title}»): sinf natijasi ${i.classAccuracy}%, ${i.students} oʻquvchidan ${i.needHelp} tasi 50% dan past.`,
  ];
  if (i.hardest.length) {
    lines.push(`Eng qiyin boʻlgan savollar:\n${i.hardest.map((h) => `- «${h.stem}» — ${h.accuracy}% toʻgʻri`).join("\n")}`);
  }
  lines.push(
    "Rejani shu natijaga moslab tuz: dars boshida (warmup) 5–7 daqiqa aynan shu tushunchalardagi xatoni tuzatuvchi takrorlash; " +
      "tekshiruv blokida shu tushunchaga oʻxshash yangi savol" +
      (i.needHelp > 0 ? "; faoliyatda orqada qolgan oʻquvchilar uchun yordamchi guruh yoki soddalashtirilgan topshiriq (tabaqalashtirish)." : "."),
  );
  return lines;
}
