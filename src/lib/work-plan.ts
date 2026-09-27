import { flowSequence, classSessions } from "@/lib/lesson-flow";
import { isTaught, unitIdForClass, type Lesson, type Unit } from "@/lib/lessons-data";

/* ════════════════════════════════════════════════════════════════════
   ISH REJA KOʻRINISHI — «bugun qaysi mavzu?» sof funksiyasi.

   Topshiriq yaratayotgan oʻqituvchiga sinfning choraklik ish rejasi
   eslatma sifatida koʻrsatiladi (Topshiriqlar → «+ Yaratish») va dars
   AI yordamchisiga kontekst boʻlib boradi. Manba — Darslar sahifasining
   oʻzi: boʻlim (chorak) va mavzular tartibi `flowSequence`, sana esa
   sinfning dars sessiyalaridan.

   «Joriy mavzu» qanday topiladi — birinchi mos kelgani:
     1. shu kuni darsi bor mavzu (`today`);
     2. undan keyingi eng yaqin sanali mavzu (`next`);
     3. sana yoʻq boʻlsa — oʻtilmagan birinchi mavzu (`untaught`).
   Koʻp oʻqituvchida ish reja import qilingan, lekin sanalar hali
   joylanmagan (Darslar sahifasida «—»), shuning uchun 3-qoida shart.
   ════════════════════════════════════════════════════════════════════ */

export type PlanRow = {
  lesson: Lesson;
  /** Sinfdagi tartib raqami (Darslar sahifasidagi «05.» bilan bir xil). */
  no: number;
  /** Eng yaqin kelgusi (boʻlmasa oxirgi) dars kuni, "YYYY-MM-DD". */
  date: string | null;
  taught: boolean;
  /** Zaxira dars — mavzusiz slot. */
  reserve: boolean;
};

export type PlanAnchor = "lesson" | "today" | "next" | "untaught";

export type WorkPlan = {
  /** Joriy mavzuning boʻlimi (chorak); `null` — «Boʻlimsiz». */
  unit: Unit | null;
  /** Shu boʻlimning barcha mavzulari, tartib boʻyicha. */
  rows: PlanRow[];
  /** `rows` ichida joriy mavzu indeksi. */
  current: number;
  anchor: PlanAnchor;
};

function rowDate(l: Lesson, classId: string, today: string): string | null {
  const sessions = classSessions(l, classId);
  if (!sessions.length) return null;
  return (sessions.find((s) => s.date >= today) ?? sessions[sessions.length - 1]).date;
}

/** Sinfning shu kundagi ish reja holati. Darslar yoʻq boʻlsa — `null`. */
export function workPlanFor(
  lessons: readonly Lesson[],
  units: readonly Unit[],
  classId: string,
  today: string,
  /** Dars muharriridan — joriy mavzu shu dars (sanadan qatʼi nazar). */
  anchorLessonId?: string,
): WorkPlan | null {
  const seq = flowSequence(lessons, units, classId);
  if (!seq.length) return null;
  const all: PlanRow[] = seq.map((lesson, i) => ({
    lesson,
    no: i + 1,
    date: rowDate(lesson, classId, today),
    taught: isTaught(lesson, classId),
    reserve: !!lesson.reserve,
  }));

  let idx = anchorLessonId ? all.findIndex((r) => r.lesson.id === anchorLessonId) : -1;
  let anchor: PlanAnchor = "lesson";
  if (idx < 0) {
    anchor = "today";
    idx = all.findIndex((r) => r.date === today && !r.reserve);
  }
  if (idx < 0) {
    anchor = "next";
    let best: string | null = null;
    all.forEach((r, i) => {
      if (r.reserve || !r.date || r.date <= today) return;
      if (best === null || r.date < best) {
        best = r.date;
        idx = i;
      }
    });
  }
  if (idx < 0) {
    anchor = "untaught";
    idx = all.findIndex((r) => !r.taught && !r.reserve);
    if (idx < 0) idx = all.length - 1;
  }

  const unitId = unitIdForClass(all[idx].lesson, classId);
  const rows = all.filter((r) => unitIdForClass(r.lesson, classId) === unitId);
  return {
    unit: units.find((u) => u.id === unitId) ?? null,
    rows,
    current: rows.findIndex((r) => r.lesson.id === all[idx].lesson.id),
    anchor,
  };
}

/** AI uchun qisqa matn: oldingi, joriy va keyingi mavzular. */
export function workPlanPrompt(plan: WorkPlan, around = 2): string {
  const lines: string[] = [];
  const from = Math.max(0, plan.current - around);
  const to = Math.min(plan.rows.length - 1, plan.current + around);
  for (let i = from; i <= to; i++) {
    const r = plan.rows[i];
    if (r.reserve) continue;
    const tag = i === plan.current ? "JORIY" : i < plan.current ? "oldingi" : "keyingi";
    lines.push(`- [${tag}] ${r.no}. ${r.lesson.title || "—"}${r.date ? ` (${r.date})` : ""}${r.taught ? " — oʻtilgan" : ""}`);
  }
  const head = plan.unit ? `Boʻlim (chorak): ${plan.unit.title}` : "Boʻlim: —";
  return `${head}\n${lines.join("\n")}`;
}
