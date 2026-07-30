import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { quizSessions, sessionParticipants, type QuizSessionRow, type SessionParticipantRow } from "@/server/db/schema";
import { requireTeacher, UnauthorizedError, ForbiddenError } from "@/server/session";

export { UnauthorizedError, ForbiddenError };

/* ════════════════════════════════════════════════════════════════════
   PLAY SESSIYASI — kviz ishtirokchisi guvohnomasi.
   docs/ost-loyihalar-arxitektura.md, A boʻlim: cookie YOʻQ, akkaunt YOʻQ.

   Ishtirokchi sessiyaga qoʻshilganda serverda xom token generatsiya
   qilinadi, brauzerga (localStorage) faqat XOM token beriladi;
   bazada FAQAT HASH saqlanadi (`session_participants.tokenHash`) —
   token oqib ketsa ham bazadan uni tiklab boʻlmaydi.
   ════════════════════════════════════════════════════════════════════ */

export function hashParticipantToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type ParticipantScope = {
  __scope: "participant";
  participant: SessionParticipantRow;
  session: QuizSessionRow;
};

/** Ishtirokchi darvozasi — `token` mijozdan (localStorage) keladi.
    Sessiya `running`/`paused` boʻlmasa ham ruxsat beradi (paused'da
    yozish DAL darajasida bloklanadi — bu yerda faqat identifikatsiya). */
export async function requireParticipant(token: string): Promise<ParticipantScope> {
  if (!token) throw new UnauthorizedError("Ishtirokchi tokeni yoʻq");
  const tokenHash = hashParticipantToken(token);

  const [participant] = await db
    .select()
    .from(sessionParticipants)
    .where(eq(sessionParticipants.tokenHash, tokenHash));
  if (!participant) throw new UnauthorizedError("Yaroqsiz ishtirokchi tokeni");

  const [session] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.id, participant.sessionId));
  if (!session) throw new UnauthorizedError("Sessiya topilmadi");
  if (session.state === "completed") throw new ForbiddenError("Sessiya yopilgan");

  return { __scope: "participant", participant, session };
}

export type HostScope = {
  __scope: "host";
  session: QuizSessionRow;
  teacherId: string;
};

/** Host (oʻqituvchi) darvozasi — `requireTeacher()` + sessiya egaligi tekshiruvi. */
export async function requireHostSession(sessionId: string): Promise<HostScope> {
  const teacher = await requireTeacher();
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacher.id)));
  if (!session) throw new ForbiddenError("Sessiya topilmadi yoki sizga tegishli emas");
  return { __scope: "host", session, teacherId: teacher.id };
}
