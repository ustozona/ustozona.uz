import "server-only";
import { after } from "next/server";

/* ════════════════════════════════════════════════════════════════════
   REALTIME TURTKI — Supabase Realtime Broadcast, REST orqali (R284).

   Kutubxona qoʻshilmadi: serverdan xabar yuborish bitta `fetch`
   (uploads.ts dagi Storage bilan bir xil yondashuv).

   Turtkida MAʼLUMOT YOʻQ — faqat «nimadir oʻzgardi». Oʻqituvchi ekrani
   uni olgach natijani egalik tekshiruvi bor server amali bilan soʻraydi.

   HECH QACHON XATO TASHLAMAYDI: realtime — qulaylik, javob qabul
   qilishning sharti emas. Sozlanmagan yoki tarmoq xatosi boʻlsa jim
   qaytadi, oʻqituvchi ekrani esa zaxira soʻrov bilan baribir yangilanadi.
   ════════════════════════════════════════════════════════════════════ */

/** Javob qaytgandan KEYIN yuboriladi (`after`). Oddiy `void fetch` serverless
    muhitda javobdan keyin muzlatilib, turtki yoʻqolishi mumkin edi. */
export function scheduleNudge(topic: string): void {
  if (!topic) return;
  after(() => nudgeTopic(topic));
}

export async function nudgeTopic(topic: string, event = "changed"): Promise<void> {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey || !topic) return;

  try {
    await fetch(`${baseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        messages: [{ topic, event, payload: {}, private: false }],
      }),
      // Javobni kutib oʻquvchini sekinlashtirmaslik uchun qisqa chegara.
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Jim — yuqoridagi izohga qarang.
  }
}
