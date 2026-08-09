/* Sinxronizatsiya natijasi — NEYTRAL modul.

   ⛔ Bu tur `"use server"` faylda eksport QILINMAYDI. Sabab
   `AGENTS.md` da: Turbopack `"use server"` modulidagi tip-reeksportini
   RUNTIME eksportga aylantiradi va modul yuklanishda qulaydi —
   bu bitta amalni emas, BARCHA Server Action'ni o'ldiradi
   (2026-08-08 da bir kunni yegan xato).

   Shuning uchun mijoz ham, server ham SHU YERDAN import qiladi. */

export type SyncOutcome =
  | {
      ok: true;
      classesCreated: number;
      studentsCreated: number;
      testsCreated: number;
      testsUpdated: number;
      conflicts: number;
      skipped: number;
      /** `sync_reports` id — tafsilotni ochish uchun. Yozilmasa null. */
      reportId: string | null;
    }
  /** Telegram hali bog'lanmagan — chaqiruvchi joy OAuth yo'liga
      yuborishi kerak. Bu XATO emas, oddiy holat. */
  | { ok: false; reason: "not_linked" }
  | { ok: false; reason: "failed" };
