/* ════════════════════════════════════════════════════════════════════
   AʼZOLIK TARIXI — oʻquvchi profilidagi «Aʼzolik» tabi uchun tiplar
   (docs/sinf-azoligi-spec.md §7).

   Neytral modul: "use server" ham, "server-only" ham YOʻQ — server action
   fayli tip eksport qila olmaydi (AGENTS.md), shuning uchun server (DAL,
   action) ham, mijoz (tab) ham tipni shu yerdan oladi.
   ════════════════════════════════════════════════════════════════════ */

/** Davrni yopish sababi (`enrollment_periods.exit_reason`). */
export type ExitReason = "moved" | "left_school" | "no_show" | "year_end" | "removed";

export const EXIT_REASON_LABEL: Record<ExitReason, string> = {
  moved: "Boshqa sinfga koʻchdi",
  left_school: "Maktabdan ketdi",
  no_show: "Kelmadi",
  year_end: "Oʻquv yili tugadi",
  removed: "Roʻyxatdan olindi",
};

export type MembershipHistoryMove = {
  id: string;
  /** Buyruq sanasi — eski sinfda oxirgi kundan keyingi kun, yangisida birinchi kun. */
  effectiveOn: string;
  orderNo: string | null;
  /** `out` — bola shu sinfdan chiqdi; `in` — shu sinfga keldi. */
  direction: "out" | "in";
  /** Qarama-qarshi tomondagi sinf nomi. */
  otherClassName: string;
  /** Kimdir bu sanani tuzata oladimi (ikkala sinfni ham boshqaradimi). */
  canCorrect: boolean;
};

export type MembershipHistoryPeriod = {
  id: string;
  classId: string;
  className: string;
  /** Sinfdagi birinchi kun; null = boshidan. */
  from: string | null;
  /** Sinfda BOʻLMAGAN birinchi kun; null = hozir ham shu yerda. */
  to: string | null;
  exitReason: string | null;
  move: MembershipHistoryMove | null;
};

export type CorrectMoveDateResult = {
  /** Yangi sana bilan oraliqdan chiqib qolgan davomat yozuvlari soni.
      Yozuvlar OʻCHIRILMAYDI — faqat ogohlantirish uchun. */
  outsideAttendance: number;
};
