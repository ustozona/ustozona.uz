"use server";

import {
  getLinkStatus, redeemBotCode, unlinkTelegram, getUnlinkImpact,
} from "@/server/dal/account-link";
import { failureOf } from "@/server/dal/_failure-reason";
import type { RedeemResult, UnlinkImpactRow, LinkStatusResult } from "@/lib/link-types";

/* LessonLab bog'lash — yupqa qatlam: mijoz komponentlari DAL'ni
   to'g'ridan chaqira olmaydi ("server-only"), shuning uchun shu yerda
   "use server" bilan qayta eksport qilinadi. Auth tekshiruvi DAL
   ichida (`requireTeacher`).

   ⛔ BU FAYLDA `export type { … }` YOZMANG — 2026-08-08 DA PRODNI
   BUZGAN XATO AYNAN SHU EDI.

   Turbopack `"use server"` modulini qayta yozadi va tip-reeksportini
   RUNTIME eksportga aylantiradi. Natijada modul yuklanish paytida
   qulaydi:

       ReferenceError: LinkState is not defined
           at module evaluation (.../src_server_actions_feedback_ts_….js)

   Va bu bitta amalni emas, HAMMASINI o'ldiradi — Next barcha Server
   Action'ni bitta chunkka yig'adi. Butun kun «Foydalanuvchi»,
   «Holatni tekshirib bo'lmadi» va onboarding sehrgarining qayta-qayta
   ochilishi shundan edi.

   Tiplar `@/lib/link-types` da (neytral modul) — mijoz ham, server ham
   SHU YERDAN import qiladi. Batafsil: o'sha faylning boshidagi izoh. */

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
