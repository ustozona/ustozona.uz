/* ════════════════════════════════════════════════════════════════════
   «BUGUN» VIDJETI — kunlik dars jadvali (docs/doska-referens-koriklari.md
   R409). Tiplar shu yerda — `"use server"` fayldan tip eksport qilinmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Bugungi bitta dars — kun boshidan daqiqalarda, sinf nomi bilan. */
export type TodayLesson = { startMin: number; endMin: number; className: string };

/**
 * `holiday` — bugun taʼtil yoki bayram (oʻquv kalendaridan): darslar
 * boʻsh, vidjet uning nomini koʻrsatadi.
 */
export type DoskaTodayResult =
  | { status: "ok"; lessons: TodayLesson[]; holiday?: string }
  | { status: "none" };

export function fmtMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
