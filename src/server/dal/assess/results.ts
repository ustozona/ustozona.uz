import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activityItems, activitySets, quizSessions, responses, sessionParticipants } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import {
  accuracy,
  accuracyByIndex,
  avgTime,
  completionRate,
  duration,
  itemAccuracy,
  outcomeCounts,
  presence,
  unanswered,
  type ResponseStat,
} from "@/lib/assess/session-stats";

/* ════════════════════════════════════════════════════════════════════
   NATIJALAR — bitta oʻtkazish (session) va toʻplam boʻyicha jamlanma.
   docs/ost-loyihalar-arxitektura.md, "DAL tuzilmasi":
     results.ts: sessionReport(sessionId) — bitta oʻtkazish (R55/R56)
                 contentReport(setId)     — HAMMA oʻtkazish jamlanmasi (R58)
                      → "shu savol besh sinfda ham qiyin" = savol yomon

   v1 da bular jonli SQL `GROUP BY` — kesh QURILMAYDI (materializatsiya
   ~50k javobdan oshganda koʻriladi).
   ════════════════════════════════════════════════════════════════════ */

async function loadOrderedItemIds(setId: string): Promise<string[]> {
  const [set] = await db.select().from(activitySets).where(eq(activitySets.id, setId));
  if (!set) return [];
  const activityIds = set.items.map((i) => i.activityId);
  if (activityIds.length === 0) return [];
  const items = await db
    .select({ id: activityItems.id, activityId: activityItems.activityId, ordinal: activityItems.ordinal })
    .from(activityItems)
    .where(inArray(activityItems.activityId, activityIds));
  // Toʻplamdagi faoliyat tartibi, keyin har faoliyat ichida ordinal.
  const activityOrder = new Map(activityIds.map((id, i) => [id, i]));
  return items
    .sort((a, b) => {
      const byActivity = (activityOrder.get(a.activityId) ?? 0) - (activityOrder.get(b.activityId) ?? 0);
      return byActivity !== 0 ? byActivity : a.ordinal - b.ordinal;
    })
    .map((i) => i.id);
}

function toResponseStats(rows: { itemId: string; participantId: string; isCorrect: boolean | null; score: string | null; elapsedMs: number | null }[]): ResponseStat[] {
  return rows.map((r) => ({
    itemId: r.itemId,
    participantId: r.participantId,
    isCorrect: r.isCorrect,
    score: r.score === null ? null : Number(r.score),
    elapsedMs: r.elapsedMs,
  }));
}

export type SessionReport = {
  accuracy: number;
  completionRate: number;
  itemAccuracy: { itemId: string; accuracy: number }[];
  accuracyByIndex: { index: number; itemId: string; accuracy: number }[];
  outcomeCounts: ReturnType<typeof outcomeCounts>;
  avgTimeMs: number;
  unansweredCount: number;
  durationMs: number;
};

/** Bitta oʻtkazish (sessiya) tahlili (R55/R56). */
export async function sessionReport(sessionId: string): Promise<SessionReport> {
  const teacher = await requireTeacher();
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacher.id)));
  if (!session) throw new Error("Sessiya topilmadi");

  const [orderedItemIds, responseRows, participants] = await Promise.all([
    loadOrderedItemIds(session.setId),
    db
      .select({
        itemId: responses.itemId,
        participantId: responses.participantId,
        isCorrect: responses.isCorrect,
        score: responses.score,
        elapsedMs: responses.elapsedMs,
      })
      .from(responses)
      .where(eq(responses.sessionId, sessionId)),
    db
      .select({ id: sessionParticipants.id })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId)),
  ]);

  const stats = toResponseStats(responseRows);
  const participantIds = participants.map((p) => p.id);
  const respondedParticipantIds = new Set(stats.map((r) => r.participantId));

  return {
    accuracy: accuracy(stats),
    completionRate: completionRate(stats, participantIds, orderedItemIds.length),
    itemAccuracy: itemAccuracy(stats),
    accuracyByIndex: accuracyByIndex(orderedItemIds, stats),
    outcomeCounts: outcomeCounts(orderedItemIds, stats),
    avgTimeMs: avgTime(stats),
    unansweredCount: unanswered(participantIds.length, respondedParticipantIds),
    durationMs: duration(session.openedAt, session.closedAt),
  };
}

export type ContentReport = {
  setId: string;
  sessionCount: number;
  accuracy: number;
  itemAccuracy: { itemId: string; accuracy: number }[];
};

/** HAMMA oʻtkazish boʻyicha jamlanma (R58) — "shu savol besh sinfda ham
    qiyin" = savol yomon, sinf emas. */
export async function contentReport(setId: string): Promise<ContentReport> {
  const teacher = await requireTeacher();
  const [set] = await db
    .select()
    .from(activitySets)
    .where(and(eq(activitySets.id, setId), eq(activitySets.teacherId, teacher.id)));
  if (!set) throw new Error("Toʻplam topilmadi");

  const sessions = await db
    .select({ id: quizSessions.id })
    .from(quizSessions)
    .where(and(eq(quizSessions.setId, setId), eq(quizSessions.teacherId, teacher.id)));
  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length === 0) {
    return { setId, sessionCount: 0, accuracy: 0, itemAccuracy: [] };
  }

  const responseRows = await db
    .select({
      itemId: responses.itemId,
      participantId: responses.participantId,
      isCorrect: responses.isCorrect,
      score: responses.score,
      elapsedMs: responses.elapsedMs,
    })
    .from(responses)
    .where(inArray(responses.sessionId, sessionIds));

  const stats = toResponseStats(responseRows);
  return {
    setId,
    sessionCount: sessionIds.length,
    accuracy: accuracy(stats),
    itemAccuracy: itemAccuracy(stats),
  };
}

/** Jonli panel uchun hozirlik (R114) — `staleAfterMs` ichida `lastSeenAt`
    yangilanmagan ishtirokchi "absent" hisoblanadi. */
export async function sessionPresence(sessionId: string) {
  const teacher = await requireTeacher();
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacher.id)));
  if (!session) throw new Error("Sessiya topilmadi");

  const participants = await db
    .select({ id: sessionParticipants.id, lastSeenAt: sessionParticipants.lastSeenAt })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));

  // ⚠️ Ishtirokchining OʻZ joriy indeksi hali kuzatilmaydi (session_participants
  // da ustun yoʻq — kelgusida `progress` jsonb'ga qoʻshiladi). Shu bois hammaga
  // sessiya indeksi beriladi → "submitted" hech qachon chiqmaydi, faqat
  // attempting/absent farqlanadi (lastSeenAt orqali).
  return presence(
    participants.map((p) => ({ id: p.id, lastSeenAt: p.lastSeenAt, currentIndex: session.currentIndex })),
    session.currentIndex
  );
}
