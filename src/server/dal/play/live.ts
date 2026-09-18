import "server-only";
import { requireParticipant } from "@/server/play/session";
import type { LiveState } from "@/lib/live-session";

/* Jonli sessiya — oʻquvchi qurilmasi soʻraydigan holat (R284).

   Har ~1,5 s da chaqiriladi, shuning uchun faqat token tekshiruvi va
   sessiya qatori — boshqa jadvalga tegmaydi. `liveTopic` bu yerdan
   CHIQMAYDI: realtime kanali faqat oʻqituvchi ekrani uchun. */
export async function getLiveState(token: string): Promise<LiveState> {
  const { session } = await requireParticipant(token);
  const config = session.renderConfig as { revealed?: boolean };
  return {
    index: session.currentIndex,
    revealed: Boolean(config.revealed),
    ended: session.state === "completed",
  };
}
