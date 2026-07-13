import type { ClassInfo } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   YIL OʻTKAZISH (ROLLOVER) — sof helperlar (React/store'siz)

   Yangi oʻquv yili boshlanganda sinflar JOYIDA qayta nomlanadi
   (5-A → 6-A, grade+1) — sinf UUID va tarixi (davomat/baho) saqlanadi.
   Bitiruvchi (11-sinf) va tugagan guruhlar arxivlanadi. Toʻgarak kabi
   darajasiz guruhlarga tegilmaydi (default "keep"). RolloverWizard shu
   defaultlarni koʻrsatadi; oʻqituvchi har sinf uchun tuzatishi mumkin.
   ════════════════════════════════════════════════════════════════════ */

export type RolloverAction = "bump" | "keep" | "archive";

/** Bitiruvchi (arxivlanadigan) eng yuqori sinf darajasi. */
export const GRADUATING_GRADE = 11;

/** Sinf nomidagi bosh sonni grade+1 ga oʻzgartiradi (5-A → 6-A). Nom sondan
    boshlanmasa yoki bosh son grade bilan mos kelmasa — nomga tegilmaydi
    (oʻqituvchi qoʻlda tuzatadi). */
export function bumpClassName(name: string, grade: number): string {
  const m = name.match(/^\s*(\d+)(.*)$/);
  if (m && Number(m[1]) === grade) return `${grade + 1}${m[2]}`;
  return name;
}

/** Sinf uchun standart rollover amali: darajali (1..10) → bump;
    GRADUATING_GRADE va undan yuqori → archive; darajasiz (toʻgarak) → keep. */
export function defaultRolloverAction(info: ClassInfo): RolloverAction {
  if (info.grade == null) return "keep";
  if (info.grade >= GRADUATING_GRADE) return "archive";
  return "bump";
}
