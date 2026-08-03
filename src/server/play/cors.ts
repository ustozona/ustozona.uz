import "server-only";

/* ════════════════════════════════════════════════════════════════════
   HAMKOR QOBIQLARI UCHUN CORS — «Ustozona Baholash» ijro sathi

   Kviz oʻyin qobiqlari (LessonLab EduGames) boshqa domenda turadi,
   lekin savol va javob Ustozonaning OʻZ bazasida qoladi. Shuning uchun
   qobiq brauzerdan bu yerdagi API'ga murojaat qiladi.

   XAVFSIZLIK — nega `*` EMAS:
   Soʻrovda ishtirokchi TOKENI boradi. `Access-Control-Allow-Origin: *`
   qoʻyilsa, istalgan sayt oʻquvchining tokeni bilan savol-javobni
   oʻqiy oladi. Shuning uchun faqat ROʻYXATDAGI domenlar oʻtadi va
   javobda AYNAN soʻrovchi domen qaytariladi.

   Roʻyxat `PLAY_ALLOWED_ORIGINS` muhit oʻzgaruvchisidan oʻqiladi
   (vergul bilan). Oʻrnatilmagan boʻlsa — hech kim oʻtmaydi: yopiq
   holat xavfsiz standart, ochiq holat emas.
   ════════════════════════════════════════════════════════════════════ */

function allowedOrigins(): string[] {
  return (process.env.PLAY_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/** Soʻrov origini roʻyxatdami? Boʻlsa — oʻsha originni qaytaradi. */
export function resolveOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const normalized = origin.replace(/\/+$/, "");
  return allowedOrigins().includes(normalized) ? normalized : null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    // Bir nechta domen roʻyxatda boʻlgani uchun javob origin'ga
    // bogʻliq — keshda aralashib ketmasin
    Vary: "Origin",
  };
}

/** CORS sarlavhalari bilan JSON javob. */
export function corsJson(
  request: Request,
  body: unknown,
  init?: { status?: number }
): Response {
  const origin = resolveOrigin(request);
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: {
      ...corsHeaders(origin),
      // Ishtirokchi javoblari — hech qachon keshlanmaydi
      "Cache-Control": "no-store",
    },
  });
}

/** Preflight (OPTIONS) javobi — roʻyxatda boʻlmagan origin 403 oladi. */
export function corsPreflight(request: Request): Response {
  const origin = resolveOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
