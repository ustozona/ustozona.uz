"use server";

import { redirect } from "next/navigation";
import {
  confirmEmailAdd,
  getEmailAddState,
  requestEmailAdd,
} from "@/server/dal/email-add";
import type { EmailAddRequestResult, EmailAddState } from "@/lib/email-add-types";

/* Email qoʻshish — yupqa qatlam, mantiq DAL'da.

   ⛔ Tiplar `@/lib/email-add-types` dan — bu yerda QAYTA EKSPORT
   QILINMAYDI (AGENTS.md: `"use server"` faylda `export type` prodni
   buzadi). */

export async function getEmailAddStateAction(): Promise<EmailAddState> {
  return getEmailAddState();
}

export async function requestEmailAddAction(email: string): Promise<EmailAddRequestResult> {
  return requestEmailAdd(String(email ?? ""));
}

/** Tasdiqlash sahifasidagi tugma — login TALAB QILINMAYDI, imzolangan
 *  token oʻzi dalil. Faqat POST: xatdagi havolani pochta skanerlari
 *  ham ochadi, GET renderda hech narsa oʻzgarmasligi kerak. */
export async function confirmEmailAddAction(formData: FormData): Promise<void> {
  const token = formData.get("t");
  const t = typeof token === "string" ? token : "";
  const r = await confirmEmailAdd(t);
  // Rad etilsa — sahifa tokenni qayta tekshirib, sababni oʻzi koʻrsatadi.
  redirect(r.ok ? "/email-tasdiqlash?ok=1" : `/email-tasdiqlash?t=${encodeURIComponent(t)}`);
}
