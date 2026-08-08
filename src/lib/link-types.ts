/* ════════════════════════════════════════════════════════════════════
   USTOZONA ↔ LESSONLAB — UMUMIY TIPLAR (neytral modul)

   ⛔ NEGA BU FAYL ALOHIDA — 2026-08-08 DA PRODNI BUZGAN XATO
   ---------------------------------------------------------
   Bu tiplar ilgari DAL ichida (`server-only`) ta'riflanib, `"use server"`
   fayldan qayta eksport qilinardi:

       // src/server/actions/account-link.ts
       "use server";
       export type { LinkState, RedeemResult, UnlinkImpactRow };

   Ko'rinishidan zararsiz — `export type` TypeScript'da o'chirilishi
   kerak. Lekin Turbopack `"use server"` modulini qayta yozadi va bu
   qatorni RUNTIME eksportga aylantiradi. Natijada prodda:

       ReferenceError: LinkState is not defined
           at module evaluation (.../src_server_actions_feedback_ts_….js)

   Va bu bitta amalni emas, HAMMASINI o'ldirdi: Next barcha Server
   Action'ni bitta chunkka yig'adi, chunk esa yuklanish paytida
   qulaydi. Oqibatlari kun bo'yi butunlay boshqa joyda izlandi:

     · «Foydalanuvchi» + bo'sh email  (sozlamalar yuklanmadi)
     · «Holatni tekshirib bo'lmadi»   (bog'lanish holati yo'q)
     · onboarding sehrgari qayta-qayta ochilishi
     · yangi hisobda `teachers` qatori yaratilmasligi

   ⛔ QOIDA: `"use server"` faylda `export type { … }` YOZMANG.
   Tiplarni shu yerga qo'ying va ikkala tomon ham SHU YERDAN import
   qilsin. Bu fayl ataylab neytral: `"use server"` ham, `server-only`
   ham yo'q, ya'ni mijoz ham, server ham bemalol import qiladi va
   hech qanday transformdan o'tmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Bog'lanish holati: bog'langan yoki bog'lash havolasi. */
export type LinkState =
  | { linked: true; telegramId: string }
  | { linked: false; deepLink: string; expiresInMinutes: number };

/** Bot bergan kodni Ustozona tomonida ishlatish natijasi. */
export type RedeemResult =
  | { status: "ok" | "already" }
  | { status: "invalid" | "expired" | "used" | "taken_uz" | "taken_tg" };

/** Biriktirishni uzishdan oldin ko'rsatiladigan oqibat — baho/javobi
    bor o'quvchilar. Bo'sh ro'yxat = xavf yo'q. */
export type UnlinkImpactRow = {
  uzStudentId: string;
  studentName: string;
  className: string;
  gradeCount: number;
  responseCount: number;
  lastActivity: string | null;
};

/** Server Action yiqilganda mijozga uzatiladigan sabab nomi.

    unauthorized → sessiya yo'q/tugagan
    forbidden    → rol yetarli emas
    server       → qolgan hammasi */
export type FailureReason = "unauthorized" | "forbidden" | "server";

/** Bog'lanish holati amalining natijasi — xato ISTISNO bilan qaytmaydi.

    Sessiya tugashi normal holat; uni istisno bilan emas, qaytarilgan
    qiymat bilan ifodalash kerak, aks holda UI unga javob bera olmaydi
    (Next production'da Server Action xatosini mijozdan yashiradi). */
export type LinkStatusResult =
  | (LinkState & { required: boolean })
  | { failed: FailureReason; detail?: string };

/** Telegram chiptasi holati — `/tg-royxat` sahifasi uchun. */
export type TicketInfo =
  | { ok: true; fullName: string }
  | { ok: false; reason: "invalid" | "expired" | "used" | "taken_tg" };

/** Telegram orqali akkaunt yaratish natijasi. */
export type CompleteResult =
  | { status: "ok" }
  | {
      status: "invalid" | "expired" | "used" | "taken_tg"
        | "email_taken" | "weak_password" | "bad_name" | "failed";
      message?: string;
    };
