import {
  CalendarClock, CalendarDays, CheckCircle2, CircleAlert, CircleDashed, PenLine,
} from "lucide-react";

/**
 * Topshiriq holati — QOʻLDA TANLANMAYDI, sana va baholardan hisoblanadi.
 * Qoʻlda oʻzgartirish maʼlumotga zid holat yaratardi ("Tugallandi", lekin
 * yarim sinf baholanmagan). Toifalar `LessonEditor.STATUS_META` bilan bir
 * xil tonlarda.
 *
 * ⚠️ Holatlar IKKI TURGA boʻlinadi va shakli ham shunga qarab:
 *
 *   KATEGORIYA (qoralama · sanasiz · rejalashtirilgan · bugun) — soʻz.
 *   MIQDOR     (baholash · tugallandi)                        — HALQA + kasr.
 *
 * Oʻqituvchining savoli "baholanyaptimi?" emas, "nechtasi qoldi?" — javob
 * raqam boʻlishi kerak (Classroom "12 Turned in", Canvas "Needs Grading (7)").
 *
 * Bu modul UI'siz: ikonka va ohang xaritasi hamda sof hisob. Chipning oʻzi —
 * `AssignmentStatusChip`, u ikkala eshikda (roʻyxat qatori va muharrir
 * sarlavhasi) bitta koʻrinish beradi.
 */
export const STATUS_META = {
  draft: { icon: PenLine, cls: "bg-muted text-muted-foreground" },
  undated: { icon: CircleAlert, cls: "bg-warning/10 text-warning" },
  planned: { icon: CalendarClock, cls: "bg-info/10 text-info" },
  today: { icon: CalendarDays, cls: "bg-primary/10 text-primary" },
  grading: { icon: CircleDashed, cls: "bg-muted text-muted-foreground" },
  done: { icon: CheckCircle2, cls: "bg-success/10 text-success" },
} as const;

export type AssignmentStatus = keyof typeof STATUS_META;

/** Miqdoriy holatlarda kasr ham boʻladi; kategoriyada faqat tur. */
export type StatusInfo =
  | { kind: Exclude<AssignmentStatus, "grading" | "done"> }
  | { kind: "grading" | "done"; graded: number; total: number };

/**
 * Bitta sinf uchun holat — sof funksiya.
 *
 * Baho sanog'i CHAQIRUVCHIDAN keladi: roʻyxat oʻnlab topshiriqni birga
 * koʻrsatadi, har biri uchun `grades` massivini qayta kezib chiqish kvadrat
 * ish boʻlardi. Chaqiruvchi bir oʻtishda sanaydi (`gradedCountByAssignment`).
 *
 * @param date  Jurnal uchun kanonik sana (`Assignment.date`), `yyyy-mm-dd`.
 * @param total Sinfdagi oʻquvchilar soni (maxraj).
 * @param graded Baho yoki Q/T belgisi kiritilgan oʻquvchilar soni.
 */
export function assignmentStatusFrom(
  date: string | undefined,
  total: number,
  graded: number,
  today: string
): StatusInfo {
  if (!date) return { kind: "undated" };
  if (date > today) return { kind: "planned" };
  if (total === 0) return { kind: "planned" };
  /* Bugun boshlangan va hali hech nima kiritilmagan — bu "baholanmoqda"
     emas. Dars kunning istalgan soatida boʻlishi mumkin, biz esa faqat
     sanani bilamiz; "0/25" oʻrniga halol "Bugun" deymiz. */
  if (graded === 0 && date === today) return { kind: "today" };
  return graded >= total
    ? { kind: "done", graded, total }
    : { kind: "grading", graded, total };
}

/**
 * `assignmentId` → baho/belgi kiritilgan oʻquvchilar soni. Bitta oʻtish.
 *
 * Qoralama baho (`isDraft`) ham sanaladi: u oʻqituvchi kiritgan qiymat,
 * shunchaki hali eʼlon qilinmagan — "qolgani" hisobida uni kiritilmagan
 * deb koʻrsatish oʻqituvchini ikkinchi marta shu oʻquvchiga qaytarardi.
 */
export function gradedCountByAssignment(
  grades: readonly { assignmentId: string; score: number | null; missing?: string }[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const g of grades) {
    if (g.score === null && !g.missing) continue;
    counts.set(g.assignmentId, (counts.get(g.assignmentId) ?? 0) + 1);
  }
  return counts;
}
