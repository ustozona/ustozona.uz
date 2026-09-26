import { NextResponse, type NextRequest } from "next/server";
import { optOutByUserId } from "@/server/dal/email-activation";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/* ════════════════════════════════════════════════════════════════════
   BIR BOSISHLI OBUNANI BEKOR QILISH — pochta mijozi uchun.

   Gmail ommaviy yuboruvchidan `List-Unsubscribe-Post` ni talab
   qiladi: foydalanuvchi Gmail interfeysidagi «Unsubscribe» tugmasini
   bosganda Gmail SAHIFANI OCHMAYDI, balki shu manzilga POST yuboradi.
   Shuning uchun bu endpoint kerak — `/unsubscribe` sahifasi faqat
   GET, u odam uchun.

   Autentifikatsiya yoʻq: token oʻzi dalil (imzolangan HMAC).
   ════════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const userId = verifyUnsubscribeToken(req.nextUrl.searchParams.get("t"));
  /* Token notoʻgʻri boʻlsa ham 200 qaytariladi: pochta mijoziga xato
     koʻrsatishdan foyda yoʻq, va 4xx qayta urinishga sabab boʻladi. */
  if (!userId) return new NextResponse(null, { status: 200 });

  try {
    await optOutByUserId(userId);
  } catch (err) {
    console.error("[unsubscribe] bekor qilib boʻlmadi:", err);
  }
  return new NextResponse(null, { status: 200 });
}
