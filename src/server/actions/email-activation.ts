"use server";

import { z } from "zod";
import { getMyPreference, setMyPreference } from "@/server/dal/email-activation";

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
