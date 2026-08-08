import { type NextRequest, NextResponse } from "next/server";

/* ════════════════════════════════════════════════════════════════════
   /api/bogla-stash — kodni cookie'ga yozadigan YAGONA joy

   ⛔ NEGA ALOHIDA ROUTE HANDLER
   -----------------------------
   Next.js Server Component render paytida cookie YOZISHNI taqiqlaydi
   — faqat Route Handler yoki Server Action ichida ruxsat beriladi.
   `/bogla/page.tsx` da bevosita `cookies().set()` chaqirilgan edi va
   bu production'da "A server error occurred" bilan yiqilardi — sahifa
   HECH NARSA render qilmasdan qulab tushardi (hatto «Roʻyxatdan
   oʻtish» tugmasi ham koʻrinmasdi).

   Shuning uchun cookie yozish shu yerga koʻchirildi. Sahifa endi FAQAT
   oʻqiydi (`cookies().get()`), hech qachon yozmaydi.
   ════════════════════════════════════════════════════════════════════ */

const COOKIE = "ll_link_code";

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("c") || "").trim();
  // Kod bilan yoki bo'lmasa ham `/bogla` ga qaytamiz — sahifa oʻzi
  // holatni (kod bor-yoʻqligini) qayta baholaydi.
  const res = NextResponse.redirect(new URL("/bogla", request.url));
  if (code) {
    res.cookies.set(COOKIE, code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
  }
  return res;
}
