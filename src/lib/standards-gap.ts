/* ════════════════════════════════════════════════════════════════════
   BOʻSHLIQ HISOBOTI — qamrov × oʻlchov matritsasi

   Butun standartlar modelining eng arzon va eng foydali natijasi. Ikki
   oʻq allaqachon bor va ular ATAYLAB aralashtirilmaydi (spec §3):

     QAMROV   (oʻqitildi)  ← DARS bogʻlanishidan   `lessonCoverage`
     OʻLCHOV  (oʻlchandi)  ← TOPSHIRIQ teglashidan `Assignment.standardIds`

   Ularni kesishtirsak toʻrt holat chiqadi, ikkitasi haqiqiy xavf:

     ┌───────────────┬──────────────────────┬──────────────────────┐
     │               │ oʻlchandi            │ oʻlchanmadi          │
     ├───────────────┼──────────────────────┼──────────────────────┤
     │ oʻqitildi     │ ✅ joyida            │ ⚠️ TEKSHIRILMAGAN    │
     │ oʻqitilmadi   │ ⚠️ OʻTILMAGAN        │ ⬜ hali navbat emas  │
     └───────────────┴──────────────────────┴──────────────────────┘

   «Oʻqitildi, lekin oʻlchanmadi» — oʻquv mazmuni baholanmay qolgani;
   «oʻlchandi, lekin oʻqitilmadi» — baholashga darsda boʻlmagan narsa
   kirib qolgani. Ikkalasi ham oʻqituvchiga darhol koʻrsatilishi kerak.

   ⚠️ Bu hisobot OʻZLASHTIRISHNI oʻlchamaydi — u faqat DALIL BOR-YOʻQLIGIGA
   qaraydi. «Oʻlchandi» degani «yaxshi oʻzlashtirildi» degani emas.

   docs/standards-page-spec.md §11.3, §12.1
   ════════════════════════════════════════════════════════════════════ */

import type { Assignment } from "@/lib/grades-data";
import type { StandardItem } from "@/lib/standards-data";
import type { Lesson } from "@/lib/lessons-data";
import { lessonCoverage } from "@/lib/standards-coverage";

export type GapStatus =
  /** Oʻqitildi va oʻlchandi. */
  | "ok"
  /** Oʻqitildi, lekin hech qachon oʻlchanmadi. */
  | "untested"
  /** Oʻlchandi, lekin darsda oʻtilmadi. */
  | "untaught"
  /** Ikkalasi ham yoʻq — hali navbat kelmagan boʻlishi mumkin. */
  | "pending";

export interface GapRow {
  std: StandardItem;
  status: GapStatus;
  taught: boolean;
  /** Shu standartni oʻlchaydigan topshiriqlar soni. */
  assignmentCount: number;
}

export interface GapSummary {
  rows: GapRow[];
  counts: Record<GapStatus, number>;
}

/** Standart oʻqitilganmi: dars bogʻlanishi yoki qoʻlda belgilangan holat. */
function isTaught(std: StandardItem, lessons: Lesson[], classId: string): boolean {
  return std.covered || lessonCoverage(lessons, classId, std.id).taught;
}

export function gapReport(
  standards: StandardItem[],
  lessons: Lesson[],
  assignments: Assignment[],
  classId: string,
): GapSummary {
  /* Bir marta sanab olamiz — har standart uchun topshiriqlarni qayta
     aylanish katta sinfda sezilarli boʻlardi. */
  const measured = new Map<string, number>();
  for (const a of assignments) {
    for (const code of a.standardIds ?? []) {
      measured.set(code, (measured.get(code) ?? 0) + 1);
    }
  }

  const counts: Record<GapStatus, number> = { ok: 0, untested: 0, untaught: 0, pending: 0 };
  const rows = standards.map((std) => {
    const taught = isTaught(std, lessons, classId);
    const assignmentCount = measured.get(std.id) ?? 0;
    const status: GapStatus = taught
      ? assignmentCount > 0 ? "ok" : "untested"
      : assignmentCount > 0 ? "untaught" : "pending";
    counts[status] += 1;
    return { std, status, taught, assignmentCount };
  });

  return { rows, counts };
}
