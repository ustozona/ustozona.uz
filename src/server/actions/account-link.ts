"use server";

import {
  getLinkStatus, redeemBotCode, unlinkTelegram, getUnlinkImpact,
  type LinkState, type RedeemResult, type UnlinkImpactRow,
} from "@/server/dal/account-link";
import { failureOf, type FailureReason } from "@/server/dal/_failure-reason";

/* LessonLab bog'lash — yupqa qatlam: mijoz komponentlari DAL'ni
   to'g'ridan chaqira olmaydi ("server-only"), shuning uchun shu yerda
   "use server" bilan qayta eksport qilinadi. Auth tekshiruvi DAL
   ichida (`requireTeacher`). */

export type { LinkState, RedeemResult, UnlinkImpactRow, FailureReason };

export type LinkStatusResult =
  | (LinkState & { required: boolean })
  | { failed: FailureReason; detail?: string };

/** Bog'lanish holati — XATO ISTISNO BILAN QAYTMAYDI.

    ⛔ Ilgari bu funksiya `throw` qilardi va mijoz shunchaki «Holatni
    tekshirib bo'lmadi» ko'rsatardi. Next.js production'da Server
    Action xatosini mijozdan yashiradi, ya'ni sabab NA ekranda, NA
    brauzer konsolida ko'rinmasdi — 2026-08-08 da nosozlik shu sababli
    butun kun noto'g'ri qatlamlarda izlandi (auth, baza, CSRF).

    Endi sabab nomlanadi va UI unga javob beradi: sessiya tugagan
    bo'lsa foydalanuvchi «qaytadan kiring» ko'radi, mazmunsiz «xato»
    emas. Sabab: `dal/_failure-reason.ts`. */
export async function getLessonLabLinkStatusAction(): Promise<LinkStatusResult> {
  try {
    return await getLinkStatus();
  } catch (err) {
    const { reason, detail } = failureOf(err, "account-link/status");
    return { failed: reason, detail };
  }
}

export async function redeemLessonLabCodeAction(code: string): Promise<RedeemResult> {
  return redeemBotCode(code);
}

export async function unlinkLessonLabAction(confirmed: boolean) {
  return unlinkTelegram({ confirmed });
}

export async function getLessonLabUnlinkImpactAction(): Promise<UnlinkImpactRow[]> {
  return getUnlinkImpact();
}
