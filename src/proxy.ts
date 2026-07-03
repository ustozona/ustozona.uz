import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/* ════════════════════════════════════════════════════════════════════
   PROXY (Next 16 — middleware EMAS) — faqat optimistik UX redirect.

   Cookie borligini tekshiradi, DB'ga TEGMAYDI (har route'da, jumladan
   prefetch'larda ishlaydi). Haqiqiy himoya — DAL ichida
   `requireTeacher()` (src/server/session.ts).
   ════════════════════════════════════════════════════════════════════ */

const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = !!getSessionCookie(request);

  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (isAuthPage) {
    // Kirgan foydalanuvchi login/register'ga kelsa — dashboardga.
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    return NextResponse.next();
  }

  // Himoyalangan boʻlimlar (matcher bilan sinxron): kirmagan → login.
  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/lessons/:path*", "/login", "/register"],
};
