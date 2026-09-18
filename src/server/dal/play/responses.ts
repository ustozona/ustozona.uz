import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, activityItems, responses, sessionParticipants } from "@/server/db/schema";
import { requireParticipant, ForbiddenError } from "@/server/play/session";
import { scoreResponse } from "@/lib/assess/score";
import { isSessionPastDue } from "@/lib/assess/session-due";
import { nudgeTopic } from "@/server/realtime/broadcast";

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
  if (session.state === "paused") {
    throw new ForbiddenError("Sessiya vaqtincha toʻxtatilgan");
  }
  if (session.state !== "running") {
    throw new ForbiddenError("Sessiya javob qabul qilmayapti");
  }
  if (isSessionPastDue(session)) {
    throw new ForbiddenError("Topshiriq muddati tugagan");
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

  /* JONLI SESSIYA (R284): har savolga BITTA javob va faqat javob ochilguncha.
     Aks holda doskadagi ustunlar bir oʻquvchini ikki marta sanardi, toʻgʻri
     javobni koʻrgandan keyin «tuzatish» esa natijani maʼnosiz qilardi. */
  const live = session.mode === "live";
  const liveConfig = session.renderConfig as { revealed?: boolean; liveTopic?: string };
  if (live && previousAttempts > 0) throw new ForbiddenError("Javob allaqachon yuborilgan");
  // Soʻrovnoma va soʻz bulutida «toʻgʻri javob» yoʻq — natija ochilgandan
  // keyin ham javob qabul qilinadi (kechikkan oʻquvchi ham fikr bildiradi).
  if (live && liveConfig.revealed && activity.grading !== "none") {
    throw new ForbiddenError("Javob vaqti tugadi");
  }
  if (activity.shape === "text") {
    const text = typeof input.answer.text === "string" ? input.answer.text.trim() : "";
    if (!text || text.length > 2000) throw new ForbiddenError("Javob 1–2000 belgi boʻlsin");
  }
  if (activity.shape === "wordcloud") {
    const text = typeof input.answer.text === "string" ? input.answer.text.trim() : "";
    if (!text || text.length > 40) throw new ForbiddenError("Javob 1–40 belgi boʻlsin");
  }

  const { isCorrect, score } = scoreResponse({
    shape: activity.shape,
    grading: activity.grading,
    content: item.content,
    ordinal: item.ordinal,
    itemId: item.id,
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

  // Oʻqituvchi ekraniga «yangi javob» turtkisi — kutilmaydi va hech qachon
  // xato tashlamaydi (server/realtime/broadcast.ts).
  if (live && liveConfig.liveTopic) void nudgeTopic(liveConfig.liveTopic);

  return row;
}
