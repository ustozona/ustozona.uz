import type { ClassInfo } from "@/lib/grades-data";
import { displayClassName } from "@/lib/class-naming";

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

/** Sinfni yangi oʻquv yiliga koʻchiradi: darajani bittaga oshiradi va yangi
    darajani FAOL yil uchun yozadi, eski darajani esa tarixi hali yoʻq boʻlgan
    barcha oldingi yillarga tarqatadi. Parallel harfi va id oʻzgarmaydi, nom
    esa darajadan qayta hisoblanadi — shu bois amal QAYTARILUVCHAN: eski
    yil faollashtirilganda 5-A yana 5-A boʻlib koʻrinadi.

    `priorYearIds` — faol yildan boshqa barcha oʻquv yillari id'lari. */
export function bumpClassToNextYear(
  info: ClassInfo,
  activeYearId: string | undefined,
  priorYearIds: string[]
): ClassInfo {
  const oldGrade = info.grade;
  if (oldGrade == null) return info;
  const newGrade = Math.min(oldGrade + 1, GRADUATING_GRADE);

  // Eski daraja — tarixi hali yoʻq oldingi yillarga (odatda bitta yil).
  const history: Record<string, number> = { ...(info.gradeByYear ?? {}) };
  for (const yid of priorYearIds) if (!(yid in history)) history[yid] = oldGrade;
  if (activeYearId) history[activeYearId] = newGrade;

  return {
    ...info,
    grade: newGrade,
    gradeByYear: history,
    name: displayClassName({ grade: newGrade, section: info.section, label: info.label }),
  };
}

/** Sinf uchun standart rollover amali: darajali (1..10) → bump;
    GRADUATING_GRADE va undan yuqori → archive; darajasiz (toʻgarak) → keep. */
export function defaultRolloverAction(info: ClassInfo): RolloverAction {
  if (info.grade == null) return "keep";
  if (info.grade >= GRADUATING_GRADE) return "archive";
  return "bump";
}
