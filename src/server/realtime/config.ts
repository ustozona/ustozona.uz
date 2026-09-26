import "server-only";
import type { RealtimeConfig } from "@/lib/live-session";

/* ════════════════════════════════════════════════════════════════════
   REALTIME SOZLAMASI — faqat serverda oʻqiladi.

   `NEXT_PUBLIC_` prefiksi ATAYLAB ishlatilmaydi: u qiymatni har bir
   tashrif buyuruvchiga yuboriladigan JS paketiga qotirib qoʻyardi.
   Buning oʻrniga sozlama faqat tizimga kirgan oʻqituvchiga, jonli
   sessiya ekrani ochilganda server amali orqali beriladi
   (`liveRealtimeConfigAction`).

   ⚠️ Cheklov: WebSocket brauzerdan ulanadi, shuning uchun anon kalit
   oʻqituvchining brauzeriga baribir yetadi. Bu `service_role` EMAS —
   RLS'ni chetlab oʻtmaydi; kanalda esa maʼlumot yoʻq (faqat turtki).

   Sozlanmagan boʻlsa `null` — ekran zaxira soʻrovga (polling) oʻtadi.
   ════════════════════════════════════════════════════════════════════ */
export function realtimeConfig(): RealtimeConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}
