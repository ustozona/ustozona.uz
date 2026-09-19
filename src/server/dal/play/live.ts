import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { quizSessions, sessionParticipants } from "@/server/db/schema";
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
  const config = session.renderConfig as { revealed?: boolean };
  return {
    index: session.currentIndex,
    revealed: Boolean(config.revealed),
    ended: session.state === "completed",
  };
}
