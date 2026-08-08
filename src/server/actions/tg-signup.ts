"use server";

import { completeTgSignup, type CompleteResult } from "@/server/dal/tg-signup";

/* Telegram orqali roʻyxatdan oʻtish — yupqa qatlam.

   Mijoz komponentlari DAL'ni toʻgʻridan chaqira olmaydi ("server-only").
   Ruxsat tekshiruvi DAL ichida: bu yerda sessiya YOʻQ (foydalanuvchi
   hali mavjud emas), ruxsatni CHIPTA beradi. */

export type { CompleteResult };

export async function completeTgSignupAction(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<CompleteResult> {
  return completeTgSignup(input);
}
