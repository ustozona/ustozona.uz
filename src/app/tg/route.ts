import { NextResponse, type NextRequest } from "next/server";
import { botUrl } from "@/server/telegram/config";

/* ════════════════════════════════════════════════════════════════════
   /tg — Ustozona botiga qisqa havola (ustozona.uz/tg).

   Xatlar, postlar va QR kodlarda bot nomi TOʻGʻRIDAN-TOʻGʻRI
   yozilmaydi: kampaniya skripti ishlab chiquvchining mashinasidan
   yuradi va u yerdagi `.env.local` da sinov boti boʻlishi mumkin. Bu
   manzil esa har doim prod env'dagi botga olib boradi, bot nomi
   oʻzgarsa ham eski havolalar ishlayveradi.

   Bot sozlanmagan boʻlsa — sozlamalardagi Telegram boʻlimi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const target = botUrl() ?? new URL("/dashboard/settings?section=telegram", request.url);
  return NextResponse.redirect(target, 307);
}
