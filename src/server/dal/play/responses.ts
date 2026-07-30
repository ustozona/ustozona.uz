import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, activityItems, responses, sessionParticipants } from "@/server/db/schema";
import { requireParticipant, ForbiddenError } from "@/server/play/session";
import { scoreResponse } from "@/lib/assess/score";

/* ════════════════════════════════════════════════════════════════════
   JAVOB QABUL QILISH — bitta joy, besh yetkazish usuli (jonli, oʻz
   tezligida, taqdimot, OMR, QR) shu yerga tushadi (docs/ost-loyihalar-
   arxitektura.md, "Asosiy gʻoya").

   `elapsed_ms` faqat KOʻRSATISH uchun saqlanadi, `scoreResponse()`
   kirish tipiga kirmaydi (score.ts izohiga qarang).
   ════════════════════════════════════════════════════════════════════ */

export type SubmitResponseInput = {
  token: string;
  itemId: string;
  answer: Record<string, unknown>;
  elapsedMs?: number;
  clientSeq?: number;
};

export async function submitResponse(input: SubmitResponseInput) {
  const { participant, session } = await requireParticipant(input.token);
  if (session.state !== "running" && session.state !== "paused") {
    throw new ForbiddenError("Sessiya javob qabul qilmayapti");
  }
  if (session.state === "paused") {
    throw new ForbiddenError("Sessiya vaqtincha toʻxtatilgan");
  }

  const [item] = await db
    .select()
    .from(activityItems)
    .where(eq(activityItems.id, input.itemId));
  if (!item) throw new ForbiddenError("Element topilmadi");

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, item.activityId));
  if (!activity) throw new ForbiddenError("Faoliyat topilmadi");

  const [{ count: previousAttempts }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(responses)
    .where(
      and(eq(responses.participantId, participant.id), eq(responses.itemId, input.itemId))
    );
  const attemptNo = previousAttempts + 1;

  const { isCorrect, score } = scoreResponse({
    shape: activity.shape,
    grading: activity.grading,
    content: item.content,
    ordinal: item.ordinal,
    answer: input.answer,
  });

  const [row] = await db
    .insert(responses)
    .values({
      id: randomUUID(),
      teacherId: activity.teacherId,
      sessionId: session.id,
      participantId: participant.id,
      studentId: participant.studentId,
      activityId: activity.id,
      itemId: item.id,
      itemVersion: activity.version,
      attemptNo,
      answer: input.answer,
      isCorrect,
      score: score === null ? null : score.toFixed(3),
      standardId: activity.standardId,
      source: activity.source,
      elapsedMs: input.elapsedMs ?? null,
      clientSeq: input.clientSeq ?? null,
    })
    .onConflictDoNothing({
      target: [responses.participantId, responses.itemId, responses.itemVersion, responses.attemptNo],
    })
    .returning();

  await db
    .update(sessionParticipants)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessionParticipants.id, participant.id));

  return row;
}
