/* Telegram orqali kirish/bogʻlash — sayt va server oʻrtasidagi tiplar.

   ⛔ Neytral modul: `"use server"` ham, `server-only` ham YOʻQ. Server
   Action fayllari tiplarni shu yerdan import qiladi va QAYTA EKSPORT
   QILMAYDI — `"use server"` faylda `export type` prodni buzadi
   (AGENTS.md). */

export type TgAuthKind = "login" | "link";

export type TgAuthStart =
  | {
      ok: true;
      /** `t.me/<bot>?start=...` — telefonda tugma, kompyuterda QR. */
      deepLink: string;
      /** Saytda koʻrinadigan 4 raqam — botda shu tanlanadi. */
      code: string;
      /** Kompyuterda telefon bilan skanerlash uchun (serverda yasalgan SVG). */
      qrSvg: string;
      expiresInSeconds: number;
    }
  | { ok: false; reason: "disabled" | "unauthorized" | "failed" };

/** Sayt har 2 soniyada soʻraydigan holat. */
export type TgAuthPoll =
  | "none" // cookie yoʻq yoki soʻrov topilmadi
  | "waiting" // bot hali ochilmagan / kod tanlanmagan
  | "awaiting_phone" // yangi akkaunt: botda raqam kutilmoqda
  | "signed_in" // login: sessiya ochildi
  | "linked" // link: telegram akkauntga ulandi
  | "rejected" // «Bu men emas» yoki notoʻgʻri kod
  | "has_account" // «menda email akkaunt bor» — avval email bilan kirish kerak
  | "taken_tg" // bu telegram boshqa akkauntga ulangan
  | "taken_uz" // bu akkaunt boshqa telegramga ulangan
  | "banned"
  | "expired";

/** Sozlamalardagi «Telegram» qatori uchun. */
export type TgConnection = {
  enabled: boolean;
  /** `user_telegram` da bogʻlanish bor. */
  linked: boolean;
  /** Ustozona boti ishga tushirilgan va bloklanmagan. */
  botActive: boolean;
  username: string | null;
  /** Toʻliq raqam — faqat egasiga koʻrsatiladi. */
  phone: string | null;
  marketing: "yes" | "no" | "unasked";
  botUrl: string | null;
};

/** Kunlik xabarlar sozlamasi. Vaqt `HH:MM` (Toshkent), 15 daqiqa qadam. */
export type TgNotifyPrefs = {
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
};

/** Tanlanadigan vaqt oraliqlari — UI roʻyxati ham, server tekshiruvi ham shu yerdan. */
export const NOTIFY_WINDOWS = {
  morning: { from: 5 * 60, to: 12 * 60 },
  evening: { from: 15 * 60, to: 23 * 60 },
} as const;

export const NOTIFY_DEFAULTS: TgNotifyPrefs = {
  morningEnabled: true,
  morningTime: "07:00",
  eveningEnabled: true,
  eveningTime: "20:00",
};

/** `from..to` oraligʻidagi 15 daqiqalik vaqtlar (`HH:MM`). */
export function notifyTimeOptions(kind: keyof typeof NOTIFY_WINDOWS): string[] {
  const { from, to } = NOTIFY_WINDOWS[kind];
  const out: string[] = [];
  for (let m = from; m <= to; m += 15) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}
