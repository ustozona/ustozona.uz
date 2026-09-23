"use server";

import {
  cancelTgAuth,
  getTgConnection,
  pollTgAuth,
  setTgMarketing,
  startTgAuth,
} from "@/server/dal/tg-auth";
import type { TgAuthKind, TgAuthPoll, TgAuthStart, TgConnection } from "@/lib/tg-auth-types";

/* Telegram orqali kirish / bogʻlash — yupqa qatlam, mantiq DAL'da.

   ⛔ Tiplar `@/lib/tg-auth-types` dan — bu yerda QAYTA EKSPORT
   QILINMAYDI (AGENTS.md: `"use server"` faylda `export type` prodni
   buzadi). */

export async function startTgAuthAction(kind: TgAuthKind): Promise<TgAuthStart> {
  if (kind !== "login" && kind !== "link") return { ok: false, reason: "failed" };
  return startTgAuth(kind);
}

export async function pollTgAuthAction(): Promise<TgAuthPoll> {
  return pollTgAuth();
}

export async function cancelTgAuthAction(): Promise<void> {
  await cancelTgAuth();
}

export async function getTgConnectionAction(): Promise<TgConnection | null> {
  return getTgConnection();
}

export async function setTgMarketingAction(consent: boolean): Promise<boolean> {
  return setTgMarketing(consent === true);
}
