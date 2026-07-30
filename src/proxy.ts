import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  PRODUCT_HEADER,
  SURFACE_HEADER,
  productFor,
  surfaceFor,
} from "@/lib/product-scope";

/* ════════════════════════════════════════════════════════════════════
   PROXY (Next 16 — middleware EMAS) — IKKI mustaqil vazifa.

   1) TEGLASH: har soʻrovga mahsulot/sirt sarlavhasini qoʻyadi. Root
      layout shundan `<html data-surface data-product>` chiqaradi
      (docs/ost-loyihalar-arxitektura.md, C boʻlim). Portalga chiqadigan
      Radix modallari `<html>` dan meros olishi uchun shu shart.

   2) HIMOYA: cookie borligini tekshiradi, DB'ga TEGMAYDI. Bu faqat
      optimistik UX redirect — haqiqiy himoya DAL ichida
      `requireTeacher()` (src/server/session.ts).

   DIQQAT: himoya endi ANIQ ROʻYXAT (`PROTECTED_PREFIXES`), avvalgidek
   "matcher'dagi hamma narsa" emas. Sabab: `/play` (anonim kviz
   ishtirokchisi) va `/shogird` (Telegram WebView — cookie ishonchsiz)
   hech qachon `/login` ga uloqtirilmasligi kerak.
   ════════════════════════════════════════════════════════════════════ */

const AUTH_PAGES = ["/login", "/register"];

/** Cookie'siz kirilsa `/login` ga yuboriladigan boʻlimlar.

    ⚠️ `/baholash`, `/doska`, `/shogird`, `/boshqaruv` ATAYLAB bu roʻyxatda
    YOʻQ — ular ochiq marketing sahifalari (docs/ost-loyihalar-arxitektura.md,
    "Marshrut qoidasi": root = marketing, ichkarisi = ilova). Ilova
    marshrutlari kelajakda `/dashboard/doska`, `/doska/ekran` kabi ichki
    yoʻllarda yashaydi va ular `/dashboard` orqali allaqachon himoyalangan. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/lessons",
  "/admin",
];

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Teglash — redirect boʻlmagan har bir javobda oʻtadi.
  const headers = new Headers(request.headers);
  headers.set(SURFACE_HEADER, surfaceFor(pathname));
  headers.set(PRODUCT_HEADER, productFor(pathname));
  const forward = () => NextResponse.next({ request: { headers } });

  const hasSessionCookie = !!getSessionCookie(request);

  // 2) Himoya
  if (AUTH_PAGES.includes(pathname)) {
    // Kirgan foydalanuvchi login/register'ga kelsa — dashboardga.
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    return forward();
  }

  if (!hasSessionCookie && PROTECTED_PREFIXES.some((p) => isUnder(pathname, p))) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return forward();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/lessons/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    // Ost-loyihalar — hozircha faqat teglash uchun (marshrutlar hali yoʻq).
    // `/play` va `/shogird` ATAYLAB PROTECTED_PREFIXES'da emas.
    "/play/:path*",
    "/shogird/:path*",
    "/doska/:path*",
    "/boshqaruv/:path*",
  ],
};
