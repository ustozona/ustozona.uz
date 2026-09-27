import { ForbiddenError, UnauthorizedError } from "@/server/session";

/* Mobil API uchun umumiy xato javobi: sessiya yoʻq → 401, ruxsat yoʻq →
   403, qolgani → 500 (tafsilot faqat server logida). */
export function mobileError(err: unknown, where: string): Response {
  if (err instanceof UnauthorizedError) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  console.error(`[mobile] ${where}:`, err);
  return Response.json({ error: "server" }, { status: 500 });
}

/* Faqat ilova: `Authorization: Bearer` sarlavhasi majburiy. Brauzer
   cookie'si bilan kelgan saytlararo soʻrov (CSRF, masalan text/plain
   forma) bu sarlavhani qoʻya olmaydi — shuning uchun rad etiladi. */
export function requireBearer(request: Request): Response | null {
  const h = request.headers.get("authorization") ?? "";
  return /^Bearer\s+\S+$/i.test(h) ? null : Response.json({ error: "unauthorized" }, { status: 401 });
}
