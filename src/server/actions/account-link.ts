"use server";

import {
  getLinkStatus, redeemBotCode, unlinkTelegram, getUnlinkImpact,
  type LinkState, type RedeemResult, type UnlinkImpactRow,
} from "@/server/dal/account-link";

/* LessonLab bog'lash — yupqa qatlam: mijoz komponentlari DAL'ni
   to'g'ridan chaqira olmaydi ("server-only"), shuning uchun shu yerda
   "use server" bilan qayta eksport qilinadi. Auth tekshiruvi DAL
   ichida (`requireTeacher`). */

export type { LinkState, RedeemResult, UnlinkImpactRow };

export async function getLessonLabLinkStatusAction() {
  return getLinkStatus();
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
