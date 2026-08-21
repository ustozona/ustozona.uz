import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  PRODUCT_HEADER,
  SURFACE_HEADER,
  TONE_HEADER,
  productFor,
  surfaceFor,
  toneFor,
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
    YOʻQ va ochiq qoladi. Sabab mahsulot holatiga qarab ikki xil:

    — Hali tayyor emas (`/baholash`, `/shogird`, `/boshqaruv`) → root'da
      `ProductPage` turadi, yaʼni ochiq marketing sahifasi.
    — Tayyor va mehmon rejimi bor (`/doska`) → root'da ILOVANING OʻZI
      turadi va u ataylab login talab qilmaydi: oʻqituvchi darsga kirdi,
      projektorni yoqdi, 3 soniyada taymer kerak (R134). Ekran
      localStorage'da ishlaydi, kirgandan keyin serverga koʻchiriladi.

    Yaʼni mahsulot tayyor boʻlgach root marketingdan ilovaga oʻtadi;
    marketing tavsifi asosiy landing'ning «Mahsulotlar» boʻlimida qoladi.
    Ilovaning login talab qiladigan qismlari (masalan sinf roʻyxati bilan
    ishlaydigan vidjetlar) DAL darajasida himoyalanadi, marshrut bilan
    emas — chunki bir sahifaning oʻzi ham mehmon, ham kirgan holatda
    ishlashi kerak. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/lessons",
  "/admin",
  "/blog/studio",
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
  headers.set(TONE_HEADER, toneFor(pathname));
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
    "/blog/studio/:path*",
  ],
};
