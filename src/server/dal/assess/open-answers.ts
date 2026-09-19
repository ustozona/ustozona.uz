import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  activityItems,
  quizSessions,
  responses,
  sessionParticipants,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { OpenAnswer } from "@/lib/live-session";

/* ════════════════════════════════════════════════════════════════════
   OCHIQ JAVOBLAR — oʻqituvchi qoʻlda baholaydi (\`grading = "manual"\`).

   Ball 0 / 0,5 / 1 — \`responses.score\` (qisman baholash, R26) ga
   yoziladi; \`isCorrect\` faqat toʻliq ballda true. Jurnalga koʻchirish
   (\`publish.ts\`) avval \`score\` ni oladi, shuning uchun baholangan javob
   darhol hisobga tushadi; baholanmagani 0 boʻlib qoladi — panel buni
   nashrdan oldin ogohlantiradi.
   ════════════════════════════════════════════════════════════════════ */

export async function listOpenAnswers(sessionId: string): Promise<OpenAnswer[]> {
  const teacher = await requireTeacher();
  const [session] = await db
    .select({ id: quizSessions.id })
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacher.id)));
  if (!session) return [];

  const rows = await db
    .select({
      responseId: responses.id,
      activityId: responses.activityId,
      answer: responses.answer,
      score: responses.score,
      content: activityItems.content,
      config: activities.config,
      studentName: sessionParticipants.displayName,
    })
    .from(responses)
    .innerJoin(activities, eq(activities.id, responses.activityId))
    .innerJoin(activityItems, eq(activityItems.id, responses.itemId))
    .innerJoin(sessionParticipants, eq(sessionParticipants.id, responses.participantId))
    .where(and(eq(responses.sessionId, sessionId), eq(activities.shape, "text")))
    .orderBy(asc(responses.activityId), asc(sessionParticipants.displayName));

  return rows.map((r) => ({
    responseId: r.responseId,
    activityId: r.activityId,
    question: (r.content as { stem?: string }).stem ?? "",
    sample: (r.config as { sample?: string }).sample,
    studentName: r.studentName,
    text: String((r.answer as { text?: unknown }).text ?? ""),
    score: r.score === null ? null : Number(r.score),
  }));
}

export async function gradeOpenAnswer(responseId: string, score: 0 | 0.5 | 1): Promise<void> {
  const teacher = await requireTeacher();
  // Egalik VA tur tekshiruvi: faqat oʻz ochiq javoblari qoʻlda baholanadi —
  // avtomatik tekshirilgan test javobini bu yoʻl bilan «tuzatib» boʻlmaydi.
  const [row] = await db
    .select({ id: responses.id })
    .from(responses)
    .innerJoin(activities, eq(activities.id, responses.activityId))
    .where(
      and(
        eq(responses.id, responseId),
        eq(responses.teacherId, teacher.id),
        eq(activities.grading, "manual"),
      ),
    );
  if (!row) throw new Error("Javob topilmadi");

  await db
    .update(responses)
    .set({ score: score.toFixed(3), isCorrect: score === 1 })
    .where(eq(responses.id, responseId));
}
