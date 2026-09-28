/* ════════════════════════════════════════════════════════════════════
   EMAIL QOʻSHISH — Telegram orqali ochilgan (emailsiz) hisob uchun.

   ⚠️ Bu modul ATAYLAB neytral: `"use server"` ham, `server-only` ham
   yoʻq — tiplarni ikkala tomon ham shu yerdan import qiladi (AGENTS.md).
   ════════════════════════════════════════════════════════════════════ */

/** Sozlamalardagi forma holati. `null` — hisobda haqiqiy email bor,
    forma kerak emas. */
export type EmailAddState = {
  /** Oxirgi tasdiqlash xati — hali bosilmagan boʻlsa. */
  pending: { email: string; sentAt: string } | null;
} | null;

export type EmailAddRequestResult =
  | { ok: true; email: string }
  | {
      ok: false;
      reason:
        /** Manzil formati notoʻgʻri yoki xat yetib bormaydigan domen. */
        | "invalid"
        /** Bu email boshqa hisobga tegishli. */
        | "taken"
        /** Oldingi xatdan keyin bir daqiqa oʻtmagan. */
        | "too_soon"
        /** Sutkalik chegara tugadi. */
        | "too_many"
        /** Hisobda allaqachon haqiqiy email bor. */
        | "has_email"
        | "send_failed";
    };

export type EmailAddConfirmError =
  /** Imzo notoʻgʻri yoki havola toʻliq nusxalanmagan. */
  | "invalid"
  /** Muddati oʻtgan yoki undan keyin boshqa xat soʻralgan. */
  | "expired"
  /** Shu orada bu email boshqa hisobga ulangan. */
  | "taken"
  /** Hisobda allaqachon haqiqiy email bor. */
  | "done";

/** Tasdiqlash sahifasi uchun — tugma bosilishidan OLDIN koʻrsatiladi. */
export type EmailAddPreview =
  | { ok: true; email: string; name: string }
  | { ok: false; reason: EmailAddConfirmError };
