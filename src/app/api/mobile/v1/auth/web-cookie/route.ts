import { mobileWebCookie } from "@/server/dal/mobile-auth";

/* POST /api/mobile/v1/auth/web-cookie — `Authorization: Bearer <token>`.
   Ilova ichidagi sayt oynasi (WebView) shu cookie bilan ochiladi —
   foydalanuvchidan saytga ikkinchi marta kirish soʻralmaydi. */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookie = await mobileWebCookie(request.headers);
  if (!cookie) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(cookie, { headers: { "Cache-Control": "no-store" } });
}
