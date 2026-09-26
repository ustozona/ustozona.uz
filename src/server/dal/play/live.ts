import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, activityItems, quizSessions, sessionParticipants } from "@/server/db/schema";
import { hashParticipantToken, UnauthorizedError } from "@/server/play/session";
import type { LiveState } from "@/lib/live-session";

/* Jonli sessiya — oʻquvchi qurilmasi soʻraydigan holat (R284).

   Har ~1,5 s da chaqiriladi, shuning uchun faqat token tekshiruvi va
   sessiya qatori — boshqa jadvalga tegmaydi. `liveTopic` bu yerdan
   CHIQMAYDI: realtime kanali faqat oʻqituvchi ekrani uchun. */
export async function getLiveState(token: string): Promise<LiveState> {
  /* `requireParticipant` EMAS: u yopilgan sessiyada xato tashlaydi, bu yerda
     esa aynan «yopildi» holatini oʻquvchiga yetkazish kerak — aks holda
     sessiya tugagach hamma ekran oxirgi savolda qotib qolardi. */
  if (!token) throw new UnauthorizedError("Ishtirokchi tokeni yoʻq");
  const [row] = await db
    .select({ session: quizSessions })
    .from(sessionParticipants)
    .innerJoin(quizSessions, eq(quizSessions.id, sessionParticipants.sessionId))
    .where(eq(sessionParticipants.tokenHash, hashParticipantToken(token)));
  if (!row) throw new UnauthorizedError("Yaroqsiz ishtirokchi tokeni");
  const { session } = row;
  const config = session.renderConfig as { revealed?: boolean; revealedActivityId?: string };
  const revealed = Boolean(config.revealed);
  const state: LiveState = {
    index: session.currentIndex,
    revealed,
    ended: session.state === "completed",
  };
  /* Toʻgʻri variant FAQAT javob ochilgandan keyin va faqat ochilgan savol
     uchun — qoʻshimcha soʻrov ham shu holatdagina ketadi (odatda 1,5 s lik
     soʻrov bitta jadval qatori bilan cheklanadi). */
  if (revealed && config.revealedActivityId) {
    state.revealedActivityId = config.revealedActivityId;
    state.correctOptionIds = await correctOptionIdsOf(config.revealedActivityId);
  }
  return state;
}

/** Test (mcq) faoliyatining toʻgʻri variantlari; boshqa tur — boʻsh roʻyxat. */
export async function correctOptionIdsOf(activityId: string): Promise<string[]> {
  const [row] = await db
    .select({ shape: activities.shape, content: activityItems.content })
    .from(activities)
    .innerJoin(activityItems, eq(activityItems.activityId, activities.id))
    .where(eq(activities.id, activityId))
    .orderBy(asc(activityItems.ordinal))
    .limit(1);
  if (!row || row.shape !== "mcq") return [];
  const options = (row.content as { options?: { id: string; isCorrect?: boolean }[] }).options ?? [];
  return options.filter((o) => o.isCorrect).map((o) => o.id);
}
