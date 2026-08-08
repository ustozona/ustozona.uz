"use server";

import { completeTgSignup } from "@/server/dal/tg-signup";
import type { CompleteResult } from "@/lib/link-types";

/* Telegram orqali roʻyxatdan oʻtish — yupqa qatlam.

   Mijoz komponentlari DAL'ni toʻgʻridan chaqira olmaydi ("server-only").
   Ruxsat tekshiruvi DAL ichida: bu yerda sessiya YOʻQ (foydalanuvchi
   hali mavjud emas), ruxsatni CHIPTA beradi.

   ⛔ `export type { … }` YOZMANG — tiplar `@/lib/link-types` da.
   Sabab: `actions/account-link.ts` dagi izoh (prodni buzgan
   `ReferenceError`). */

export async function completeTgSignupAction(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<CompleteResult> {
  return completeTgSignup(input);
}
