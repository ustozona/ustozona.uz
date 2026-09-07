"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getMyPreference, optOutByUserId, setMyPreference } from "@/server/dal/email-activation";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/* Aktivatsiya xatlari sozlamasi — yupqa qatlam: zod-parse → DAL.

   ⛔ Bu faylda `export type { … }` YOZILMAYDI — Turbopack `"use server"`
   modulida tip-reeksportini runtime eksportga aylantiradi va butun
   Server Action chunkini yiqitadi (AGENTS.md). Tiplar DAL'da. */

export async function fetchEmailActivationPrefAction(): Promise<{ enabled: boolean }> {
  return getMyPreference();
}

export async function setEmailActivationPrefAction(enabled: boolean): Promise<{ ok: true }> {
  await setMyPreference(z.boolean().parse(enabled));
  return { ok: true };
}

/** Obunani bekor qilish sahifasidagi tugma — login TALAB QILINMAYDI,
 *  imzolangan token oʻzi dalil. Faqat POST orqali chaqiriladi:
 *  GET renderda oʻzgarish qilinmasligi kerak, chunki xatdagi havolani
 *  pochta darvozasi va havola-skanerlari ham ochadi. */
export async function unsubscribeByTokenAction(formData: FormData): Promise<void> {
  const token = formData.get("t");
  const userId = verifyUnsubscribeToken(typeof token === "string" ? token : null);
  if (!userId) redirect("/unsubscribe");
  await optOutByUserId(userId);
  redirect("/unsubscribe?ok=1");
}
