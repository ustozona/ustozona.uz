/* ════════════════════════════════════════════════════════════════════
   PARALLEL KALITI — Q3 qoidasi uchun (docs/sinf-azoligi-spec.md §3).

   `classes` qatori aslida FAN GURUHI («7-A Matematika», «7-A Ingliz
   1-guruh»): maktab rejimida bitta bola bir vaqtda bir nechta darajali
   guruhda boʻlishi TOʻGʻRI. Qoida parallel darajasida:

     Bir sanada bolaning barcha darajali guruhlari BITTA parallelga
     tegishli. «7-A Matematika» + «7-A Ingliz» — mumkin;
     «7-A Matematika» + «7-D Ingliz» — mumkin emas.

   Parallel kaliti:
     • `parentClassId` boʻlsa — maʼmuriy sinf;
     • boʻlmasa — `(grade, section)`;
     • darajasiz guruh (toʻgarak) — kalit YOʻQ, qoidaga kirmaydi.

   ⚠️ `grade` — xom ustun. Yil faollashganda u faol yilga keltirilgani
   uchun (`applyYearActivationSideEffects`) shu yerda ayrim proyeksiya
   kerak emas.

   Neytral modul: "use server" ham, "server-only" ham YOʻQ.
   ════════════════════════════════════════════════════════════════════ */

export type ParallelSource = {
  parentClassId?: string | null;
  grade?: number | null;
  section?: string | null;
};

/** Guruhning parallel kaliti; darajasiz guruh (toʻgarak) uchun `null`. */
export function parallelKey(c: ParallelSource): string | null {
  if (c.parentClassId) return `p:${c.parentClassId}`;
  if (c.grade == null) return null;
  return `g:${c.grade}:${c.section ?? ""}`;
}
