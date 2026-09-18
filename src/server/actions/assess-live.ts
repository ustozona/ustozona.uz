"use server";

import { z } from "zod";
import { closeSession } from "@/server/dal/assess/sessions";
import {
  listLiveClasses,
  liveResults,
  setLiveStep,
  startLiveSession,
} from "@/server/dal/assess/live";
import { requireTeacher } from "@/server/session";
import { realtimeConfig } from "@/server/realtime/config";
import type { LiveResults, LiveSessionInfo, RealtimeConfig } from "@/lib/live-session";

/* Jonli sessiya — oʻqituvchi (Doska) amallari. Yupqa qatlam: zod → DAL.
   Tiplar `lib/live-session.ts` da (bu faylda tip eksporti TAQIQ — AGENTS.md). */

const startSchema = z.object({
  setId: z.string().min(1),
  classId: z.string().min(1),
});

export async function startLiveSessionAction(
  input: z.infer<typeof startSchema>
): Promise<LiveSessionInfo> {
  const { setId, classId } = startSchema.parse(input);
  return startLiveSession(setId, classId);
}

const stepSchema = z.object({
  sessionId: z.string().min(1),
  index: z.number().int().min(0).max(10_000),
  revealed: z.boolean(),
});

export async function setLiveStepAction(input: z.infer<typeof stepSchema>): Promise<void> {
  const { sessionId, index, revealed } = stepSchema.parse(input);
  await setLiveStep(sessionId, index, revealed);
}

export async function liveResultsAction(sessionId: string): Promise<LiveResults> {
  return liveResults(z.string().min(1).parse(sessionId));
}

export async function endLiveSessionAction(sessionId: string): Promise<void> {
  await closeSession(z.string().min(1).parse(sessionId));
}

/** Realtime ulanish sozlamasi — faqat tizimga kirgan oʻqituvchiga.
    JS paketiga qotirilmaydi (`server/realtime/config.ts` izohi). */
export async function liveRealtimeConfigAction(): Promise<RealtimeConfig | null> {
  await requireTeacher();
  return realtimeConfig();
}

export async function listLiveClassesAction(): Promise<{ id: string; name: string }[]> {
  return listLiveClasses();
}
