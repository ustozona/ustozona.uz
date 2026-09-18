"use server";

import { z } from "zod";
import {
  createSession,
  closeSession,
  getSession,
  listSessionsBySet,
  openSession,
} from "@/server/dal/assess/sessions";
import { publishSessionToGrades, type PublishResult } from "@/server/dal/assess/publish";
import { sessionReport, type SessionReport } from "@/server/dal/assess/results";
import type { QuizSessionRow } from "@/server/db/schema";

/* Host (oʻqituvchi) sessiya boshqaruvi — yupqa qatlam: zod-parse → DAL. */

export async function listSessionsAction(setId: string): Promise<QuizSessionRow[]> {
  return listSessionsBySet(setId);
}

/** Nashr etilgan topshiriqdan (`assignment.sourceSessionId`) orqaga —
    Baholash toʻplamini topish uchun (AssignmentEditorOverlay "Ochish"). */
export async function getSetIdForSessionAction(sessionId: string): Promise<string | null> {
  const session = await getSession(sessionId);
  return session?.setId ?? null;
}

const startSchema = z.object({
  setId: z.string().min(1),
  classId: z.string().min(1),
  title: z.string().max(200).optional(),
  /** Topshiriqning «Muddat» sanasi (YYYY-MM-DD) — uyga vazifa. */
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Sessiya yaratadi VA darhol ochadi (`running`) — v1 UI uchun bitta qadam.
    `dueDate` berilsa, sessiya shu kunning oxirigacha (Toshkent vaqti)
    ochiq: oʻquvchi xohlagan vaqtda, oʻz tezligida topshiradi. */
export async function startSessionAction(input: z.infer<typeof startSchema>): Promise<QuizSessionRow> {
  const { dueDate, ...parsed } = startSchema.parse(input);
  const dueAt = dueDate ? new Date(`${dueDate}T23:59:59.999+05:00`) : undefined;
  const created = await createSession({ ...parsed, mode: "selfpaced", dueAt });
  return openSession(created.id);
}

export async function closeSessionAction(sessionId: string): Promise<QuizSessionRow> {
  return closeSession(sessionId);
}

export async function sessionReportAction(sessionId: string): Promise<SessionReport> {
  return sessionReport(sessionId);
}

const publishSchema = z.object({
  sessionId: z.string().min(1),
  topicId: z.string().min(1),
});

export async function publishSessionAction(
  input: z.infer<typeof publishSchema>
): Promise<PublishResult> {
  const parsed = publishSchema.parse(input);
  return publishSessionToGrades(parsed.sessionId, parsed.topicId);
}
