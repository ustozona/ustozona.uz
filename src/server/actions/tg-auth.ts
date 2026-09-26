"use server";

import {
  cancelTgAuth,
  dismissTgPrompt,
  getTgConnection,
  getTgDigestPreview,
  getTgNotifyPrefs,
  getTgPrompt,
  pollTgAuth,
  setTgMarketing,
  setTgNotifyPrefs,
  startTgAuth,
} from "@/server/dal/tg-auth";
import type {
  TgAuthKind,
  TgAuthPoll,
  TgAuthStart,
  TgConnection,
  TgDigestPreview,
  TgNotifyPrefs,
  TgPrompt,
} from "@/lib/tg-auth-types";

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

export async function getTgPromptAction(): Promise<TgPrompt | null> {
  return getTgPrompt();
}

export async function dismissTgPromptAction(): Promise<void> {
  await dismissTgPrompt();
}

export async function getTgDigestPreviewAction(): Promise<TgDigestPreview | null> {
  return getTgDigestPreview();
}

export async function setTgMarketingAction(consent: boolean): Promise<boolean> {
  return setTgMarketing(consent === true);
}

export async function getTgNotifyPrefsAction(): Promise<TgNotifyPrefs | null> {
  return getTgNotifyPrefs();
}

export async function setTgNotifyPrefsAction(input: TgNotifyPrefs): Promise<boolean> {
  if (!input || typeof input !== "object") return false;
  return setTgNotifyPrefs({
    morningEnabled: input.morningEnabled === true,
    morningTime: String(input.morningTime ?? ""),
    eveningEnabled: input.eveningEnabled === true,
    eveningTime: String(input.eveningTime ?? ""),
  });
}
